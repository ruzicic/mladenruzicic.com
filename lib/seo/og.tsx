import { readFile } from "node:fs/promises"
import { join } from "node:path"

/**
 * Shared `next/og` card. Node runtime only — Satori needs a TTF/OTF, so we read
 * the un-subset faces from `assets/fonts` (the WOFF2s in `app/fonts` cannot be
 * used here).
 *
 * Two faces, matching the site's pairing: Gloock for the headline, JetBrains
 * Mono for the eyebrow, the footer line and the meta label. Satori has no
 * fallback stack, so anything not covered by a loaded face renders as a blank
 * box — every text node below therefore names one of these two families.
 */

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = "image/png"

const FONT_DIR = join(process.cwd(), "assets", "fonts")

export async function gloock() {
  "use cache"
  return readFile(join(FONT_DIR, "Gloock-Regular.ttf"))
}

export async function jetbrainsMono() {
  "use cache"
  return readFile(join(FONT_DIR, "JetBrainsMono-Regular.ttf"))
}

/**
 * The `fonts` array every `opengraph-image` route passes to `ImageResponse`.
 * One place to load them, so a new card can never forget the mono face.
 */
export async function ogFonts() {
  const [display, mono] = await Promise.all([gloock(), jetbrainsMono()])
  return [
    {
      name: "Gloock",
      data: display,
      style: "normal" as const,
      weight: 400 as const,
    },
    {
      name: "JetBrains Mono",
      data: mono,
      style: "normal" as const,
      weight: 400 as const,
    },
  ]
}

const DISPLAY = "Gloock"
const MONO = "JetBrains Mono"

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
        fontFamily: MONO,
        padding: 72,
        borderBottom: `12px solid ${accent}`,
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: MONO,
          fontSize: 20,
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
            fontFamily: DISPLAY,
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
              fontFamily: DISPLAY,
              marginTop: 24,
              // An index page's lede runs longer than a case study's one-liner.
              fontSize: line.length > 120 ? 26 : 30,
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
          fontFamily: MONO,
          justifyContent: "space-between",
          fontSize: 20,
          color: "#939597",
        }}
      >
        <span>mladenruzicic.com</span>
        {meta ? <span style={{ color: accent }}>{meta}</span> : null}
      </div>
    </div>
  )
}
