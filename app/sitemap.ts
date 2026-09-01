import type { MetadataRoute } from "next"

import { getPage, getSite, getWork } from "@/lib/content"

/** Built from `content/`, so a new case study appears without touching this file. */
export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSite()
  const aboutUpdated = getPage("about").updated
  const usesUpdated = getPage("uses").updated

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${site.url}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/work`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${site.url}/mentoring`, changeFrequency: "monthly", priority: 0.9 },
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
    changeFrequency: entry.status === "current" ? "monthly" : "yearly",
    priority: entry.featured ? 0.8 : 0.6,
  }))

  return [...staticRoutes, ...workRoutes]
}
