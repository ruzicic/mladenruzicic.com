/**
 * WCAG contrast helpers for brand colours on the site's dark ground.
 *
 * Brand colours (ZF blue, HEGIAS purple, …) are used as fills and as text.
 * Neither #0B0B0C nor #F2F0EA is readable on every one of them, and the dark
 * ones fail as text on the page ground, so the colour of the ink is computed
 * rather than assumed. Pure functions, safe in Server Components.
 */

export const GROUND = "#0b0b0c"
export const INK = "#f2f0ea"
/**
 * The literal value of `--color-accent` in `app/globals.css`. The helpers below
 * parse hex, so a caller that needs the accent as *data* (to compute ink on it)
 * must pass this, never the `var(--color-accent)` string. Keep in sync with the
 * token.
 */
export const ACCENT = "#f5df4d"

const HEX = /^#?(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/**
 * `null` for anything that is not a 3/4/6/8-digit hex — a `var(--token)`
 * string, a colour name, an empty content field.
 *
 * This used to coerce failure to `[0, 0, 0]`, which reads as "black" rather
 * than "unknown": `inkOn("var(--color-accent)")` computed the ink for black,
 * chose light ink, and shipped #F2F0EA on #F5DF4D at 1.18:1. Every caller
 * below now handles `null` explicitly.
 */
export function hexToRgb(hex: string): [number, number, number] | null {
  if (typeof hex !== "string" || !HEX.test(hex.trim())) return null
  let h = hex.trim().replace(/^#/, "")
  if (h.length === 3 || h.length === 4) {
    h = h
      .slice(0, 3)
      .split("")
      .map((c) => c + c)
      .join("")
  }
  const n = Number.parseInt(h.slice(0, 6), 16)
  if (Number.isNaN(n)) return null
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * Names the caller that passed something unparseable, in dev only. The ink
 * helpers still return a safe colour — this exists so a future `var(--token)`
 * shows up in the terminal instead of only in an axe run.
 */
function warnUnparseable(fn: string, value: string): void {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[lib/color] ${fn}() received ${JSON.stringify(value)}, which is not a hex colour. ` +
        `Pass a literal (e.g. ACCENT), not a CSS custom property. Falling back to INK.`
    )
  }
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return (
    "#" +
    [r, g, b]
      .map((v) =>
        Math.round(Math.min(255, Math.max(0, v)))
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  )
}

function channel(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

/** `null` when `hex` is unparseable. */
export function luminance(hex: string): number | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  const [r, g, b] = rgb
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/**
 * WCAG 2.x contrast ratio between two hex colours (1..21). An unparseable
 * argument yields 1 — "no measurable contrast" — so a loop that lightens until
 * it reaches a minimum terminates instead of spinning on NaN comparisons.
 */
export function contrast(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  if (la === null || lb === null) return 1
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** Unparseable input falls back to the other colour rather than to black. */
export function mix(a: string, b: string, t: number): string {
  const ra = hexToRgb(a)
  const rb = hexToRgb(b)
  if (!ra) return rb ? b : INK
  if (!rb) return a
  return rgbToHex([
    ra[0] + (rb[0] - ra[0]) * t,
    ra[1] + (rb[1] - ra[1]) * t,
    ra[2] + (rb[2] - ra[2]) * t,
  ])
}

/**
 * The ink (dark or light) with the higher contrast on a given fill.
 * An unparseable fill returns {@link INK} — the page's default foreground —
 * explicitly, and says so in dev.
 */
export function inkOn(fill: string): string {
  if (!hexToRgb(fill)) {
    warnUnparseable("inkOn", fill)
    return INK
  }
  return contrast(fill, GROUND) >= contrast(fill, INK) ? GROUND : INK
}

/**
 * Ink for a brand colour used as text on top of its own tint over the ground
 * (the timeline bands: brand at `alpha` over #0B0B0C). Lightens toward the page
 * ink until it reaches `min` contrast against that tinted surface.
 */
export function inkOnTint(hex: string, alpha = 0.26, min = 4.5): string {
  if (!hexToRgb(hex)) {
    warnUnparseable("inkOnTint", hex)
    return INK
  }
  const surface = mix(GROUND, hex, alpha)
  let t = 0
  let out = hex
  while (contrast(out, surface) < min && t < 1) {
    t += 0.05
    out = mix(hex, INK, t)
  }
  return out
}

/**
 * A brand colour lightened toward the page ink just enough to reach `min`
 * contrast against the dark ground, for use as small text. Colours that
 * already pass come back unchanged.
 */
export function brandInkOnDark(hex: string, min = 4.5): string {
  if (!hexToRgb(hex)) {
    warnUnparseable("brandInkOnDark", hex)
    return INK
  }
  let t = 0
  let out = hex
  while (contrast(out, GROUND) < min && t < 1) {
    t += 0.05
    out = mix(hex, INK, t)
  }
  return out
}
