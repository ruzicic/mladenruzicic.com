"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

import type { CompanyId } from "@/lib/content/schema"

import { requestExpand } from "../hero/highlight-store"
import { NavPending } from "../primitives/NavPending"
import { Popover } from "../primitives/Popover"
import { TransitionLink } from "../primitives/TransitionLink"
import { SoundToggle } from "../sound/SoundToggle"

/**
 * The mobile bottom pill — docs/v3-redesign-plan.md §5.8, §5.6.
 *
 * Below 720px it replaces the header nav. It shows the current section from one
 * IntersectionObserver over `[data-section]`, and taps open a `popover="auto"`
 * sheet anchored to the pill: the employer colour scrubber, the three nav
 * destinations, and the sound toggle.
 *
 * `#work`, `#history` and the hero highlight store only exist on the homepage,
 * but the pill renders from `app/layout.tsx` on every route — so every target
 * here is location-aware. Off-home the scrubber and "Work" become real
 * cross-route links and `requestExpand` is not called, since `TimelineRail` is
 * not mounted to consume it.
 */

export interface PillCompany {
  id: CompanyId
  short: string
  color: string
  yearsLabel: string
  /** Length of the band in years — drives `flex` on the scrubber segment. */
  years: number
}

/** Closes the sheet from inside it (the Popover primitive owns the element). */
function closeSheet(target: EventTarget | null) {
  if (!(target instanceof Element)) return
  const panel = target.closest<HTMLElement>("[popover]")
  try {
    panel?.hidePopover()
  } catch {
    /* Already closed. */
  }
}

const NAV_LINK =
  "block border-b border-line py-[6px] font-display text-[34px] leading-tight tracking-[-0.02em]"

/**
 * Colour is the only affordance a scrubber segment has, and two of the six
 * brand colours fall below WCAG 1.4.11's 3:1 against `bg-surface-2` — ZF
 * `#0057B8` at 2.47:1 and HEGIAS `#6F246F` at 1.75:1 — so those two bars are
 * effectively invisible. A 1px `line-strong` outline gives every segment a
 * boundary that does not depend on its fill.
 *
 * The bar stays 6px tall; `[data-pill-segment]` in `app/styles/shell.css` grows
 * it to a 24px target (WCAG 2.5.8) without changing what it looks like.
 */
const SEGMENT =
  "block h-full w-full rounded-[2px] outline outline-[var(--color-line-strong)]"

export function MobilePill({ companies }: { companies: PillCompany[] }) {
  const [section, setSection] = useState("Intro")
  const onHome = usePathname() === "/"

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-section]")
    if (sections.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const label =
            entry.target instanceof HTMLElement
              ? entry.target.dataset.section
              : undefined
          if (entry.isIntersecting && label) setSection(label)
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    )
    sections.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  return (
    <div
      data-mobile-pill
      className={[
        "pointer-events-none fixed inset-x-0 bottom-0 z-60 flex justify-center px-4",
        "min-[720px]:hidden",
      ].join(" ")}
      style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
    >
      <Popover
        label="Sections and settings"
        positionArea="block-start"
        fallbacks="block-end span-all"
        className={[
          "mr-pill-sheet pointer-events-auto",
          "w-[min(92vw,360px)] max-w-[min(92vw,360px)] rounded-[22px]",
          "border-line bg-surface-2 p-[18px] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]",
        ].join(" ")}
        trigger={({ popoverTarget, id, style }) => (
          <button
            type="button"
            id={id}
            popoverTarget={popoverTarget}
            data-testid="mobile-pill"
            data-hover
            style={{ ...style, viewTransitionName: "site-pill" }}
            className={[
              "pointer-events-auto flex w-[220px] max-w-full items-center justify-between gap-4",
              "rounded-pill border border-line bg-surface-2/95 px-[18px] py-[14px] backdrop-blur-[14px]",
              "font-mono text-[12px] uppercase leading-none tracking-[0.08em] text-fg",
              "shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]",
            ].join(" ")}
          >
            <span className="flex items-center gap-[10px]">
              <span
                aria-hidden
                className="inline-block h-2 w-2 flex-none rounded-full bg-accent"
              />
              {section}
            </span>
            <span aria-hidden className="grid grid-cols-3 gap-[3px]">
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className="block h-1 w-1 rounded-full bg-fg" />
              ))}
            </span>
          </button>
        )}
      >
        <nav aria-label="Sections">
          <ul
            role="list"
            data-pill-scrubber
            className="m-0 mb-[14px] flex h-[6px] list-none gap-[3px] p-0"
          >
            {companies.map((company) => (
              <li
                key={company.id}
                className="block"
                style={{ flex: `${company.years} 1 0%` }}
              >
                {onHome ? (
                  <a
                    href="#history"
                    data-hover
                    data-pill-segment
                    aria-label={`${company.short}, ${company.yearsLabel}`}
                    onClick={(event) => {
                      requestExpand(company.id)
                      closeSheet(event.currentTarget)
                    }}
                    className={SEGMENT}
                    style={{ background: company.color }}
                  />
                ) : (
                  <TransitionLink
                    href="/#history"
                    data-hover
                    data-pill-segment
                    aria-label={`${company.short}, ${company.yearsLabel}`}
                    onClick={(event) => closeSheet(event.currentTarget)}
                    className={SEGMENT}
                    style={{ background: company.color }}
                  />
                )}
              </li>
            ))}
          </ul>

          {onHome ? (
            <a
              href="#work"
              data-hover
              className={NAV_LINK}
              onClick={(event) => closeSheet(event.currentTarget)}
            >
              Work
            </a>
          ) : (
            <TransitionLink
              href="/work"
              data-hover
              className={NAV_LINK}
              onClick={(event) => closeSheet(event.currentTarget)}
            >
              Work
              <NavPending />
            </TransitionLink>
          )}
          <TransitionLink
            href="/mentoring"
            data-hover
            className={NAV_LINK}
            onClick={(event) => closeSheet(event.currentTarget)}
          >
            Mentoring
            <NavPending />
          </TransitionLink>
          <TransitionLink
            href="/about"
            data-hover
            className={`${NAV_LINK} border-b-0`}
            onClick={(event) => closeSheet(event.currentTarget)}
          >
            About
            <NavPending />
          </TransitionLink>

          <SoundToggle block className="mt-[10px]" />
        </nav>
      </Popover>
    </div>
  )
}
