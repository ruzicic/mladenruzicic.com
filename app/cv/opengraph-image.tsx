import { ImageResponse } from "next/og"

import { getCv, getSite } from "@/lib/content"
import { OG_CONTENT_TYPE, OG_SIZE, OgCard, ogFonts } from "@/lib/seo/og"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "CV: Mladen Ružičić"

/**
 * `/cv` card. Colocated with the route because `pageMetadata()` returns its own
 * `openGraph` object and the root card does not cascade. Node runtime (the
 * default): Satori reads the TTFs in `assets/fonts`.
 */
export default async function Image() {
  const cv = getCv()
  return new ImageResponse(
    <OgCard
      title={cv.seo.title}
      line={getSite().line}
      meta={[cv.experience.title, cv.projects.title, cv.skills.title].join(
        " · "
      )}
    />,
    { ...size, fonts: await ogFonts() }
  )
}
