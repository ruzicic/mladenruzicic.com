import { ImageResponse } from "next/og"

import { getWork, getWorkPage } from "@/lib/content"
import { OG_CONTENT_TYPE, OG_SIZE, OgCard, ogFonts } from "@/lib/seo/og"

import { displayToPlainText } from "../components/primitives/Display"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Work — Mladen Ružičić"

/**
 * `/work` index card.
 *
 * It has to live here rather than cascade from `app/opengraph-image.tsx`:
 * `pageMetadata()` returns its own `openGraph` object and Next merges metadata
 * one top-level key at a time, so the root image never reaches a route that
 * sets `openGraph` itself. Same reason for `/about`, `/uses` and `/mentoring`.
 */
export default async function Image() {
  const copy = getWorkPage()
  const count = String(getWork().length)
  return new ImageResponse(
    (
      <OgCard
        eyebrow={copy.eyebrow
          .map((item) => item.replace("{count}", count))
          .join(" · ")}
        title={displayToPlainText(copy.h1)}
        line={copy.seo.description}
        meta="/work"
      />
    ),
    { ...size, fonts: await ogFonts() }
  )
}
