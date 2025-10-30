import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/about", "/work", "/uses"].map((route) => ({
    url: `https://mladenruzicic.com${route}`,
    lastModified: new Date().toISOString().split("T")[0],
    changeFrequency: (route === "" ? "weekly" : "monthly") as
      | "weekly"
      | "monthly",
    priority: route === "" ? 1 : 0.8,
  }))

  return [...routes]
}
