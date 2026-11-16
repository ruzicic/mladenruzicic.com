import { ImageResponse } from "next/og"

import { getHome, getMentoring } from "@/lib/content"
import { OG_CONTENT_TYPE, OG_SIZE, OgCard, ogFonts } from "@/lib/seo/og"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Mentoring with Mladen Ružičić, for a strong fit"

/**
 * `/mentoring` card. Colocated with the route because `pageMetadata()` returns its own
 * `openGraph` object and the root card does not cascade. Node runtime (the
 * default): Satori reads the TTFs in `assets/fonts`.
 */
export default async function Image() {
  const copy = getMentoring()
  // The first sentence of the landing's mentoring line: the proof, briefly.
  const proof = getHome().mentoring.body.split(". ")[0]
  return new ImageResponse(
    <OgCard title={copy.title} line={`${proof}.`} meta={copy.section} />,
    { ...size, fonts: await ogFonts() }
  )
}
