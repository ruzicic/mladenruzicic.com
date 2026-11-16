"use client"

import { useEffect, useState, type MouseEvent, type ReactNode } from "react"

import { Icon } from "@/app/components/primitives/Icon"
import { TransitionLink } from "@/app/components/primitives/TransitionLink"

export interface StoryBackProps {
  /** "All work": the label, and the link's name, on the cover. */
  all: string
  /** The project's name: the label once the cover's name has scrolled away. */
  title: string
  /** The product's tile (`ProductTile`, drawn by `StoryBar`), before the name. */
  tile?: ReactNode
  /** The link's name once it leads to the top ("TenderLift, back to top"). */
  toTop: string
}

/**
 * The left end of a case study's bar (`StoryBar`), and its one piece of
 * client code.
 *
 * On the cover it is "← All work", a link to `/work`. Once the cover's name
 * (`#cs-title`) has gone under the bar (owner, 16 Nov 2026: "it goes from
 * all work to tenderlift, but both times links back to all work? the latter
 * should link to top of the page"), the label is the project's name, the
 * arrow turns up (160ms, none under reduced motion) and the same link leads
 * to `#top`: smoothly to the top of the page, unless motion is reduced, with
 * focus moved to the cover's name so a keyboard is not left behind. A
 * middle click or a modified click on `#top` is the browser's own. Its name
 * follows: "All work", then "TenderLift, back to top" (the visible name
 * first, WCAG 2.5.3). Without JavaScript it stays "← All work" to `/work`.
 *
 * The label is "All work" and the tile with the name (owner, 16 Nov 2026:
 * "morph logo + name in that header") stacked in one place, so the link
 * never changes size; a long name ends in an ellipsis. Where the browser
 * has scroll-driven animations the two morph in step with the scroll over
 * the last 56px of the cover name's way under the bar (`story.css`, the
 * `data-morph` the effect sets, so a page without JavaScript keeps "All
 * work"); elsewhere, and with motion reduced, they swap at the threshold.
 * `data-scrolled` goes on the bar (its paper ground and hairline,
 * `app/styles/story.css`) and on the bar's left end, which the Ask panel
 * copies. One IntersectionObserver, whose top edge is the bar's foot as it
 * sits at the top of the window; it is set up again if the window's size
 * changes the bar's height. The link's target, its name and `data-scrolled`
 * follow that threshold, where the morph ends.
 */
export function StoryBack({ all, title, tile, toTop }: StoryBackProps) {
  const [up, setUp] = useState(false)

  useEffect(() => {
    const bar = document.querySelector<HTMLElement>("[data-cs-bar]")
    const name = document.getElementById("cs-title")
    if (!bar || !name) return
    const id = bar.querySelector<HTMLElement>("[data-top-id]")
    bar.toggleAttribute("data-morph", true)

    const set = (on: boolean) => {
      for (const el of [bar, id])
        if (el) el.toggleAttribute("data-scrolled", on)
      setUp(on)
    }

    let io: IntersectionObserver | null = null
    let height = -1
    const watch = () => {
      // The part of the bar that stays in view: its height less the part
      // that slides above the window as it sticks (`top` is negative).
      const h = Math.round(
        bar.offsetHeight + (parseFloat(getComputedStyle(bar).top) || 0)
      )
      if (h === height) return
      height = h
      io?.disconnect()
      io = new IntersectionObserver(
        ([e]) => set(!e.isIntersecting && e.boundingClientRect.bottom <= h),
        { rootMargin: `${-h}px 0px 0px 0px` }
      )
      io.observe(name)
    }
    watch()
    const ro = new ResizeObserver(watch)
    ro.observe(bar)

    return () => {
      ro.disconnect()
      io?.disconnect()
      bar.toggleAttribute("data-morph", false)
      for (const el of [bar, id])
        if (el) el.toggleAttribute("data-scrolled", false)
    }
  }, [])

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!up) return
    // A new tab or window for `#top` is the browser's business.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return
    e.preventDefault()
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    window.scrollTo({ top: 0, behavior: still ? "instant" : "smooth" })
    document.getElementById("cs-title")?.focus({ preventScroll: true })
  }

  return (
    <TransitionLink
      href={up ? "#top" : "/work"}
      className="site-top__name cs-back"
      data-back=""
      data-up={up ? "" : undefined}
      aria-label={up ? toTop : undefined}
      onClick={onClick}
    >
      <Icon name="arrow-left" className="site-top__arrow cs-back-arrow" />
      <span className="cs-back-label">
        <span className="cs-back-all" aria-hidden={up || undefined}>
          {all}
        </span>
        <span className="cs-back-name" aria-hidden="true">
          {tile ? <span className="cs-back-mark">{tile}</span> : null}
          <span className="cs-back-title">{title}</span>
        </span>
      </span>
    </TransitionLink>
  )
}
