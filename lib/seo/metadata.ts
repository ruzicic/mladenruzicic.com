import type { Metadata } from "next"

import { SITE } from "@/content/site"

/** Shared `metadataBase`, robots and OG defaults for every route. */
export const baseMetadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.roles[0]}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  manifest: "/manifest.json",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.roles[0]}`,
    description: SITE.description,
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.roles[0]}`,
    description: SITE.description,
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

export interface PageMetadataInput {
  title: string
  description: string
  /** Path with a leading slash, e.g. `/work/tenderlift`. */
  path: string
  /**
   * `og:type`. `article` for a case study, `website` for an index, `profile`
   * for `/about`. Defaults to `article` because case studies are the majority.
   */
  type?: "article" | "website" | "profile"
  /**
   * Override the OG image. Omit and Next uses the colocated
   * `opengraph-image.tsx` for the route, which is what every route wants — pass
   * this only for an image that is not file-based.
   *
   * NOTE: it has to be colocated with the ROUTE. Returning an `openGraph`
   * object here replaces the one in `baseMetadata` wholesale (Next merges
   * metadata a top-level key at a time), so a route without its own image file
   * ships no `og:image` at all — the root `app/opengraph-image.tsx` does not
   * cascade into it.
   */
  image?: string
}

/**
 * Per-route metadata with a correct canonical and `openGraph.url`.
 *
 * `alternates.canonical` is a path, resolved against `metadataBase` from
 * `baseMetadata`; `openGraph.url` is absolute because a few validators still
 * insist on it.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "article",
  image,
}: PageMetadataInput): Metadata {
  const url = new URL(path, SITE.url).toString()
  const images = image ? [{ url: image }] : undefined
  return {
    title,
    description,
    alternates: {
      canonical: path,
      ...(path === "/" ? null : { types: { "text/markdown": `${path}.md` } }),
    },
    openGraph: {
      type,
      // Re-stated because this object replaces `baseMetadata.openGraph`.
      locale: "en_US",
      siteName: SITE.name,
      title,
      description,
      url,
      ...(images ? { images } : null),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(images ? { images } : null),
    },
  }
}
