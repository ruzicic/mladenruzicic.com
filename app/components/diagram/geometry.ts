/**
 * Geometry for the swimlane flowcharts. A flow is drawn in a box whose
 * height is fixed per layout and whose width is the diagram's own. Every
 * horizontal coordinate is `p% + px` of that width (the lanes are
 * percentages, the boxes are pixels), every vertical one is pixels, so the
 * same markup lays out at any width without JavaScript and without scaling
 * the type. A layout is checked at a reference width only to know which way
 * a line runs.
 */

/** A horizontal coordinate: `p` percent of the flow's width plus `px`. */
export type X = readonly [p: number, px: number]
export type Pt = readonly [x: X, y: number]

export const x = (p: number, px = 0): X => [p, px]
const plus = (a: X, px: number): X => [a[0], a[1] + px]
const at = (a: X, w: number) => (a[0] / 100) * w + a[1]

export function cssX(a: X): string {
  const [p, px] = a
  if (p === 0) return `${round(px)}px`
  if (px === 0) return `${round(p)}%`
  return `calc(${round(p)}% ${px < 0 ? "-" : "+"} ${round(Math.abs(px))}px)`
}

function round(n: number) {
  return Math.round(n * 100) / 100
}

/** A box, by its centre and size. */
export interface Place {
  x: X
  y: number
  /** Pixels, or `p% + px` for a box that spans lanes. */
  w: number | X
  h: number
  /** Walk index: when the node lights. */
  k?: number
}

const half = (w: number | X): X =>
  typeof w === "number" ? [0, w / 2] : [w[0] / 2, w[1] / 2]
const add = (a: X, b: X, sign = 1): X => [
  a[0] + sign * b[0],
  a[1] + sign * b[1],
]

export const top = (b: Place): Pt => [b.x, b.y - b.h / 2]
export const bottom = (b: Place): Pt => [b.x, b.y + b.h / 2]
export const left = (b: Place): Pt => [add(b.x, half(b.w), -1), b.y]
export const right = (b: Place): Pt => [add(b.x, half(b.w)), b.y]

/** An orthogonal polyline; the last point carries the arrowhead. */
export interface Edge {
  pts: Pt[]
  dashed?: boolean
  /** Default true. */
  head?: boolean
  /** Walk index of the first segment; each further segment is one later. */
  k?: number
}

export interface Segment {
  dir: "r" | "l" | "d" | "u"
  left: string
  top: number
  width: string
  height: number
  dashed: boolean
  k?: number
}

export interface Head {
  dir: "r" | "l" | "d" | "u"
  left: string
  top: number
  dashed: boolean
  k?: number
}

const LINE = 1.5
const HEAD = 7

/**
 * Turns an edge into absolutely positioned segments and an arrowhead. The
 * last segment stops where the arrowhead begins, so the line never pokes
 * through its point.
 */
export function route(edge: Edge, refW: number) {
  const segments: Segment[] = []
  let head: Head | undefined
  const withHead = edge.head !== false
  for (let i = 0; i < edge.pts.length - 1; i++) {
    const [ax, ay] = edge.pts[i]
    const [bx0, by] = edge.pts[i + 1]
    const last = i === edge.pts.length - 2
    const k = edge.k === undefined ? undefined : edge.k + i
    if (ay !== by && (ax[0] !== bx0[0] || ax[1] !== bx0[1])) {
      throw new Error(
        `Flow edge segment ${i} is not orthogonal: ${cssX(ax)},${ay} to ${cssX(bx0)},${by}`
      )
    }
    if (ay === by) {
      const dir = at(bx0, refW) >= at(ax, refW) ? "r" : "l"
      const bx =
        last && withHead ? plus(bx0, dir === "r" ? -HEAD + 1 : HEAD - 1) : bx0
      // After a corner, reach back half a line so the elbow closes.
      const back = i > 0 ? LINE / 2 : 0
      const a = dir === "r" ? plus(ax, -back) : bx
      const b = dir === "r" ? bx : plus(ax, back)
      segments.push({
        dir,
        left: cssX(a),
        top: ay - LINE / 2,
        width: cssX([b[0] - a[0], b[1] - a[1]]),
        height: LINE,
        dashed: !!edge.dashed,
        k,
      })
      if (last && withHead) {
        head = {
          dir,
          left: cssX(plus(bx0, dir === "r" ? -HEAD : 0)),
          top: ay - 4,
          dashed: !!edge.dashed,
          k: k === undefined ? undefined : k + 1,
        }
      }
    } else {
      const dir = by > ay ? "d" : "u"
      const end =
        last && withHead ? (dir === "d" ? by - HEAD + 1 : by + HEAD - 1) : by
      const [y0, y1] =
        dir === "d"
          ? [ay - (i > 0 ? LINE / 2 : 0), end]
          : [end, ay + (i > 0 ? LINE / 2 : 0)]
      segments.push({
        dir,
        left: cssX(plus(ax, -LINE / 2)),
        top: y0,
        width: `${LINE}px`,
        height: Math.max(0, y1 - y0),
        dashed: !!edge.dashed,
        k,
      })
      if (last && withHead) {
        head = {
          dir,
          left: cssX(plus(ax, -4)),
          top: dir === "d" ? by - HEAD : by,
          dashed: !!edge.dashed,
          k: k === undefined ? undefined : k + 1,
        }
      }
    }
  }
  return { segments, head }
}

/** Absolute position of a box, as inline custom properties. */
export function boxVars(b: Place, prefix: "" | "n") {
  return {
    [`--${prefix}l`]: cssX(add(b.x, half(b.w), -1)),
    [`--${prefix}t`]: `${b.y - b.h / 2}px`,
    [`--${prefix}w`]: typeof b.w === "number" ? `${b.w}px` : cssX(b.w),
    [`--${prefix}h`]: `${b.h}px`,
  }
}
