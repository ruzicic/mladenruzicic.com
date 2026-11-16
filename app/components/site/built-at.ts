import { cacheLife } from "next/cache"

/**
 * When the site was last built, in ms: the moment the footer's station clock
 * is drawn at in the prerendered markup, before it mounts and shows the time
 * in Ticino. Cached, so the prerender captures it once (a server render has
 * no "now" under Cache Components). Nothing shows it as a date.
 */
export async function getBuiltAt(): Promise<number> {
  "use cache"
  cacheLife("max")
  return Date.now()
}
