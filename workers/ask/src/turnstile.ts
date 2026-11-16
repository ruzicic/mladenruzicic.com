import { TURNSTILE_ACTION } from "../../../lib/ask/protocol"

/**
 * Server-side validation of a Turnstile token (Siteverify), read on
 * 2026-11-12 from developers.cloudflare.com/turnstile/get-started/server-side-validation/:
 * a token is at most 2048 characters, valid for 300 seconds and single-use;
 * the response has `success`, `hostname`, `action` and `error-codes`.
 *
 * A token passes only when `success` is true, its `action` is the one the
 * panel sets, and its `hostname` is one of the site's. The published test
 * secrets (developers.cloudflare.com/turnstile/troubleshooting/testing/)
 * always report the hostname `example.com` and no action, so with one of
 * those that is what is expected instead. A test secret accepts the
 * published dummy token, so it is honoured only in local development
 * (`allowTestSecret`, set from `ASK_ALLOW_LOCALHOST`); in production it
 * counts as a missing secret and Ask stays closed.
 */

export const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify"

export const MAX_TURNSTILE_TOKEN_CHARS = 2048

/** The secrets Cloudflare publishes for tests: they work with no account. */
export const TEST_SECRETS = [
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
] as const

/**
 * `ok`, `failed` (the visitor's token is not good), or `unavailable`
 * (Siteverify could not be asked, or failed on its side: not the visitor's
 * fault, so it is not reported as a failed check).
 */
export type TurnstileResult = "ok" | "failed" | "unavailable"

export interface VerifyOptions {
  secret: string
  remoteIp: string
  hostnames: string[]
  allowTestSecret: boolean
  fetch?: typeof fetch
  timeoutMs?: number
}

export async function verifyTurnstile(
  token: string,
  {
    secret,
    remoteIp,
    hostnames,
    allowTestSecret,
    fetch: send = fetch,
    timeoutMs = 5_000,
  }: VerifyOptions
): Promise<TurnstileResult> {
  if (!token || token.length > MAX_TURNSTILE_TOKEN_CHARS) return "failed"
  // Printable ASCII only: the token goes into a form body, nothing else.
  if (!/^[\x21-\x7e]+$/.test(token)) return "failed"
  const test = (TEST_SECRETS as readonly string[]).includes(secret)
  if (test && !allowTestSecret) return "unavailable"
  if (!test && hostnames.length === 0) return "unavailable"

  let result: {
    success?: unknown
    hostname?: unknown
    action?: unknown
    "error-codes"?: unknown
  }
  try {
    const body = new URLSearchParams({ secret, response: token })
    if (remoteIp) body.set("remoteip", remoteIp)
    const res = await send(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) return "unavailable"
    result = (await res.json()) as typeof result
  } catch {
    return "unavailable"
  }

  if (result.success !== true) {
    const codes = Array.isArray(result["error-codes"])
      ? result["error-codes"]
      : []
    return codes.includes("internal-error") ||
      codes.includes("invalid-input-secret") ||
      codes.includes("missing-input-secret")
      ? "unavailable"
      : "failed"
  }
  if (test) return result.hostname === "example.com" ? "ok" : "failed"
  if (result.action !== TURNSTILE_ACTION) return "failed"
  if (
    typeof result.hostname !== "string" ||
    !hostnames.includes(result.hostname.toLowerCase())
  )
    return "failed"
  return "ok"
}
