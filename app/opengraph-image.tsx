import { ImageResponse } from "next/og"

import { OG_CONTENT_TYPE, OG_SIZE, OgCard, ogFonts } from "@/lib/seo/og"
import { SITE } from "@/content/site"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = `${SITE.name} — ${SITE.tagline}`

/** Site-wide OG card. Node runtime (the default); no `runtime` export. */
export default async function Image() {
  return new ImageResponse(
    (
      <OgCard
        eyebrow={SITE.name}
        title={SITE.tagline}
        line={SITE.roles.join(" · ")}
        meta={`${SITE.location.city}, ${SITE.location.country}`}
      />
    ),
    { ...size, fonts: await ogFonts() }
  )
}
