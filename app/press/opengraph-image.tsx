import { ImageResponse } from "next/og"

import { getPress } from "@/lib/content"
import { OG_CONTENT_TYPE, OG_SIZE, OgCard, ogFonts } from "@/lib/seo/og"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Press kit: Mladen Ružičić"

/**
 * `/press` card. Colocated with the route because `pageMetadata()` returns its own
 * `openGraph` object and the root card does not cascade. Node runtime (the
 * default): Satori reads the TTFs in `assets/fonts`.
 */
export default async function Image() {
  const press = getPress()
  return new ImageResponse(
    <OgCard
      title={press.title}
      line={press.seo.description}
      meta="Bio · Headshot · Facts"
    />,
    { ...size, fonts: await ogFonts() }
  )
}
