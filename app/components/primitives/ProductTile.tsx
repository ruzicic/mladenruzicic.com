import { useId, type CSSProperties } from "react"
// clsx, not `cn`: this renders inside client islands, and `cn` pulls
// tailwind-merge (about 8 KB gzipped) into their chunks. No caller passes a
// class that conflicts with the ones set here, so there is nothing to merge.
import { clsx as cn } from "clsx"

import type { ProductMark } from "@/lib/content/schema"
import { TILE_ART_ID } from "@/lib/content/tile-art-id"

export type { ProductMark }

export interface ProductTileProps {
  mark: ProductMark
  /**
   * `text` (default): 1em of the surrounding text, the tile in front of a
   * product name in running copy and in lists.
   * `headline`: 0.85em, the chip inside the cycling headline.
   */
  size?: "text" | "headline"
  className?: string
}

/**
 * The small rounded brand tile that sits in front of product names. One tile,
 * two sizes, so the headline chip and the text lockups match (the owner's
 * "better sized+spaced to the ones in heading").
 *
 * Geometry from `Landing.dc.html`: a square box of 1em (or 0.85em) with
 * `border-radius: 30%`, a 0.5px inner hairline, and the mark centred inside:
 * an SVG at 0.62em, one serif letter at 0.75em, or a serif glyph at 1.3em
 * (lifted so it sits in the middle).
 *
 * An `art` mark is the whole tile: its full-colour 64x64 artwork is drawn
 * inline over the face, clipped by the same 30% radius, with the hairline
 * laid on top of it. Inline rather than an `<img>`: the markup arrives with
 * the HTML (and, in the headline's client island, with its props), so a tile
 * paints in the same frame as its name, with no request and no pop-in when
 * the headline swaps tiles, and it needs no JavaScript.
 *
 * Decorative: always `aria-hidden`. The product name next to it is the text.
 * `bg` and `fg` are the brand colours from content, the one place an inline
 * hex is allowed.
 */
export function ProductTile({
  mark,
  size = "text",
  className,
}: ProductTileProps) {
  const { mark: m } = mark
  // A bare mark (studenti.rs) has no ground, no clip and no edge.
  const bare = m.kind === "art" && m.bare === true
  const face: CSSProperties = {
    background: bare ? "transparent" : mark.bg,
    color: mark.fg,
  }
  // Only artwork with ids (a gradient) needs a per-tile prefix.
  const uid = useId().replace(/[^\w-]/g, "")
  const art =
    m.kind === "art"
      ? m.body.includes(TILE_ART_ID)
        ? m.body.replaceAll(TILE_ART_ID, `t${uid}-`)
        : m.body
      : null

  return (
    <span
      aria-hidden="true"
      data-tile={mark.slug}
      className={cn(
        "relative inline-block flex-none",
        size === "text"
          ? "mr-[0.28em] size-[1em] align-[-0.14em]"
          : "mr-[0.2em] size-[0.85em] align-[-0.075em]",
        className
      )}
    >
      <span
        data-tile-face=""
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          !bare &&
            "overflow-hidden rounded-[30%] shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.1)]",
          size === "headline" ? "text-[0.85em]" : "text-[1em]"
        )}
        style={face}
      >
        {art !== null ? (
          <>
            <svg
              data-tile-art=""
              viewBox="0 0 64 64"
              className="absolute inset-0 block size-full"
              focusable="false"
              // Checked at build time by `lib/content/tile-art.ts`: geometry
              // only, no scripts, styles or external references.
              dangerouslySetInnerHTML={{ __html: art }}
            />
            {/* The face's hairline is painted under its children; on art
                it has to sit on top. A light ground (white, cream) gets a
                firmer 1px edge so it still reads as a tile on the paper. */}
            {/* A bare mark has no edge at all. */}
            {bare ? null : (
              <span
                className={cn(
                  "absolute inset-0 rounded-[inherit]",
                  m.kind === "art" && m.light
                    ? "shadow-[inset_0_0_0_1px_rgb(17_17_17/0.12)]"
                    : "shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.1)]"
                )}
              />
            )}
          </>
        ) : m.kind === "svg" && m.accent ? (
          <span
            data-tile-accent=""
            className="absolute top-1/2 left-1/2 block size-[0.62em] -translate-x-1/2 -translate-y-1/2 [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
            style={{
              background: m.accent.color,
              maskImage: `url("${m.accent.src}")`,
            }}
          />
        ) : null}
        {m.kind === "svg" ? (
          // The mark files are white-filled geometry (content/products.ts),
          // so the tile paints them with `fg` through a mask, as the board
          // draws them: rust brackets on FontAlternatives' cream, white
          // elsewhere. An <img> would show every mark white. A mark with an
          // `accent` (TenderLift's red dot) gets a second masked layer.
          <span
            data-tile-mark=""
            className="block size-[0.62em] flex-none bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
            style={
              m.accent
                ? {
                    // The accent is cut out of the mark (mask-composite:
                    // exclude), then painted in its own colour on top, so
                    // its edges never fringe white.
                    maskImage: `url("${m.accent.src}"), url("${m.src}")`,
                    maskComposite: "exclude",
                  }
                : { maskImage: `url("${m.src}")` }
            }
          />
        ) : m.kind === "art" ? null : m.kind === "letters" ? (
          <span
            className={cn(
              "flex-none font-display leading-none",
              m.text.length > 1
                ? "text-[0.5em] tracking-[-0.02em]"
                : "text-[0.75em]"
            )}
          >
            {m.text}
          </span>
        ) : (
          <span className="flex-none translate-y-[-0.36em] font-display text-[1.3em] leading-none">
            {m.text}
          </span>
        )}
      </span>
    </span>
  )
}
