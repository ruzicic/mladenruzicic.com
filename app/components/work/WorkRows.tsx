import { ViewTransition } from "react"

import { brandInkOnDark, inkOn } from "@/lib/color"
import { getCompany, getFeaturedWork, getHome } from "@/lib/content"
import type { WorkEntry, WorkStatus } from "@/lib/content/schema"

import { Chip } from "../primitives/Chip"
import { Container } from "../primitives/Container"
import { Display } from "../primitives/Display"
import { Eyebrow } from "../primitives/Eyebrow"
import { NavPending } from "../primitives/NavPending"
import { SectionHeader } from "../primitives/Section"
import { TransitionLink } from "../primitives/TransitionLink"
import { WorkFocus } from "./WorkFocus"

/**
 * "Selected work" — the five featured rows from the design.
 *
 * A Server Component: every row's copy, chips and links are in the HTML before
 * any JavaScript runs. The only client code is `WorkFocus`, which adds the
 * project-focus dimming on top of an already-visible resting state.
 *
 * Screenshots do not exist yet (docs/v3-redesign-plan.md §7), so the 16:10 art
 * tile is a CSS gradient in the entry's accent. It is wrapped in the shared
 * `work-art-${slug}` view-transition name that `/work` and `/work/[slug]` use,
 * so it will morph into the real artwork the moment that lands.
 */

const ROOT_ID = "work-rows"

const STATUS_LABEL: Record<WorkStatus, string> = {
  current: "Current",
  active: "Active",
  maintained: "Maintained",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
}

function periodLabel(entry: WorkEntry): string {
  const from = entry.period.from.slice(0, 4)
  const to = entry.period.to === "now" ? "now" : entry.period.to.slice(0, 4)
  return from === to ? from : `${from} – ${to}`
}

function hostLabel(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

/** The design's "Drop artwork" tile, standing in as an accent gradient. */
function ArtTile({ entry }: { entry: WorkEntry }) {
  const company = entry.company ? getCompany(entry.company) : undefined

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-sm bg-surface shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)]">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            `radial-gradient(120% 100% at 12% 8%, ${entry.accent}59, transparent 62%),` +
            `radial-gradient(95% 95% at 92% 96%, ${entry.accent}24, transparent 68%),` +
            "repeating-linear-gradient(135deg, rgba(242,240,234,0.05) 0 14px, transparent 14px 28px)",
        }}
      />

      {company ? (
        <div className="pointer-events-none absolute left-4 top-4">
          <Chip
            variant="brand"
            color={company.color}
            mark={company.mark}
            className="rounded-pill bg-bg/75 backdrop-blur-[8px]"
          >
            {company.short}
          </Chip>
        </div>
      ) : null}

      <TransitionLink
        href={`/work/${entry.slug}`}
        data-hover
        aria-label={`Open the ${entry.title} case study`}
        className={[
          "absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xs",
          "border border-[var(--color-line-strong)] bg-bg/75 backdrop-blur-[8px]",
          "text-[18px] leading-none text-fg",
          "transition-colors duration-fast ease-pill hover:bg-fg hover:text-bg",
        ].join(" ")}
      >
        <span aria-hidden>⤢</span>
        <NavPending />
      </TransitionLink>
    </div>
  )
}

export function WorkRows() {
  const home = getHome()
  const featured = getFeaturedWork()

  return (
    <section
      id="work"
      data-section="Work"
      aria-labelledby="work-heading"
      className="relative pb-20 pt-[120px]"
    >
      <Container id={ROOT_ID}>
        <SectionHeader
          id="work-heading"
          title={home.work.eyebrow}
          meta={`${featured.length} ${home.work.countLabel}`}
        />

        <div className="grid gap-[112px]" data-testid="work-rows">
          {featured.map((entry) => {
            const company = entry.company
              ? getCompany(entry.company)
              : undefined
            return (
              <article
                key={entry.slug}
                id={`project-${entry.slug}`}
                data-project={entry.slug}
                itemScope
                itemType="https://schema.org/CreativeWork"
                className="mr-work-row scroll-mt-[80px]"
              >
                <ViewTransition
                  name={`work-art-${entry.slug}`}
                  share="vt-morph"
                  default="none"
                >
                  <div>
                    <ArtTile entry={entry} />
                  </div>
                </ViewTransition>

                <div className="grid gap-[18px]">
                  <Eyebrow
                    className="gap-x-[14px] text-[11px]"
                    items={[
                      <span key="period" className="text-accent">
                        {periodLabel(entry)}
                      </span>,
                      STATUS_LABEL[entry.status],
                      company ? (
                        <a
                          key="company"
                          href="#history"
                          data-hover
                          className="inline-flex items-center gap-2"
                          style={{ color: brandInkOnDark(company.color) }}
                        >
                          <span
                            aria-hidden
                            className="inline-block h-[14px] w-[14px] rounded-[3px]"
                            style={{
                              background: company.color,
                              color: inkOn(company.color),
                            }}
                          />
                          {company.short}
                        </a>
                      ) : (
                        <span key="role">{entry.role}</span>
                      ),
                    ]}
                  />

                  <meta itemProp="name" content={entry.title} />
                  <ViewTransition
                    name={`work-title-${entry.slug}`}
                    share="vt-morph"
                  >
                    <Display as="h3">{entry.title}</Display>
                  </ViewTransition>

                  <p
                    itemProp="abstract"
                    className="m-0 max-w-[36ch] text-[22px] leading-[1.4] text-fg"
                  >
                    {entry.line}
                  </p>
                  <p
                    itemProp="description"
                    className="m-0 max-w-[48ch] text-[17px] leading-[1.55] text-dim-2"
                  >
                    {entry.detail}
                  </p>

                  {entry.tech.length > 0 ? (
                    <ul
                      aria-label="Built with"
                      className="m-0 flex list-none flex-wrap gap-2 p-0"
                    >
                      {entry.tech.map((tech) => (
                        <li key={tech}>
                          <Chip>{tech}</Chip>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {entry.url ? (
                    <a
                      itemProp="url"
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      data-hover
                      className="inline-flex w-max items-center gap-2 font-mono text-[12px] uppercase tracking-[0.08em] text-accent"
                    >
                      {hostLabel(entry.url)} <span aria-hidden>↗</span>
                    </a>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>

        <div className="mt-24 flex justify-end">
          <TransitionLink
            href="/work"
            data-hover
            className={[
              "inline-flex items-baseline gap-4 border-b border-[rgba(242,240,234,0.25)] pb-[6px]",
              "font-display text-[clamp(28px,3vw,44px)] tracking-[-0.02em]",
            ].join(" ")}
          >
            {home.work.allWorkLabel}
            <span className="font-mono text-[14px] text-muted">/work →</span>
            <NavPending />
          </TransitionLink>
        </div>
      </Container>

      <WorkFocus rootId={ROOT_ID} />
    </section>
  )
}
