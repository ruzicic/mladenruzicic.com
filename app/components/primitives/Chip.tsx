import type { ReactNode } from "react"

import { ACCENT, inkOn } from "@/lib/color"
import { cn } from "@/lib/utils"

export interface ChipProps {
  children: ReactNode
  /**
   * `tech` — the hairline tag used under work rows.
   * `accent` — filled, for the current/primary marker.
   * `brand` — outlined in `color`, for company markers.
   */
  variant?: "tech" | "accent" | "brand"
  /** Hex used by the `brand` variant for the border and the leading square. */
  color?: string
  /** 1–2 letter mark rendered in a leading square (brand variant). */
  mark?: string
  className?: string
}

/** Small mono label. Not interactive — wrap in a link or Button if it must be. */
export function Chip({
  children,
  variant = "tech",
  color,
  mark,
  className,
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-xs px-[10px] py-[6px]",
        "font-mono text-[11px] leading-none tracking-[0.04em]",
        variant === "tech" && "border border-line text-dim",
        variant === "accent" && "bg-accent text-bg",
        variant === "brand" && "border text-fg",
        className
      )}
      style={variant === "brand" && color ? { borderColor: color } : undefined}
    >
      {mark ? (
        <span
          aria-hidden
          className="grid h-[18px] w-[18px] place-items-center rounded-xs text-[9px] font-semibold"
          style={{
            background: color ?? ACCENT,
            color: inkOn(color ?? ACCENT),
          }}
        >
          {mark}
        </span>
      ) : null}
      {children}
    </span>
  )
}
