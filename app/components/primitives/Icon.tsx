import type { CSSProperties } from "react"
// clsx, not `cn`: this renders inside client islands, and `cn` pulls
// tailwind-merge (about 8 KB gzipped) into their chunks.
import { clsx } from "clsx"

import "../../styles/icon.css"

/**
 * The site's own icon set (owner, 15 Nov 2026: "our own custom designed mini
 * set of icons that look great together and have similar minimalistic micro
 * transitions"). One 16-unit grid, one 1.5px stroke (`--ico-stroke`, never
 * scaled), butt caps and mitred joins, nothing filled.
 *
 * Every arrow is one glyph: a shaft and an open 90° chevron, drawn pointing
 * right and turned (`arrow-left`, `arrow-up`, `arrow-down`, and 45° for
 * `arrow-up-right`). `close` is the plus turned 45°; `minus` is the plus
 * with its vertical bar turned flat.
 *
 * The toggles are one icon holding both states, so a state change can turn
 * or cross-fade instead of swapping markup:
 * - `plus-close` (the Ask button): turns 45° when on;
 * - `plus-minus` (a disclosure): the vertical bar turns flat when on;
 * - `arrow-down-up` (Show all): turns 180° when on;
 * - `play-pause` (video, the pile, the headline): play when off, pause on;
 * - `copy-check`: copy when off; on, the check draws itself.
 * `on` comes from the `on` prop, or from the control around it
 * (`[data-on]`, `[aria-expanded="true"]`, an open `<details>`).
 *
 * The motion is CSS only (`app/styles/icon.css`) and driven by the control
 * that holds the icon, its hover and keyboard focus: an arrow's head leads
 * (it moves two units forward and the shaft follows; the tail stays),
 * `close` turns 90°, `download` drops toward its tray. 160ms on the
 * standard easing; nothing moves under reduced motion.
 *
 * `1em` square by default, so an icon follows its label's size and sits on
 * the text's cap centre; `size` (px) for a free-standing control.
 * Decorative: `aria-hidden`; the control carries the name.
 */

export const ICON_NAMES = [
  "arrow-right",
  "arrow-left",
  "arrow-up",
  "arrow-down",
  "arrow-up-right",
  "arrow-down-up",
  "plus",
  "minus",
  "close",
  "plus-close",
  "plus-minus",
  "play",
  "pause",
  "play-pause",
  "download",
  "copy",
  "check",
  "copy-check",
  "mail",
  "calendar",
  "list",
  "sound",
] as const
export type IconName = (typeof ICON_NAMES)[number]

export interface IconProps {
  name: IconName
  /** Pixel size for a free-standing control; default `1em`. */
  size?: number
  /** The second state of a toggle icon (see above). */
  on?: boolean
  className?: string
}

const TURN: Partial<Record<IconName, number>> = {
  "arrow-right": 0,
  "arrow-left": 180,
  "arrow-up": -90,
  "arrow-down": 90,
  "arrow-down-up": 90,
  "arrow-up-right": -45,
}

/** The one arrow, pointing right: shaft, then the open chevron. */
function Arrow({ turn }: { turn: number }) {
  return (
    <g transform={turn ? `rotate(${turn} 8 8)` : undefined}>
      <g className="ico-dir">
        <path className="ico-shaft" d="M3 8H12.25" />
        <path className="ico-head" d="M8 3.75 12.25 8 8 12.25" />
      </g>
    </g>
  )
}

/** The cross: a vertical and a horizontal bar, turned as a whole for close. */
function Cross() {
  return (
    <g className="ico-x">
      <path className="ico-v" d="M8 3V13" />
      <path className="ico-h" d="M3 8H13" />
    </g>
  )
}

const PLAY = <path className="ico-play" d="M5.25 3.5 12.25 8 5.25 12.5Z" />
const PAUSE = <path className="ico-pause" d="M5.75 3.5V12.5M10.25 3.5V12.5" />
const COPY = (
  <g className="ico-copy">
    <path d="M5.5 5.5V2.5H13.5V10.5H10.5" />
    <path d="M2.5 5.5H10.5V13.5H2.5Z" />
  </g>
)
const CHECK = <path className="ico-check" d="M3.25 8.5 6.5 11.75 12.75 4.75" />

function glyph(name: IconName) {
  if (name in TURN) return <Arrow turn={TURN[name]!} />
  switch (name) {
    case "plus":
    case "minus":
    case "close":
    case "plus-close":
    case "plus-minus":
      return <Cross />
    case "play":
      return PLAY
    case "pause":
      return PAUSE
    case "play-pause":
      return (
        <>
          {PLAY}
          {PAUSE}
        </>
      )
    case "download":
      return (
        <>
          <g className="ico-drop">
            <path d="M8 2V9" />
            <path d="M3.75 4.75 8 9 12.25 4.75" />
          </g>
          <path d="M3 13.25H13" />
        </>
      )
    case "copy":
      return COPY
    case "check":
      return CHECK
    case "copy-check":
      return (
        <>
          {COPY}
          {CHECK}
        </>
      )
    case "mail":
      return (
        <>
          <path d="M2 3.5H14V12.5H2Z" />
          <path d="M2 3.5 8 8.5 14 3.5" />
        </>
      )
    case "calendar":
      return (
        <>
          <path d="M2.5 3.5H13.5V13.5H2.5Z" />
          <path d="M2.5 7H13.5M5.5 2V5M10.5 2V5" />
        </>
      )
    case "list":
      return (
        <path d="M2.5 4.5H4M6 4.5H13.5M2.5 8H4M6 8H13.5M2.5 11.5H4M6 11.5H13.5" />
      )
    case "sound":
      // A speaker and two arcs: the "Sound on" sign (a sign, no motion).
      return (
        <>
          <path d="M2 6H5L9 3V13L5 10H2Z" />
          <path d="M11.5 6A3 3 0 0 1 11.5 10" />
          <path d="M13.5 4A5.5 5.5 0 0 1 13.5 12" />
        </>
      )
    default:
      return null
  }
}

export function Icon({ name, size, on, className }: IconProps) {
  const style: CSSProperties | undefined = size
    ? { width: size, height: size }
    : undefined
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      data-icon={name}
      data-on={on ? "" : undefined}
      className={clsx("ico", className)}
      style={style}
    >
      {glyph(name)}
    </svg>
  )
}
