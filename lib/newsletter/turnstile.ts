/**
 * Cloudflare Turnstile for the footer's newsletter sign-up (owner,
 * 2026-11-16: "add the same invisible check Ask uses"). The same widget and
 * site key as Ask, with its own `action`; the token is verified here, in the
 * `subscribe` Server Action, instead of in the Ask Worker.
 *
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY   the widget's site key (public by design;
 *                                    already set for Ask)
 *   TURNSTILE_SECRET_KEY             the same widget's secret, host env only
 *
 * Both or nothing. With either unset (local dev, CI, and production until the
 * secret is added in the hosting environment) the check is off: no widget,
 * no script, no extra field, and the action does what it did before the
 * check existed. With both set, a sign-up without a token that verifies is
 * refused with the generic "did not go through" line.
 *
 * Read by `next.config.ts` (Turnstile's origin in the content security
 * policy), `SiteFooter` (the site key, and only the key, for the form) and
 * the action. Relative imports only and no side effects: `next.config.ts`
 * imports this file. Never import it from a client component: nothing here
 * belongs in the browser (the form takes its constants from `./protocol`).
 *
 * Siteverify as documented on 2026-11-12 at
 * developers.cloudflare.com/turnstile/get-started/server-side-validation/
 * (the same reading as `workers/ask/src/turnstile.ts`): a token is at most
 * 2048 characters, single-use and valid for 300 seconds; the answer carries
 * `success`, `hostname`, `action` and `error-codes`.
 */

import { NEWSLETTER_TURNSTILE_ACTION } from "./protocol"

export { NEWSLETTER_TURNSTILE_ACTION, TURNSTILE_FIELD } from "./protocol"

export const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify"

const MAX_TOKEN_CHARS = 2048
const SITE_KEY = /^[\w-]{8,64}$/

/** The secrets Cloudflare publishes for tests: they work with no account. */
const TEST_SECRETS = [
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
]

type Env = Record<string, string | undefined>

interface NewsletterTurnstile {
  siteKey: string
  secret: string
}

/** Both variables, or `null` when the check is off. */
export function newsletterTurnstile(
  env: Env = process.env
): NewsletterTurnstile | null {
  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
  const secret = env.TURNSTILE_SECRET_KEY?.trim()
  if (!siteKey || !secret) return null
  if (!SITE_KEY.test(siteKey))
    throw new Error(
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY does not look like a site key"
    )
  return { siteKey, secret }
}

/**
 * The site key for the form when the check is on, else `null`. The only
 * piece of this file that may reach the browser.
 */
export function newsletterTurnstileSiteKey(
  env: Env = process.env
): string | null {
  return newsletterTurnstile(env)?.siteKey ?? null
}

/**
 * `ok`; `failed` (the visitor's token is missing, malformed, spent, or for
 * another site or action); or `unavailable` (Siteverify could not be asked,
 * or the secret is wrong). The action refuses the last two alike.
 */
export type TurnstileResult = "ok" | "failed" | "unavailable"

export interface VerifyOptions {
  secret: string
  /** The site's hostname for this request; the token must name it. */
  hostname: string | null
  /** The visitor's IP, when the platform states it; optional for Siteverify. */
  remoteIp: string | null
  /**
   * Accept Cloudflare's published test secrets (they pass a dummy token from
   * any page). Only under `next dev`; in production one counts as broken.
   */
  allowTestSecret: boolean
  fetch?: typeof fetch
  timeoutMs?: number
}

export async function verifyTurnstile(
  token: string,
  {
    secret,
    hostname,
    remoteIp,
    allowTestSecret,
    fetch: send = fetch,
    timeoutMs = 5_000,
  }: VerifyOptions
): Promise<TurnstileResult> {
  if (!token || token.length > MAX_TOKEN_CHARS) return "failed"
  // Printable ASCII only: the token goes into a form body, nothing else.
  if (!/^[\x21-\x7e]+$/.test(token)) return "failed"
  const test = TEST_SECRETS.includes(secret)
  if (test && !allowTestSecret) return "unavailable"
  if (!hostname) return "failed"

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
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) return "unavailable"
    result = (await res.json()) as typeof result
  } catch {
    // Network error or timeout. Not logged: the error can carry the request.
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
  // The test secrets always answer for `example.com` and no action.
  if (test) return result.hostname === "example.com" ? "ok" : "failed"
  if (result.action !== NEWSLETTER_TURNSTILE_ACTION) return "failed"
  if (
    typeof result.hostname !== "string" ||
    result.hostname.toLowerCase() !== hostname
  )
    return "failed"
  return "ok"
}

/**
 * The hostname the request was made to, as Next's own Server Action check
 * reads it (`X-Forwarded-Host`, else `Host`), lowercased and without the
 * port. Next has already refused a request whose `Origin` differs from it.
 */
export function requestHostname(headers: Headers): string | null {
  const raw = (headers.get("x-forwarded-host") ?? headers.get("host"))
    ?.split(",")[0]
    ?.trim()
    .toLowerCase()
  if (!raw) return null
  // `[::1]:3000` keeps its brackets; `example.com:443` loses the port.
  const host = raw.startsWith("[") ? raw.slice(0, raw.indexOf("]") + 1) : raw
  return host.replace(/:\d+$/, "") || null
}

/**
 * The visitor's IP when the platform states it (Vercel sets `X-Real-IP` and
 * `X-Forwarded-For`), else `null`. Siteverify takes it as an extra signal;
 * it is never stored or logged.
 */
export function clientIp(headers: Headers): string | null {
  const ip = (
    headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]
  )?.trim()
  return ip && /^[0-9a-f.:]{2,45}$/i.test(ip) ? ip : null
}
