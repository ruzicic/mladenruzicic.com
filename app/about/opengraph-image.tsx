import { ImageResponse } from "next/og"

import { getAbout, getSite } from "@/lib/content"
import { OG_CONTENT_TYPE, OG_SIZE, OgCard, ogFonts } from "@/lib/seo/og"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "About Mladen Ružičić: the longer story"

/**
 * `/about` card. Colocated with the route because `pageMetadata()` returns its own
 * `openGraph` object and the root card does not cascade. Node runtime (the
 * default): Satori reads the TTFs in `assets/fonts`.
 */
export default async function Image() {
  const about = getAbout()
  return new ImageResponse(
    <OgCard title={about.title} line={getSite().line} meta={about.section} />,
    { ...size, fonts: await ogFonts() }
  )
}
