import type { MetadataRoute } from "next"

import { getPage, getSite, getWork } from "@/lib/content"
import { LAST_UPDATED } from "@/lib/content/markdown"

/**
 * Built from `content/`, so a new case study appears without touching this file.
 *
 * `lastModified` comes from the content's own `updated` where there is one —
 * `/about`, `/uses`, and any case study whose frontmatter sets it — and from
 * `LAST_UPDATED` otherwise. That fallback is the newest `updated` in
 * `content/`, not a build date, so a rebuild never moves it; the cost is that
 * an edit to `content/pages/uses.mdx` bumps every entry that has not set its
 * own `updated`. Set it in the frontmatter to opt an entry out of that.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSite()
  const aboutUpdated = getPage("about").updated
  const usesUpdated = getPage("uses").updated

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      // No trailing slash: Next resolves the home `alternates.canonical` to
      // the bare origin, and a `<loc>` that disagrees with the `<link
      // rel=canonical>` on the same document is a needless mismatch. The
      // breadcrumb and the markdown mirrors spell it the same way.
      url: site.url,
      changeFrequency: "weekly",
      priority: 1,
      lastModified: LAST_UPDATED,
    },
    {
      url: `${site.url}/work`,
      changeFrequency: "weekly",
      priority: 0.9,
      lastModified: LAST_UPDATED,
    },
    {
      url: `${site.url}/mentoring`,
      changeFrequency: "monthly",
      priority: 0.9,
      lastModified: LAST_UPDATED,
    },
    {
      url: `${site.url}/about`,
      changeFrequency: "monthly",
      priority: 0.8,
      lastModified: aboutUpdated,
    },
    {
      url: `${site.url}/uses`,
      changeFrequency: "yearly",
      priority: 0.4,
      lastModified: usesUpdated,
    },
  ]

  const workRoutes: MetadataRoute.Sitemap = getWork().map((entry) => ({
    url: `${site.url}/work/${entry.slug}`,
    changeFrequency:
      entry.status === "current" || entry.status === "active"
        ? "monthly"
        : "yearly",
    priority: entry.featured ? 0.8 : 0.6,
    lastModified: entry.updated ?? LAST_UPDATED,
  }))

  return [...staticRoutes, ...workRoutes]
}
