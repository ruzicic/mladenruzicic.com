import { cacheLife } from "next/cache"

/**
 * The two places the shell needs the current date: the footer's copyright year
 * and the open end of the ZF band (`to: "now"`).
 *
 * SERVER ONLY, and cached. Cache Components refuses a bare `new Date()` during
 * a prerender because the value can change between renders; `"use cache"` with
 * a `days` lifetime is the sanctioned way to prerender it and let ISR refresh
 * it. Both values are passed down as props, so the client never recomputes them
 * and hydration can never disagree with the HTML.
 */

/** Current year plus the elapsed month fraction, e.g. 2026.67. */
export async function nowFraction(): Promise<number> {
  "use cache"
  cacheLife("days")
  const now = new Date()
  return now.getFullYear() + now.getMonth() / 12
}

/** Current year, for the footer. */
export async function currentYear(): Promise<number> {
  "use cache"
  cacheLife("days")
  return new Date().getFullYear()
}
