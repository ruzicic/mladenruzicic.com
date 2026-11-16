/**
 * Colour helpers for branded links (owner, 15 Nov 2026): the underline and
 * hover wash of a product lockup or a case-study link are drawn in the
 * brand's colour. Pure functions; the loader uses them to pick a product's
 * colour and to refuse one that would vanish on the paper.
 */

/** The page sheet (`--color-paper` in app/globals.css). */
export const PAPER = "#FCFCFA"

/**
 * Below this contrast against the paper an underline is as good as
 * invisible: a content error, not a style choice.
 */
export const MIN_BRAND_CONTRAST = 1.6

/** WCAG relative luminance of a `#RRGGBB` colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two `#RRGGBB` colours. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * A product's brand colour: `brand` when content sets one, else the tile's
 * ground, unless the ground is light (relative luminance above 0.8: white,
 * the creams), then the mark's own colour.
 */
export function brandOf(p: { brand?: string; bg: string; fg: string }): string {
  if (p.brand) return p.brand
  return luminance(p.bg) > 0.8 ? p.fg : p.bg
}
