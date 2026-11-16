"use client"

import { useEffect, useRef, type ReactNode } from "react"

import {
  CARD_H,
  CARD_W,
  type PreviewItem,
  type PreviewMark,
  type PreviewShot,
} from "./preview-types"

export interface LedgerPreviewProps {
  items: PreviewItem[]
  /** "SCROLLING", the tag while a capture glides. */
  scrollingTag: string
  /** The server-rendered groups and rows (`[data-pv-row]`). */
  children: ReactNode
}

/* Board props (`Landing.dc.html` defaults). */
const TRAIL_MS = 120
const TILT = 3
const REST_TILT = -2
const GLIDE_DELAY_MS = 600
/** The capture moves like a page being scrolled: about 90px a second. */
const GLIDE_SPEED = 90
const GLIDE_HOLD_MS = 800
/** Stills drift their few extra pixels in 6s legs (the board's 13.6s cycle). */
const DRIFT_LEG_MS = 6000
const GLIDE_EASE =
  "linear(0, 0.0027 2%, 0.0109 4%, 0.0245 6%, 0.0435 8%, 0.9565 92%, 0.9755 94%, 0.9891 96%, 0.9973 98%, 1)"
const GLIDE_EASE_FALLBACK = "cubic-bezier(0.3, 0.08, 0.7, 0.92)"
const DOCK_EASE = "cubic-bezier(0.22, 1, 0.36, 1)"

type NetworkInformation = { saveData?: boolean }

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function savesData() {
  const c = (navigator as Navigator & { connection?: NetworkInformation })
    .connection
  if (c?.saveData) return true
  try {
    return window.matchMedia("(prefers-reduced-data: reduce)").matches
  } catch {
    return false
  }
}

function loadImage(
  img: HTMLImageElement | null,
  shot: PreviewShot | undefined
) {
  if (!img || !shot) return Promise.resolve(false)
  if (!img.getAttribute("src")) {
    img.onload = () => img.setAttribute("data-loaded", "")
    if (shot.srcSet) img.srcset = shot.srcSet
    img.src = shot.src
  }
  return img.decode().then(
    () => true,
    () => false
  )
}

/** Down at ~90px/s, hold, back three times faster, hold, repeat. */
function glideKeyframes(end: number, ease: string) {
  const down = (end / GLIDE_SPEED) * 1000
  const up = down / 3
  const total = down + GLIDE_HOLD_MS + up + GLIDE_HOLD_MS
  return {
    duration: total,
    keyframes: [
      { translate: "0 0", offset: 0, easing: ease },
      { translate: `0 ${-end}px`, offset: down / total },
      {
        translate: `0 ${-end}px`,
        offset: (down + GLIDE_HOLD_MS) / total,
        easing: ease,
      },
      { translate: "0 0", offset: (down + GLIDE_HOLD_MS + up) / total },
      { translate: "0 0", offset: 1 },
    ],
  }
}

function driftKeyframes(end: number) {
  const total = 2 * (DRIFT_LEG_MS + GLIDE_HOLD_MS)
  const e = "ease-in-out"
  return {
    duration: total,
    keyframes: [
      { translate: "0 0", offset: 0, easing: e },
      { translate: `0 ${-end}px`, offset: DRIFT_LEG_MS / total },
      {
        translate: `0 ${-end}px`,
        offset: (DRIFT_LEG_MS + GLIDE_HOLD_MS) / total,
        easing: e,
      },
      { translate: "0 0", offset: (2 * DRIFT_LEG_MS + GLIDE_HOLD_MS) / total },
      { translate: "0 0", offset: 1 },
    ],
  }
}

function Mark({ mark }: { mark: PreviewMark }) {
  if (mark.kind === "art") {
    return (
      // The tile's own full-colour artwork, as a file: the preview is hidden
      // until hover, so its markup has no reason to ride in the props.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="ledger-pv-svg rounded-[30%]"
        src={mark.src}
        alt=""
        width={84}
        height={84}
        loading="lazy"
      />
    )
  }
  if (mark.kind === "svg") {
    return (
      // A tiny static SVG, already cached by the row's tile.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="ledger-pv-svg"
        src={mark.src}
        alt=""
        width={84}
        height={84}
        // Lazy: the preview is hidden until hover, and an eager <img> in the
        // shell makes React emit a <link rel=preload> for it in the head.
        loading="lazy"
      />
    )
  }
  return (
    <span
      className={
        mark.kind === "glyph" ? "ledger-pv-glyph" : "ledger-pv-letters"
      }
    >
      {mark.text}
    </span>
  )
}

/**
 * The cursor-carried preview over the list (`Landing.dc.html`, "Ledger
 * previews"). One card for the whole list, positioned with `translate` and
 * driven by `requestAnimationFrame`; nothing here sets React state on a
 * pointer move.
 *
 * - Pointer (only `(hover: hover) and (pointer: fine)`): the card sits 24px
 *   right of and 16px below the pointer, trails it by 120ms, rests at -2deg
 *   and leans up to 3deg the way the pointer moves. It flips to the
 *   pointer's left near the page edge and never leaves the list vertically.
 *   Over a group heading it steps away.
 * - Keyboard focus on a row docks it beside that row, upright and still.
 * - The row's still loads on hover intent; after 600ms on one row the
 *   full-length capture loads and glides (studenti.rs stops at 88%). Stills
 *   without a capture drift their few spare pixels.
 * - Reduced motion: no trailing, no tilt, no glide (the still stays).
 *   Saved data: no pictures at all, the product's mark instead.
 *
 * Phones get none of it (the owner: "no thumbnails on mobile"); the CSS
 * keeps the card `display: none` there and the handlers bail out.
 */
export function LedgerPreview({
  items,
  scrollingTag,
  children,
}: LedgerPreviewProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const moveRef = useRef<HTMLDivElement>(null)
  const tiltRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const list = listRef.current
    const moveEl = moveRef.current
    const tiltEl = tiltRef.current
    if (!list || !moveEl || !tiltEl) return
    const card: HTMLDivElement = moveEl
    const tilt: HTMLDivElement = tiltEl
    const layers = Array.from(
      card.querySelectorAll<HTMLElement>("[data-pv-layer]")
    )

    // Matches the CSS that shows the card (work.css, `.ledger-pv`).
    const fine = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (min-width: 721px)"
    )
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    const ease =
      typeof CSS !== "undefined" &&
      CSS.supports("transition-timing-function", "linear(0, 1)")
        ? GLIDE_EASE
        : GLIDE_EASE_FALLBACK

    let mode: "rest" | "follow" | "dock" = "rest"
    let shown = false
    let hidAt = 0
    let lastX = 0
    let current = -1 // the layer on screen
    let active = -1 // the row whose glide clock is running
    let focusRow: HTMLElement | null = null
    let raf = 0
    let pending: { x: number; y: number; target: Element | null } | null = null
    let leanTimer = 0
    let glideTimer = 0
    let glide: Animation | null = null
    let run = 0 // bumped on every stop, so a late image decode is ignored

    function setShown(on: boolean) {
      if (on === shown) return
      shown = on
      card.toggleAttribute("data-shown", on)
      if (!on) hidAt = performance.now()
    }

    function stopGlide() {
      window.clearTimeout(glideTimer)
      glide?.cancel()
      glide = null
      for (const l of layers) l.removeAttribute("data-glide")
      active = -1
      run++
    }

    function activate(i: number) {
      if (active === i) return
      stopGlide()
      active = i
      if (current !== i) {
        layers[current]?.removeAttribute("data-on")
        layers[i]?.setAttribute("data-on", "")
        current = i
      }
      const item = items[i]
      const layer = layers[i]
      if (!item || !layer) return
      const lite = savesData()
      card.toggleAttribute("data-lite", lite)
      if (lite) return
      const still = layer.querySelector<HTMLImageElement>("[data-pv-still]")
      void loadImage(still, item.still)
      // The glide is continuous motion: not under the reduced-motion
      // preference or the page's pause (`html[data-motion="paused"]`).
      if (
        reduce.matches ||
        document.documentElement.dataset.motion === "paused"
      )
        return

      const mine = run
      glideTimer = window.setTimeout(() => {
        if (run !== mine) return
        if (item.capture) {
          const img = layer.querySelector<HTMLImageElement>("[data-pv-capture]")
          void loadImage(img, item.capture).then((ok) => {
            if (!ok || run !== mine || !img || !item.capture) return
            layer.setAttribute("data-glide", "")
            const g = glideKeyframes(item.capture.end, ease)
            glide = img.animate(g.keyframes, {
              duration: g.duration,
              iterations: Infinity,
              fill: "both",
            })
          })
        } else if (still && item.still && item.still.end > 0) {
          const d = driftKeyframes(item.still.end)
          glide = still.animate(d.keyframes, {
            duration: d.duration,
            iterations: Infinity,
            fill: "both",
          })
        }
      }, GLIDE_DELAY_MS)
    }

    function hide() {
      mode = "rest"
      setShown(false)
      // The same row, met again, restarts from the top after the delay.
      stopGlide()
    }

    function bounds() {
      const r = list!.getBoundingClientRect()
      const vw = document.documentElement.clientWidth
      return {
        r,
        w: list!.offsetWidth,
        h: Math.max(CARD_H, list!.offsetHeight),
        minX: 24 - r.left,
        maxX: vw - 24 - r.left,
      }
    }

    function place(
      x: number,
      y: number,
      rot: number,
      origin: string,
      transition: string
    ) {
      card.style.transition = transition
      card.style.translate = `${Math.round(x * 10) / 10}px ${Math.round(y * 10) / 10}px`
      card.style.setProperty("--pv-origin", origin)
      tilt.style.rotate = `${Math.round(rot * 100) / 100}deg`
    }

    function rowIndex(row: Element) {
      const n = Number((row as HTMLElement).dataset.pvRow)
      return Number.isInteger(n) ? n : -1
    }

    function frame() {
      raf = 0
      const n = pending
      pending = null
      if (!n) return
      const row = n.target?.closest?.("[data-pv-row]")
      if (!row || !list!.contains(row)) {
        // Over a group heading, a gap or the footer: the card steps away.
        if (mode === "follow") {
          if (focusRow) dock()
          else hide()
        }
        return
      }
      const idx = rowIndex(row)
      if (idx < 0) return
      const b = bounds()
      const x = n.x - b.r.left
      const y = clamp(n.y - b.r.top, 0, b.h - 1)
      const entering = !shown && performance.now() - hidAt > 160
      const following = mode === "follow" && shown
      const dx = following ? x - lastX : 0
      lastX = x
      const calm = reduce.matches
      const lean = calm ? 0 : clamp(dx * 0.35, -TILT, TILT)
      const flip = x + 24 + CARD_W > b.maxX
      const cx = clamp(flip ? x - 24 - CARD_W : x + 24, b.minX, b.maxX - CARD_W)
      const cy = clamp(y + 16, 0, b.h - CARD_H)
      mode = "follow"
      place(
        cx,
        cy,
        calm ? 0 : REST_TILT + lean,
        flip ? "100% 0" : "0 0",
        entering || calm ? "none" : `translate ${TRAIL_MS}ms ease-out`
      )
      window.clearTimeout(leanTimer)
      if (!calm) {
        leanTimer = window.setTimeout(() => {
          if (mode === "follow") tilt.style.rotate = `${REST_TILT}deg`
        }, 140)
      }
      activate(idx)
      setShown(true)
    }

    function schedule(x: number, y: number, target: Element | null) {
      pending = { x, y, target }
      if (!raf) raf = requestAnimationFrame(frame)
    }

    function dock() {
      const row = focusRow
      if (!row) return hide()
      const idx = rowIndex(row)
      if (idx < 0) return hide()
      const b = bounds()
      const rr = row.getBoundingClientRect()
      const fy = rr.top - b.r.top + rr.height / 2
      mode = "dock"
      place(
        clamp(b.w + 24, b.minX, b.maxX - CARD_W),
        clamp(fy - CARD_H / 2, 0, b.h - CARD_H),
        0,
        "0 50%",
        reduce.matches ? "none" : `translate 220ms ${DOCK_EASE}`
      )
      activate(idx)
      setShown(true)
    }

    function onMove(e: PointerEvent) {
      if (e.pointerType !== "mouse" || !fine.matches) return
      schedule(e.clientX, e.clientY, e.target as Element | null)
    }

    function onLeave() {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      pending = null
      if (mode !== "follow") return
      if (focusRow) dock()
      else hide()
    }

    // The card is inside the list, so a scroll under a still pointer would
    // carry it away; re-read what is under the pointer instead.
    let lastPointer: { x: number; y: number } | null = null
    function trackPointer(e: PointerEvent) {
      lastPointer = { x: e.clientX, y: e.clientY }
    }
    function onScroll() {
      if (mode !== "follow" || !lastPointer) return
      const { x, y } = lastPointer
      const el = document.elementFromPoint(x, y)
      if (!el || !list!.contains(el)) return onLeave()
      schedule(x, y, el)
    }

    function onFocusIn(e: FocusEvent) {
      const t = e.target as HTMLElement | null
      const row = t?.closest<HTMLElement>("[data-pv-row]")
      if (!t || !row || !fine.matches) return
      let keyboard: boolean
      try {
        keyboard = t.matches(":focus-visible")
      } catch {
        keyboard = true
      }
      if (!keyboard) return
      focusRow = row
      if (mode !== "follow") dock()
    }

    function onFocusOut(e: FocusEvent) {
      const to = e.relatedTarget as HTMLElement | null
      if (to && list!.contains(to) && to.closest("[data-pv-row]")) return
      focusRow = null
      if (mode === "dock") hide()
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && shown) hide()
    }

    list.addEventListener("pointermove", onMove, { passive: true })
    list.addEventListener("pointerleave", onLeave)
    list.addEventListener("focusin", onFocusIn)
    list.addEventListener("focusout", onFocusOut)
    list.addEventListener("keydown", onKey)
    window.addEventListener("pointermove", trackPointer, { passive: true })
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      list.removeEventListener("pointermove", onMove)
      list.removeEventListener("pointerleave", onLeave)
      list.removeEventListener("focusin", onFocusIn)
      list.removeEventListener("focusout", onFocusOut)
      list.removeEventListener("keydown", onKey)
      window.removeEventListener("pointermove", trackPointer)
      window.removeEventListener("scroll", onScroll)
      if (raf) cancelAnimationFrame(raf)
      window.clearTimeout(leanTimer)
      stopGlide()
    }
  }, [items])

  return (
    <div ref={listRef} className="ledger-list">
      {children}

      <div ref={moveRef} className="ledger-pv" aria-hidden="true">
        <div className="ledger-pv-anim">
          <div ref={tiltRef} className="ledger-pv-tilt">
            {items.map((item, i) => (
              <div
                key={item.slug}
                className="ledger-pv-layer"
                data-pv-layer={i}
                data-tone={item.tone}
                style={
                  item.tone === "mark"
                    ? { background: item.bg, color: item.fg }
                    : undefined
                }
              >
                <div className="ledger-pv-mark">
                  <Mark mark={item.mark} />
                </div>
                {item.still ? (
                  <div className="ledger-pv-frame">
                    {/* Loaded on hover intent by the effect above, so no src here. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      data-pv-still=""
                      alt=""
                      width={CARD_W}
                      height={Math.round(item.still.height)}
                      decoding="async"
                      style={{ height: item.still.height }}
                    />
                    {item.capture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        data-pv-capture=""
                        alt=""
                        width={CARD_W}
                        height={Math.round(item.capture.height)}
                        decoding="async"
                        style={{ height: item.capture.height }}
                      />
                    ) : null}
                  </div>
                ) : null}
                {item.capture ? (
                  <span className="ledger-pv-tag">
                    <span className="ledger-pv-dot" />
                    {scrollingTag}
                  </span>
                ) : null}
                <div className="ledger-pv-cap">{item.caption}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
