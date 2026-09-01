import { ImageResponse } from "next/og"

import { getWorkBySlug, getWorkSlugs } from "@/lib/content"
import { gloock, OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/lib/seo/og"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export function generateStaticParams() {
  return getWorkSlugs().map((slug) => ({ slug }))
}

/** Per-case-study OG card, tinted with the project accent. */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = getWorkBySlug(slug)

  return new ImageResponse(
    (
      <OgCard
        eyebrow={
          entry
            ? `${entry.period.from}–${entry.period.to} · ${entry.role}`
            : "Work"
        }
        title={entry?.title ?? "Work"}
        meta={entry?.status}
        accent={entry?.accent}
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
