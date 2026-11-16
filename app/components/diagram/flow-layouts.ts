import {
  bottom,
  left,
  right,
  top,
  x,
  type Edge,
  type Place,
  type Pt,
  type X,
} from "./geometry"

/**
 * Where every box, exit, line and label of a swimlane flow sits, at the two
 * sizes. The wide layout is the prototype's (CaseStudy.dc.html, `.fc`), drawn
 * for a 656px chart (the 752 square less its 48px margin) and valid from
 * about 560px; the narrow one is drawn for 310px (the 358 square less 24px)
 * and holds up to about 560px. Words come from content/diagrams; this file
 * holds only geometry and the order of the walk (`k`).
 */

export interface FlowLabel {
  /** `[stepId, branchIndex]`: the branch label from content. */
  of: readonly [string, number]
  x: X
  /** Top edge. */
  y: number
  align?: "start" | "center"
}

export interface FlowReason {
  x: X
  w: X
  y: number
  /** `c`: `y` is the vertical centre; `t`: the top. */
  v?: "c" | "t"
  align?: "start" | "end"
}

export interface FlowLayout {
  /** Reference width, used only to tell which way a line runs. */
  refW: number
  height: number
  /** The two dotted lane dividers, in percent. */
  lanes: readonly [number, number]
  /** Left edge of each lane label: person, system, me. */
  laneLabels: readonly [X, X, X]
  nodes: Record<string, Place>
  exits: Record<string, Place>
  edges: Edge[]
  labels: FlowLabel[]
  /** Reasons beside their nodes; absent at a size, they are visually hidden there. */
  reasons: Record<string, FlowReason>
}

/* ------------------------------------------------------------------------ */
/* studenti-rs/submission                                                   */
/* ------------------------------------------------------------------------ */

function submissionWide(): FlowLayout {
  const S = x(30, 98) // the system column's spine
  const n = {
    upload: { x: x(15), y: 22, w: 168, h: 44, k: 0 },
    material: { x: S, y: 88, w: 184, h: 60, k: 3 },
    confirm: { x: x(15), y: 164, w: 168, h: 64, k: 6 },
    copy: { x: S, y: 240, w: 184, h: 60, k: 9 },
    good: { x: S, y: 318, w: 184, h: 60, k: 11 },
    me: { x: x(88), y: 318, w: 120, h: 44 },
    publish: { x: S, y: 394, w: 196, h: 64, k: 13 },
    end: { x: x(53), y: 474, w: x(46), h: 68, k: 15 },
  } satisfies Record<string, Place>
  const e = {
    refused: { x: x(76, -42), y: 88, w: 84, h: 52 },
    strike: { x: x(76, -42), y: 240, w: 84, h: 52 },
    binned: { x: x(30, -56), y: 318, w: 72, h: 28 },
  } satisfies Record<string, Place>
  return {
    refW: 656,
    height: 508,
    lanes: [30, 76],
    laneLabels: [x(0), x(30, 10), x(76, 10)],
    nodes: n,
    exits: e,
    edges: [
      { pts: [right(n.upload), [S, 22], top(n.material)], k: 1 },
      { pts: [left(n.material), [x(15), 88], top(n.confirm)], k: 4 },
      { pts: [right(n.material), left(e.refused)], dashed: true },
      { pts: [right(n.confirm), [S, 164], top(n.copy)], k: 7 },
      { pts: [right(n.copy), left(e.strike)], dashed: true },
      { pts: [bottom(n.copy), top(n.good)], k: 10 },
      { pts: [left(n.good), right(e.binned)], dashed: true },
      { pts: [right(n.good), left(n.me)] },
      { pts: [bottom(n.good), top(n.publish)], k: 12 },
      { pts: [bottom(n.publish), [S, top(n.end)[1]]], k: 14 },
    ],
    labels: [
      { of: ["material", 1], x: x(22.5, 3), y: 68 },
      { of: ["material", 0], x: x(53, 53), y: 68 },
      { of: ["copy", 0], x: x(53, 53), y: 220 },
      { of: ["copy", 1], x: x(30, 106), y: 272, align: "start" },
      { of: ["good", 2], x: x(30, -7), y: 296 },
      { of: ["good", 1], x: x(59, 65), y: 298 },
      { of: ["good", 0], x: x(30, 106), y: 350, align: "start" },
    ],
    reasons: {
      upload: { x: x(30, 116), w: x(46, -126), y: 22 },
      material: { x: x(76, 12), w: x(24, -12), y: 88 },
      confirm: { x: x(30, 116), w: x(46, -126), y: 164 },
      copy: { x: x(0), w: x(30, -10), y: 240, align: "end" },
      good: { x: x(88, -60), w: x(0, 120), y: 348, v: "t" },
      publish: { x: x(0), w: x(30, -16), y: 394, align: "end" },
    },
  }
}

function submissionNarrow(): FlowLayout {
  const S = x(50) // system spine
  const n = {
    upload: { x: x(0, 34), y: 21, w: 68, h: 40, k: 0 },
    material: { x: S, y: 21, w: 140, h: 40, k: 2 },
    confirm: { x: x(0, 40), y: 76, w: 80, h: 40, k: 6 },
    copy: { x: S, y: 76, w: 100, h: 36, k: 8 },
    good: { x: S, y: 125, w: 130, h: 38, k: 10 },
    me: { x: x(100, -38), y: 172, w: 76, h: 32 },
    publish: { x: S, y: 174, w: 146, h: 36, k: 12 },
    end: { x: x(37.5), y: 220, w: x(75), h: 36, k: 14 },
  } satisfies Record<string, Place>
  const e = {
    refused: { x: x(100, -30), y: 21, w: 60, h: 42 },
    strike: { x: x(100, -30), y: 76, w: 60, h: 42 },
    binned: { x: x(0, 30), y: 125, w: 60, h: 26 },
  } satisfies Record<string, Place>
  const elbowY = 48
  return {
    refW: 310,
    height: 238,
    lanes: [25, 75],
    laneLabels: [x(0), x(25, 8), x(75, 8)],
    nodes: n,
    exits: e,
    edges: [
      { pts: [right(n.upload), left(n.material)], k: 1 },
      {
        pts: [
          bottom(n.material),
          [S, elbowY],
          [n.confirm.x, elbowY],
          top(n.confirm),
        ],
        k: 3,
      },
      { pts: [right(n.material), left(e.refused)], dashed: true },
      { pts: [right(n.confirm), left(n.copy)], k: 7 },
      { pts: [right(n.copy), left(e.strike)], dashed: true },
      { pts: [bottom(n.copy), top(n.good)], k: 9 },
      { pts: [left(n.good), right(e.binned)], dashed: true },
      { pts: [right(n.good), [n.me.x, n.good.y], top(n.me)] },
      { pts: [bottom(n.good), top(n.publish)], k: 11 },
      { pts: [bottom(n.publish), [S, top(n.end)[1]]], k: 13 },
    ],
    labels: [
      { of: ["material", 1], x: x(25, 20), y: elbowY - 15 },
      { of: ["material", 0], x: x(75, -1), y: 4 },
      { of: ["copy", 0], x: x(75, -6), y: 60 },
      { of: ["copy", 1], x: x(50, 6), y: 94, align: "start" },
      { of: ["good", 2], x: x(25, -2), y: 109 },
      { of: ["good", 1], x: x(87.5, -8), y: 109 },
      { of: ["good", 0], x: x(50, 6), y: 144, align: "start" },
    ],
    reasons: {},
  }
}

/* ------------------------------------------------------------------------ */
/* studenti-rs/support                                                      */
/* ------------------------------------------------------------------------ */

function supportWide(): FlowLayout {
  const S = x(53)
  const n = {
    write: { x: x(15), y: 22, w: 168, h: 44, k: 0 },
    sort: { x: S, y: 90, w: 196, h: 64, k: 3 },
    simple: { x: S, y: 166, w: 184, h: 60, k: 5 },
    me: { x: x(88), y: 166, w: 150, h: 76 },
    facts: { x: S, y: 246, w: 196, h: 64, k: 7 },
    reply: { x: S, y: 324, w: 196, h: 64, k: 9 },
    end: { x: S, y: 404, w: x(46), h: 68, k: 11 },
  } satisfies Record<string, Place>
  return {
    refW: 656,
    height: 438,
    lanes: [30, 76],
    laneLabels: [x(0), x(30, 10), x(76, 10)],
    nodes: n,
    exits: {},
    edges: [
      { pts: [right(n.write), [S, 22], top(n.sort)], k: 1 },
      { pts: [bottom(n.sort), top(n.simple)], k: 4 },
      { pts: [right(n.simple), left(n.me)] },
      { pts: [bottom(n.simple), top(n.facts)], k: 6 },
      { pts: [bottom(n.facts), top(n.reply)], k: 8 },
      { pts: [bottom(n.reply), [S, top(n.end)[1]]], k: 10 },
    ],
    labels: [
      { of: ["simple", 1], x: x(70.5, 8.5), y: 146 },
      { of: ["simple", 0], x: x(53, 8), y: 198, align: "start" },
    ],
    reasons: {
      // Under the student's box: what students write about.
      write: { x: x(0), w: x(30, -12), y: 58, v: "t" },
      simple: { x: x(0), w: x(30, -12), y: 166, align: "end" },
      me: { x: x(88, -75), w: x(0, 150), y: 212, v: "t" },
      reply: { x: x(0), w: x(30, -12), y: 324, align: "end" },
    },
  }
}

function supportNarrow(): FlowLayout {
  const S = x(50)
  const n = {
    write: { x: x(0, 38), y: 18, w: 76, h: 36, k: 0 },
    sort: { x: S, y: 18, w: 120, h: 36, k: 2 },
    simple: { x: S, y: 70, w: 100, h: 36, k: 4 },
    me: { x: x(100, -38), y: 70, w: 76, h: 70 },
    facts: { x: S, y: 120, w: 140, h: 36, k: 6 },
    reply: { x: S, y: 170, w: 150, h: 36, k: 8 },
    end: { x: x(37.5), y: 216, w: x(75), h: 32, k: 10 },
  } satisfies Record<string, Place>
  return {
    refW: 310,
    height: 232,
    lanes: [25, 75],
    laneLabels: [x(0), x(25, 8), x(75, 8)],
    nodes: n,
    exits: {},
    edges: [
      { pts: [right(n.write), left(n.sort)], k: 1 },
      { pts: [bottom(n.sort), top(n.simple)], k: 3 },
      { pts: [right(n.simple), left(n.me)] },
      { pts: [bottom(n.simple), top(n.facts)], k: 5 },
      { pts: [bottom(n.facts), top(n.reply)], k: 7 },
      { pts: [bottom(n.reply), [S, top(n.end)[1]]], k: 9 },
    ],
    labels: [
      { of: ["simple", 1], x: x(75, -15), y: 54 },
      { of: ["simple", 0], x: x(50, 6), y: 88, align: "start" },
    ],
    reasons: {},
  }
}

export const FLOW_LAYOUTS: Record<
  string,
  { wide: FlowLayout; narrow: FlowLayout }
> = {
  "studenti-rs/submission": {
    wide: submissionWide(),
    narrow: submissionNarrow(),
  },
  "studenti-rs/support": { wide: supportWide(), narrow: supportNarrow() },
}

export type { Pt }
