/**
 * Cell geometry for the Ask button's pixel fill, ported from
 * `askBuildGeometry()` in `docs/v4-ideation/board/project/Landing.dc.html`.
 *
 * Computed once from the board's seeded generator (seed 20261111), so every
 * cell keeps the same delay on every render, on the server and the client.
 * Only the numbers live here; the CSS in `app/styles/ask.css` lays the cells
 * out on a grid and reads `--d` (delay), `--t` (duration) and `--o` (resting
 * opacity) from each one.
 */

export function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

export interface FillCell {
  /** Transition delay, ms. */
  d: number
  /** Transition duration, ms. */
  t: number
  /** Resting opacity (the faint dither on the right edge), if any. */
  o?: number
}

function build() {
  const rnd = seeded(20261111)
  // 16 x 8 whole 6px cells on the button's 96 x 48 border box. Rows fill
  // bottom-up: 36ms a row plus up to 80ms of jitter.
  const button: FillCell[] = []
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 16; c++) {
      const d = Math.round((7 - r) * 36 + rnd() * 80)
      const t = Math.round(140 + rnd() * 60)
      const h = rnd()
      // The board's paper "marker" cell (bottom row, 15th column) is gone
      // (owner, 15 Nov 2026: no light pixels while the button is black); it
      // is an ordinary cell now. The generator still draws the same numbers
      // in the same order, so every other cell keeps its timing.
      const cell: FillCell = { d, t }
      // The board put this dither in the last two columns, hard against the
      // right border, where it read as a clipped edge. It sits one cell in
      // from the right, top and bottom borders, so the border stays a clean
      // line and the hint of cells remains.
      const inner = c >= 13 && c <= 14 && r >= 1 && r <= 6
      if (inner && h < 0.5) cell.o = c === 14 ? 0.06 : 0.035
      button.push(cell)
    }
  }
  return { button }
}

const GEOMETRY = build()

export const BUTTON_CELLS = GEOMETRY.button

/** Style object for one fill cell (custom properties only). */
export function fillCellStyle(cell: FillCell): Record<string, string> {
  const style: Record<string, string> = {
    "--d": `${cell.d}ms`,
    "--t": `${cell.t}ms`,
  }
  if (cell.o !== undefined) style["--o"] = String(cell.o)
  return style
}
