import type { MetadataRoute } from "next"

import { getPage, getSite, getWork } from "@/lib/content"
import { LAST_UPDATED } from "@/lib/content/markdown"

/**
 * Built from `content/`, so a new case study appears without touching this file.
 *
 * `lastModified` comes from the content's own `updated` where there is one
 * (`/about`, `/uses`) and from the build date otherwise — case studies have no
 * per-entry timestamp in the schema, and a build date is honest: the page really
 * was regenerated then.
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
    lastModified: LAST_UPDATED,
  }))

  return [...staticRoutes, ...workRoutes]
}
