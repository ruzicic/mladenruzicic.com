import { ImageResponse } from "next/og"

import { getPage } from "@/lib/content"
import { OG_CONTENT_TYPE, OG_SIZE, OgCard, ogFonts } from "@/lib/seo/og"

import { displayToPlainText } from "../components/primitives/Display"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "About — Mladen Ružičić"

/** `/about` card. Colocated for the reason documented in `pageMetadata`. */
export default async function Image() {
  const page = getPage("about")
  return new ImageResponse(
    (
      <OgCard
        eyebrow={page.eyebrow.join(" · ")}
        title={displayToPlainText(page.h1)}
        line={page.description}
        meta="/about"
      />
    ),
    { ...size, fonts: await ogFonts() }
  )
}
