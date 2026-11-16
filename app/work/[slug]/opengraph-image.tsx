import { notFound } from "next/navigation"
import { ImageResponse } from "next/og"

import { getProductMark, getStories, getStory } from "@/lib/content"
import { productStatusLine } from "@/lib/seo/markdown"
import {
  artDataUri,
  markDataUri,
  OG_CONTENT_TYPE,
  OG_SIZE,
  OgCard,
  ogFonts,
} from "@/lib/seo/og"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/**
 * `alt` has to be a static export here: `generateImageMetadata` would give each
 * slug its own alt text, but it also inserts a `[__metadata_id__]` segment.
 */
export const alt = "A case study by Mladen Ružičić"

/** The nine stories only; every other `/work/<slug>` redirects. */
export function generateStaticParams() {
  return getStories().map((entry) => ({ slug: entry.slug }))
}

/**
 * Per-story card: the product tile, the story's title and its one line.
 * Node runtime (the default) because Satori reads the TTFs in `assets/fonts`.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = getStory(slug)
  // Only the nine stories have a card; a retired or unknown slug is a 404, not
  // a Satori render.
  if (!entry) notFound()
  const mark = getProductMark(slug)
  const svg =
    mark?.mark.kind === "art"
      ? await artDataUri(mark.mark.src)
      : mark?.mark.kind === "svg"
        ? await markDataUri(mark.mark.src, mark.fg)
        : undefined

  return new ImageResponse(
    <OgCard
      title={entry.title}
      line={entry.line}
      meta={productStatusLine(slug)}
      tile={mark ? { mark, svg } : undefined}
    />,
    { ...size, fonts: await ogFonts() }
  )
}
