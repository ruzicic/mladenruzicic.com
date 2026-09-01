import { getWork } from "@/lib/content"
import type { WorkEntry } from "@/lib/content/schema"

import { TransitionLink } from "../primitives"

export interface PrevNextWorkProps {
  entry: WorkEntry
}

/**
 * Previous / next in featured order — the same order `getWork()` returns
 * (featured first by `highlightRank`, then most recent first), so walking the
 * arrows walks the site's own idea of importance. The list wraps.
 */
export function PrevNextWork({ entry }: PrevNextWorkProps) {
  const all = getWork()
  if (all.length < 2) return null

  const index = all.findIndex((item) => item.slug === entry.slug)
  if (index === -1) return null

  const previous = all[(index - 1 + all.length) % all.length]
  const next = all[(index + 1) % all.length]

  return (
    <nav
      aria-label="More work"
      className="grid gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-2"
    >
      <Side entry={previous} direction="previous" />
      <Side entry={next} direction="next" />
    </nav>
  )
}

function Side({
  entry,
  direction,
}: {
  entry: WorkEntry
  direction: "previous" | "next"
}) {
  const next = direction === "next"
  return (
    <TransitionLink
      href={`/work/${entry.slug}`}
      rel={next ? "next" : "prev"}
      className={`group bg-surface p-6 transition-colors duration-fast hover:bg-surface-2 ${
        next ? "sm:text-right" : ""
      }`}
    >
      <span className="block font-mono text-[10px] uppercase leading-none tracking-[0.1em] text-muted">
        {next ? "Next →" : "← Previous"}
      </span>
      <span className="mt-3 block font-display text-[24px] leading-[1.15] text-fg transition-colors duration-fast group-hover:text-accent">
        {entry.title}
      </span>
      <span className="mt-2 block text-[15px] leading-[1.5] text-dim-2">
        {entry.line}
      </span>
    </TransitionLink>
  )
}
