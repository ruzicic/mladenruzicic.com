/**
 * Whether the site talks to the live Ask Worker, read once from two public
 * build-time variables (workers/ask/README.md "Switch the site on"):
 *
 *   NEXT_PUBLIC_ASK_ENDPOINT          https://ask.mladenruzicic.com/ask
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY    the widget's site key (public by design)
 *
 * Both or nothing: with either unset, typed questions stay on the keyword
 * match and no Turnstile or Worker origin enters the content security
 * policy. `next.config.ts` (the policy) and `TopBlock` (the panel's data)
 * both read it here, so they cannot disagree.
 */

/** Where Turnstile's script and its challenge frame come from. */
export const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com"

export interface AskLiveConfig {
  endpoint: string
  siteKey: string
}

const SITE_KEY = /^[\w-]{8,64}$/

export function askLiveConfig(
  env: Record<string, string | undefined> = process.env
): AskLiveConfig | null {
  const endpoint = env.NEXT_PUBLIC_ASK_ENDPOINT?.trim()
  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
  if (!endpoint || !siteKey) return null
  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    throw new Error(
      `NEXT_PUBLIC_ASK_ENDPOINT is not a URL: "${endpoint}" (workers/ask/README.md)`
    )
  }
  const local = /^(localhost|127\.0\.0\.1)$/.test(url.hostname)
  if (url.protocol !== "https:" && !(local && url.protocol === "http:"))
    throw new Error("NEXT_PUBLIC_ASK_ENDPOINT must be an https:// URL")
  if (!SITE_KEY.test(siteKey))
    throw new Error(
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY does not look like a site key"
    )
  return { endpoint: url.href, siteKey }
}
