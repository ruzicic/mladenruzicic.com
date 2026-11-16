import { z } from "zod"

import {
  clientIp,
  newsletterTurnstile,
  requestHostname,
  TURNSTILE_FIELD,
  verifyTurnstile,
} from "./turnstile"

/**
 * What the `subscribe` Server Action (`app/components/site/subscribe.ts`)
 * does, with the environment, the request headers and `fetch` passed in, so
 * the tests can run it against a mocked Kit and Siteverify
 * (`tests/newsletter-bots.spec.ts`). Nothing here reads the request on its
 * own or logs anything.
 *
 * Same provider, form and env var as the live site's old
 * `app/api/subscribe/route.ts`: Kit (formerly ConvertKit) API v3, form
 * 5347573, key in `CONVERTKIT_API_KEY`. v3 is deprecated by Kit but still
 * served; its form-subscribe call takes `api_key`, `email` and an optional
 * `first_name` (`name` is deprecated), and answers 200 with a `subscription`
 * object. Only that answer counts as a sign-up.
 *
 * Bots meet two layers before Kit is called:
 *
 * 1. The honeypot (`website`), with no key needed: people never see it, so
 *    a filled one gets the success-looking answer and nothing is sent.
 * 2. Turnstile (`lib/newsletter/turnstile.ts`), only while both
 *    `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` are set: the
 *    token in the `turnstile` field must verify, or the answer is `failed`.
 *    With either unset the check is skipped entirely and the sign-up works
 *    exactly as it did before the check existed.
 *
 * Siteverify is asked last, just before Kit, so a malformed or reserved
 * address never spends a call (or the visitor's token).
 */

const FORM_ID = "5347573"
export const KIT_ENDPOINT = `https://api.convertkit.com/v3/forms/${FORM_ID}/subscribe`
const TIMEOUT_MS = 8000

export type SubscribeState =
  | { status: "idle" }
  | { status: "ok" }
  | {
      status: "error"
      code: "invalid" | "unavailable" | "failed"
      /** What was typed, so the field keeps it after the form resets. */
      email: string
    }

const emailSchema = z.string().trim().max(254).pipe(z.email())

/**
 * RFC 2606 / 6761 names that can never receive mail. They are refused before
 * the provider is called, which also means the e2e suite's addresses
 * (`@example.com`) can never reach the live list, key or no key.
 */
const RESERVED =
  /@(?:(?:[^@]+\.)?example\.(?:com|net|org)|[^@]+\.(?:test|example|invalid|localhost))$/i

export interface SubscribeContext {
  env: Record<string, string | undefined>
  /** The incoming request's headers (hostname and visitor IP). */
  headers: Headers
  fetch?: typeof fetch
}

export async function runSubscribe(
  formData: FormData,
  { env, headers, fetch: send = fetch }: SubscribeContext
): Promise<SubscribeState> {
  const raw = formData.get("email")
  const typed = typeof raw === "string" ? raw.slice(0, 254) : ""
  // The honeypot: people never see it, so a filled one is a bot. Answer as
  // if it worked and send nothing.
  const honeypot = formData.get("website")
  if (typeof honeypot === "string" && honeypot !== "") return { status: "ok" }

  const parsed = emailSchema.safeParse(raw)
  if (!parsed.success) {
    return { status: "error", code: "invalid", email: typed }
  }

  const apiKey = env.CONVERTKIT_API_KEY
  if (!apiKey) return { status: "error", code: "unavailable", email: typed }
  if (RESERVED.test(parsed.data)) {
    return { status: "error", code: "invalid", email: typed }
  }

  // Off (null) unless both Turnstile variables are set: see the header.
  const check = newsletterTurnstile(env)
  if (check) {
    const token = formData.get(TURNSTILE_FIELD)
    const verdict = await verifyTurnstile(
      typeof token === "string" ? token : "",
      {
        secret: check.secret,
        hostname: requestHostname(headers),
        remoteIp: clientIp(headers),
        allowTestSecret: env.NODE_ENV === "development",
        fetch: send,
      }
    )
    if (verdict !== "ok") {
      return { status: "error", code: "failed", email: typed }
    }
  }

  try {
    const res = await send(KIT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ api_key: apiKey, email: parsed.data }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) return { status: "error", code: "failed", email: typed }
    const body: unknown = await res.json().catch(() => null)
    const confirmed =
      typeof body === "object" &&
      body !== null &&
      "subscription" in body &&
      typeof body.subscription === "object" &&
      body.subscription !== null
    return confirmed
      ? { status: "ok" }
      : { status: "error", code: "failed", email: typed }
  } catch {
    // Network error or timeout. Deliberately not logged: the error can
    // carry the request.
    return { status: "error", code: "failed", email: typed }
  }
}
