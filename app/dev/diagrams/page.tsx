import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getWorkBySlug } from "@/lib/content"
import { Diagram, DIAGRAM_IDS, diagramText } from "@/app/components/diagram"

/**
 * Specimen sheet for the diagrams, for checking them by eye and in
 * tests/diagram.spec.ts: every diagram in a 752px square, a 358px square
 * and a 342px square (the column on a 390px phone), on the paper, with the square's hairline and radius drawn here (on
 * a story the page draws them).
 *
 * Development only. In a production build it is the site's 404 (the check is
 * on `NODE_ENV`, which `next build` sets to production), it is not in
 * app/sitemap.ts, and app/robots.ts disallows `/dev/`.
 */

export const metadata: Metadata = {
  title: "Diagrams (dev)",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
}

const SIZES = [752, 358, 342] as const

export default function DiagramSpecimen() {
  if (process.env.NODE_ENV === "production") notFound()
  return (
    <main
      style={{
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 64,
        background: "var(--color-paper)",
      }}
    >
      <h1 className="font-mono text-label uppercase text-muted">
        Diagrams, at 752, 358 and 342
      </h1>
      {DIAGRAM_IDS.map((id) => {
        const accent = getWorkBySlug(id.split("/")[0])?.accent
        return (
          <section
            key={id}
            data-specimen={id}
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-start",
              gap: 40,
            }}
          >
            {SIZES.map((size) => (
              <figure
                key={size}
                data-size={size}
                style={{
                  margin: 0,
                  width: size,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div
                  data-square=""
                  style={{
                    width: size,
                    height: size,
                    borderRadius: 12,
                    overflow: "hidden",
                    outline: "1px solid var(--color-rule)",
                    outlineOffset: -1,
                  }}
                >
                  <Diagram id={id} accent={accent} />
                </div>
                <figcaption className="text-small text-muted">
                  {id} · {diagramText(id).caption}
                </figcaption>
              </figure>
            ))}
          </section>
        )
      })}
    </main>
  )
}
