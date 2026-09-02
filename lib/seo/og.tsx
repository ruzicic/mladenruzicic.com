import { readFile } from "node:fs/promises"
import { join } from "node:path"

/**
 * Shared `next/og` card. Node runtime only — Satori needs a TTF/OTF, so we read
 * the un-subset Gloock from `assets/fonts` (the WOFF2s in `app/fonts` cannot be
 * used here).
 */

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = "image/png"

export async function gloock() {
  "use cache"
  return readFile(join(process.cwd(), "assets", "fonts", "Gloock-Regular.ttf"))
}

export interface OgCardProps {
  eyebrow: string
  title: string
  /** The entry's one-line summary, under the headline. */
  line?: string
  meta?: string
  accent?: string
}

/**
 * Dark card, 1200×630: mono eyebrow, Gloock headline in the project accent's
 * company, the one-line summary, and a 12px accent bar along the bottom edge.
 */
export function OgCard({
  eyebrow,
  title,
  line,
  meta,
  accent = "#F5DF4D",
}: OgCardProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0B0B0C",
        color: "#F2F0EA",
        padding: 72,
        borderBottom: `12px solid ${accent}`,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 22,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "#939597",
        }}
      >
        {eyebrow}
      </div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 980 }}>
        <div
          style={{
            display: "flex",
            fontFamily: "Gloock",
            fontSize: title.length > 40 ? 68 : 88,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          {title}
        </div>
        {line ? (
          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: 30,
              lineHeight: 1.35,
              color: "#C9C7C1",
              maxWidth: 860,
            }}
          >
            {line}
          </div>
        ) : null}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 22,
          color: "#939597",
        }}
      >
        <span>mladenruzicic.com</span>
        {meta ? <span style={{ color: accent }}>{meta}</span> : null}
      </div>
    </div>
  )
}
