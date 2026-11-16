"use client"

import { useEffect, useRef, useState } from "react"

const pad = (n: number) => String(n).padStart(2, "0")

/**
 * The panel's last line, "03 / 11 · Search, before and now": which square is
 * crossing the middle of the window. Server-rendered at the first square,
 * so without JavaScript it is still a true line.
 *
 * It also keeps the pinned panel honest about its own height. The panel is
 * `position: sticky` (`app/styles/story.css`); a panel taller than the window
 * would hide its last lines until the end of the page. The panel's height
 * goes into `--cs-panel-h`, and the stylesheet's `top` turns negative by the
 * difference, so a tall panel scrolls with the page until its foot is in
 * view, and only then holds.
 *
 * Not a live region: the squares are read in order with their own captions,
 * so announcing every square as it passes would only repeat them.
 */
export function StoryProgress({ labels }: { labels: string[] }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const line = ref.current
    const panel = line?.closest<HTMLElement>(".cs-panel")
    const page = line?.closest<HTMLElement>("[data-story]")
    if (!panel || !page) return

    const ro = new ResizeObserver(() => {
      panel.style.setProperty("--cs-panel-h", `${panel.offsetHeight}px`)
    })
    ro.observe(panel)

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const i = Number((e.target as HTMLElement).dataset.index)
          if (!Number.isNaN(i)) setCurrent(i)
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    )
    const squares = page.querySelectorAll<HTMLElement>("[data-square]")
    for (const el of squares) io.observe(el)

    // The last square may never reach the middle of the window: once the
    // column has ended above it, the last square is the one on show.
    const onScroll = () => {
      const last = squares[squares.length - 1]
      if (last && last.getBoundingClientRect().bottom < innerHeight / 2)
        setCurrent(squares.length - 1)
    }
    addEventListener("scroll", onScroll, { passive: true })

    return () => {
      ro.disconnect()
      io.disconnect()
      removeEventListener("scroll", onScroll)
    }
  }, [])

  const i = Math.min(current, labels.length - 1)
  const label = labels[i]
  return (
    <p ref={ref} className="cs-progress">
      {pad(i + 1)} / {pad(labels.length)}
      {label ? ` · ${label}` : null}
    </p>
  )
}
