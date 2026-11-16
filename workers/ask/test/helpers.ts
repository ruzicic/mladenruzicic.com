import { SESSION_HEADER, TURNSTILE_HEADER } from "../../../lib/ask/protocol"
import { readConfig, type AskConfig, type AskVars } from "../src/config"
import { deriveKeys } from "../src/crypto"
import type { AskDeps, LimitsClient, RunModel } from "../src/handler"
import { KNOWLEDGE } from "../src/knowledge"
import {
  admit,
  forget,
  remember,
  type LimitsStorage,
} from "../src/limits-store"
import { issueSession } from "../src/session"
import type { TurnstileResult } from "../src/turnstile"

/**
 * Stubs for every seam of the handler: the model, the per-minute limiter,
 * the limits object (the real logic over in-memory storage), Turnstile and
 * the KV notes. Nothing here touches the network or a Cloudflare account.
 */

export const ORIGIN = "https://mladenruzicic.com"
export const IP = "203.0.113.7"
export const UA = "Mozilla/5.0 (test)"
export const SIGNING_KEY = "test-signing-key-0123456789abcdefghijklmnop"
/** Cloudflare's published dummy token (developers.cloudflare.com/turnstile/troubleshooting/testing/). */
export const DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX"
export const NOW = new Date("2026-11-12T10:00:00Z")

export const VARS: AskVars = {
  ASK_ALLOWED_ORIGINS:
    "https://mladenruzicic.com,https://www.mladenruzicic.com",
  ASK_ALLOW_LOCALHOST: "false",
  ASK_TURNSTILE_HOSTNAMES: "mladenruzicic.com,www.mladenruzicic.com",
  ASK_TIMEOUT_MS: "2000",
  ASK_FIRST_TOKEN_MS: "1000",
  ASK_DAILY_CAP: "5",
  ASK_VISITOR_DAILY_CAP: "3",
  TURNSTILE_SECRET_KEY: "a-production-secret-that-is-not-real",
  ASK_SIGNING_KEY: SIGNING_KEY,
}

export const CONFIG: AskConfig = readConfig(VARS)

/**
 * A Workers AI-style SSE stream that sends `chunks` as text deltas, and
 * `usage` (token counts) in a last chunk of its own when given.
 */
export function modelStream(
  chunks: string[],
  {
    delayMs = 0,
    shape = "openai" as "openai" | "legacy",
    hang = false,
    usage = undefined as
      { prompt_tokens: number; completion_tokens: number } | undefined,
  } = {}
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        if (delayMs) await new Promise((r) => setTimeout(r, delayMs))
        const payload =
          shape === "openai"
            ? { choices: [{ delta: { content: chunk } }] }
            : { response: chunk }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        )
      }
      if (hang) return
      if (usage)
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify(
              shape === "openai"
                ? { choices: [], usage }
                : { response: "", usage }
            )}\n\n`
          )
        )
      controller.enqueue(encoder.encode("data: [DONE]\n\n"))
      controller.close()
    },
  })
}

/** The Durable Object's storage API, in memory. */
export class MemoryStorage implements LimitsStorage {
  readonly data = new Map<string, unknown>()
  alarm: number | null = null
  async get<T>(key: string) {
    return structuredClone(this.data.get(key)) as T | undefined
  }
  async put<T>(key: string, value: T) {
    this.data.set(key, structuredClone(value))
  }
  async delete(keys: string[]) {
    let n = 0
    for (const k of keys) if (this.data.delete(k)) n++
    return n
  }
  async list<T>({ prefix }: { prefix: string }) {
    return new Map(
      [...this.data].filter(([k]) => k.startsWith(prefix)) as [string, T][]
    )
  }
  async getAlarm() {
    return this.alarm
  }
  async setAlarm(at: number) {
    this.alarm = at
  }
}

export function memoryLimits(storage = new MemoryStorage()): LimitsClient & {
  storage: MemoryStorage
} {
  return {
    storage,
    admit: (req) => admit(storage, req),
    remember: (memo, answer) =>
      remember(storage, memo, answer, NOW.getTime() + 1),
    forget: (memo) => forget(storage, memo),
  }
}

export interface Calls {
  run: { model: string; inputs: Record<string, unknown>; options: AiOptions }[]
  limit: string[]
  turnstile: { token: string; ip: string }[]
  background: Promise<unknown>[]
}

export interface DepsOverrides extends Partial<AskDeps> {
  reply?: string[]
  model?: RunModel
  turnstile?: TurnstileResult
  limited?: boolean
  notes?: string
}

export function deps(overrides: DepsOverrides = {}): {
  deps: AskDeps
  calls: Calls
  limits: ReturnType<typeof memoryLimits>
} {
  const calls: Calls = { run: [], limit: [], turnstile: [], background: [] }
  const reply = overrides.reply ?? [
    "Mladen co-founded ",
    "TenderLift in September 2025. ",
    '<<<META>>>{"kind":"answer","sources":["/work/tenderlift"]}',
  ]
  const model: RunModel = overrides.model ?? (async () => modelStream(reply))
  const limits = memoryLimits()
  const {
    reply: _r,
    model: _m,
    turnstile = "ok",
    limited = false,
    notes = "",
    ...rest
  } = overrides
  const base: AskDeps = {
    config: CONFIG,
    knowledge: KNOWLEDGE,
    run: async (id, inputs, options) => {
      calls.run.push({ model: id, inputs, options })
      return model(id, inputs, options)
    },
    limiter: {
      limit: async ({ key }) => {
        calls.limit.push(key)
        return { success: !limited }
      },
    },
    limits,
    verifyTurnstile: async (token, ip) => {
      calls.turnstile.push({ token, ip })
      return turnstile
    },
    loadNotes: async () => notes,
    waitUntil: (p) => {
      calls.background.push(p)
    },
    now: () => NOW,
  }
  return { deps: { ...base, ...rest }, calls, limits }
}

/**
 * Waits for the background work the handler started (memo writes, question
 * log writes), including work started by other background work.
 */
export async function settle(calls: Calls) {
  let seen = -1
  while (seen !== calls.background.length) {
    seen = calls.background.length
    await Promise.all(calls.background)
  }
}

/** A valid session token for the default binding. */
export async function sessionFor(
  binding: { origin?: string; ip?: string; ua?: string } = {},
  nowMs = NOW.getTime(),
  ttl = CONFIG.sessionSeconds
): Promise<string> {
  const keys = await deriveKeys(SIGNING_KEY)
  const { token } = await issueSession(
    keys,
    {
      origin: binding.origin ?? ORIGIN,
      ip: binding.ip ?? IP,
      userAgent: binding.ua ?? UA,
    },
    nowMs,
    ttl
  )
  return token
}

export interface AskInit {
  origin?: string | null
  method?: string
  type?: string
  accept?: string | null
  path?: string
  raw?: string
  ip?: string
  ua?: string
  /** A session token; default: none. */
  session?: string
  /** A Turnstile token; default: the dummy token when there is no session. */
  turnstile?: string | null
  headers?: Record<string, string>
}

/** A request as the panel sends it. */
export function ask(body: unknown, init: AskInit = {}): Request {
  const headers = new Headers(init.headers)
  if (init.origin !== null) headers.set("Origin", init.origin ?? ORIGIN)
  headers.set("Content-Type", init.type ?? "application/json")
  if (init.accept !== null)
    headers.set("Accept", init.accept ?? "text/event-stream")
  headers.set("CF-Connecting-IP", init.ip ?? IP)
  headers.set("User-Agent", init.ua ?? UA)
  if (init.session) headers.set(SESSION_HEADER, init.session)
  const turnstile =
    init.turnstile === undefined
      ? init.session
        ? null
        : DUMMY_TOKEN
      : init.turnstile
  if (turnstile) headers.set(TURNSTILE_HEADER, turnstile)
  const method = init.method ?? "POST"
  return new Request(`https://ask.example.test${init.path ?? "/ask"}`, {
    method,
    headers,
    body:
      method === "GET" || method === "OPTIONS"
        ? undefined
        : (init.raw ?? JSON.stringify(body)),
  })
}
