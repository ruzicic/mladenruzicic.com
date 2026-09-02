import { ViewTransition } from "react"

import { getCompany } from "@/lib/content"
import type { WorkEntry } from "@/lib/content/schema"

import { Chip, Container, Display } from "../primitives"
import { AccentGradient, Grain } from "../shaders"
import { StatusBadge } from "./StatusBadge"
import { caseStudyLinks, formatPeriod, statusLabel } from "./taxonomy"
import { MORPH_CLASS, workTitleTransitionName } from "./transitions"
import { WorkArt } from "./WorkArt"

const ART_SIZES = "(min-width: 1080px) 42vw, (min-width: 720px) 50vw, 92vw"

export interface CaseStudyHeaderProps {
  entry: WorkEntry
}

/**
 * The full-bleed case-study header — docs/v3-redesign-plan.md §5.2, §5.3.
 *
 * This is the ONE animated shader on the page: `AccentGradient` in the entry's
 * accent, with the CSS grain overlay on top. The art tile carrying
 * `work-art-<slug>` lives here so the morph pairs with the card on `/work` and
 * with the row on `/`; the `h1` carries `work-title-<slug>` for the same reason.
 */
export function CaseStudyHeader({ entry }: CaseStudyHeaderProps) {
  const company = entry.company ? getCompany(entry.company) : undefined
  const links = caseStudyLinks(entry)

  return (
    <header className="relative isolate overflow-hidden border-b border-line-soft">
      <AccentGradient accent={entry.accent} />
      <Grain />
      <div aria-hidden className="scrim-header" />

      <Container className="relative z-[2] pt-[72px] pb-[80px] md:pt-[104px] md:pb-[96px]">
        <div className="grid items-center gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          <div>
            <p className="m-0 flex flex-wrap items-center gap-x-[14px] gap-y-2 font-mono text-[11px] uppercase leading-none tracking-[0.08em] text-muted">
              <span>{entry.kind}</span>
              <span aria-hidden className="text-accent">
                ·
              </span>
              <span>{statusLabel(entry.status)}</span>
              <span aria-hidden className="text-accent">
                ·
              </span>
              <span className="tabular-nums">{formatPeriod(entry.period)}</span>
              {company ? (
                <Chip variant="brand" color={company.color} mark={company.mark}>
                  {company.name}
                </Chip>
              ) : null}
            </p>

            <ViewTransition
              name={workTitleTransitionName(entry.slug)}
              share={MORPH_CLASS}
              default="none"
            >
              <Display as="h1" size="section" className="mt-6">
                {entry.title}
              </Display>
            </ViewTransition>

            <p className="mt-6 mb-0 max-w-[34ch] text-[clamp(20px,2.2vw,24px)] leading-[1.35] text-fg">
              {entry.line}
            </p>
            <p className="mt-4 mb-0 max-w-[52ch] text-[17px] leading-[1.55] text-dim-2">
              {entry.detail}
            </p>
          </div>

          <div className="relative">
            <WorkArt entry={entry} sizes={ART_SIZES} preload />
            <div className="pointer-events-none absolute right-3 top-3">
              <StatusBadge status={entry.status} />
            </div>
          </div>
        </div>

        <dl className="mt-14 grid gap-x-10 gap-y-8 border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Role">{entry.role}</Field>

          <Field label="Period">
            <span className="tabular-nums">{formatPeriod(entry.period)}</span>
            {entry.period.approx ? (
              <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                ≈ approximate
              </span>
            ) : null}
          </Field>

          {entry.location ? (
            <Field label="Location">{entry.location}</Field>
          ) : null}

          {links.length > 0 ? (
            <Field label="Links">
              <ul role="list" className="m-0 flex list-none flex-col gap-2 p-0">
                {links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-2 text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
                    >
                      {link.label}
                      <span aria-hidden>↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Field>
          ) : null}

          <Field label="Tech" className="sm:col-span-2 lg:col-span-4">
            <ul role="list" className="m-0 flex list-none flex-wrap gap-2 p-0">
              {entry.tech.map((tech) => (
                <li key={tech}>
                  <Chip>{tech}</Chip>
                </li>
              ))}
            </ul>
          </Field>
        </dl>
      </Container>
    </header>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="m-0 font-mono text-[10px] uppercase leading-none tracking-[0.1em] text-muted">
        {label}
      </dt>
      <dd className="m-0 mt-3 text-[15px] leading-[1.5] text-dim">
        {children}
      </dd>
    </div>
  )
}
