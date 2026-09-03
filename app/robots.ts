import type { MetadataRoute } from "next"

import { getSite } from "@/lib/content"

/**
 * Everything is public and crawlable.
 *
 * Deliberately NO `Disallow` for the markdown mirrors. Two reasons:
 *
 *   1. The URLs actually advertised to crawlers are `/about.md`,
 *      `/work/tenderlift.md` — via `<link rel="alternate" type="text/markdown">`
 *      and llms.txt's "append `.md`" instruction. They live under `/`, not
 *      `/md/`, so a `Disallow: /md/` guarded a namespace nothing links to.
 *   2. Where it did apply it was the classic anti-pattern: `app/md/[...path]`
 *      answers with `X-Robots-Tag: noindex`, and a crawler blocked by
 *      `Disallow` never fetches the response and therefore never sees the
 *      `noindex` — so a linked mirror could be indexed *without* its content.
 *      The header covers both `/md/*` and `*.md` and is the stronger signal.
 *
 * No `Host:` either — Yandex-only and deprecated since 2018.
 */
export default function robots(): MetadataRoute.Robots {
  const site = getSite()
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${site.url}/sitemap.xml`,
  }
}
