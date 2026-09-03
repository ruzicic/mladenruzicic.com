"use client"

import { useEffect } from "react"

/**
 * The design's right-edge accent bar, implemented as the "visible scrollbar"
 * from docs/v3-redesign-plan.md §5.7.
 *
 * Chrome/Safari drive it with `animation-timeline: scroll(root)` — zero JS on
 * the scroll path. Firefox release (and anything else without scroll-driven
 * animations) gets a rAF-throttled fallback that writes `--mr-scroll`.
 * Both are switched off under reduced motion; the CSS lives in shell.css.
 */
export function ScrollHairline() {
  useEffect(() => {
    const supportsScrollTimeline =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("animation-timeline: scroll()")
    if (supportsScrollTimeline) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const root = document.documentElement
    let frame = 0

    const update = () => {
      frame = 0
      const max = root.scrollHeight - root.clientHeight
      const progress =
        max > 0 ? Math.min(1, Math.max(0, root.scrollTop / max)) : 0
      root.style.setProperty("--mr-scroll", progress.toFixed(4))
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      root.style.removeProperty("--mr-scroll")
    }
  }, [])

  return (
    <div
      data-scroll-hairline
      aria-hidden
      className="pointer-events-none fixed inset-y-0 right-0 z-40 w-[3px]"
    >
      <span className="block h-full w-full bg-accent" />
    </div>
  )
}
