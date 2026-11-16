import { useEffect, useRef } from "react"

/**
 * Holds the page still while a modal overlay or a full-screen effect is on
 * (owner, 16 Nov 2026: "scroll has to be disabled while sheets/dialogs are
 * on"). One lock for the whole site, counted: the page scrolls again only
 * when the last holder lets go, whatever order they let go in.
 *
 * - `overflow: hidden` on `<html>`: no wheel, key or touch scroll of the
 *   page (iOS Safari honours it on the root since 16).
 * - `scrollbar-gutter: stable` while held, and only where the page had a
 *   classic scrollbar: the bar goes, its room stays, nothing moves sideways.
 *   Where the browser does not keep the root's gutter, the bar stays instead
 *   and a key guard stops the keys that would scroll the page.
 * - `overscroll-behavior: none` on `<html>`: no rubber band behind a sheet.
 * - A non-passive `touchmove` and `wheel` guard on the document: a move is
 *   cancelled unless it starts inside one of the holders' `allow` elements
 *   and a scroller between it and that element can still move. Inside the
 *   sheet the reader scrolls as usual (give the scroller
 *   `overscroll-behavior: contain`); anywhere else nothing moves, which is
 *   what stops iOS from scrolling the page through a fixed layer.
 * - `touch: "none"` (the About postscript) also sets `touch-action: none` on
 *   `<html>` from the next touch on, so a finger moves the effect's circle
 *   and never the page.
 *
 * The scroll position is never touched, so nothing jumps when it lets go.
 * Inline styles on `<html>` only: no global CSS, and what was there before
 * is put back.
 */

export interface ScrollLockOptions {
  /** The element whose own scrolling stays allowed (a sheet's scroller). */
  allow?: () => Element | null
  /** `none`: no panning or zooming by touch anywhere while held. */
  touch?: "none"
}

interface Holder {
  options: ScrollLockOptions
}

const holders = new Set<Holder>()
let saved: {
  overflow: string
  overscroll: string
  gutter: string
  touchAction: string
} | null = null

function canScroll(el: Element, dx: number, dy: number) {
  const cs = getComputedStyle(el)
  const y = /(auto|scroll)/.test(cs.overflowY)
  const x = /(auto|scroll)/.test(cs.overflowX)
  if (y && el.scrollHeight > el.clientHeight + 1) {
    // Moving the content up (finger up, wheel down) needs room below.
    if (dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1)
      return true
    if (dy < 0 && el.scrollTop > 0) return true
    if (dy === 0 && dx === 0) return true
  }
  if (x && el.scrollWidth > el.clientWidth + 1) {
    if (dx > 0 && el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
      return true
    if (dx < 0 && el.scrollLeft > 0) return true
  }
  return false
}

/** May a move of (dx, dy) that starts on `target` scroll something allowed? */
function allowed(target: EventTarget | null, dx: number, dy: number) {
  if (!(target instanceof Element)) return false
  for (const h of holders) {
    const root = h.options.allow?.()
    if (!root || !root.contains(target)) continue
    for (
      let el: Element | null = target;
      el && root.contains(el);
      el = el.parentElement
    ) {
      if (canScroll(el, dx, dy)) return true
      if (el === root) break
    }
  }
  return false
}

let touchY = 0
let touchX = 0

function onTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  if (!t) return
  touchX = t.clientX
  touchY = t.clientY
}

function onTouchMove(e: TouchEvent) {
  // Two fingers: a pinch. Leave zoom alone.
  if (!e.cancelable || e.touches.length > 1) return
  const t = e.touches[0]
  if (!t) return
  // The content moves against the finger: finger up scrolls down.
  const dx = touchX - t.clientX
  const dy = touchY - t.clientY
  if (allowed(e.target, dx, dy)) return
  e.preventDefault()
}

function onWheel(e: WheelEvent) {
  if (!e.cancelable || e.ctrlKey) return // ctrl+wheel is a pinch zoom
  if (allowed(e.target, e.deltaX, e.deltaY)) return
  e.preventDefault()
}

/** Keys that scroll, and which way (Space and Enter only off a control). */
const SCROLL_KEYS: Record<string, number> = {
  ArrowUp: -1,
  ArrowDown: 1,
  PageUp: -1,
  PageDown: 1,
  Home: -1,
  End: 1,
  " ": 1,
}

/**
 * Only where the page keeps its scrollbar (see `engage`): the keys that
 * would scroll it do nothing, unless they are typing or move a scroller the
 * lock allows.
 */
function onKey(e: KeyboardEvent) {
  const dir = SCROLL_KEYS[e.key]
  if (!dir || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
  const t = e.target
  if (
    t instanceof Element &&
    t.closest(
      'input, textarea, select, [contenteditable=""], [contenteditable="true"]'
    )
  )
    return
  if (e.key === " " && t instanceof Element && t.closest("button, a, summary"))
    return
  if (allowed(t, 0, dir * (e.shiftKey && e.key === " " ? -1 : 1))) return
  e.preventDefault()
}

const LISTEN = { capture: true, passive: false } as const

function engage() {
  const html = document.documentElement
  const s = html.style
  saved = {
    overflow: s.overflow,
    overscroll: s.overscrollBehavior,
    gutter: s.scrollbarGutter,
    touchAction: s.touchAction,
  }
  const width = html.clientWidth
  // A classic scrollbar takes room; keep the room when the bar goes.
  if (window.innerWidth - width > 0) s.scrollbarGutter = "stable"
  s.overflow = "hidden"
  s.overscrollBehavior = "none"
  // Where the root does not keep its gutter (Chromium did not in testing),
  // the page would shift sideways by the bar: keep the bar instead, and
  // hold the page with the wheel and key guards. Such a page has a mouse;
  // touch screens have overlay scrollbars and take the first path.
  if (html.clientWidth !== width) {
    s.overflow = saved.overflow
    s.scrollbarGutter = saved.gutter
    document.addEventListener("keydown", onKey, LISTEN)
  }
  html.setAttribute("data-scroll-locked", "")
  document.addEventListener("touchstart", onTouchStart, {
    capture: true,
    passive: true,
  })
  document.addEventListener("touchmove", onTouchMove, LISTEN)
  document.addEventListener("wheel", onWheel, LISTEN)
}

function release() {
  const html = document.documentElement
  document.removeEventListener("touchstart", onTouchStart, { capture: true })
  document.removeEventListener("touchmove", onTouchMove, { capture: true })
  document.removeEventListener("wheel", onWheel, { capture: true })
  document.removeEventListener("keydown", onKey, { capture: true })
  if (saved) {
    const s = html.style
    s.overflow = saved.overflow
    s.overscrollBehavior = saved.overscroll
    s.scrollbarGutter = saved.gutter
    s.touchAction = saved.touchAction
  }
  saved = null
  html.removeAttribute("data-scroll-locked")
}

function applyTouch() {
  const want = [...holders].some((h) => h.options.touch === "none")
  if (saved)
    document.documentElement.style.touchAction = want
      ? "none"
      : saved.touchAction
}

/**
 * Holds the page still until the returned function is called (calling it
 * again does nothing).
 */
export function lockScroll(options: ScrollLockOptions = {}): () => void {
  if (typeof document === "undefined") return () => {}
  const holder: Holder = { options }
  if (holders.size === 0) engage()
  holders.add(holder)
  applyTouch()
  let held = true
  return () => {
    if (!held) return
    held = false
    holders.delete(holder)
    if (holders.size === 0) release()
    else applyTouch()
  }
}

/** `lockScroll` for as long as `on` is true and the component is mounted. */
export function useScrollLock(on: boolean, options: ScrollLockOptions = {}) {
  const ref = useRef(options)
  useEffect(() => {
    ref.current = options
  })
  useEffect(() => {
    if (!on) return
    return lockScroll({
      allow: () => ref.current.allow?.() ?? null,
      touch: ref.current.touch,
    })
  }, [on])
}
