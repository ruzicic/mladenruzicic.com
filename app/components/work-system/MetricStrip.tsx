import type { WorkEntry } from "@/lib/content/schema"
import { cn } from "@/lib/utils"

export interface MetricStripProps {
  metrics: NonNullable<WorkEntry["metrics"]>
  className?: string
}

/**
 * Numbers with a confidence marker — docs/v3-content-contract.md.
 *
 * - `verified`            → rendered plain.
 * - `needs-verification`  → rendered with a small mono "unverified" tag, so the
 *                           page never presents an unchecked number as a fact.
 * - `private`             → never rendered at all, on any page or mirror.
 *
 * Returns `null` when nothing public survives the filter, so callers do not have
 * to duplicate that check.
 */
export function MetricStrip({ metrics, className }: MetricStripProps) {
  const shown = metrics.filter((metric) => metric.confidence !== "private")
  if (shown.length === 0) return null

  return (
    <dl
      className={cn(
        "m-0 grid list-none gap-px overflow-hidden rounded-sm border border-line bg-line p-0",
        shown.length > 1 && "sm:grid-cols-2",
        shown.length > 2 && "lg:grid-cols-3",
        className
      )}
    >
      {shown.map((metric) => (
        <div key={metric.label} className="bg-surface p-5">
          <dt className="sr-only">{metric.label}</dt>
          <dd className="m-0">
            <span className="block font-display text-[clamp(30px,3.4vw,44px)] leading-none tabular-nums text-fg">
              {metric.value}
            </span>
            <span className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase leading-none tracking-[0.08em] text-muted">
              {metric.label}
              {metric.confidence === "needs-verification" ? (
                <span
                  title="Not independently verified."
                  className="rounded-xs border border-line px-[6px] py-[3px] text-[9px] text-dim-2"
                >
                  unverified
                </span>
              ) : null}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  )
}
