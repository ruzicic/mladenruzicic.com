/**
 * One accent per page: the story's own colour, passed in by the page
 * (DIAGRAMS.md, "Colour"). Brand colours run from near-white yellow
 * (TenderLift) to deep purple (HEGIAS), so three derived values keep every
 * use legible:
 *
 * - `--dg-accent`: the colour itself, for fills (a filled cell, a bar, the
 *   badge, the model box's wash).
 * - `--dg-accent-line`: the colour darkened, keeping its hue, until it has
 *   3:1 against paper (WCAG 1.4.11), for lines and outlines.
 * - `--dg-on-accent`: white or ink, whichever reads better on the fill, for
 *   text set on it. Both are checked for 4.5:1.
 */

const PAPER = "#fcfcfa"
const INK = "#111111"
const WHITE = "#ffffff"

type Rgb = [number, number, number]

function parse(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`
}

function luminance([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Darkens towards black in small steps until `min` contrast on paper. */
function darkenUntil(rgb: Rgb, min: number): Rgb {
  const paper = parse(PAPER)!
  let c = rgb
  for (let i = 0; i < 40 && contrast(c, paper) < min; i++) {
    c = [c[0] * 0.94, c[1] * 0.94, c[2] * 0.94]
  }
  return c
}

export interface AccentVars {
  "--dg-accent": string
  "--dg-accent-line": string
  "--dg-on-accent": string
}

export function accentVars(accent: string | undefined): AccentVars {
  const rgb = accent ? parse(accent) : null
  if (!rgb) {
    return {
      "--dg-accent": INK,
      "--dg-accent-line": INK,
      "--dg-on-accent": WHITE,
    }
  }
  const onWhite = contrast(rgb, parse(WHITE)!)
  const onInk = contrast(rgb, parse(INK)!)
  return {
    "--dg-accent": toHex(rgb),
    "--dg-accent-line": toHex(darkenUntil(rgb, 3)),
    "--dg-on-accent": onWhite >= 4.5 || onWhite >= onInk ? WHITE : INK,
  }
}
