"use client"

import type { ReactNode } from "react"

import { useHydrated } from "@/app/components/landing/use-client-only"
import { Button } from "@/app/components/primitives/Button"
import { Icon } from "@/app/components/primitives/Icon"
import { railCounter } from "@/app/components/primitives/rail-counter"
import { useRail } from "@/app/components/primitives/use-rail"

export interface EarlyCarouselProps {
  label: string
  counterFormat: string
  prevLabel: string
  nextLabel: string
  total: number
  /** The server-rendered slides. */
  children: ReactNode
}

/**
 * The early projects' carousel inside the story on `/about` (owner, 15 Nov
 * 2026, layout B): one slide at a time, the counter and the arrows at the
 * bottom right of the words on desktop, above the slide on a phone. The
 * behaviour is the shared rail (`useRail`): the arrows, arrow keys when it
 * has focus, a mouse drag, native swipe with snap, instant steps under
 * reduced motion. No autoplay, no dots. It loops (owner, 16 Nov 2026: "go
 * to 1 when at the end and the other way around; not automatically ...
 * just on scroll"): the rail's `loop`, so the arrows are never disabled
 * and the counter goes from "4 / 4" to "1 / 4".
 */
export function EarlyCarousel({
  label,
  counterFormat,
  prevLabel,
  nextLabel,
  total,
  children,
}: EarlyCarouselProps) {
  const { idx, move, bind } = useRail(total, { loop: true })
  const ready = useHydrated()

  return (
    <div className="ab-car">
      <div
        {...bind}
        className="ab-car__rail"
        data-ready={ready ? "" : undefined}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
      >
        {children}
      </div>
      <div className="ab-car__ctl">
        <span className="ab-car__count">
          {railCounter(counterFormat, idx, total)}
        </span>
        <div className="ab-car__arrows">
          <Button size="icon" aria-label={prevLabel} onClick={() => move(-1)}>
            <Icon name="arrow-left" size={16} />
          </Button>
          <Button size="icon" aria-label={nextLabel} onClick={() => move(1)}>
            <Icon name="arrow-right" size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
