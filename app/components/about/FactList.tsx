import "@/app/styles/about.css"

import type { Fact } from "@/lib/content/schema"
import { cn } from "@/lib/utils"

/**
 * Facts as a `<dl>` under hairlines (`Landing-About.dc.html` `#ab-facts`):
 * mono label in a 148px column, value beside it; stacked on phones. Used by
 * `/press` (About dropped its facts on 15 Nov 2026).
 */
export function FactList({
  items,
  className,
}: {
  items: Fact[]
  className?: string
}) {
  return (
    <dl className={cn("ab-rules m-0", className)}>
      {items.map((f) => (
        <div key={f.label} className="ab-fact">
          <dt>{f.label}</dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  )
}
