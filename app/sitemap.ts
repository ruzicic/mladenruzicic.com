import type { MetadataRoute } from "next"

import { getSite, getStories } from "@/lib/content"
import { columnStills } from "@/lib/content/schema"
import { LAST_UPDATED } from "@/lib/seo/markdown"

/**
 * Real pages only, built from `content/`: the six pages and the nine stories.
 * Every other `/work/<slug>` 308s to `/work#<slug>` and `/uses` 308s to
 * `/about`, so none of them is listed. `lastModified` is a story's own
 * `updated` where it has one and the content date (`SITE.updated`) otherwise,
 * never a build date, so a rebuild never moves it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSite()
  const headshot = `${site.url}${site.headshot.src}`

  const pages: MetadataRoute.Sitemap = [
    // No trailing slash: it matches the canonical Next resolves for `/`.
    {
      url: site.url,
      changeFrequency: "weekly",
      priority: 1,
      lastModified: LAST_UPDATED,
      images: [headshot],
    },
    {
      url: `${site.url}/work`,
      changeFrequency: "weekly",
      priority: 0.9,
      lastModified: LAST_UPDATED,
    },
    {
      url: `${site.url}/about`,
      changeFrequency: "monthly",
      priority: 0.8,
      lastModified: LAST_UPDATED,
      images: [headshot],
    },
    {
      url: `${site.url}/cv`,
      changeFrequency: "monthly",
      priority: 0.7,
      lastModified: LAST_UPDATED,
      images: [headshot],
    },
    {
      url: `${site.url}/mentoring`,
      changeFrequency: "monthly",
      priority: 0.7,
      lastModified: LAST_UPDATED,
    },
    {
      url: `${site.url}/press`,
      changeFrequency: "monthly",
      priority: 0.6,
      lastModified: LAST_UPDATED,
      images: [headshot],
    },
  ]

  const stories: MetadataRoute.Sitemap = getStories().map((entry) => ({
    url: `${site.url}/work/${entry.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
    lastModified: entry.updated ?? LAST_UPDATED,
    images: columnStills(entry.column).map((s) => `${site.url}${s.src}`),
  }))

  return [...pages, ...stories]
}
