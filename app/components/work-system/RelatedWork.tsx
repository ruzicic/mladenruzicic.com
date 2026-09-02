import { getWork } from "@/lib/content"
import type { WorkEntry } from "@/lib/content/schema"

import { Eyebrow, TransitionLink } from "../primitives"
import { StaticAccentGradient } from "../shaders"
import { formatYears, statusLabel } from "./taxonomy"

/** Same company first, then same kind. Never the entry itself. */
export function relatedTo(entry: WorkEntry, limit = 3): WorkEntry[] {
  const rest = getWork().filter((item) => item.slug !== entry.slug)
  const sameCompany = entry.company
    ? rest.filter((item) => item.company === entry.company)
    : []
  const sameKind = rest.filter(
    (item) => item.kind === entry.kind && !sameCompany.includes(item)
  )
  return [...sameCompany, ...sameKind].slice(0, limit)
}

export interface RelatedWorkProps {
  entry: WorkEntry
  limit?: number
}

/**
 * Three neighbours. Small cards on purpose — the art here must NOT carry the
 * `work-art-<slug>` name, or two elements would claim the same transition name
 * on one page and the morph would break.
 */
export function RelatedWork({ entry, limit = 3 }: RelatedWorkProps) {
  const items = relatedTo(entry, limit)
  if (items.length === 0) return null

  return (
    <section aria-labelledby="related-work">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-line pt-5">
        <Eyebrow as="h2" id="related-work" className="text-fg">
          Related work
        </Eyebrow>
        <Eyebrow className="justify-end text-right">
          {entry.company
            ? "Same chapter, or the same kind of thing"
            : "More of the same kind"}
        </Eyebrow>
      </div>

      {/* role="list": Safari/VoiceOver drops list semantics on
          `list-style: none`. */}
      <ul
        role="list"
        className="mt-10 grid list-none grid-cols-1 gap-8 p-0 sm:grid-cols-3"
      >
        {items.map((item) => (
          <li key={item.slug}>
            <TransitionLink href={`/work/${item.slug}`} className="group block">
              <span className="relative block aspect-[16/10] overflow-hidden rounded-sm border border-line">
                <StaticAccentGradient accent={item.accent} />
              </span>
              <span className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase leading-none tracking-[0.08em] text-muted">
                <span className="tabular-nums text-accent">
                  {formatYears(item.period)}
                </span>
                <span>{statusLabel(item.status)}</span>
              </span>
              <span className="mt-2 block font-display text-[22px] leading-[1.15] text-fg transition-colors duration-fast group-hover:text-accent">
                {item.title}
              </span>
              <span className="mt-2 block text-[15px] leading-[1.5] text-dim-2">
                {item.line}
              </span>
            </TransitionLink>
          </li>
        ))}
      </ul>
    </section>
  )
}
