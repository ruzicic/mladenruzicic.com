"use client"

import { useEffect, useRef } from "react"

/**
 * The diagram's one client island: it marks its diagram `data-walk="on"`
 * while any of it is on screen, which is the only state in which
 * app/styles/diagram.css runs the walk. Reduced motion and the page's pause
 * (`html[data-motion="paused"]`) are handled in CSS, so this never reads
 * them. Without JavaScript the attribute is never set and the diagram stays
 * static and complete.
 */
export function Walk() {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>("[data-dg]")
    if (!root || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) root.dataset.walk = "on"
        else delete root.dataset.walk
      },
      { threshold: 0.25 }
    )
    io.observe(root)
    return () => {
      io.disconnect()
      delete root.dataset.walk
    }
  }, [])
  return <span ref={ref} hidden />
}
