import { ViewTransition } from "react"

import { getCompany } from "@/lib/content"
import type { WorkEntry } from "@/lib/content/schema"
import { cn } from "@/lib/utils"

import { Chip, Display, TransitionLink } from "../primitives"
import { StatusBadge } from "./StatusBadge"
import { formatYears } from "./taxonomy"
import { MORPH_CLASS, workTitleTransitionName } from "./transitions"
import { WorkArt } from "./WorkArt"

const ART_SIZES = "(min-width: 1080px) 44vw, (min-width: 720px) 46vw, 92vw"

export interface WorkCardProps {
  entry: WorkEntry
  className?: string
}

/**
 * One card on `/work`. The whole card is a single `TransitionLink`, so the hit
 * target is the card and there is exactly one tab stop per project.
 *
 * Everything a reader needs is on the card without hovering: art, status, year,
 * company, title, one-line summary and the tech list. Hover only lifts the art.
 */
export function WorkCard({ entry, className }: WorkCardProps) {
  const company = entry.company ? getCompany(entry.company) : undefined

  return (
    <TransitionLink
      href={`/work/${entry.slug}`}
      className={cn("work-card group", className)}
    >
      <div className="relative">
        <WorkArt entry={entry} sizes={ART_SIZES} />

        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-3">
          {company ? (
            <Chip
              variant="brand"
              color={company.color}
              mark={company.mark}
              className="bg-bg/75 backdrop-blur-[6px]"
            >
              {company.name}
            </Chip>
          ) : (
            <span />
          )}
          <StatusBadge status={entry.status} />
        </div>
      </div>

      <p className="mt-5 m-0 flex flex-wrap items-center gap-x-[14px] gap-y-1 font-mono text-[11px] uppercase leading-none tracking-[0.08em] text-muted">
        <span className="text-accent">{formatYears(entry.period)}</span>
        <span>{entry.kind}</span>
        {entry.period.approx ? <span>≈ approximate</span> : null}
      </p>

      <ViewTransition
        name={workTitleTransitionName(entry.slug)}
        share={MORPH_CLASS}
        default="none"
      >
        <Display
          as="h3"
          size="sub"
          className="mt-3 transition-colors duration-fast group-hover:text-accent"
        >
          {entry.title}
        </Display>
      </ViewTransition>

      <p className="mt-3 mb-0 max-w-[44ch] text-[17px] leading-[1.5] text-dim">
        {entry.line}
      </p>

      <span className="mt-4 flex flex-wrap gap-2">
        {entry.tech.slice(0, 4).map((tech) => (
          <Chip key={tech}>{tech}</Chip>
        ))}
      </span>
    </TransitionLink>
  )
}
