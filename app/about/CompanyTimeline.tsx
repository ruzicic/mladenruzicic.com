import type { Company } from "@/lib/content/schema"

import { TransitionLink } from "../components/primitives"

export interface CompanyTimelineProps {
  companies: Company[]
}

/**
 * The compact `/about` timeline — deliberately NOT the homepage rail.
 * A plain ordered list, newest first: name, role, years, an "approximate" badge
 * while the dates are unverified, and a link to the case study when one exists.
 *
 * `content/pages/about.mdx` does not repeat this (see the content contract);
 * it is rendered from `COMPANIES` so there is one place to correct a date.
 */
export function CompanyTimeline({ companies }: CompanyTimelineProps) {
  return (
    <ol className="m-0 grid list-none gap-0 p-0">
      {companies.map((company) => (
        <li
          key={company.id}
          className="grid gap-x-8 gap-y-3 border-t border-line-soft py-6 last:border-b sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)]"
        >
          <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] uppercase leading-none tracking-[0.08em] text-muted">
            <span className="tabular-nums">{company.yearsLabel}</span>
            {company.approx ? (
              <span
                title="Dates not yet verified."
                className="rounded-xs border border-line px-[6px] py-[3px] text-[9px] text-dim-2"
              >
                ≈ approximate
              </span>
            ) : null}
          </p>

          <div>
            <h3 className="m-0 flex flex-wrap items-center gap-3 font-sans text-[18px] font-semibold leading-tight text-fg">
              <span
                aria-hidden
                className="inline-block h-[10px] w-[10px] rounded-xs"
                style={{ background: company.color }}
              />
              {company.name}
            </h3>
            <p className="mt-2 mb-0 text-[16px] leading-[1.5] text-dim">
              {company.role}
            </p>
            {company.prev ? (
              <p className="mt-1 mb-0 text-[14px] leading-[1.5] text-muted">
                Previously: {company.prev}
              </p>
            ) : null}
            {company.workSlug ? (
              <p className="mt-3 mb-0">
                <TransitionLink
                  href={`/work/${company.workSlug}`}
                  className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent"
                >
                  Read the case study →
                </TransitionLink>
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
