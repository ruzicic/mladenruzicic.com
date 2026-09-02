import { ImageResponse } from "next/og"

import { getWorkBySlug, getWorkSlugs } from "@/lib/content"
import { gloock, OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/lib/seo/og"

import {
  formatPeriod,
  statusLabel,
} from "../../components/work-system/taxonomy"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/**
 * `alt` has to be a static export here: `generateImageMetadata` would give each
 * slug its own alt text, but it also inserts a `[__metadata_id__]` route segment
 * and a second URL level, which is not worth it for one image per case study.
 */
export const alt = "Case study — Mladen Ružičić"

export function generateStaticParams() {
  return getWorkSlugs().map((slug) => ({ slug }))
}

/**
 * Per-case-study OG card, tinted with the project accent. Node runtime (the
 * default in Next 16) because Satori needs the Gloock TTF from `assets/fonts`.
 */
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
            ? `${entry.kind} · ${formatPeriod(entry.period)} · ${entry.role}`
            : "Work"
        }
        title={entry?.title ?? "Work"}
        line={entry?.line}
        meta={entry ? statusLabel(entry.status) : undefined}
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
