"use client"

import { useRef } from "react"

import type { CompanyId, Person } from "@/lib/content/schema"

import { Popover } from "../primitives/Popover"
import { hueFromId, initialsOf } from "./span"

/**
 * A "worked alongside" avatar and its card — docs/v3-redesign-plan.md §5.6.
 *
 * The card is a `popover="auto"` panel in the top layer: click (or Enter/Space
 * via `popovertarget`) opens it everywhere, so keyboard and touch have full
 * parity. On a fine pointer only, hovering for 220 ms opens it as well; that is
 * strictly additive.
 *
 * Deliberately NOT focus-to-open: a mouse user's click both focuses and toggles,
 * so focus-open would immediately close the card again.
 */

export interface PersonPopoverProps {
  person: Person
  /** The band this person belongs to, if any. */
  companyId?: CompanyId
  /** Opens that band on the rail and scrolls to it. */
  onGoToBand: (id: CompanyId) => void
  /** Avatar diameter in px. 36 in the "worked alongside" row, 32 in a band. */
  size?: 32 | 36
}

const HOVER_DELAY = 220

export function PersonPopover({
  person,
  companyId,
  onGoToBand,
  size = 36,
}: PersonPopoverProps) {
  const timer = useRef(0)
  const hue = hueFromId(person.id)
  const initials = initialsOf(person.name)

  const panel = (id: string) =>
    typeof document === "undefined" ? null : document.getElementById(id)

  const hoverOpen = (panelId: string) => {
    if (!window.matchMedia("(pointer: fine)").matches) return
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      try {
        const element = panel(panelId)
        if (element && !element.matches(":popover-open")) {
          ;(element as HTMLElement).showPopover()
        }
      } catch {
        /* ignore */
      }
    }, HOVER_DELAY)
  }

  const hoverClose = (panelId: string) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      try {
        const element = panel(panelId)
        if (element?.matches(":popover-open")) {
          ;(element as HTMLElement).hidePopover()
        }
      } catch {
        /* ignore */
      }
    }, HOVER_DELAY)
  }

  const close = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return
    try {
      target.closest<HTMLElement>("[popover]")?.hidePopover()
    } catch {
      /* ignore */
    }
  }

  return (
    <Popover
      label={person.name}
      positionArea="block-start span-inline-end"
      fallbacks="block-end span-inline-end, block-start span-inline-start, block-end span-inline-start"
      className="w-[min(92vw,380px)] max-w-[min(92vw,380px)] p-0"
      trigger={({ popoverTarget, id, style }) => (
        <button
          type="button"
          id={id}
          popoverTarget={popoverTarget}
          data-hover
          aria-label={person.name}
          onPointerEnter={() => hoverOpen(popoverTarget)}
          onPointerLeave={() => hoverClose(popoverTarget)}
          style={{
            ...style,
            width: size,
            height: size,
            background: `hsl(${hue} 35% 32%)`,
          }}
          className={[
            "grid place-items-center rounded-full border-2 border-bg p-0",
            "text-[11px] font-semibold text-fg",
            "transition-transform duration-fast ease-pill hover:-translate-y-1",
          ].join(" ")}
        >
          {initials}
        </button>
      )}
    >
      {/* The trigger sits inside the mono, uppercase "Worked alongside" row and
          the panel inherits from it in the DOM, so reset type here. */}
      <div
        className="grid gap-4 p-6 font-sans normal-case tracking-normal"
        onPointerEnter={() => window.clearTimeout(timer.current)}
      >
        <div className="flex items-center gap-[14px]">
          <span
            aria-hidden
            className="grid h-14 w-14 flex-none place-items-center rounded-full text-[16px] font-semibold"
            style={{ background: `hsl(${hue} 35% 32%)` }}
          >
            {initials}
          </span>
          <span className="grid min-w-0 gap-1">
            <strong className="font-display text-[28px] font-normal leading-none tracking-[-0.02em]">
              {person.name}
            </strong>
            <span
              className="font-mono text-[12px] uppercase tracking-[0.08em]"
              style={{ color: `hsl(${hue} 60% 60%)` }}
            >
              {person.where}
            </span>
          </span>
        </div>

        <p className="m-0 text-[16px] leading-[1.5] text-dim">{person.why}</p>

        {person.note ? (
          <p className="m-0 font-serif-italic text-[18px] italic leading-[1.35] text-muted">
            {person.note}
          </p>
        ) : null}

        {person.linkedin || companyId ? (
          <div className="flex flex-wrap gap-[18px] font-mono text-[12px] uppercase tracking-[0.08em]">
            {person.linkedin ? (
              <a
                href={person.linkedin}
                target="_blank"
                rel="noreferrer noopener"
                data-hover
                className="text-accent"
              >
                LinkedIn ↗
              </a>
            ) : null}
            {companyId ? (
              <button
                type="button"
                data-hover
                className="bg-transparent p-0 text-left uppercase text-muted hover:text-accent"
                onClick={(event) => {
                  close(event.currentTarget)
                  onGoToBand(companyId)
                }}
              >
                Where: {person.where}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </Popover>
  )
}
