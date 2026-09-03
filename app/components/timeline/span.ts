/**
 * Rail geometry — shared by the server wrapper and the client rail.
 * Pure functions only: no `Date`, so the value can never differ between the
 * server render and hydration. The "now" fraction comes from
 * `app/components/site/now.ts` (server only, `"use cache"`) and is passed down
 * as a prop.
 */

/** The axis runs 2027 on the left to 2008 on the right, as in the design. */
export const SPAN_TO = 2027
export const SPAN_FROM = 2008
export const SPAN_YEARS = SPAN_TO - SPAN_FROM

/** Rail height, collapsed and with one band expanded. */
export const RAIL_HEIGHT = 270
export const RAIL_HEIGHT_EXPANDED = 740
/** Width of an expanded band's panel. */
export const EXPANDED_WIDTH = 480

/**
 * Horizontal breathing room trimmed off the right of every band, so two
 * adjacent spans never look welded together. Shared by the band width and by
 * the overlap strip, which has to land on the same pixel.
 */
export const BAND_GAP = 6

/**
 * Overlaps shorter than two months are an artefact of how a range is written
 * down, not a real double engagement: HEGIAS ends in April 2021 and Shopify
 * starts in April 2021, and both are inclusive. Drawing a 7px hatch there would
 * claim something the dates do not say.
 */
export const MIN_OVERLAP_YEARS = 2 / 12

/** Vertical anchors from the design, in px inside the rail. */
export const ROW = {
  employedLabel: 44,
  bands: 64,
  bandHeight: 72,
  independentLabel: 160,
  markerA: 184,
  divider: 178,
  markerB: 212,
  /**
   * A third marker row, used only when two cannot hold the set without one
   * label painting over another — see `assignMarkerRows`. It is still inside
   * `RAIL_HEIGHT`: a 13px label on this baseline ends around 258 of 270.
   */
  markerC: 240,
} as const

/** The marker rows, top to bottom, in the order `assignMarkerRows` fills them. */
export const MARKER_ROWS = [ROW.markerA, ROW.markerB, ROW.markerC] as const

/** Position of a year on the axis, as a percentage from the left edge. */
export function pct(year: number): number {
  return ((SPAN_TO - year) / SPAN_YEARS) * 100
}

/** Resolves a company's `to`, which is `"now"` for the current employer. */
export function resolveTo(to: number | "now", now: number): number {
  return to === "now" ? now : to
}

/**
 * How much of a band its newer neighbour covers, as a fraction of the band's
 * own width (0 when they do not overlap).
 *
 * Bands are painted newest-first, so the *older* band of an overlapping pair is
 * the one drawn on top — it keeps its end edge, its mark and its date line
 * readable, and it is the one that has to admit what is underneath it. That
 * admission is the hatched strip along its leading edge, which is exactly this
 * fraction wide.
 *
 * `band.to` must already be resolved through `resolveTo`.
 */
export function overlapWithNewer(
  band: { from: number; to: number },
  newerFrom: number | undefined
): number {
  if (newerFrom === undefined) return 0
  const overlap = band.to - newerFrom
  const span = band.to - band.from
  if (overlap < MIN_OVERLAP_YEARS || span <= 0) return 0
  return Math.min(overlap / span, 1)
}

/**
 * Roughly how wide a marker's label is, expressed in axis years.
 *
 * The rail is a fixed 1400px (1800px from 720px up), so pixels convert to
 * years exactly. A label is a 12px dot, an 8px gap, the title at the 13px sans
 * face (~7.2px average advance), another 8px gap, a four-digit mono year and
 * 8px of right padding. The narrow rail is used because that is where a label
 * covers the most years.
 */
export function markerLabelYears(title: string): number {
  const px = 12 + 8 + title.length * 7.2 + 8 + 24 + 8
  return px / (1400 / SPAN_YEARS)
}

/**
 * Which row each independent-project marker sits on, as an index into
 * `MARKER_ROWS`.
 *
 * Markers arrive oldest-first and are painted right-to-left (2008 is the right
 * edge), with each label flowing rightwards from its dot — so a marker's label
 * runs back towards the marker placed before it on the same row. Simple
 * `index % 2` alternation was enough while the four projects were spread over
 * the axis, but TenderLift (2025), Amada (2025) and FontAlternatives (2026)
 * now sit inside one year of each other, and three labels that wide cannot
 * share two rows: the last one painted covers the others, because each marker
 * carries an opaque background.
 *
 * So rows are filled greedily instead: a marker takes the topmost row whose
 * previous marker its label does not reach. When every row is taken it falls
 * back to the row whose previous marker is oldest — the least bad overlap —
 * rather than dropping the marker.
 */
export function assignMarkerRows(
  markers: { title: string; year: number }[],
  rowCount: number = MARKER_ROWS.length
): number[] {
  const lastYear = Array.from({ length: rowCount }, () => -Infinity)

  return markers.map((marker) => {
    const reachesBackTo = marker.year - markerLabelYears(marker.title)
    let row = lastYear.findIndex((year) => reachesBackTo >= year)
    if (row === -1) {
      row = lastYear.indexOf(Math.min(...lastYear))
    }
    lastYear[row] = marker.year
    return row
  })
}

/** Stable 0–359 hue from an id, so an avatar keeps its colour across renders. */
export function hueFromId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % 360
}

/** "Radovan Skendžić" → "RS". */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}
