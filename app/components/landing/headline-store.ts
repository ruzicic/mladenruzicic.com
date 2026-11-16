import { useSyncExternalStore } from "react"

/**
 * The cycling headline's state, shared by the headline and the story's product
 * names without a React context (so nothing re-renders the paragraphs): a
 * module-level store read through `useSyncExternalStore`. Each subscriber picks
 * one primitive, so a product name re-renders only when its own "lit" flag
 * flips.
 *
 * Mechanism, from `Landing.dc.html` (`wTick` / `wShow` / `wBlocked`): a 100ms
 * tick counts down only while nothing holds the loop; the first swap comes
 * 700ms later than the pace, every later one at the pace; showing a phrase from
 * the paragraph resets the countdown. The loop holds while the reader is in the
 * headline or the story, while a popover, a sheet, the Ask panel or the press
 * menu is open, and while paused.
 */

export interface HeadlineState {
  /** The phrase on show. */
  cur: number
  /** The phrase leaving, or -1. */
  prev: number
  /** False until the first swap: the first phrase keeps its load treatment. */
  switched: boolean
  /** The reader pressed pause (or asked for reduced motion). */
  paused: boolean
  /** Something holds the loop (hover, focus, a popover, the Ask panel). */
  held: boolean
}

const INITIAL: HeadlineState = {
  cur: 0,
  prev: -1,
  switched: false,
  paused: false,
  held: false,
}

let state = INITIAL
let count = 6
let pace = 2500
let remaining = pace + 700
const listeners = new Set<() => void>()
const holds = new Set<string>()

function emit() {
  for (const l of listeners) l()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Called once by the ticker with the content's phrase count and pace. */
export function configureHeadline(phrases: number, paceMs: number) {
  if (count === phrases && pace === paceMs) return
  count = phrases
  pace = paceMs
  remaining = paceMs + 700
}

/** Show phrase `i` now (a product name in the story was hovered or focused). */
export function showPhrase(i: number) {
  if (i < 0 || i >= count) return
  remaining = pace
  if (i === state.cur) return
  state = { ...state, prev: state.cur, cur: i, switched: true }
  emit()
}

export function setHeadlinePaused(paused: boolean) {
  remaining = pace
  if (state.paused === paused) return
  state = { ...state, paused }
  emit()
}

/**
 * Hold or release the loop under a key. Other islands use this too: the Ask
 * panel and the press menu should call `holdHeadline("ask", open)` /
 * `holdHeadline("menu", open)` to match the board.
 */
export function holdHeadline(key: string, on: boolean) {
  if (on) holds.add(key)
  else holds.delete(key)
  const held = holds.size > 0
  if (state.held !== held) {
    state = { ...state, held }
    emit()
  }
}

/** One 100ms step of the countdown. */
export function tickHeadline(ms: number) {
  if (state.paused || holds.size > 0) return
  remaining -= ms
  if (remaining <= 0) showPhrase((state.cur + 1) % count)
}

export function useHeadline<T>(select: (s: HeadlineState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(INITIAL)
  )
}
