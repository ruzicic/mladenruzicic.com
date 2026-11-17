"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react"

import { isTrackEvent, track, trackLink } from "@/lib/analytics"

/**
 * A rail: a native horizontal scroller with snap whose children are its
 * items, one in focus at a time. Shared by "Recent work" on `/`
 * (`app/components/landing/StripRail.tsx`) and the early projects on
 * `/about` (`app/components/about/EarlyCarousel.tsx`); the styles every rail
 * needs are in `app/styles/rail.css` (`[data-rail]`).
 *
 * The items are server-rendered children and are never re-rendered here:
 * the item in focus gets `data-on`, written straight to the DOM, and `idx`
 * drives the caller's counter and arrows. Item `i` rests at `i * step`, the
 * distance between the first two items, so the caller's CSS must snap them
 * there (a start or a centre alignment that the item's own scale does not
 * move).
 *
 * By hand (owner, 15 Nov 2026: "click on unfocused items scrolls to them;
 * drag to move/swipe on mobile"):
 * - A click or tap on an item that is not in focus only brings it into
 *   focus, with the arrows' motion. Its links do not fire on that click; on
 *   the item in focus they work as before. Keyboard activation (Enter, a
 *   click with `detail` 0) is never held back.
 * - On the item in focus, a click anywhere that is not a link or a button
 *   follows the item's primary link, the one marked `data-rail-primary`,
 *   if it has one (owner, 16 Nov 2026: the strip's cards go to the case
 *   study, or else the website). The link itself is clicked, so its own
 *   behaviour (a page transition, a new tab) is kept; a modified click
 *   opens it in a new tab. Enter on the rail itself does the same.
 * - A mouse press that travels more than `SLOP` drags the rail 1:1 under
 *   pointer capture, with snap off (`data-free`) until it has settled on an
 *   item: the nearest one, or one further on a flick. Such a drag never ends
 *   in a click, a text selection or a native drag of a picture or link.
 * - Touch is left to the browser: native scrolling with snap, one item per
 *   swipe (`scroll-snap-stop` in rail.css). Taps follow the first rule.
 * - Keys, when the rail or something in it has focus: the arrows step,
 *   Home and End go to either end. Tabbing onto an item brings it into focus.
 * - Under reduced motion every step is instant.
 *
 * `loop` (the early projects, owner, 16 Nov 2026: "carousel on about page
 * should loop ... not automatically ... just on scroll"): past the last item
 * comes the first and before the first the last, for the arrows, the keys,
 * a drag and a swipe. Once hydrated the hook puts a copy of the last item
 * before the first and a copy of the first after the last (`data-rail-clone`:
 * `aria-hidden`, `inert`, no ids, the same image URLs, so nothing new is
 * fetched). Stepping or swiping past an end lands on the copy with the
 * normal motion; once the rail has come to rest there it is moved, in one
 * instant and invisible jump, to the real item the copy shows. `idx` is
 * always the real item, so the counter reads "4 / 4" then "1 / 4". Home and
 * End do not wrap. Without JavaScript there are no copies and no loop.
 */

const FOCUSABLE = "a[href], button:not([disabled])"
/** What a click on an item in focus may land on without being a shortcut. */
const CONTROL =
  "a[href], button, input, select, textarea, summary, label, [role='button']"

/** A mouse press that travels less than this (px) is a click, not a drag. */
const SLOP = 6
/** Release speed (px per ms) over the last moments of a drag that counts as
 *  a flick: the rail settles on the next item in the drag's direction
 *  instead of the nearest one. Never more than that one item. */
const FLICK = 0.45
/** How far back (ms) the release speed is measured. */
const FLICK_WINDOW = 100
/** The settle's longest wait for `scrollend` before snap comes back. */
const SETTLE_MAX = 900
/** With `loop`: no scroll for this long (ms) counts as at rest, where
 *  `scrollend` is missing. */
const REST = 150

interface Drag {
  id: number
  x0: number
  y0: number
  /** Past the slop: the rail follows the pointer. */
  active: boolean
  /** The scroll position being written, clamped to the rail's range. */
  pos: number
  lastX: number
  /** Recent [time, clientX] pairs, for the release speed. */
  trail: [number, number][]
}

export interface RailOptions {
  /** Wrap around at both ends (see above). */
  loop?: boolean
}

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v))

/** A copy of an item for the loop's ends: seen, never reached. */
function cloneItem(item: HTMLElement): HTMLElement {
  const copy = item.cloneNode(true) as HTMLElement
  copy.setAttribute("data-rail-clone", "")
  copy.setAttribute("aria-hidden", "true")
  copy.inert = true
  copy.removeAttribute("data-on")
  copy.removeAttribute("id")
  copy.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"))
  return copy
}

export function useRail(total: number, { loop = false }: RailOptions = {}) {
  const ref = useRef<HTMLDivElement>(null)
  const raf = useRef(0)
  const drag = useRef<Drag | null>(null)
  /** The click that ends a drag is swallowed. */
  const swallow = useRef(false)
  /** Undoes a settle in progress (snap back on, listeners off). */
  const settling = useRef<(() => void) | null>(null)
  /** With `loop`: the copies are in place (slot = item + 1). */
  const cloned = useRef(false)
  /** The slot a programmatic scroll is heading for, until the rail rests. */
  const aim = useRef<number | null>(null)
  const [idx, setIdx] = useState(0)

  /** Every child, copies included: the rail's slots. */
  const slots = useCallback(
    () =>
      ref.current ? (Array.from(ref.current.children) as HTMLElement[]) : [],
    []
  )
  const step = useCallback(() => {
    const [a, b] = slots()
    return a && b ? b.offsetLeft - a.offsetLeft : 1
  }, [slots])
  /** The real item a slot shows. */
  const itemOf = useCallback(
    (s: number) => (cloned.current ? (((s - 1) % total) + total) % total : s),
    [total]
  )

  const sync = useCallback(() => {
    raf.current = 0
    const el = ref.current
    if (!el) return
    const list = slots()
    const s = clamp(Math.round(el.scrollLeft / step()), 0, list.length - 1)
    list.forEach((c, j) => c.toggleAttribute("data-on", j === s))
    setIdx(itemOf(s))
  }, [slots, step, itemOf])

  /**
   * At rest: the aim is spent, and on a copy (with `loop`) the rail jumps
   * to the real item it shows. Not mid-drag, not mid-settle, only exactly
   * on a slot (so a finger held still is never moved), and only on the slot
   * a step was heading for: the quiet-time fallback can fire mid-scroll
   * when a frame comes late, and the `scrollend` of a scroll that a newer
   * step replaced is not the end of the newer one. Clearing the aim there
   * lost a step in quick presses on a busy machine (16 Nov 2026).
   */
  const rest = useCallback(() => {
    const el = ref.current
    if (!el) return
    if (drag.current?.active || el.hasAttribute("data-free")) return
    const st = step()
    const s = Math.round(el.scrollLeft / st)
    if (Math.abs(el.scrollLeft - s * st) > 1) return
    if (aim.current !== null && aim.current !== s) return
    aim.current = null
    if (!cloned.current) return
    if (s === 0) el.scrollLeft = total * st
    else if (s === total + 1) el.scrollLeft = st
  }, [step, total])

  // The loop's copies, once hydrated, before the first paint after it: the
  // rail keeps the item it showed.
  useLayoutEffect(() => {
    const el = ref.current
    if (!loop || !el || total < 2 || el.children.length !== total) return
    const at = Math.round(el.scrollLeft / step())
    const real = slots()
    const head = cloneItem(real[total - 1])
    const tail = cloneItem(real[0])
    el.prepend(head)
    el.append(tail)
    cloned.current = true
    el.scrollLeft = (at + 1) * step()
    sync()
    return () => {
      const shown = itemOf(Math.round(el.scrollLeft / step()))
      head.remove()
      tail.remove()
      cloned.current = false
      el.scrollLeft = shown * step()
    }
  }, [loop, total, slots, step, sync, itemOf])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    sync()
    let idle = 0
    const onScroll = () => {
      if (!raf.current) raf.current = requestAnimationFrame(sync)
      window.clearTimeout(idle)
      idle = window.setTimeout(rest, REST)
    }
    // A hand on the rail takes over from any step under way.
    const drop = () => (aim.current = null)
    el.addEventListener("scroll", onScroll, { passive: true })
    el.addEventListener("scrollend", rest)
    el.addEventListener("wheel", drop, { passive: true })
    el.addEventListener("touchstart", drop, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      el.removeEventListener("scroll", onScroll)
      el.removeEventListener("scrollend", rest)
      el.removeEventListener("wheel", drop)
      el.removeEventListener("touchstart", drop)
      window.removeEventListener("resize", onScroll)
      window.clearTimeout(idle)
      cancelAnimationFrame(raf.current)
      settling.current?.()
    }
  }, [sync, rest])

  /** Scrolls to slot `s` (clamped), and moves keyboard focus there if asked. */
  const toSlot = (s: number, moveFocus = false) => {
    const el = ref.current
    if (!el) return
    const list = slots()
    const t = clamp(s, 0, list.length - 1)
    const instant = reducedMotion()
    aim.current = instant ? null : t
    el.scrollTo({ left: t * step(), behavior: instant ? "auto" : "smooth" })
    if (!moveFocus) return
    // A copy is never focused: its real item is.
    const real = list[cloned.current ? itemOf(t) + 1 : t]
    const target = real?.matches(FOCUSABLE)
      ? real
      : real?.querySelector<HTMLElement>(FOCUSABLE)
    ;(target ?? el).focus({ preventScroll: true })
  }

  /** Goes to item `i`. With `loop`, -1 and `total` are the copies. */
  const go = (i: number, moveFocus = false) => {
    if (!cloned.current) return toSlot(i, moveFocus)
    if (reducedMotion()) i = ((i % total) + total) % total
    toSlot(clamp(i, -1, total) + 1, moveFocus)
  }

  /**
   * One item on, or back (`dir` 1 or -1): the arrows and the arrow keys.
   * From where the rail is heading rather than where it is, so quick
   * presses add up. With `loop`, past a copy the rail first moves by the
   * whole set, which shows the same picture.
   */
  const move = (dir: 1 | -1, moveFocus = false) => {
    const el = ref.current
    if (!el) return
    if (cloned.current && reducedMotion()) return go(idx + dir, moveFocus)
    const st = step()
    let t = (aim.current ?? Math.round(el.scrollLeft / st)) + dir
    if (cloned.current && (t < 0 || t > total + 1)) {
      const shift = t < 0 ? total : -total
      el.scrollLeft += shift * st
      t += shift
    }
    toSlot(t, moveFocus)
  }

  /** Follows the primary link of the item in focus, if it has one. */
  const follow = (e: MouseEvent | KeyboardEvent) => {
    const on = slots().find((c) => c.hasAttribute("data-on"))
    const link = on?.querySelector<HTMLAnchorElement>("a[data-rail-primary]")
    if (!link) return false
    e.preventDefault()
    // The item's own event, if it has one (a strip card's `recent work:
    // <slug>`, `lib/analytics.ts`); the link counts itself on its click
    // (`FathomAnalytics`), or here when it is opened without one.
    const opened = on?.getAttribute("data-track-open")
    if (isTrackEvent(opened)) track(opened)
    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      trackLink(link)
      window.open(link.href, "_blank", "noopener")
    } else link.click()
    return true
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.metaKey || e.ctrlKey) return
    const inner = e.target !== e.currentTarget
    if (e.key === "Enter") {
      if (!inner) follow(e)
      return
    }
    if (e.key === "ArrowRight") move(1, inner)
    else if (e.key === "ArrowLeft") move(-1, inner)
    else if (e.key === "Home") go(0, inner)
    else if (e.key === "End") go(total - 1, inner)
    else return
    e.preventDefault()
  }

  // Tabbing onto an item scrolls it into the focus position. A mouse press
  // that focuses a link does not: the click (or the drag) decides.
  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) return
    if (!(e.target as Element).matches(":focus-visible")) return
    const s = slots().findIndex((c) => c.contains(e.target as Node))
    if (s >= 0 && itemOf(s) !== idx) toSlot(s)
  }

  /** Scrolls to slot `t` with snap off, then gives snap back once there. */
  const settle = (t: number) => {
    const el = ref.current
    if (!el) return
    const i = clamp(t, 0, slots().length - 1)
    const left = Math.min(el.scrollWidth - el.clientWidth, i * step())
    let timer = 0
    const done = () => {
      window.clearTimeout(timer)
      el.removeEventListener("scrollend", done)
      el.removeAttribute("data-free")
      settling.current = null
      rest()
    }
    if (reducedMotion() || Math.abs(el.scrollLeft - left) < 1) {
      el.scrollLeft = left
      done()
      return
    }
    settling.current = done
    el.addEventListener("scrollend", done)
    timer = window.setTimeout(done, SETTLE_MAX)
    el.scrollTo({ left, behavior: "smooth" })
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    swallow.current = false
    aim.current = null
    if (e.pointerType !== "mouse" || e.button !== 0 || !e.isPrimary) return
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
    drag.current = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      active: false,
      pos: 0,
      lastX: e.clientX,
      trail: [[e.timeStamp, e.clientX]],
    }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const el = ref.current
    if (!d || !el || e.pointerId !== d.id) return
    if (!d.active) {
      if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < SLOP) return
      d.active = true
      settling.current?.()
      el.setPointerCapture(d.id)
      el.setAttribute("data-free", "")
      el.setAttribute("data-dragging", "")
      // From the press, not from the slop: the rail stays under the hand.
      d.pos = el.scrollLeft
      d.lastX = d.x0
    }
    e.preventDefault()
    const sel = window.getSelection()
    if (sel && !sel.isCollapsed) sel.removeAllRanges()
    const max = el.scrollWidth - el.clientWidth
    d.pos = Math.min(max, Math.max(0, d.pos - (e.clientX - d.lastX)))
    d.lastX = e.clientX
    el.scrollLeft = d.pos
    d.trail.push([e.timeStamp, e.clientX])
    while (d.trail.length > 2 && e.timeStamp - d.trail[0][0] > FLICK_WINDOW)
      d.trail.shift()
  }

  const endDrag = (e: PointerEvent<HTMLDivElement>, released: boolean) => {
    const d = drag.current
    const el = ref.current
    if (!d || !el || e.pointerId !== d.id) return
    drag.current = null
    if (!d.active) return
    swallow.current = released
    // A click, if any, comes before timers run; a release with no click
    // after it (outside the window) must not eat the next one.
    if (released) window.setTimeout(() => (swallow.current = false), 0)
    if (el.hasPointerCapture(d.id)) el.releasePointerCapture(d.id)
    el.removeAttribute("data-dragging")
    // The speed of the drag's own last moves; a release that comes after
    // the pointer has stood still for a moment is not a flick.
    const [t0, x0] = d.trail[0]
    const [t1, x1] = d.trail[d.trail.length - 1]
    const held = e.timeStamp - t1 > FLICK_WINDOW
    const v = !released || held || t1 <= t0 ? 0 : (x1 - x0) / (t1 - t0)
    const f = el.scrollLeft / step()
    const t =
      v <= -FLICK
        ? Math.ceil(f - 0.02)
        : v >= FLICK
          ? Math.floor(f + 0.02)
          : Math.round(f)
    settle(t)
  }

  // After a drag, the click it ends in is not a click. Before an item is in
  // focus, a click only focuses it (not for the keyboard: `detail` 0).
  const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (swallow.current) {
      swallow.current = false
      e.preventDefault()
      e.stopPropagation()
      return
    }
    if (e.detail === 0) return
    const list = slots()
    const s = list.findIndex((c) => c.contains(e.target as Node))
    if (s < 0 || list[s].hasAttribute("data-on")) return
    e.preventDefault()
    e.stopPropagation()
    toSlot(s)
  }

  // A click that got this far landed on the item in focus: off its links
  // and buttons, it is a shortcut to the item's primary link. Selecting
  // text in it is not.
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el || e.defaultPrevented || e.button !== 0) return
    const hit = (e.target as Element).closest(CONTROL)
    if (hit && el.contains(hit)) return
    const sel = window.getSelection()
    if (sel && !sel.isCollapsed && el.contains(sel.anchorNode)) return
    const s = slots().findIndex((c) => c.contains(e.target as Node))
    if (s < 0) return
    follow(e)
  }

  // No native drag of a picture, clip or link out of the rail.
  const onDragStart = (e: DragEvent<HTMLDivElement>) => e.preventDefault()

  /** Spread on the scroller. */
  const bind = {
    ref,
    "data-rail": "",
    "data-loop": loop ? "" : undefined,
    tabIndex: 0,
    onKeyDown,
    onFocus,
    onPointerDown,
    onPointerMove,
    onPointerUp: (e: PointerEvent<HTMLDivElement>) => endDrag(e, true),
    onPointerCancel: (e: PointerEvent<HTMLDivElement>) => endDrag(e, false),
    onLostPointerCapture: (e: PointerEvent<HTMLDivElement>) =>
      endDrag(e, false),
    onClickCapture,
    onClick,
    onDragStart,
  }

  return { idx, go, move, bind }
}
