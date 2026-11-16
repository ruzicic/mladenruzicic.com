/**
 * How wide a line of Geist Serif is, in em, so the cover can size the
 * project's name and its numbers to the room they have without measuring in
 * the browser (no client code, nothing that moves after the first paint).
 *
 * The advances are Geist Serif Regular's, measured at 100px in the browser
 * on 16 Nov 2026, in classes, each a little over the real average of its
 * letters: the nine names come out 2 to 13 percent wider than they are, so
 * a name never runs past its room. A character outside the classes counts as
 * a lowercase letter.
 */
const MARKS = new Set([..." .,:;'’!"])
const NARROW = new Set([..."fijlrtIJ"])
/** Figures and the signs beside them (0.59em; "1" 0.39em). */
const FIGURES = new Set([..."023456789~+"])
/** The wide letters, each at its own width. */
const WIDE: Record<string, number> = {
  m: 0.9,
  w: 0.78,
  M: 0.87,
  W: 1.07,
  "%": 0.74,
}

function advance(ch: string) {
  if (ch in WIDE) return WIDE[ch]
  if (MARKS.has(ch)) return 0.24
  if (ch === "1") return 0.41
  if (FIGURES.has(ch)) return 0.61
  if (NARROW.has(ch)) return 0.34
  if (/[A-Z]/.test(ch)) return 0.69
  return 0.58
}

/**
 * The width of `text` in em, with the tracking given (`em` per character,
 * negative to tighten).
 */
export function serifEm(text: string, tracking = 0) {
  let em = 0
  for (const ch of text) em += advance(ch) + tracking
  return Number(em.toFixed(3))
}
