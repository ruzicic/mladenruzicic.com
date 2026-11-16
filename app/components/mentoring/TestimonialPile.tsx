"use client"

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type FocusEvent,
  type PointerEvent,
} from "react"
import Image from "next/image"

import { haptic } from "@/lib/haptics"

import { Button } from "../primitives/Button"
import { Icon } from "../primitives/Icon"
import { useDelayedOn } from "../primitives/use-delayed-on"

export interface PileCard {
  id: string
  /** Verbatim from `content/testimonials.ts`; never edited. */
  quote: string
  author: string
  initials: string
  avatar?: string
  blurDataURL?: string
  /** The caption's second line ("Mentee for 2 years · 2024"), if known. */
  meta?: string
  /** The card's paper tone (content, `said.pile`). */
  tone: string
  /** Tilt in degrees while the card waits in the pile. */
  rot: number
  /** Tilt once it is the top card. */
  rest: number
}

export interface TestimonialPileProps {
  cards: PileCard[]
  /** The region's label (the section title). */
  label: string
  /** `{n} / {total}` */
  counterFormat: string
  /** `Testimonial {n} of {total}. Show the next one, {next} of {total}` */
  nextLabelFormat: string
  pauseLabel: string
  playLabel: string
}

/** The board's defaults for its tweak props (`tilt`, `seconds`). */
const TILT = 1
const SECONDS = 7
/** Top card plus three showing behind it; the rest wait unseen. */
const SHOWN = 4

/* The hand. Distances in CSS pixels, speeds in px/ms. */
/** Movement before a press becomes a drag (or, on touch, a scroll). */
const SLOP = 6
/**
 * On touch, a finger that rests on the card this long before it moves has
 * picked the card up: it drags in any direction and the page holds still.
 * A quicker vertical swipe is the page scrolling.
 */
const HOLD_MS = 200
/** Distance from the origin that sends the card to the back on release. */
const THROW = 90
/** A release this fast throws the card from a shorter drag... */
const FLICK_SPEED = 0.5
/** ...as long as it has moved at least this far. */
const FLICK_MIN = 24
/** Tilt while dragging: one degree per 24px across, at most 12. */
const PX_PER_DEG = 24
const MAX_DRAG_TILT = 12
/** The pressed card: flat, a touch smaller (`.ment-card[data-press]`). */
const PRESS_SCALE = 0.985
/** The tallest a waiting card leans (content: 2.4deg), for the pile's extent. */
const PILE_TILT = 2.5

/*
 * The send-to-back move: out until clear of the pile, then back under it.
 * The reader's move is 540ms; autoplay is a little slower and lands without
 * the spring (`[data-move="auto"]` in mentoring.css).
 */
const USER_MS = { out: 240, back: 300 }
const AUTO_MS = { out: 320, back: 360 }
/** Reduced motion: a cross-fade, no flight. */
const FADE_MS = 150
const BACK_EASE = "cubic-bezier(0.45, 0, 0.2, 1)"
/** A tap's direction: right and slightly down. */
const TAP_DIR = unit(1, 0.2)
/** At most this many cards in the air; the oldest lands at once. */
const MAX_FLIGHTS = 3

type Kind = "tap" | "throw" | "key" | "auto"

/** A card's transform, in the same function list the stylesheet uses. */
interface Pose {
  x: number
  y: number
  r: number
  s: number
}

interface Gesture {
  id: number
  touch: boolean
  /** When the press began (event time). */
  t0: number
  x0: number
  y0: number
  x: number
  y: number
  /** `press` until it moves; then a `drag`, a `scroll` (touch, vertical) or,
   *  under reduced motion, a `swipe` that is measured but not drawn. */
  mode: "press" | "drag" | "scroll" | "swipe"
  top: HTMLElement
  next: HTMLElement | null
  /** The grab point, from the top card's centre. */
  px: number
  py: number
  /** The card underneath: where it waits and the tilt it takes on top. */
  from: Pose
  rest: number
  /** The pose last written to the top card. */
  pose: Pose
  samples: { t: number; x: number; y: number }[]
}

interface Flight {
  el: HTMLElement
  anim: Animation | null
}

/**
 * The testimonial pile on `/mentoring` (`Landing-Mentoring.dc.html` and the
 * phone board): the mentee quotes as tilted paper cards, the top one lifted.
 * It advances every 7s, with a 2px bar filling towards the next card. The
 * top card can be handled like paper: pressed it settles flat, dragged it
 * follows the pointer and leans about where it was held while the card
 * underneath rises (on a phone: a sideways drag, or any drag after a short
 * hold, and the page holds still; a quick vertical swipe scrolls the page), and thrown (or tapped) it travels clear of the pile,
 * drops behind it and slides back in as the last card while the next one
 * springs up. A short drag springs back. The counter button and Enter or
 * Space on it make the same move as a tap; any manual move stops the cycle.
 * The round button pauses and plays.
 *
 * Nothing in the gesture goes through React: pointer moves write the two
 * cards' transforms through `requestAnimationFrame`, the flight is two Web
 * Animations on the thrown card, and React commits once per move (the new
 * top card). Transform and opacity only.
 *
 * The timer is the bar itself: its CSS animation runs for 7s and its
 * `animationend` advances the pile, so pausing is `animation-play-state` and
 * the bar and the cards can never drift apart. It holds still on hover, on
 * keyboard focus inside the region, while a card is held, while the tab is
 * hidden, while the pile is off screen and while the Ask panel is open
 * (`data-ask-open` on `<html>`, `ask:toggle` on `document`). Under
 * `prefers-reduced-motion` it never advances on its own, the play control
 * and bar are not shown, and a move is a 150ms cross-fade with no flight and
 * no drag-follow.
 *
 * All `<figure>`s are in the DOM and in the accessibility tree, in content
 * order, so a screen reader or crawler reads every quote verbatim. A manual
 * advance announces the new top card in a polite status line. Without
 * JavaScript (`@media (scripting: none)`) the pile is a plain stack.
 */
export function TestimonialPile({
  cards,
  label,
  counterFormat,
  nextLabelFormat,
  pauseLabel,
  playLabel,
}: TestimonialPileProps) {
  const n = cards.length
  const [top, setTop] = useState(0)
  const [paused, setPaused] = useState(false)
  const [tick, setTick] = useState(0)
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const [held, setHeld] = useState(false)
  const [onScreen, setOnScreen] = useState(false)
  const [announce, setAnnounce] = useState("")

  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    readReducedMotion,
    () => false
  )
  const tabHidden = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "hidden",
    () => false
  )
  const askOpen = useSyncExternalStore(
    subscribeAsk,
    () => document.documentElement.hasAttribute("data-ask-open"),
    () => false
  )

  const regionRef = useRef<HTMLDivElement>(null)
  const pileRef = useRef<HTMLDivElement>(null)
  const cardEls = useRef<(HTMLElement | null)[]>([])
  /** The top card as the gesture code sees it: ahead of React's commit. */
  const topRef = useRef(0)
  const gesture = useRef<Gesture | null>(null)
  const frame = useRef(0)
  const flights = useRef(new Set<Flight>())
  const flightSeq = useRef(0)

  useEffect(() => {
    const el = regionRef.current
    if (!el || typeof IntersectionObserver === "undefined") {
      setOnScreen(true)
      return
    }
    const io = new IntersectionObserver(([entry]) =>
      setOnScreen(Boolean(entry?.isIntersecting))
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // While a card is in the hand the page does not move under it. The pile
  // is `touch-action: pan-y`, so a sideways drag never pans; a vertical one
  // after a hold (`HOLD_MS`) is cancelled here, before the browser starts to
  // scroll. Non-passive on purpose, and only cancelling what can be.
  useEffect(() => {
    const pile = pileRef.current
    if (!pile) return
    const onTouchMove = (e: TouchEvent) => {
      const g = gesture.current
      if (!g || !e.cancelable) return
      if (g.mode === "drag" || g.mode === "swipe") e.preventDefault()
    }
    pile.addEventListener("touchmove", onTouchMove, { passive: false })
    return () => pile.removeEventListener("touchmove", onTouchMove)
  }, [])

  // Leave nothing in the air when the page goes.
  useEffect(() => {
    const live = flights.current
    return () => {
      cancelAnimationFrame(frame.current)
      for (const f of live) f.anim?.cancel()
      live.clear()
    }
  }, [])

  const playing = !paused && !reduced
  // The toggle's glyph follows the hold (hover, keyboard focus, a drag), a
  // hold under 120ms excepted. The progress bar already stops on `running`.
  const holdNow = useDelayedOn(playing && (hover || focus || held))
  const toggleState = !playing ? "paused" : holdNow ? "held" : "running"
  const running =
    playing && !hover && !focus && !held && !tabHidden && onScreen && !askOpen

  /* Flights ---------------------------------------------------------------- */

  /** Ends a flight now: the card takes its resting place at the back. */
  const land = (f: Flight) => {
    f.anim?.cancel()
    f.anim = null
    delete f.el.dataset.fly
    f.el.style.zIndex = ""
    flights.current.delete(f)
  }

  const startFlight = (el: HTMLElement): Flight => {
    for (const f of flights.current) if (f.el === el) land(f)
    if (flights.current.size >= MAX_FLIGHTS) {
      const oldest = flights.current.values().next().value
      if (oldest) land(oldest)
    }
    const f: Flight = { el, anim: null }
    flights.current.add(f)
    // Over the pile, newest on top, until it is clear of it.
    el.dataset.fly = "over"
    el.style.zIndex = String(20 + (flightSeq.current++ % 50))
    return f
  }

  /**
   * The send-to-back flight of card `i`: out along `dir` until no part of it
   * overlaps the pile, under the pile (its stacking changes only there), then
   * back into the last slot with its waiting tilt.
   */
  const fly = (
    i: number,
    kind: Kind,
    release?: { pose: Pose; dir: [number, number]; speed: number }
  ) => {
    const el = cardEls.current[i]
    if (!el) return
    const ms = kind === "auto" ? AUTO_MS : USER_MS

    // Every read before any write.
    const w = el.offsetWidth
    const h = el.offsetHeight
    const fromCss = release
      ? poseCss(release.pose)
      : getComputedStyle(el).transform
    const start = release?.pose ?? { x: 0, y: 0, r: 0, s: 1 }
    // The last visible slot (the hidden ones share it).
    const backEl = cardEls.current[(i + Math.min(SHOWN, n) - 1) % n]
    const slot = backEl ? readSlot(backEl) : { x: 0, y: 0, s: 1 }
    const back: Pose = { ...slot, r: cards[i]!.rot * TILT }

    const dir = release?.dir ?? TAP_DIR
    const lean = start.r + (dir[0] >= 0 ? 6 : -6)
    const r = Math.max(-16, Math.min(16, lean))
    const k = clearance(w, h, r, start, dir)
    const out: Pose = {
      x: start.x + dir[0] * k,
      y: start.y + dir[1] * k,
      r,
      s: PRESS_SCALE,
    }
    // Keep the thrown card's momentum: the curve starts at the speed it was
    // released at (its first control point's slope), then slows to the turn.
    const slope = release ? (release.speed * ms.out) / k : 0
    const outEase = release
      ? `cubic-bezier(0.25, ${Math.min(1, 0.25 * slope).toFixed(3)}, 0.3, 1)`
      : kind === "auto"
        ? "cubic-bezier(0.55, 0, 0.35, 1)"
        : "cubic-bezier(0.5, 0, 0.3, 1)"

    const f = startFlight(el)
    el.style.transform = ""
    const a = el.animate(
      [{ transform: fromCss }, { transform: poseCss(out) }],
      { duration: ms.out, easing: outEase, fill: "forwards" }
    )
    f.anim = a
    a.onfinish = () => {
      if (f.anim !== a) return
      // Clear of the pile: drop behind it, then slide back in.
      el.dataset.fly = "under"
      el.style.zIndex = ""
      const b = el.animate(
        [{ transform: poseCss(out) }, { transform: poseCss(back) }],
        { duration: ms.back, easing: BACK_EASE, fill: "forwards" }
      )
      a.cancel()
      f.anim = b
      b.onfinish = () => {
        if (f.anim === b) land(f)
      }
    }
  }

  /** Reduced motion: the top card fades out where it is. */
  const fade = (i: number) => {
    const el = cardEls.current[i]
    if (!el) return
    const from = getComputedStyle(el).transform
    const f = startFlight(el)
    const a = el.animate(
      [
        { transform: from, opacity: 1 },
        { transform: from, opacity: 0 },
      ],
      { duration: FADE_MS, easing: "ease", fill: "forwards" }
    )
    f.anim = a
    a.onfinish = () => {
      if (f.anim === a) land(f)
    }
  }

  /**
   * The one move: the top card goes to the back. A tap, a throw, the counter
   * (`key`) or the timer (`auto`). React commits once, here.
   */
  const sendToBack = (
    kind: Kind,
    release?: { pose: Pose; dir: [number, number]; speed: number }
  ) => {
    const i = topRef.current
    const next = (i + 1) % n
    const manual = kind !== "auto"
    const pile = pileRef.current
    if (pile) pile.dataset.move = manual ? "user" : "auto"

    if (reduced) fade(i)
    else fly(i, kind, release)

    topRef.current = next
    setTop(next)
    setTick((t) => t + 1)
    if (manual) {
      setPaused(true)
      const shown = cards[next]
      if (shown) setAnnounce(`${shown.author}: “${shown.quote}”`)
      haptic("tap")
    }
  }

  /* The hand --------------------------------------------------------------- */

  const draw = () => {
    frame.current = 0
    const g = gesture.current
    if (!g || g.mode !== "drag") return
    const dx = g.x - g.x0
    const dy = g.y - g.y0
    // Lean with the horizontal offset, about the grab point: held above the
    // centre the bottom trails, held below it the top does.
    const sign = g.py <= 0 ? 1 : -1
    const r = clamp((dx / PX_PER_DEG) * sign, MAX_DRAG_TILT)
    const rad = (r * Math.PI) / 180
    const c = Math.cos(rad)
    const s = Math.sin(rad)
    // Rotating about P is rotating about the centre, then moving by P - R·P.
    const pose: Pose = {
      x: dx + g.px - (c * g.px - s * g.py),
      y: dy + g.py - (s * g.px + c * g.py),
      r,
      s: PRESS_SCALE,
    }
    g.pose = pose
    g.top.style.transform = poseCss(pose)
    if (g.next) {
      const p = Math.min(1, Math.hypot(dx, dy) / THROW)
      g.next.style.transform = poseCss({
        x: lerp(g.from.x, 0, p),
        y: lerp(g.from.y, 0, p),
        r: lerp(g.from.r, g.rest, p),
        s: lerp(g.from.s, 1, p),
      })
    }
  }

  const beginDrag = (g: Gesture, pointerId: number) => {
    g.mode = "drag"
    const pile = pileRef.current
    try {
      pile?.setPointerCapture(pointerId)
    } catch {
      // The pointer is already gone; the next event ends the gesture.
    }
    if (pile) pile.dataset.dragging = ""
    window.getSelection()?.removeAllRanges()

    const box = g.top.getBoundingClientRect()
    g.px = g.x0 - (box.left + box.width / 2)
    g.py = g.y0 - (box.top + box.height / 2)
    const j = (topRef.current + 1) % n
    const next = n > 1 ? cardEls.current[j] : null
    g.next = next ?? null
    if (next) {
      g.from = { ...readSlot(next), r: cards[j]!.rot * TILT }
      g.rest = cards[j]!.rest * TILT
      next.dataset.drag = ""
    }
    g.top.dataset.drag = ""
  }

  /** Lets go of both cards: CSS carries them to their slots. */
  const releaseCards = (g: Gesture) => {
    delete g.top.dataset.press
    delete g.top.dataset.drag
    g.top.style.transform = ""
    if (g.next) {
      delete g.next.dataset.drag
      g.next.style.transform = ""
    }
  }

  const endGesture = () => {
    cancelAnimationFrame(frame.current)
    frame.current = 0
    gesture.current = null
    const pile = pileRef.current
    if (pile) {
      delete pile.dataset.held
      delete pile.dataset.dragging
    }
    setHeld(false)
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary || gesture.current) return
    if (e.pointerType === "mouse" && e.button !== 0) return
    const topEl = cardEls.current[topRef.current]
    if (!topEl) return
    for (const f of flights.current) if (f.el === topEl) land(f)
    const pose = { x: 0, y: 0, r: 0, s: PRESS_SCALE }
    gesture.current = {
      id: e.pointerId,
      touch: e.pointerType === "touch",
      t0: e.timeStamp,
      x0: e.clientX,
      y0: e.clientY,
      x: e.clientX,
      y: e.clientY,
      mode: "press",
      top: topEl,
      next: null,
      px: 0,
      py: 0,
      from: pose,
      rest: 0,
      pose,
      samples: [{ t: e.timeStamp, x: e.clientX, y: e.clientY }],
    }
    if (!reduced) {
      if (pileRef.current) pileRef.current.dataset.move = "user"
      topEl.dataset.press = ""
    }
    if (pileRef.current) pileRef.current.dataset.held = ""
    setHeld(true)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g || e.pointerId !== g.id) return
    g.x = e.clientX
    g.y = e.clientY
    g.samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY })
    if (g.samples.length > 8) g.samples.shift()

    if (g.mode === "press") {
      const dx = g.x - g.x0
      const dy = g.y - g.y0
      if (Math.hypot(dx, dy) < SLOP) return
      const held = e.timeStamp - g.t0 >= HOLD_MS
      if (g.touch && Math.abs(dy) > Math.abs(dx) && !held) {
        // A quick vertical swipe on a phone is the page scrolling (`pan-y`).
        g.mode = "scroll"
        delete g.top.dataset.press
        return
      }
      if (reduced) {
        g.mode = "swipe"
        return
      }
      beginDrag(g, e.pointerId)
    }
    if (g.mode === "drag") {
      if (window.getSelection()?.isCollapsed === false)
        window.getSelection()?.removeAllRanges()
      frame.current ||= requestAnimationFrame(draw)
    }
  }

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g || e.pointerId !== g.id) return
    g.x = e.clientX
    g.y = e.clientY
    const dx = g.x - g.x0
    const dy = g.y - g.y0
    const dist = Math.hypot(dx, dy)
    const pile = pileRef.current

    if (g.mode === "press") {
      endGesture()
      releaseCards(g)
      // A press that ends with text selected in a card was a selection.
      const selecting = pile ? selectionWithin(pile) : false
      if (dist < SLOP && !selecting) sendToBack("tap")
      return
    }
    if (g.mode === "swipe") {
      endGesture()
      if (dist >= THROW) sendToBack("throw")
      return
    }
    if (g.mode === "scroll") {
      endGesture()
      releaseCards(g)
      return
    }

    // A drag: draw the last position, then throw or spring back.
    draw()
    const v = velocity(g.samples, e.timeStamp)
    const outward = v.x * dx + v.y * dy > 0
    const thrown =
      dist >= THROW || (v.speed >= FLICK_SPEED && dist >= FLICK_MIN && outward)
    endGesture()
    if (thrown) {
      const dir = v.speed >= 0.3 && outward ? unit(v.x, v.y) : unit(dx, dy)
      // The flight reads its geometry before the cards are let go.
      sendToBack("throw", { pose: g.pose, dir, speed: v.speed })
      delete g.top.dataset.press
      delete g.top.dataset.drag
      if (g.next) {
        delete g.next.dataset.drag
        g.next.style.transform = ""
      }
    } else {
      releaseCards(g)
    }
  }

  const onPointerCancel = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g || e.pointerId !== g.id) return
    endGesture()
    releaseCards(g)
  }

  /* Focus, hover ----------------------------------------------------------- */

  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    // The play/pause toggle never holds the pile: otherwise a keyboard user
    // who presses Play while focused on it sees nothing happen.
    if ((e.target as Element).closest(".ment-toggle")) {
      setFocus(false)
      return
    }
    // Only keyboard focus holds the pile; a click on a control should not.
    let keyboard = true
    try {
      keyboard = e.target.matches(":focus-visible")
    } catch {
      // Older engines without :focus-visible: treat it as keyboard focus.
    }
    if (keyboard) setFocus(true)
  }
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    const to = e.relatedTarget
    if (!(to instanceof Node && e.currentTarget.contains(to))) setFocus(false)
  }
  const onPointerEnter = (e: PointerEvent) => {
    if (e.pointerType === "mouse") setHover(true)
  }
  const onPointerLeave = (e: PointerEvent) => {
    if (e.pointerType === "mouse") setHover(false)
  }

  const toggle = () => {
    setPaused((p) => !p)
    setTick((t) => t + 1)
  }

  const fill = (format: string, values: Record<string, number>) =>
    format.replace(/\{(\w+)\}/g, (m, k: string) =>
      k in values ? String(values[k]) : m
    )
  const counter = fill(counterFormat, { n: top + 1, total: n })
  const nextLabel = fill(nextLabelFormat, {
    n: top + 1,
    total: n,
    next: ((top + 1) % n) + 1,
  })

  return (
    <div
      ref={regionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className="ment-region"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {/* Press, drag or tap anywhere on the pile: it acts on the top card.
          The counter button is the same move for the keyboard. */}
      <div
        ref={pileRef}
        className="ment-pile"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={(e) => {
          // Taking capture from a card fires this on the card; only the
          // pile's own loss (without a pointerup) ends the gesture.
          if (e.target === e.currentTarget) onPointerCancel(e)
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        {cards.map((card, i) => {
          const pos = (i - top + n) % n
          const shown = pos < SHOWN
          const style = {
            "--r": `${(pos === 0 ? card.rest : card.rot) * TILT}deg`,
            background: card.tone,
          } as CSSProperties
          return (
            <figure
              key={card.id}
              ref={(el) => {
                cardEls.current[i] = el
              }}
              className="ment-card"
              data-pos={shown ? pos : "out"}
              data-len={sizeOf(card.quote)}
              style={style}
            >
              <blockquote className="ment-quote">
                <p>&ldquo;{card.quote}&rdquo;</p>
              </blockquote>
              <figcaption className="ment-cap">
                {card.avatar ? (
                  <Image
                    src={card.avatar}
                    alt=""
                    width={44}
                    height={44}
                    sizes="44px"
                    draggable={false}
                    placeholder={card.blurDataURL ? "blur" : "empty"}
                    blurDataURL={card.blurDataURL}
                    className="ment-face"
                  />
                ) : (
                  <span aria-hidden="true" className="ment-face ment-initials">
                    {card.initials}
                  </span>
                )}
                <span className="ment-who">
                  <span>{card.author}</span>
                  {card.meta ? (
                    <span className="ment-meta">{card.meta}</span>
                  ) : null}
                </span>
              </figcaption>
            </figure>
          )
        })}
      </div>

      <div
        className="ment-bar"
        aria-hidden="true"
        data-on={playing ? "" : undefined}
      >
        {playing ? (
          <div
            key={tick}
            className="ment-bar-fill"
            style={
              {
                "--ment-seconds": `${SECONDS}s`,
                animationPlayState: running ? "running" : "paused",
              } as CSSProperties
            }
            onAnimationEnd={() => {
              if (!gesture.current) sendToBack("auto")
            }}
          />
        ) : null}
      </div>

      <div className="ment-ctls">
        {reduced ? null : (
          <Button
            size="icon"
            className="ment-ctl ment-toggle"
            aria-label={playing ? pauseLabel : playLabel}
            data-state={toggleState}
            onClick={toggle}
          >
            {/* Pause while it runs, play otherwise; one glyph cross-fades. */}
            <Icon name="play-pause" size={16} on={toggleState === "running"} />
          </Button>
        )}
        <Button
          size="compact"
          className="ment-ctl ment-count"
          aria-label={nextLabel}
          onClick={() => sendToBack("key")}
        >
          {counter}
        </Button>
      </div>

      <p role="status" className="sr-only">
        {announce}
      </p>
    </div>
  )
}

/** The board's three quote sizes, by length. */
function sizeOf(quote: string) {
  return quote.length <= 140 ? "s" : quote.length <= 190 ? "m" : "l"
}

function poseCss(p: Pose) {
  const f = (v: number) => +v.toFixed(3)
  return `translate(${f(p.x)}px, ${f(p.y)}px) rotate(${f(p.r)}deg) scale(${f(p.s)})`
}

/** A waiting slot's offset and scale, as the stylesheet sets them. */
function readSlot(el: HTMLElement) {
  const cs = getComputedStyle(el)
  const num = (name: string, fallback: number) => {
    const v = parseFloat(cs.getPropertyValue(name))
    return Number.isFinite(v) ? v : fallback
  }
  return { x: num("--x", 0), y: num("--y", 0), s: num("--s", 1) }
}

/**
 * How far along `dir` a card at `start` has to travel, leaning `r` degrees,
 * before no part of it overlaps the pile (the top card's box grown by the
 * waiting cards' offsets and lean).
 */
function clearance(
  w: number,
  h: number,
  r: number,
  start: Pose,
  dir: [number, number]
) {
  const rad = (Math.abs(r) * Math.PI) / 180
  const lean = (PILE_TILT * Math.PI) / 180
  const halfW = ((w * Math.cos(rad) + h * Math.sin(rad)) / 2) * PRESS_SCALE
  const halfH = ((w * Math.sin(rad) + h * Math.cos(rad)) / 2) * PRESS_SCALE
  const pileW = w / 2 + 14 + (h / 2) * Math.sin(lean) + 8
  const pileH = h / 2 + 30 + (w / 2) * Math.sin(lean) + 8
  const along = (limit: number, at: number, d: number) =>
    Math.abs(d) < 1e-3 ? Infinity : (Math.sign(d) * limit - at) / d
  const k = Math.min(
    along(halfW + pileW, start.x, dir[0]),
    along(halfH + pileH, start.y, dir[1])
  )
  return Math.max(40, k)
}

/** Release speed from the last 80ms of samples; zero if the hand had stopped. */
function velocity(samples: Gesture["samples"], now: number) {
  const last = samples[samples.length - 1]
  if (!last || now - last.t > 60) return { x: 0, y: 0, speed: 0 }
  const first = samples.find((s) => last.t - s.t <= 80) ?? last
  const dt = last.t - first.t
  if (dt <= 0) return { x: 0, y: 0, speed: 0 }
  const x = (last.x - first.x) / dt
  const y = (last.y - first.y) / dt
  return { x, y, speed: Math.hypot(x, y) }
}

function selectionWithin(root: Element) {
  const sel = window.getSelection()
  return Boolean(
    sel && !sel.isCollapsed && sel.anchorNode && root.contains(sel.anchorNode)
  )
}

function unit(x: number, y: number): [number, number] {
  const l = Math.hypot(x, y)
  return l > 0 ? [x / l, y / l] : TAP_DIR
}

function lerp(a: number, b: number, p: number) {
  return a + (b - a) * p
}

function clamp(v: number, max: number) {
  return Math.max(-max, Math.min(max, v))
}

const REDUCED = "(prefers-reduced-motion: reduce)"

function readReducedMotion() {
  return window.matchMedia(REDUCED).matches
}

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED)
  mq.addEventListener("change", onChange)
  return () => mq.removeEventListener("change", onChange)
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange)
  return () => document.removeEventListener("visibilitychange", onChange)
}

function subscribeAsk(onChange: () => void) {
  document.addEventListener("ask:toggle", onChange)
  return () => document.removeEventListener("ask:toggle", onChange)
}
