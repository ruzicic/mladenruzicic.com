"use client"

import Image from "next/image"
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
  const whereColor = `hsl(${hue} 60% ${labelLightness(hue)}%)`

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
            "grid place-items-center overflow-hidden rounded-full border-2 border-bg p-0",
            "text-[11px] font-semibold text-fg",
            "transition-transform duration-fast ease-pill hover:-translate-y-1",
          ].join(" ")}
        >
          {/* `alt=""`: the button already carries the name as `aria-label`, so
              a described image would announce the person twice. */}
          {person.avatar ? (
            <Image
              src={person.avatar}
              alt=""
              width={size}
              height={size}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
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
            className="grid h-14 w-14 flex-none place-items-center overflow-hidden rounded-full text-[16px] font-semibold"
            style={{ background: `hsl(${hue} 35% 32%)` }}
          >
            {person.avatar ? (
              <Image
                src={person.avatar}
                alt=""
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </span>
          <span className="grid min-w-0 gap-1">
            <strong className="font-display text-[28px] font-normal leading-none tracking-[-0.02em]">
              {person.name}
            </strong>
            <span
              className="font-mono text-[12px] uppercase tracking-[0.08em]"
              style={{ color: whereColor }}
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

/**
 * Lightness for the `person.where` label, per hue.
 *
 * `hsl(h 60% 60%)` is not equally light at every hue: it bottoms out at 3.20:1
 * against `--color-surface-2` around 240° (`#5c5cd6`), below the 4.5:1 that
 * 12px text needs. `hueFromId` hashes the person id, so the hue is not under
 * editorial control — today's five people happen to land elsewhere, but any new
 * id can hash into the blue band. Lift lightness across that band, on a base
 * two points above the designed 60% so red (the next-worst hue) clears too.
 * Worst case across hues 0–359 goes from 3.20:1 to 4.80:1.
 */
function labelLightness(hue: number): number {
  const raw = Math.abs(hue - 240)
  const distance = Math.min(raw, 360 - raw)
  return 62 + 16 * Math.max(0, 1 - distance / 90)
}
