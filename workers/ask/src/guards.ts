import {
  MAX_BODY_BYTES,
  MAX_QUESTION_CHARS,
  MIN_QUESTION_CHARS,
} from "../../../lib/ask/protocol"
import type { AskConfig } from "./config"

/**
 * The request checks that need no I/O, in the order the handler applies
 * them. Each returns a plain result; the handler turns a failure into a
 * response. None of them says which rule failed: to the visitor every one
 * of them is `bad_request`.
 */

const LOCALHOST = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/

/** Is this `Origin` header allowed to call the Worker? Exact match only. */
export function isAllowedOrigin(
  origin: string | null,
  config: Pick<AskConfig, "allowedOrigins" | "allowLocalhost">
): origin is string {
  if (!origin) return false
  if (config.allowedOrigins.includes(origin)) return true
  return config.allowLocalhost && LOCALHOST.test(origin)
}

export function isJson(contentType: string | null): boolean {
  if (!contentType) return false
  return contentType.split(";")[0].trim().toLowerCase() === "application/json"
}

/** The panel always asks for a stream; a bare script often does not. */
export function acceptsEventStream(accept: string | null): boolean {
  return !!accept && /(^|,)\s*text\/event-stream\s*(;|,|$)/i.test(accept)
}

export type BodyResult =
  { ok: true; text: string } | { ok: false; reason: "too_large" | "unreadable" }

/**
 * The body as text, read with a hard byte cap: a `Content-Length` over the
 * cap is refused before reading, and a body without one is cut off as soon
 * as it passes the cap, so a large upload is never buffered.
 */
export async function readCappedBody(
  request: Request,
  maxBytes = MAX_BODY_BYTES
): Promise<BodyResult> {
  const declared = Number(request.headers.get("Content-Length") ?? "")
  if (Number.isFinite(declared) && declared > maxBytes)
    return { ok: false, reason: "too_large" }
  if (!request.body) return { ok: true, text: "" }
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) {
        await reader.cancel().catch(() => {})
        return { ok: false, reason: "too_large" }
      }
      chunks.push(value)
    }
  } catch {
    return { ok: false, reason: "unreadable" }
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const c of chunks) {
    bytes.set(c, offset)
    offset += c.byteLength
  }
  try {
    return {
      ok: true,
      text: new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(
        bytes
      ),
    }
  } catch {
    return { ok: false, reason: "unreadable" }
  }
}

/**
 * Control characters, zero-width characters and bidirectional overrides:
 * nothing a visitor means to type, and a common way to hide instructions.
 */
export function isInvisible(code: number): boolean {
  return (
    (code <= 0x1f && code !== 0x09 && code !== 0x0a) ||
    (code >= 0x7f && code <= 0x9f) ||
    (code >= 0x200b && code <= 0x200f) ||
    (code >= 0x2028 && code <= 0x202e) ||
    (code >= 0x2066 && code <= 0x2069) ||
    code === 0xfeff
  )
}

export type QuestionResult =
  { ok: true; question: string } | { ok: false; reason: "shape" | "length" }

/**
 * `{ "question": "…" }` and nothing else: no history, no options. Control
 * characters are removed and whitespace collapsed before the length check.
 */
export function parseQuestion(text: string): QuestionResult {
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return { ok: false, reason: "shape" }
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return { ok: false, reason: "shape" }
  const keys = Object.keys(body)
  if (keys.length !== 1 || keys[0] !== "question")
    return { ok: false, reason: "shape" }
  const raw = (body as { question: unknown }).question
  if (typeof raw !== "string") return { ok: false, reason: "shape" }
  const question = [...raw]
    .map((ch) => (isInvisible(ch.codePointAt(0) ?? 0) ? " " : ch))
    .join("")
    .replace(/\s+/g, " ")
    .trim()
  const length = [...question].length
  if (length < MIN_QUESTION_CHARS || length > MAX_QUESTION_CHARS)
    return { ok: false, reason: "length" }
  return { ok: true, question }
}

const LINK = /\b(?:https?:\/\/|www\.)\S+|\b[\w-]+(?:\.[\w-]+)+\/\S*/giu

export type ScreenResult = { ok: true } | { ok: false; reason: string }

/**
 * Spam that never reaches the model: a question with fewer than two
 * letters, with more than one link, or that is mostly links. One bare
 * domain ("Is studenti.rs his?") is a fine question.
 */
export function screenQuestion(question: string): ScreenResult {
  const letters = question.match(/\p{L}/gu)?.length ?? 0
  if (letters < 2) return { ok: false, reason: "letters" }
  const links = question.match(LINK) ?? []
  if (links.length > 1) return { ok: false, reason: "links" }
  const linked = links.reduce((n, l) => n + l.length, 0)
  const visible = question.replace(/\s/g, "").length
  if (links.length && linked * 2 > visible)
    return { ok: false, reason: "mostly_link" }
  return { ok: true }
}

/**
 * The question as the repeat memo compares it: case, spacing and
 * punctuation do not make a new question.
 */
export function normalizeForMemo(question: string): string {
  return question
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
}

/**
 * The part of an address that names one visitor: an IPv4 address as it is,
 * an IPv6 address by its /64 network. One IPv6 connection usually holds a
 * whole /64 and rotates through it (privacy addresses), so keying on the
 * full address would hand out a fresh daily allowance per rotation. An
 * IPv4-mapped IPv6 address counts as its IPv4 address.
 */
export function visitorAddress(ip: string): string {
  const a = ip.trim().toLowerCase()
  if (!a.includes(":")) return a
  const mapped =
    /^(?:0{0,4}:){0,5}(?:0{0,4}:)?:?ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(a)
  if (mapped) return mapped[1]
  const [head, tail = ""] = a.split("::")
  const left = head ? head.split(":") : []
  const right = a.includes("::") && tail ? tail.split(":") : []
  const groups = a.includes("::")
    ? [
        ...left,
        ...Array(Math.max(0, 8 - left.length - right.length)).fill("0"),
        ...right,
      ]
    : left
  if (groups.length !== 8 || !groups.every((g) => /^[0-9a-f]{1,4}$/.test(g)))
    return a
  return `${groups
    .slice(0, 4)
    .map((g) => g.replace(/^0+(?=.)/, ""))
    .join(":")}::/64`
}
