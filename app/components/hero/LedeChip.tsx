"use client"

import { inkOn } from "@/lib/color"
import type { CompanyId } from "@/lib/content/schema"

import { requestExpand } from "./highlight-store"

/**
 * The inline brand chips inside the hero lede — the `[[zf-scalar]]` and
 * `[[tenderlift]]` tokens in `content/pages/home.ts`.
 *
 * Both are real, focusable, server-rendered controls: the text they contain is
 * plain HTML and stays selectable and findable. Only the ZF one is a client
 * island, because it has to reach the timeline through the highlight store.
 */

const baseClass =
  "inline-flex items-baseline gap-[7px] whitespace-nowrap align-baseline text-fg pb-px transition-colors duration-fast hover:text-accent"

function Mark({ mark, color }: { mark: string; color: string }) {
  return (
    <span
      aria-hidden
      className="grid h-[18px] w-[18px] shrink-0 translate-y-[3px] place-items-center rounded-xs font-mono text-[9px] font-semibold leading-none"
      style={{ background: color, color: inkOn(color) }}
    >
      {mark}
    </span>
  )
}

/** Expands the matching timeline band and scrolls to it. */
export function ExpandChip({
  id,
  label,
  mark,
  color,
}: {
  id: CompanyId
  label: string
  mark: string
  color: string
}) {
  return (
    <button
      type="button"
      data-hover
      className={`${baseClass} cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[inherit]`}
      style={{ borderBottom: `1px solid ${color}` }}
      onClick={() => {
        requestExpand(id)
        document.getElementById("history")?.scrollIntoView({ block: "start" })
      }}
    >
      <Mark mark={mark} color={color} />
      {label}
    </button>
  )
}

/** Plain anchor chip (TenderLift → the work row on this page). */
export function LinkChip({
  href,
  label,
  mark,
  color,
}: {
  href: string
  label: string
  mark: string
  color: string
}) {
  return (
    <a
      href={href}
      data-hover
      className={baseClass}
      style={{ borderBottom: `1px solid ${color}` }}
    >
      <Mark mark={mark} color={color} />
      {label}
    </a>
  )
}
