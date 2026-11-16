import { ImageResponse } from "next/og"

import { getSite } from "@/lib/content"
import { OG_CONTENT_TYPE, OG_SIZE, OgCard, ogFonts } from "@/lib/seo/og"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Mladen Ružičić: Product + Tech, based in Switzerland."

/**
 * The site card, used by `/`. Colocated with the route because `pageMetadata()` returns its own
 * `openGraph` object and the root card does not cascade. Node runtime (the
 * default): Satori reads the TTFs in `assets/fonts`.
 */
export default async function Image() {
  return new ImageResponse(<OgCard title={getSite().line} />, {
    ...size,
    fonts: await ogFonts(),
  })
}
