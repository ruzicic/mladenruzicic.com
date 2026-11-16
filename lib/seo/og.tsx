import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { getSite } from "@/lib/content"
import type { ProductMark } from "@/lib/content/schema"

/**
 * The shared `next/og` card: one quiet template for every page. Paper
 * background, the name small at the top, the page's title large in Geist
 * Serif, an optional line under it, and the domain in Geist Mono at the foot.
 * Stories add the product tile above the title.
 *
 * Node runtime only: Satori needs TTF/OTF, so the faces are read from
 * `assets/fonts` (see the README there; Geist Serif ships only as WOFF2 in the
 * `geist` package and was converted to TTF once, losslessly). Satori has no
 * fallback stack, so every text node names one of the three loaded families.
 *
 * Colours are the site's tokens (`app/globals.css`), repeated here because
 * Satori cannot read CSS variables. Tile colours come from content.
 */

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = "image/png"

const FONT_DIR = join(process.cwd(), "assets", "fonts")
const PUBLIC_DIR = join(process.cwd(), "public")

const SERIF = "Geist Serif"
const SANS = "Geist"
const MONO = "Geist Mono"

const PAPER = "#fcfcfa"
const INK = "#111111"
const INK_SOFT = "#2a2a27"
const MUTED = "#696964" // --color-muted in app/globals.css
const RULE = "#e4e3de"

async function font(file: string) {
  "use cache"
  return readFile(join(FONT_DIR, file))
}

/** The `fonts` array every `opengraph-image` route passes to `ImageResponse`. */
export async function ogFonts() {
  const [serif, sans, mono] = await Promise.all([
    font("GeistSerif-Regular.ttf"),
    font("Geist-Regular.ttf"),
    font("GeistMono-Regular.ttf"),
  ])
  return [
    {
      name: SERIF,
      data: serif,
      style: "normal" as const,
      weight: 400 as const,
    },
    { name: SANS, data: sans, style: "normal" as const, weight: 400 as const },
    { name: MONO, data: mono, style: "normal" as const, weight: 400 as const },
  ]
}

/**
 * A mark file as a data URI, painted with the tile's `fg`. The files are
 * white-filled geometry (the site paints them through a CSS mask, which
 * Satori does not support), so the white fill is swapped for `fg` here.
 */
export async function markDataUri(src: string, fg: string): Promise<string> {
  "use cache"
  const svg = await readFile(join(PUBLIC_DIR, src), "utf8")
  const painted = svg.replace(
    /fill=(["'])(#fff|#ffffff|white)\1/gi,
    `fill="${fg}"`
  )
  return `data:image/svg+xml;base64,${Buffer.from(painted).toString("base64")}`
}

/**
 * A complete tile (`art` mark) as a data URI. The file already carries its
 * own colours and background; Satori draws it as an image and the card
 * clips it to the tile's radius.
 */
export async function artDataUri(src: string): Promise<string> {
  "use cache"
  const svg = await readFile(join(PUBLIC_DIR, src))
  return `data:image/svg+xml;base64,${svg.toString("base64")}`
}

export interface OgTile {
  mark: ProductMark
  /** `markDataUri()` for an `svg` mark, `artDataUri()` for an `art` one. */
  svg?: string
}

export interface OgCardProps {
  title: string
  /** One line under the title. */
  line?: string
  /** Mono label at the bottom right, e.g. "Running · 2025 to now". */
  meta?: string
  tile?: OgTile
}

const TILE = 104

function Tile({ tile }: { tile: OgTile }) {
  const { mark, svg } = tile
  const m = mark.mark
  if (m.kind === "art" && svg && m.bare) {
    // A bare mark: no ground, no clip, no edge.
    return (
      <div
        style={{ display: "flex", width: TILE, height: TILE, marginBottom: 36 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={svg} width={TILE} height={TILE} />
      </div>
    )
  }
  if (m.kind === "art" && svg) {
    return (
      <div
        style={{
          display: "flex",
          position: "relative",
          width: TILE,
          height: TILE,
          borderRadius: TILE * 0.3,
          background: mark.bg,
          marginBottom: 36,
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={svg} width={TILE} height={TILE} />
        {/* The hairline on top of the artwork, as the site draws it. */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: 0,
            width: TILE,
            height: TILE,
            borderRadius: TILE * 0.3,
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        />
      </div>
    )
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: TILE,
        height: TILE,
        borderRadius: TILE * 0.3,
        background: mark.bg,
        color: mark.fg,
        border: "1px solid rgba(0,0,0,0.08)",
        marginBottom: 36,
        overflow: "hidden",
      }}
    >
      {m.kind === "svg" && svg ? (
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        <img src={svg} width={TILE * 0.62} height={TILE * 0.62} />
      ) : m.kind === "glyph" ? (
        <div
          style={{
            display: "flex",
            fontFamily: SERIF,
            fontSize: TILE * 1.3,
            lineHeight: 1,
            marginTop: -TILE * 0.72,
          }}
        >
          {m.text}
        </div>
      ) : m.kind === "letters" ? (
        <div
          style={{
            display: "flex",
            fontFamily: SERIF,
            fontSize: TILE * (m.text.length > 1 ? 0.5 : 0.75),
            lineHeight: 1,
          }}
        >
          {m.text}
        </div>
      ) : null}
    </div>
  )
}

/** 1200×630, paper, Geist Serif title. */
export function OgCard({ title, line, meta, tile }: OgCardProps) {
  const site = getSite()
  const long = title.length > 22
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: PAPER,
        color: INK,
        fontFamily: SANS,
        padding: "64px 80px 56px",
      }}
    >
      <div
        style={{ display: "flex", fontFamily: SANS, fontSize: 28, color: INK }}
      >
        {site.name}
      </div>

      <div style={{ display: "flex", flexDirection: "column", maxWidth: 1000 }}>
        {tile ? <Tile tile={tile} /> : null}
        <div
          style={{
            display: "flex",
            fontFamily: SERIF,
            fontSize: long ? 68 : 88,
            lineHeight: 1.04,
            letterSpacing: -1,
            color: INK,
          }}
        >
          {title}
        </div>
        {line ? (
          <div
            style={{
              display: "flex",
              fontFamily: SANS,
              marginTop: 26,
              fontSize: line.length > 110 ? 26 : 30,
              lineHeight: 1.4,
              color: INK_SOFT,
              maxWidth: 940,
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
          alignItems: "center",
          borderTop: `1px solid ${RULE}`,
          paddingTop: 22,
          fontFamily: MONO,
          fontSize: 19,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: MUTED,
        }}
      >
        <span>{site.domain}</span>
        {meta ? <span>{meta}</span> : null}
      </div>
    </div>
  )
}
