"use client"

import { useEffect, useRef } from "react"

import { handAngles, hhmm, zurich } from "./time"

export interface StationClockProps {
  /**
   * The moment the prerendered markup shows (the build); on mount the hands
   * jump to the time in Switzerland.
   */
  builtAt: number
  /** "Time in Switzerland": the dial's name for screen readers. */
  timeLabel: string
  /** "Built in Switzerland": the muted words after the time. */
  line: string
}

const rot = (deg: number) => `rotate(${Math.round(deg * 100) / 100}deg)`

/** The dial's text alternative: "Time in Switzerland: 14:32". */
const clockLabel = (label: string, time: string) => `${label}: ${time}`

/**
 * The footer's small station clock, with the time beside it and the line
 * "Built in Switzerland" after it
 * (the owner: "swiss-railway-schedule-style… minimalistic, but still
 * associated easily with switzerland"; 15 Nov 2026: "leave only swiss clock
 * as a nice little detail"). Our own simplified dial, not the SBB face: twelve
 * strokes, black hour and minute hands, a red second hand that sweeps and
 * pauses at 12.
 *
 * The server renders the dial at build time, so the markup is static and
 * hydrates without a mismatch; on mount the hands jump to the Swiss time
 * and then tick, written straight to the DOM (no re-render per second). The
 * clock stops while the tab is hidden or the clock is off screen, and under
 * reduced motion it holds still: no second hand, minute updates only.
 *
 * Pausing (WCAG 2.2.2). The second hand sweeps for at least a minute after
 * the clock comes into view (or the tab comes back), until it next reaches
 * 12, then parks there the way a station clock waits for its signal, and
 * only the minute hand moves after that. Scrolling it back into view starts one more minute. The landing's
 * pause control (`html[data-motion="paused"]`) parks it at once.
 */
export function StationClock({ builtAt, timeLabel, line }: StationClockProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const hourRef = useRef<SVGGElement>(null)
  const minRef = useRef<SVGGElement>(null)
  const secRef = useRef<SVGGElement>(null)
  const timeRef = useRef<HTMLSpanElement>(null)

  const initial = handAngles(builtAt)
  const initialTime = hhmm(builtAt)

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    const root = document.documentElement
    let timer: number | null = null
    let onScreen = true
    // The second hand runs until this moment (a minute boundary, so it parks
    // as it reaches 12), then rests.
    let sweepUntil = 0
    const motionPaused = () => root.dataset.motion === "paused"
    const sweeping = (now: number) =>
      !reduce.matches && !motionPaused() && now < sweepUntil
    // The minute hand turns on a running count of minutes, so 59 to 00 never
    // spins it backwards.
    const t0 = Date.now()
    const m0 = Math.floor(t0 / 60000)
    const mA0 = zurich(t0).m * 6

    const paint = (now: number, animate: boolean) => {
      const minute = mA0 + (Math.floor(now / 60000) - m0) * 6
      const a = handAngles(now, minute)
      const still = !animate || reduce.matches
      const set = (el: SVGGElement | null, deg: number, transition: string) => {
        if (!el) return
        el.style.transition = still ? "none" : transition
        el.style.transform = rot(deg)
      }
      set(hourRef.current, a.hour, "none")
      set(
        minRef.current,
        a.minute,
        "transform 120ms cubic-bezier(0.3, 2.2, 0.6, 1)"
      )
      if (sweeping(now))
        set(
          secRef.current,
          a.second,
          a.secondMs ? `transform ${a.secondMs}ms linear` : "none"
        )
      else set(secRef.current, 0, "none")
      const t = hhmm(now)
      if (timeRef.current && timeRef.current.textContent !== t)
        timeRef.current.textContent = t
      svgRef.current?.setAttribute("aria-label", clockLabel(timeLabel, t))
    }

    const stop = () => {
      if (timer != null) window.clearTimeout(timer)
      timer = null
    }

    const schedule = () => {
      stop()
      if (document.hidden || !onScreen) return
      const now = Date.now()
      // One tick a second, aligned to the boundary so the hand never skips
      // or repeats a step; one a minute under reduced motion.
      const ms = sweeping(now) ? 1010 - (now % 1000) : 60010 - (now % 60000)
      timer = window.setTimeout(() => {
        paint(Date.now(), true)
        schedule()
      }, ms)
    }

    const resume = () => {
      paint(Date.now(), false)
      schedule()
    }

    /** One more minute of sweep, ending on a minute boundary. */
    const restart = () => {
      sweepUntil = Math.ceil((Date.now() + 60000) / 60000) * 60000
      resume()
    }

    restart()

    const io = new IntersectionObserver((entries) => {
      const visible = entries.some((e) => e.isIntersecting)
      if (visible === onScreen) return
      onScreen = visible
      if (visible) restart()
      else stop()
    })
    if (rootRef.current) io.observe(rootRef.current)

    // The landing's pause control: park at once, and a fresh minute on Play.
    const mo = new MutationObserver(restart)
    mo.observe(root, { attributes: true, attributeFilter: ["data-motion"] })

    const onVisibility = () => {
      if (document.hidden) stop()
      else restart()
    }
    document.addEventListener("visibilitychange", onVisibility)
    reduce.addEventListener("change", resume)

    return () => {
      stop()
      io.disconnect()
      mo.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      reduce.removeEventListener("change", resume)
    }
  }, [timeLabel])

  return (
    <div ref={rootRef} className="clock-row">
      <svg
        ref={svgRef}
        className="clock"
        role="img"
        aria-label={clockLabel(timeLabel, initialTime)}
        viewBox="0 0 48 48"
      >
        <circle className="clock__face" cx="24" cy="24" r="23" />
        <g className="clock__ticks">
          {Array.from({ length: 12 }, (_, i) => (
            <line
              key={i}
              x1="24"
              y1="4.5"
              x2="24"
              y2={i % 3 === 0 ? 9.5 : 8}
              strokeWidth={i % 3 === 0 ? 3 : 1.6}
              transform={i ? `rotate(${i * 30} 24 24)` : undefined}
            />
          ))}
        </g>
        <g
          ref={hourRef}
          className="clock__hand"
          style={{ transform: rot(initial.hour) }}
        >
          <rect x="22.25" y="12.5" width="3.5" height="14.5" />
        </g>
        <g
          ref={minRef}
          className="clock__hand"
          style={{ transform: rot(initial.minute) }}
        >
          <rect x="22.75" y="6" width="2.5" height="21" />
        </g>
        <g
          ref={secRef}
          className="clock__hand clock__sec"
          style={{ transform: rot(initial.second) }}
        >
          <rect x="23.4" y="11" width="1.2" height="18" />
          <circle cx="24" cy="11" r="3" />
        </g>
      </svg>
      <span className="clock-row__cell">
        {/* The dial's label already says the time to screen readers. */}
        <span ref={timeRef} className="clock-row__now" aria-hidden="true">
          {initialTime}
        </span>
        <span className="clock-row__key">{line}</span>
      </span>
    </div>
  )
}
