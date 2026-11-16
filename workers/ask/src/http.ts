import {
  SESSION_HEADER,
  TURNSTILE_HEADER,
  type RefusalBody,
  type RefusalOutcome,
} from "../../../lib/ask/protocol"

/**
 * Every response the Worker sends is built here, so CORS and the security
 * headers cannot be forgotten on one path. A refusal is one JSON object,
 * `{ "outcome": …, "retryAfter"?: … }`, and nothing else: no message, no
 * detail of which rule fired, no stack.
 */

/** Response headers that hold for every response. */
const BASE: Record<string, string> = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  // Nothing here is a page: it may not be framed, run script or load anything.
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Cross-Origin-Resource-Policy": "same-site",
}

/**
 * CORS for an allowed origin: that exact origin, never `*`, and no
 * credentials (the session is a header, not a cookie).
 */
export function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST",
    "Access-Control-Allow-Headers": `Content-Type, ${SESSION_HEADER}, ${TURNSTILE_HEADER}`,
    "Access-Control-Expose-Headers": `${SESSION_HEADER}, Retry-After`,
    "Access-Control-Max-Age": "7200",
    Vary: "Origin",
  }
}

const STATUS: Record<RefusalOutcome, number> = {
  bad_request: 400,
  challenge_needed: 401,
  challenge_failed: 403,
  rate_limited: 429,
  daily_limit: 429,
  budget_reached: 429,
  unavailable: 503,
}

export function refusal(
  outcome: RefusalOutcome,
  headers: Record<string, string> = {},
  options: { status?: number; retryAfter?: number } = {}
): Response {
  const body: RefusalBody = { outcome }
  const extra: Record<string, string> = {}
  if (options.retryAfter !== undefined) {
    body.retryAfter = Math.max(1, Math.ceil(options.retryAfter))
    extra["Retry-After"] = String(body.retryAfter)
  }
  return new Response(JSON.stringify(body), {
    status: options.status ?? STATUS[outcome],
    headers: {
      ...BASE,
      "Content-Type": "application/json; charset=utf-8",
      ...headers,
      ...extra,
    },
  })
}

export function preflight(headers: Record<string, string>): Response {
  return new Response(null, { status: 204, headers: { ...BASE, ...headers } })
}

export function eventStream(
  body: ReadableStream<Uint8Array>,
  headers: Record<string, string>
): Response {
  return new Response(body, {
    status: 200,
    headers: {
      ...BASE,
      "Content-Type": "text/event-stream; charset=utf-8",
      ...headers,
    },
  })
}
