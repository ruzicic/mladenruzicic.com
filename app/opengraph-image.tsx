import { ImageResponse } from "next/og"

import { SITE } from "@/content/site"
import { gloock, OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/lib/seo/og"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = `${SITE.name} — ${SITE.tagline}`

/** Site-wide OG card. Node runtime (the default); no `runtime` export. */
export default async function Image() {
  return new ImageResponse(
    (
      <OgCard
        eyebrow={SITE.roles.join(" · ")}
        title={SITE.tagline}
        meta={`${SITE.location.city}, ${SITE.location.country}`}
      />
    ),
    {
      ...size,
      fonts: [
        { name: "Gloock", data: await gloock(), style: "normal", weight: 400 },
      ],
    }
  )
}
