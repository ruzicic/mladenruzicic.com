import type { MetadataRoute } from "next"

import { getSite } from "@/lib/content"

/**
 * Everything is public and indexable. `/md/` is the machine mirror of pages that
 * already exist, so it is disallowed to keep duplicate content out of the index
 * — agents reach it through `Accept: text/markdown`, the `.md` suffix or
 * `llms.txt`, none of which care about robots rules.
 */
export default function robots(): MetadataRoute.Robots {
  const site = getSite()
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/md/"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  }
}
