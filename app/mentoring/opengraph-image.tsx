import { ImageResponse } from "next/og"

import { getMentoring } from "@/lib/content"
import { OG_CONTENT_TYPE, OG_SIZE, OgCard, ogFonts } from "@/lib/seo/og"

import { displayToPlainText } from "../components/primitives/Display"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Mentoring — Mladen Ružičić"

/** `/mentoring` card. Colocated for the reason documented in `pageMetadata`. */
export default async function Image() {
  const copy = getMentoring()
  return new ImageResponse(
    (
      <OgCard
        eyebrow={copy.eyebrow.join(" · ")}
        title={displayToPlainText(copy.h1)}
        line={copy.seo.description}
        meta="/mentoring"
      />
    ),
    { ...size, fonts: await ogFonts() }
  )
}
