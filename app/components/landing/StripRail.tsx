"use client"

import type { ReactNode } from "react"

import { Button } from "@/app/components/primitives/Button"
import { Icon } from "@/app/components/primitives/Icon"
import { railCounter } from "@/app/components/primitives/rail-counter"
import { useRail } from "@/app/components/primitives/use-rail"

import { useHydrated, useMedia } from "./use-client-only"

export interface StripRailProps {
  title: string
  counterFormat: string
  total: number
  prevLabel: string
  nextLabel: string
  regionLabel: string
  regionLabelTouch: string
  /** The server-rendered cards. */
  children: ReactNode
}

/**
 * The strip's head (title, counter, arrows) and its scroller. The behaviour,
 * which card is in focus (counter, arrows, the `data-on` flag the CSS
 * fallback and the drift read), keys, click to focus, the mouse drag and
 * touch, is the shared rail (`useRail` in
 * `app/components/primitives/use-rail.ts`, the owner's "click on unfocused
 * items scrolls to them; drag to move/swipe on mobile", 15 Nov 2026).
 *
 * The focus look is CSS: a scroll-driven `view(inline)` animation where it is
 * supported, the `data-on` flag otherwise (`app/styles/landing.css`).
 */

export function StripRail({
  title,
  counterFormat,
  total,
  prevLabel,
  nextLabel,
  regionLabel,
  regionLabelTouch,
  children,
}: StripRailProps) {
  const { idx, move, bind } = useRail(total)
  const ready = useHydrated()
  const touch = useMedia("(pointer: coarse)")

  return (
    <>
      <div className="lp-work-head">
        <h2 id="recent-work-title" className="lp-work-title">
          {title}
        </h2>
        <div className="lp-work-ctl">
          <span className="lp-count">
            {railCounter(counterFormat, idx, total)}
          </span>
          <div className="lp-arrows">
            <Button
              size="icon"
              className="lp-arr"
              aria-label={prevLabel}
              disabled={idx <= 0}
              onClick={() => move(-1)}
            >
              <Icon name="arrow-left" size={16} />
            </Button>
            <Button
              size="icon"
              className="lp-arr"
              aria-label={nextLabel}
              disabled={idx >= total - 1}
              onClick={() => move(1)}
            >
              <Icon name="arrow-right" size={16} />
            </Button>
          </div>
        </div>
      </div>
      <div
        {...bind}
        className="lp-strip"
        data-strip=""
        data-ready={ready ? "" : undefined}
        role="region"
        aria-label={touch ? regionLabelTouch : regionLabel}
      >
        {children}
      </div>
    </>
  )
}
