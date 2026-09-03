"use client"

import { useEffect } from "react"

/**
 * The design's "project focus" effect — the most-visible work row is active and
 * the others recede (docs/v3-redesign-plan.md §3: no scroll-snap, IO only).
 *
 * Progressive enhancement: this component renders nothing. The resting state in
 * shell.css is fully visible, and the dimming rule is gated on
 * `[data-work-focus="on"]`, which is only set once an observation has actually
 * chosen a row. With JavaScript off every row stays at full opacity.
 */
export function WorkFocus({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId)
    if (!root) return
    const articles = Array.from(
      root.querySelectorAll<HTMLElement>("[data-project]")
    )
    if (articles.length === 0) return

    const ratios = new Map<Element, number>()
    let active: HTMLElement | null = null

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(
            entry.target,
            entry.isIntersecting ? entry.intersectionRatio : 0
          )
        }
        let best: HTMLElement | null = null
        let bestRatio = 0
        for (const article of articles) {
          const ratio = ratios.get(article) ?? 0
          if (ratio > bestRatio) {
            bestRatio = ratio
            best = article
          }
        }
        if (best === active) return
        active?.removeAttribute("data-active")
        active = best
        if (active) {
          active.setAttribute("data-active", "")
          root.dataset.workFocus = "on"
        } else {
          delete root.dataset.workFocus
        }
      },
      {
        threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
        rootMargin: "-25% 0px -25% 0px",
      }
    )

    articles.forEach((article) => observer.observe(article))

    return () => {
      observer.disconnect()
      active?.removeAttribute("data-active")
      delete root.dataset.workFocus
    }
  }, [rootId])

  return null
}
