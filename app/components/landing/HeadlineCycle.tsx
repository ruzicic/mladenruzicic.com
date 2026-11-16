"use client"

import {
  useEffect,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from "react"
// clsx, not `cn`: this renders inside client islands, and `cn` pulls
// tailwind-merge (about 8 KB gzipped) into their chunks. No caller passes a
// class that conflicts with the ones set here, so there is nothing to merge.
import { clsx as cn } from "clsx"

import type { ProductMark } from "@/lib/content/schema"
import { Button } from "@/app/components/primitives/Button"
import { Icon } from "@/app/components/primitives/Icon"
import { ProductTile } from "@/app/components/primitives/ProductTile"

import {
  configureHeadline,
  holdHeadline,
  setHeadlinePaused,
  tickHeadline,
  useHeadline,
  type HeadlineState,
} from "./headline-store"
import { useHydrated } from "./use-client-only"

export interface CyclePhrase {
  phrase: string
  on: string
  mark: ProductMark
}

/**
 * The board's layer classes (`wVals`): the phrase on show is `lw-first` until
 * the first swap and `lw-in` after it; the one leaving is `lw-out`. Only those
 * two layers are in the DOM, so the page never carries five copies of the
 * phrases (the screen-reader sentence in the `<h1>` already names all five).
 */
function layers(s: HeadlineState) {
  const out: { i: number; cls: string }[] = []
  if (s.prev >= 0 && s.prev !== s.cur) out.push({ i: s.prev, cls: "lw-out" })
  out.push({ i: s.cur, cls: s.switched ? "lw-in" : "lw-first" })
  return out.sort((a, b) => a.i - b.i)
}

const self = (s: HeadlineState) => s

/** The swapping second line: tile plus phrase, changed in place. */
export function HeadlineSlot({
  phrases,
  sizer,
}: {
  phrases: CyclePhrase[]
  /** The longest phrase: reserves the line box at every width. */
  sizer: string
}) {
  const s = useHeadline(self)
  return (
    <span aria-hidden="true" className="lw-slot" data-sizer={sizer}>
      {layers(s).map(({ i, cls }) => (
        <span key={i} className={cn("lw-layer", cls)}>
          <ProductTile mark={phrases[i].mark} size="headline" />
          {phrases[i].phrase}
        </span>
      ))}
    </span>
  )
}

/** The product line under the headline, "on TenderLift". */
export function HeadlineOn({ phrases }: { phrases: CyclePhrase[] }) {
  const s = useHeadline(self)
  return (
    <p aria-hidden="true" className="lw-on">
      {layers(s).map(({ i, cls }) => (
        <span key={i} className={cn("lw-m", cls)}>
          {phrases[i].on}
        </span>
      ))}
    </p>
  )
}

/**
 * Pause / play, and the ticker. One setting drives the button: "paused by
 * the visitor", changed only by pressing it. The glyph, the name and
 * `data-state` show that setting and nothing else: the pause glyph while the
 * cycle is set to run, play only when the visitor has paused it, flipped once
 * and at once by every press. Transient holds (the pointer or focus in the
 * headline or the story, a popover, the Ask panel, a hidden tab) stop the
 * ticker but never change the button, and release on their own; pointing at
 * or focusing the button itself is not a hold (`data-hold-ignore`), so Play
 * under the pointer resumes at once. Resuming starts a full interval from
 * the phrase on show.
 *
 * Under `prefers-reduced-motion: reduce` the loop starts paused, so the
 * first phrase stays and the button truthfully offers "Play"; the reader can
 * still opt in, or step through by pointing at the product names.
 */
export function HeadlinePause({
  count,
  paceMs,
  pauseLabel,
  playLabel,
}: {
  count: number
  paceMs: number
  pauseLabel: string
  playLabel: string
}) {
  const paused = useHeadline((s) => s.paused)
  const ready = useHydrated()

  useEffect(() => {
    configureHeadline(count, paceMs)
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (mq.matches) setHeadlinePaused(true)
    const onChange = () => setHeadlinePaused(mq.matches)
    mq.addEventListener("change", onChange)
    const iv = window.setInterval(() => {
      if (!document.hidden) tickHeadline(100)
    }, 100)
    return () => {
      window.clearInterval(iv)
      mq.removeEventListener("change", onChange)
    }
  }, [count, paceMs])

  // The one stop control for the page's continuous motion (WCAG 2.2.2):
  // `app/styles/landing.css` freezes the strip's drift, and `CardClip`
  // pauses a card's clip, under `html[data-motion="paused"]`.
  useEffect(() => {
    const root = document.documentElement
    if (paused) root.dataset.motion = "paused"
    else delete root.dataset.motion
    return () => {
      delete root.dataset.motion
    }
  }, [paused])

  return (
    <Button
      size="icon"
      className="lw-pause"
      data-hold-ignore=""
      aria-label={paused ? playLabel : pauseLabel}
      data-state={paused ? "paused" : "running"}
      onClick={() => setHeadlinePaused(!paused)}
      // Nothing moves without JavaScript, so the control waits for it; it
      // keeps its box meanwhile so nothing shifts.
      data-ready={ready ? "" : undefined}
    >
      {/* The visitor's setting only: pause glyph while set to run. */}
      <Icon name="play-pause" size={14} on={!paused} />
    </Button>
  )
}

/**
 * Holds the headline loop while the pointer or focus is inside (the board's
 * `wHeadEnter` / `wParaEnter`). Renders a plain element around server
 * children; it never re-renders them.
 */
export function HoldZone({
  hold,
  className,
  children,
}: {
  hold: string
  className?: string
  children: ReactNode
}) {
  const key = (part: string) => `${hold}:${part}`
  useEffect(
    () => () => {
      holdHeadline(`${hold}:pointer`, false)
      holdHeadline(`${hold}:focus`, false)
    },
    [hold]
  )
  return (
    <div
      className={className}
      onPointerEnter={(e: PointerEvent) => {
        // Entering straight onto the reader's own control is not a hold.
        if (e.pointerType === "mouse")
          holdHeadline(
            key("pointer"),
            !(e.target as Element).closest("[data-hold-ignore]")
          )
      }}
      onPointerOver={(e: PointerEvent) => {
        // Pointing at the reader's own control is not a hold either.
        if (e.pointerType === "mouse")
          holdHeadline(
            key("pointer"),
            !(e.target as Element).closest("[data-hold-ignore]")
          )
      }}
      onPointerLeave={() => holdHeadline(key("pointer"), false)}
      onFocus={(e: FocusEvent<HTMLDivElement>) =>
        // The pause button is the reader's own control: focus on it must not
        // hold the loop, or "Play" would do nothing until focus moves on.
        holdHeadline(
          key("focus"),
          !(e.target as Element).closest("[data-hold-ignore]")
        )
      }
      onBlur={(e: FocusEvent<HTMLDivElement>) => {
        const to = e.relatedTarget
        if (to instanceof Node && e.currentTarget.contains(to)) return
        holdHeadline(key("focus"), false)
      }}
    >
      {children}
    </div>
  )
}
