import {
  SESSION_HEADER,
  TURNSTILE_HEADER,
  type AnswerOutcome,
  type DoneEvent,
  type ErrorEvent,
} from "../../../lib/ask/protocol"
import type { AskConfig } from "./config"
import { deriveKeys, keyedHash } from "./crypto"
import {
  acceptsEventStream,
  isAllowedOrigin,
  isJson,
  normalizeForMemo,
  parseQuestion,
  readCappedBody,
  screenQuestion,
  visitorAddress,
} from "./guards"
import { corsHeaders, eventStream, preflight, refusal } from "./http"
import {
  secondsToNextUtcDay,
  utcDay,
  type Admission,
  type AdmitRequest,
  type MemoAnswer,
} from "./limits-store"
import { userMessage, withNotes, type Knowledge } from "./prompt"
import {
  cleanCountry,
  type LogOutcome,
  type QuestionLog,
  type QuestionRecord,
} from "./questions-log"
import { issueSession, readSession, type Binding } from "./session"
import { validateSources, type Source } from "./sources"
import { AnswerFilter, modelText, sse, type ModelUsage } from "./stream"
import type { TurnstileResult } from "./turnstile"

/**
 * `POST /ask`: one question in, one streamed answer out. The wire format is
 * `lib/ask/protocol.ts`. The checks run cheapest first, so abuse costs as
 * little as possible and the model is the last thing reached:
 *
 *   1. path, method, origin (CORS preflight ends here)
 *   2. content type, accept, body size, body shape, spam screen
 *   3. a session or a Turnstile token is present          (no I/O)
 *   4. session signature                                   (CPU only)
 *   5. per-minute limit                    (the rate limiting binding)
 *   6. Turnstile Siteverify, only without a valid session       (fetch)
 *   7. repeat memo, per-visitor day, everyone's day   (one Durable Object call)
 *   8. the model
 *
 * Step 5 runs before step 6 so a flood of junk tokens is cut off by the
 * cheap local limiter before it costs a Siteverify round trip.
 *
 * A question that gets past steps 5 and 6 is written to the question log
 * (`questions-log.ts`) once its outcome is known: the question, the outcome,
 * the sources, the time it took, token counts, the model and the country.
 * Never the answer, the address, a hash of it, the session or the browser.
 * Questions refused before that (bad shape, spam, no or failed check, the
 * per-minute limit) are not logged: anyone can send those without solving
 * a check, so logging them would let a script fill the log. Console output
 * is one-line operational errors only.
 */

/** The seam to Workers AI (`env.AI.run`), so tests can stub the model. */
export type RunModel = (
  model: string,
  inputs: Record<string, unknown>,
  options: AiOptions
) => Promise<unknown>

/** The seam to the `AskLimits` Durable Object. */
export interface LimitsClient {
  admit(req: AdmitRequest): Promise<Admission>
  remember(memo: string, answer: MemoAnswer): Promise<void>
  forget(memo: string): Promise<void>
}

export interface AskDeps {
  config: AskConfig
  knowledge: Knowledge
  run: RunModel
  limiter: Pick<RateLimit, "limit">
  limits: LimitsClient
  verifyTurnstile: (token: string, remoteIp: string) => Promise<TurnstileResult>
  /** The owner's notes from KV, or `""`. Must not throw. */
  loadNotes: () => Promise<string>
  /**
   * The question log (D1). Absent, or with `logRetentionDays` 0, nothing is
   * written and Ask behaves exactly as without it.
   */
  questions?: QuestionLog
  /** Keeps background work alive past the response (`ctx.waitUntil`). */
  waitUntil?: (promise: Promise<unknown>) => void
  now?: () => Date
}

/** A repeat of a question still being answered waits this long. */
const PENDING_RETRY_SECONDS = 10
/** The notes are optional: a slow KV read is skipped, not waited for. */
const NOTES_WAIT_MS = 1_000
const MAX_USER_AGENT_CHARS = 512

class Timeout extends Error {}

/** After the total deadline, how long a last error event may take to write. */
const CLOSE_GRACE_MS = 250

function deadline<T>(promise: Promise<T>, ms: number): Promise<T> {
  let id: ReturnType<typeof setTimeout> | null = null
  const timer = new Promise<never>((_, reject) => {
    id = setTimeout(() => reject(new Timeout()), Math.max(0, ms))
  })
  return Promise.race([promise, timer]).finally(() => {
    if (id !== null) clearTimeout(id)
  })
}

function isStream(value: unknown): value is ReadableStream<Uint8Array> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ReadableStream).getReader === "function"
  )
}

function logError(message: string) {
  console.error(JSON.stringify({ message: `ask: ${message}` }))
}

/** What a logged question ended with, besides its outcome. */
type LogDetails = Partial<
  Pick<
    QuestionRecord,
    "replayed" | "sources" | "model" | "inputTokens" | "outputTokens"
  >
>
/** Logs the question once; later calls do nothing. Never throws. */
type LogQuestion = (outcome: LogOutcome, details?: LogDetails) => void

function questionLogger(
  deps: AskDeps,
  base: Pick<QuestionRecord, "askedAt" | "question" | "country">,
  received: number
): LogQuestion {
  const log = deps.questions
  if (!log || deps.config.logRetentionDays <= 0) return () => {}
  let logged = false
  return (outcome, details = {}) => {
    if (logged) return
    logged = true
    const record: QuestionRecord = {
      ...base,
      outcome,
      replayed: details.replayed ?? false,
      sources: details.sources ?? [],
      durationMs: Date.now() - received,
      inputTokens: details.inputTokens ?? null,
      outputTokens: details.outputTokens ?? null,
      model: details.model ?? null,
    }
    // After the outcome is known, in the background: a slow or failing
    // database never changes or delays what the visitor gets.
    const write = Promise.resolve()
      .then(() => log.write(record))
      .catch(() => logError("question log unavailable"))
    deps.waitUntil?.(write)
  }
}

export async function handleRequest(
  request: Request,
  deps: AskDeps
): Promise<Response> {
  const { config } = deps
  const received = Date.now()

  // 1. Path, method, origin.
  if (new URL(request.url).pathname !== "/ask")
    return refusal("bad_request", {}, { status: 404 })
  const method = request.method
  if (method !== "POST" && method !== "OPTIONS")
    return refusal("bad_request", { Allow: "POST, OPTIONS" }, { status: 405 })
  const origin = request.headers.get("Origin")
  if (!isAllowedOrigin(origin, config))
    return refusal("bad_request", {}, { status: 403 })
  const cors = corsHeaders(origin)
  if (method === "OPTIONS")
    return request.headers.get("Access-Control-Request-Method") === "POST"
      ? preflight(cors)
      : refusal("bad_request", {}, { status: 403 })

  if (!config.signingKey || !config.turnstileSecret) {
    logError("a secret is missing")
    return refusal("unavailable", cors)
  }

  // 2. What the panel sends, and nothing else.
  if (!isJson(request.headers.get("Content-Type")))
    return refusal("bad_request", cors, { status: 415 })
  if (!acceptsEventStream(request.headers.get("Accept")))
    return refusal("bad_request", cors)
  const body = await readCappedBody(request)
  if (!body.ok)
    return refusal("bad_request", cors, {
      status: body.reason === "too_large" ? 413 : 400,
    })
  const parsed = parseQuestion(body.text)
  if (!parsed.ok || !screenQuestion(parsed.question).ok)
    return refusal("bad_request", cors)
  const question = parsed.question

  // 3. A session, or a token to start one.
  const sessionToken = request.headers.get(SESSION_HEADER)
  const challenge = request.headers.get(TURNSTILE_HEADER)
  if (!sessionToken && !challenge) return refusal("challenge_needed", cors)

  // 4. The session's signature.
  const now = deps.now?.() ?? new Date()
  const keys = await deriveKeys(config.signingKey)
  // Set by Cloudflare on every request; `X-Forwarded-For` is set by the
  // client and is deliberately not read.
  const ip = request.headers.get("CF-Connecting-IP") ?? ""
  // One visitor: an IPv4 address, or an IPv6 /64 (see `visitorAddress`).
  const visitor = visitorAddress(ip)
  const binding: Binding = {
    origin,
    ip: visitor,
    userAgent: (request.headers.get("User-Agent") ?? "").slice(
      0,
      MAX_USER_AGENT_CHARS
    ),
  }
  let session = await readSession(sessionToken, keys, binding, now.getTime())
  if (!session && !challenge) return refusal("challenge_needed", cors)

  // 5. Per minute, per visitor (approximate, per Cloudflare location).
  const minuteKey = await keyedHash(keys.visitor, `minute|${visitor}`)
  let minute: { success: boolean }
  try {
    minute = await deps.limiter.limit({ key: minuteKey })
  } catch {
    // Fail closed, like every other dependency: no model call.
    logError("rate limiter unavailable")
    return refusal("unavailable", cors)
  }
  if (!minute.success) return refusal("rate_limited", cors, { retryAfter: 60 })

  // 6. Turnstile, once per visit.
  let headers = cors
  if (!session) {
    const verdict = await deps.verifyTurnstile(challenge ?? "", ip)
    if (verdict === "unavailable") {
      logError("turnstile unavailable")
      return refusal("unavailable", cors)
    }
    if (verdict === "failed") return refusal("challenge_failed", cors)
    const issued = await issueSession(
      keys,
      binding,
      now.getTime(),
      config.sessionSeconds
    )
    session = issued.session
    headers = { ...cors, [SESSION_HEADER]: issued.token }
  }

  // A checked visitor from here on: the question is logged once it ends.
  const logQuestion = questionLogger(
    deps,
    { askedAt: now, question, country: cleanCountry(request.cf?.country) },
    received
  )

  // 7. The strict limits, in one call so they cost the same whichever fires.
  const day = utcDay(now)
  const memo = await keyedHash(
    keys.session,
    `memo|${session.sid}|${normalizeForMemo(question)}`
  )
  let admission: Admission
  try {
    admission = await deps.limits.admit({
      day,
      visitor: await keyedHash(keys.visitor, `day|${day}|${visitor}`),
      memo,
      visitorCap: config.visitorDailyCap,
      globalCap: config.dailyCap,
      now: now.getTime(),
    })
  } catch {
    logError("limits unavailable")
    logQuestion("error")
    return refusal("unavailable", headers)
  }
  switch (admission.kind) {
    case "memo":
      logQuestion(admission.answer.outcome, {
        replayed: true,
        sources: admission.answer.sources.map((s) => s.href),
      })
      return replay(admission.answer, headers)
    case "pending":
      logQuestion("rate_limited")
      return refusal("rate_limited", headers, {
        retryAfter: PENDING_RETRY_SECONDS,
      })
    case "daily_limit":
    case "budget_reached":
      logQuestion(admission.kind)
      return refusal(admission.kind, headers, {
        retryAfter: secondsToNextUtcDay(now),
      })
  }

  // 8. The model.
  return answer(question, memo, deps, headers, logQuestion)
}

/** A finished answer sent again, as the stream sent it the first time. */
function replay(memo: MemoAnswer, headers: Record<string, string>): Response {
  const done: DoneEvent = { outcome: memo.outcome, sources: memo.sources }
  const body = sse("delta", { text: memo.text }) + sse("done", done)
  return eventStream(
    new Response(new TextEncoder().encode(body)).body!,
    headers
  )
}

async function answer(
  question: string,
  memo: string,
  deps: AskDeps,
  headers: Record<string, string>,
  logQuestion: LogQuestion
): Promise<Response> {
  const { config } = deps
  const started = Date.now()
  const usage: ModelUsage = { inputTokens: null, outputTokens: null }
  const logEnd = (outcome: LogOutcome, sources: string[] = []) =>
    logQuestion(outcome, { sources, model: config.model, ...usage })
  const controller = new AbortController()
  const remaining = () => config.timeoutMs - (Date.now() - started)
  const forget = () =>
    deps.waitUntil?.(deps.limits.forget(memo).catch(() => {}))

  const notes = await deadline(deps.loadNotes(), NOTES_WAIT_MS).catch(() => "")
  const knowledge = withNotes(deps.knowledge, notes)

  const inputs: Record<string, unknown> = {
    // No history, ever: the rules and the context, then this one question.
    messages: [
      { role: "system", content: knowledge.systemPrompt },
      { role: "user", content: userMessage(question) },
    ],
    stream: true,
    max_completion_tokens: config.maxTokens,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
  }
  if (config.reasoning) inputs.reasoning_effort = config.reasoning

  const options: AiOptions = {
    signal: controller.signal,
    // Routes every request to the instance that already holds the prompt's
    // prefix, so the long system prompt is billed as cached input.
    extraHeaders: { "x-session-affinity": `ask-${knowledge.promptId}` },
  }
  if (config.gatewayId)
    options.gateway = {
      id: config.gatewayId,
      // Never store prompts or answers in the gateway's logs.
      collectLog: false,
      cacheTtl: config.gatewayCacheTtl,
    }

  let texts: AsyncGenerator<string, void, undefined>
  let first: IteratorResult<string, void>
  try {
    const out = await deadline(
      deps.run(config.model, inputs, options),
      config.firstTokenMs
    )
    if (!isStream(out)) throw new Error("not a stream")
    texts = modelText(out, usage)
    first = await deadline(
      texts.next(),
      Math.min(config.firstTokenMs - (Date.now() - started), remaining())
    )
  } catch (error) {
    controller.abort()
    forget()
    logError(error instanceof Timeout ? "model timed out" : "model failed")
    logEnd(error instanceof Timeout ? "timeout" : "error")
    return refusal("unavailable", headers)
  }

  const filter = new AnswerFilter(knowledge.email)
  const encoder = new TextEncoder()
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  const writer = writable.getWriter()
  const write = (event: string, data: unknown) =>
    writer.write(encoder.encode(sse(event, data)))
  const broke: ErrorEvent = { outcome: "unavailable" }

  // The total deadline covers the whole response, writes included: a reader
  // that stops reading would otherwise hold the model and this request open.
  let expired = false
  const total = setTimeout(
    () => {
      expired = true
      controller.abort()
      forget()
      logError("answer timed out")
      logEnd("timeout")
      // Say so if the reader still reads; if it does not, end the stream.
      deadline(write("error", broke), CLOSE_GRACE_MS)
        .then(
          () => writer.close(),
          () => writer.abort(new Timeout())
        )
        .catch(() => {})
    },
    Math.max(0, remaining())
  )

  const pump = (async () => {
    try {
      let next = first
      while (!next.done) {
        const piece = filter.push(next.value)
        if (piece) await write("delta", { text: piece })
        next = await deadline(texts.next(), remaining())
      }
      const { text: last, meta } = filter.end()
      if (last) await write("delta", { text: last })
      if (!filter.text.trim()) {
        forget()
        logEnd("error")
        await write("error", broke)
        return
      }
      const done = finish(meta, filter, knowledge, question)
      // Logged before the last write: a reader that left early does not
      // turn a finished answer into an error in the log.
      logEnd(
        done.outcome,
        done.sources.map((s) => s.href)
      )
      await write("done", done)
      deps.waitUntil?.(
        deps.limits
          .remember(memo, { text: filter.text, ...done })
          .catch(() => {})
      )
    } catch (error) {
      if (!expired) {
        controller.abort()
        forget()
        if (error instanceof Timeout) logError("answer timed out")
        logEnd(error instanceof Timeout ? "timeout" : "error")
        await write("error", broke).catch(() => {})
      }
    } finally {
      clearTimeout(total)
      await texts.return(undefined).catch(() => {})
      await writer.close().catch(() => {})
    }
  })()
  deps.waitUntil?.(pump)

  return eventStream(readable, headers)
}

/**
 * ONA's row and shop: the family rule says ONA comes up only when the
 * question names it, so these are never offered as sources otherwise.
 */
const NAMED_ONLY_SOURCES = new Set(["/work#ona", "https://onatorba.com"])
/**
 * The question names ONA: "ONA" in capitals (lower-case "ona" is "she" in
 * Serbian), the shop's domain, or its full name.
 */
function namesOna(question: string): boolean {
  return /\bONA\b/.test(question) || /onatorba|\bona by alma\b/i.test(question)
}

/** Site paths, `mailto:` and `https:` links only. */
function safeHref(href: string): boolean {
  return (
    href.startsWith("/") ||
    href.startsWith("mailto:") ||
    href.startsWith("https://")
  )
}

/** The final event: the outcome, and sources checked against the site map. */
export function finish(
  meta: { kind?: unknown; sources?: unknown } | null,
  filter: Pick<AnswerFilter, "mentioned">,
  knowledge: Pick<Knowledge, "sources">,
  question = ""
): { outcome: AnswerOutcome; sources: Source[] } {
  const index = knowledge.sources
  const outcome: AnswerOutcome =
    meta?.kind === "out_of_scope" || meta?.kind === "unknown"
      ? meta.kind
      : "answer"
  if (outcome === "out_of_scope") return { outcome, sources: [] }
  let sources = validateSources(
    [
      ...(Array.isArray(meta?.sources) ? meta.sources : []),
      ...filter.mentioned,
    ],
    index,
    // Room for the ones dropped below.
    6
  )
    .filter((s) => safeHref(s.href))
    .filter((s) => !NAMED_ONLY_SOURCES.has(s.href) || namesOna(question))
    .slice(0, 3)
  if (outcome === "unknown") {
    const email = index.email
    sources = email
      ? [email, ...sources.filter((s) => s.href !== email.href)].slice(0, 3)
      : sources
  }
  return { outcome, sources }
}
