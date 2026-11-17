import type { Metadata, Viewport } from "next"

import { getHome, getSite } from "@/lib/content"

/**
 * Content dates are `YYYY-MM-DD`; Google reads `dateModified` as a DateTime
 * and flags a bare date on ProfilePage (Search Console, 2026-11-17).
 */
export function dateTime(date: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00Z` : date
}

/**
 * Metadata for every route. The root layout exports `baseMetadata` and
 * `baseViewport`; every page goes through `pageMetadata()`, which sets the
 * canonical, the markdown twin, Open Graph and the Twitter card in one place.
 * Titles and descriptions come from content (each page's `seo` block).
 */

const site = getSite()
const home = getHome()

/** `@ruzicic`, from the X profile URL in content. */
const X_HANDLE = `@${new URL(site.links.x).pathname.replace(/^\/+|\/+$/g, "")}`

/** The paper colour (`--color-paper` in `app/globals.css`): the light theme. */
const PAPER = "#fcfcfa"

/** The markdown twin of a page path. `/` has no segment, so it is `/index.md`. */
function markdownPath(path: string): string {
  return path === "/" ? "/index.md" : `${path}.md`
}

/** Shared `metadataBase`, title template, robots and card defaults. */
export const baseMetadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: home.seo.title,
    template: `%s · ${site.name}`,
  },
  description: home.seo.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  manifest: "/manifest.json",
  formatDetection: { telephone: false, address: false, email: false },
  // `/` itself has no `metadata` export, so its canonical and markdown twin
  // live here. Every other page replaces `alternates` through `pageMetadata`.
  alternates: {
    canonical: "/",
    types: { "text/markdown": markdownPath("/") },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: site.name,
    title: home.seo.title,
    description: home.seo.description,
    url: site.url,
  },
  twitter: {
    card: "summary_large_image",
    site: X_HANDLE,
    creator: X_HANDLE,
    title: home.seo.title,
    description: home.seo.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

/** One light theme: the browser chrome matches the paper. */
export const baseViewport: Viewport = {
  themeColor: PAPER,
  colorScheme: "light",
}

export interface PageMetadataInput {
  title: string
  description: string
  /** Path with a leading slash, e.g. `/work/tenderlift`. */
  path: string
  /**
   * `og:type`. `article` for a story, `website` for an index, `profile` for
   * `/about`. Defaults to `article` because stories are the majority.
   */
  type?: "article" | "website" | "profile"
  /** `YYYY-MM-DD`: `article:modified_time` for a story (as a DateTime). */
  modified?: string
  /**
   * Override the OG image. Omit it and Next uses the route's colocated
   * `opengraph-image.tsx`, which is what every route wants.
   *
   * NOTE: the image file has to sit next to the ROUTE. The `openGraph` object
   * returned here replaces the layout's wholesale (Next merges metadata one
   * top-level key at a time), so a route without its own image file ships no
   * `og:image`: the root `app/opengraph-image.tsx` does not cascade.
   */
  image?: string
}

/**
 * Per-route metadata: canonical, markdown twin (`<link rel="alternate"
 * type="text/markdown">`), Open Graph and Twitter. `alternates.canonical` is a
 * path resolved against `metadataBase`; `openGraph.url` is absolute because a
 * few validators still insist on it.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "article",
  modified,
  image,
}: PageMetadataInput): Metadata {
  const url = path === "/" ? site.url : new URL(path, site.url).toString()
  // The card's title is the tab's: `<title>` comes from the layout's
  // template (`%s · <name>`), which Next does not apply to `og:title` or
  // `twitter:title`, so it is spelled out here. `/` has no `metadata` of its
  // own and keeps the layout's.
  const shared = path === "/" ? title : `${title} · ${site.name}`
  const images = image ? [{ url: image }] : undefined
  const person = {
    firstName: site.name.split(" ")[0],
    lastName: site.name.split(" ").slice(1).join(" "),
    username: X_HANDLE.slice(1),
  }

  const openGraph: Metadata["openGraph"] =
    type === "article"
      ? {
          type: "article",
          authors: [`${site.url}/about`],
          ...(modified ? { modifiedTime: dateTime(modified) } : null),
          locale: "en_US",
          siteName: site.name,
          title: shared,
          description,
          url,
          ...(images ? { images } : null),
        }
      : type === "profile"
        ? {
            type: "profile",
            ...person,
            locale: "en_US",
            siteName: site.name,
            title: shared,
            description,
            url,
            ...(images ? { images } : null),
          }
        : {
            type: "website",
            locale: "en_US",
            siteName: site.name,
            title: shared,
            description,
            url,
            ...(images ? { images } : null),
          }

  return {
    title,
    description,
    alternates: {
      canonical: path,
      types: { "text/markdown": markdownPath(path) },
    },
    openGraph,
    twitter: {
      card: "summary_large_image",
      site: X_HANDLE,
      creator: X_HANDLE,
      title: shared,
      description,
      ...(images ? { images } : null),
    },
  }
}
