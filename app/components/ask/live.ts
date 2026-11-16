import {
  isAnswerOutcome,
  isRefusalOutcome,
  SESSION_HEADER,
  TURNSTILE_HEADER,
  type AnswerOutcome,
  type WireSource,
} from "@/lib/ask/protocol"

import { ChallengeError, getTurnstileToken } from "./turnstile"
import type { LiveRefusal } from "./types"

/**
 * The live path to the Ask Worker (`lib/ask/protocol.ts` is the contract).
 * A separate chunk, imported by `answer.ts` only when a typed question is
 * about to go to the model.
 *
 * The first question of a visit carries a Turnstile token; the Worker
 * answers with a session token in `Ask-Session`, kept here in memory only
 * (not a cookie, not storage: it ends with the tab) and sent with every
 * later question. When the Worker says the session has expired, the check
 * runs once more and the question is sent again.
 *
 * Every wait has a timeout, and every way this can end is one `LiveResult`:
 * it never throws, except an `AbortError` when the caller aborts.
 */

export type LiveStatus = "checking" | "interactive" | "answering"

export type LiveResult =
  | { outcome: AnswerOutcome; text: string; sources: WireSource[] }
  | {
      outcome: LiveRefusal
      retryAfter?: number
      /** What streamed before the answer broke off. */
      partial?: string
    }

export interface LiveOptions {
  endpoint: string
  siteKey: string
  /** The whole answer so far, each time more of it streams in. */
  onText?: (text: string) => void
  onStatus?: (status: LiveStatus) => void
  /** The element the Turnstile widget renders into. */
  challengeHost: () => HTMLElement | null
  signal?: AbortSignal
}

/** First byte, and the whole answer. Above the Worker's own (15 s / 25 s). */
const FIRST_BYTE_MS = 20_000
const TOTAL_MS = 40_000
/** More than any answer the Worker's token cap allows. */
const MAX_TEXT_CHARS = 6_000
const SESSION_TOKEN = /^[\w-]{1,200}\.[\w-]{1,100}$/

let session: string | null = null

export async function askLive(
  question: string,
  options: LiveOptions
): Promise<LiveResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    let token: string | null = null
    if (!session) {
      const host = options.challengeHost()
      if (!host) return { outcome: "unavailable" }
      options.onStatus?.("checking")
      try {
        token = await getTurnstileToken({
          siteKey: options.siteKey,
          host,
          signal: options.signal,
          onInteractive: (on) =>
            options.onStatus?.(on ? "interactive" : "checking"),
        })
      } catch (error) {
        if (options.signal?.aborted) throw error
        return {
          outcome:
            error instanceof ChallengeError
              ? "challenge_failed"
              : "unavailable",
        }
      }
    }
    options.onStatus?.("answering")
    const result = await send(question, token, options)
    if (result !== "challenge_needed") return result
    session = null
  }
  return { outcome: "unavailable" }
}

async function send(
  question: string,
  turnstile: string | null,
  { endpoint, onText, signal }: LiveOptions
): Promise<LiveResult | "challenge_needed"> {
  const controller = new AbortController()
  const abort = () => controller.abort()
  signal?.addEventListener("abort", abort, { once: true })
  let timer = window.setTimeout(abort, FIRST_BYTE_MS)
  let text = ""
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    }
    if (session) headers[SESSION_HEADER] = session
    else if (turnstile) headers[TURNSTILE_HEADER] = turnstile
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ question }),
      signal: controller.signal,
      credentials: "omit",
      cache: "no-store",
      redirect: "error",
      referrerPolicy: "no-referrer",
    })
    const issued = res.headers.get(SESSION_HEADER)
    if (issued && SESSION_TOKEN.test(issued)) session = issued

    const type = res.headers.get("Content-Type") ?? ""
    if (!res.ok || !type.startsWith("text/event-stream") || !res.body)
      return await refusal(res)

    window.clearTimeout(timer)
    timer = window.setTimeout(abort, TOTAL_MS)
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let end: number
      while ((end = buffer.indexOf("\n\n")) >= 0) {
        const block = buffer.slice(0, end)
        buffer = buffer.slice(end + 2)
        const event = /^event: (.+)$/m.exec(block)?.[1]
        const data = /^data: (.+)$/m.exec(block)?.[1]
        if (!event || !data) continue
        const payload = JSON.parse(data) as Record<string, unknown>
        if (event === "delta" && typeof payload.text === "string") {
          text = (text + payload.text).slice(0, MAX_TEXT_CHARS)
          onText?.(text)
        } else if (event === "done") {
          await reader.cancel().catch(() => {})
          if (!text.trim() || !isAnswerOutcome(payload.outcome))
            return broke(text)
          return {
            outcome: payload.outcome,
            text,
            sources: safeSources(payload.sources),
          }
        } else if (event === "error") {
          await reader.cancel().catch(() => {})
          return broke(text)
        }
      }
    }
    return broke(text)
  } catch (error) {
    if (signal?.aborted) throw error
    return broke(text)
  } finally {
    window.clearTimeout(timer)
    signal?.removeEventListener("abort", abort)
  }
}

/** The stream broke off (or never started): keep what arrived. */
function broke(text: string): LiveResult {
  return text.trim()
    ? { outcome: "unavailable", partial: text }
    : { outcome: "unavailable" }
}

async function refusal(
  res: Response
): Promise<LiveResult | "challenge_needed"> {
  let body: { outcome?: unknown; retryAfter?: unknown } = {}
  try {
    body = (await res.json()) as typeof body
  } catch {
    return { outcome: "unavailable" }
  }
  const { outcome } = body
  if (outcome === "challenge_needed") return "challenge_needed"
  if (!isRefusalOutcome(outcome) || outcome === "challenge_needed")
    return { outcome: "unavailable" }
  const retryAfter =
    typeof body.retryAfter === "number" && body.retryAfter > 0
      ? Math.min(body.retryAfter, 86_400)
      : undefined
  return { outcome, retryAfter }
}

/** Only links a page can safely render: site paths, https and mailto. */
function safeSources(value: unknown): WireSource[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (s): s is WireSource =>
        !!s &&
        typeof s.href === "string" &&
        typeof s.label === "string" &&
        s.label.length <= 80 &&
        // No backslash: browsers read "/\\host" as "//host", another site.
        !s.href.includes("\\") &&
        /^(\/(?!\/)|https:\/\/|mailto:)/.test(s.href)
    )
    .slice(0, 3)
}
