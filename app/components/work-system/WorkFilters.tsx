"use client"

import { cn } from "@/lib/utils"

import { FILTERS, type FilterId } from "./taxonomy"

export interface WorkFiltersProps {
  value: FilterId
  onChange: (next: FilterId) => void
  /** How many entries each filter would show. Empty filters are not rendered. */
  counts: Record<FilterId, number>
  pending?: boolean
}

/**
 * The filter row. Real `<button>`s in a labelled group, so the whole row is
 * reachable with Tab and operable with Enter/Space; `aria-pressed` carries the
 * state and the count is part of the accessible name.
 */
export function WorkFilters({
  value,
  onChange,
  counts,
  pending,
}: WorkFiltersProps) {
  return (
    <div
      role="group"
      aria-label="Filter work"
      data-pending={pending ? "" : undefined}
      className="scroll-x -mx-[var(--gutter)] flex gap-2 px-[var(--gutter)] py-1"
    >
      {FILTERS.map((filter) => {
        const count = counts[filter.id] ?? 0
        if (count === 0) return null
        const active = filter.id === value
        return (
          <button
            key={filter.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(filter.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-pill border px-4 py-[9px]",
              "font-mono text-[11px] uppercase leading-none tracking-[0.08em]",
              "transition-colors duration-fast ease-pill",
              active
                ? "border-accent bg-accent text-bg"
                : "border-line text-dim hover:border-accent hover:text-accent"
            )}
          >
            {filter.label}
            <span
              className={cn(
                "tabular-nums",
                active ? "text-bg/70" : "text-muted"
              )}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
