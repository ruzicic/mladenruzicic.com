import { ImageResponse } from "next/og"

import { getWorkPage } from "@/lib/content"
import { OG_CONTENT_TYPE, OG_SIZE, OgCard, ogFonts } from "@/lib/seo/og"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Work Mladen Ružičić has put real time into"

/**
 * `/work` card. Colocated with the route because `pageMetadata()` returns its own
 * `openGraph` object and the root card does not cascade. Node runtime (the
 * default): Satori reads the TTFs in `assets/fonts`.
 */
export default async function Image() {
  const copy = getWorkPage()
  return new ImageResponse(
    <OgCard
      title={copy.title}
      line={copy.seo.description}
      meta={copy.seo.title}
    />,
    { ...size, fonts: await ogFonts() }
  )
}
