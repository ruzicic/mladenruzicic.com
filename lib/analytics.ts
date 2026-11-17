import { trackEvent } from "fathom-client"

/**
 * Fathom events (owner, 2026-11-17: "da, dodaj svih 6 eventova"). Page views
 * are `app/components/FathomAnalytics.tsx`; the newsletter's goal is its own
 * `trackGoal` in `NewsletterForm.tsx`. These are the six named events, and
 * the only ones: add none without the owner asking.
 *
 * Names are fixed strings or a fixed prefix and a product slug from content.
 * Never the text of a question, an address, a URL or anything a visitor
 * typed.
 *
 * Client-safe and side-effect free: Server Components import `linkEvent`
 * and the builders to write `data-track` on a link; `track` runs only in the
 * browser.
 */
export type TrackEvent =
  /** 1. Ask: the panel opened, a question sent (prepared or typed). */
  | "ask: open"
  | "ask: prepared question"
  | "ask: typed question"
  /** 2. A product's own site, from a list row, a strip card or a cover. */
  | `website: ${string}`
  /** 3. The CV as a PDF, from `/cv`'s "Download PDF" or About's button. */
  | "cv: download"
  /** 4. Mentoring: the MentorCruise profile, the 15-minute call. */
  | "mentoring: mentorcruise"
  | "mentoring: call"
  /** 5. Any email link. */
  | "contact: email"
  /** 6. A "Recent work" card opened through the card in focus. */
  | `recent work: ${string}`

/** `website: <slug>`: a product's website, wherever it is one of its two actions. */
export const websiteEvent = (slug: string): TrackEvent => `website: ${slug}`

/** `recent work: <slug>`: a strip card opened by the card in focus itself. */
export const recentWorkEvent = (slug: string): TrackEvent =>
  `recent work: ${slug}`

/** Every name `TrackEvent` allows, for strings read back from the DOM. */
const NAME =
  /^(?:ask: (?:open|prepared question|typed question)|cv: download|mentoring: (?:mentorcruise|call)|contact: email|(?:website|recent work): [a-z0-9]+(?:-[a-z0-9]+)*)$/

export function isTrackEvent(name: unknown): name is TrackEvent {
  return typeof name === "string" && NAME.test(name)
}

/**
 * The event a link's destination stands for, by its `href`, or `undefined`.
 * Applied at render (`data-track`) and again, as a fallback, by the click
 * listener, so every way the site renders these destinations counts:
 * - `mailto:` (and the `/cdn-cgi/l/email-protection` link Cloudflare
 *   rewrites it into on the live site): `contact: email`;
 * - `/cv.pdf` (`SITE.links.cv`): `cv: download`;
 * - MentorCruise (`mentors.to`, `mentorcruise.com`): `mentoring: mentorcruise`;
 * - the booking link (`cal.com`, `SITE.links.booking`): `mentoring: call`.
 */
export function linkEvent(
  href: string | null | undefined
): TrackEvent | undefined {
  if (!href) return undefined
  if (/^mailto:/i.test(href) || href.startsWith("/cdn-cgi/l/email-protection"))
    return "contact: email"
  if (/^\/cv\.pdf(?:[?#]|$)/.test(href)) return "cv: download"
  let host: string
  try {
    host = new URL(href).hostname.replace(/^www\./, "")
  } catch {
    return undefined
  }
  if (host === "mentors.to" || host === "mentorcruise.com")
    return "mentoring: mentorcruise"
  if (host === "cal.com") return "mentoring: call"
  return undefined
}

const ON =
  process.env.NODE_ENV === "production" &&
  Boolean(process.env.NEXT_PUBLIC_FATHOM_SITE_ID)

/**
 * Sends one event to Fathom (`trackEvent`, a `sendBeacon` to
 * `cdn.usefathom.com`, so a navigation never waits for it). A no-op outside
 * a production build with a site id, on the server, and when the script is
 * blocked (fathom-client only queues the call). Never throws.
 *
 * For the end-to-end tests only (`tests/analytics.spec.ts`): an array at
 * `window.__fathomEvents` collects each name as well, with or without a site
 * id. Nothing on the site defines it.
 */
export function track(name: TrackEvent): void {
  try {
    if (typeof window === "undefined") return
    const log = (window as { __fathomEvents?: unknown }).__fathomEvents
    if (Array.isArray(log)) log.push(name)
    if (ON) trackEvent(name)
  } catch {
    // Counting is a nicety: never let it break the click it counts.
  }
}

/**
 * Counts a link: its `data-track`, else what its `href` stands for
 * (`linkEvent`). The click listener (`FathomAnalytics`) calls it for every
 * link clicked; the strip calls it for a primary link it opens itself.
 */
export function trackLink(link: Element): void {
  const name =
    link.getAttribute("data-track") ?? linkEvent(link.getAttribute("href"))
  if (isTrackEvent(name)) track(name)
}
