import type { WorkStatus } from "@/lib/content/schema"
import { cn } from "@/lib/utils"

import { statusIsLive, statusLabel } from "./taxonomy"

export interface StatusBadgeProps {
  status: WorkStatus
  className?: string
}

/**
 * Mono status pill. Live work (current/active) gets the accent dot; everything
 * else is muted. Colour is never the only signal — the word is always there.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const live = statusIsLive(status)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-pill border px-[10px] py-[5px]",
        "font-mono text-[10px] uppercase leading-none tracking-[0.08em]",
        "bg-bg/75 backdrop-blur-[6px]",
        live ? "border-accent/60 text-fg" : "border-line text-muted",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-[6px] w-[6px] rounded-pill",
          live ? "bg-accent" : "bg-muted"
        )}
      />
      {statusLabel(status)}
    </span>
  )
}
