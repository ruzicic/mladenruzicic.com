/**
 * The data the list's cursor preview needs, one entry per row, in row order.
 * Built on the server by `Ledger` (from `getBuiltList()`, the product
 * registry and `content/media.ts`) and handed to the `LedgerPreview` island,
 * so the client never imports content.
 */

/** A picture drawn 300px wide, top-aligned in the card. */
export type PreviewShot = {
  src: string
  srcSet?: string
  /** Its height at 300px wide. */
  height: number
  /** How far it travels upward when it glides or drifts (px). */
  end: number
}

export type PreviewMark =
  | { kind: "art"; src: string }
  | { kind: "svg"; src: string }
  | { kind: "letters"; text: string }
  | { kind: "glyph"; text: string }

export type PreviewItem = {
  /** The row's product slug (React key). */
  slug: string
  caption: string
  /**
   * `image`: a screenshot (and maybe a full-length capture). `mark`: the
   * product's mark large on its brand colour. `letters`: one serif letter on
   * the dark card (the retired products).
   */
  tone: "image" | "mark" | "letters"
  /** Brand colours from content, for `mark` layers. */
  bg: string
  fg: string
  /** Drawn on `mark`/`letters` layers, and on `image` layers when data is saved. */
  mark: PreviewMark
  /** Shown first, loaded on hover intent. Without a capture it drifts slowly. */
  still?: PreviewShot
  /** The full-length capture, loaded once the delay passes, then glides. */
  capture?: PreviewShot
}

/** Card geometry from `Landing.dc.html`. */
export const CARD_W = 300
export const CARD_H = 200
/** The picture area above the 32px caption bar. */
export const CARD_VISIBLE = 168
