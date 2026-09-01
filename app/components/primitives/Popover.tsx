"use client"

import { useEffect, useId, type ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Loads the CSS anchor-positioning polyfill once, and only where the browser
 * lacks native support (Safari ≤ 18, Firefox ≤ 146).
 * docs/v3-redesign-plan.md §5.6.
 */
let polyfillPromise: Promise<unknown> | null = null
function ensureAnchorPositioning() {
  if (typeof window === "undefined") return
  if (CSS.supports("anchor-name: --a")) return
  polyfillPromise ??= import("@oddbird/css-anchor-positioning").catch(() => null)
  return polyfillPromise
}

export interface PopoverProps {
  /**
   * The invoker. Receives `popovertarget` and `popovertargetaction` props —
   * render a `<button>` (or `Button` with no `href`).
   */
  trigger: (props: {
    popoverTarget: string
    id: string
    style: React.CSSProperties
  }) => ReactNode
  children: ReactNode
  /**
   * Where the panel sits relative to the anchor, as a `position-area` value.
   * Default `block-end span-inline-end` (below, aligned to the start edge).
   */
  positionArea?: string
  /** `position-try-fallbacks` value. Default flips to the block-start side. */
  fallbacks?: string
  className?: string
  /** Accessible label for the panel. */
  label?: string
}

/**
 * Popover API panel (`popover="auto"`: top layer, light dismiss, Escape) placed
 * with CSS anchor positioning. Keyboard and touch behave identically to mouse —
 * there is no hover-only path.
 */
export function Popover({
  trigger,
  children,
  positionArea = "block-end span-inline-end",
  fallbacks = "block-start span-inline-end, block-end span-inline-start, block-start span-inline-start",
  className,
  label,
}: PopoverProps) {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, "")
  const panelId = `pop-${raw}`
  const anchorId = `--anchor-${raw}`
  useEffect(() => {
    ensureAnchorPositioning()
  }, [])

  return (
    <>
      {trigger({
        popoverTarget: panelId,
        id: `${panelId}-trigger`,
        style: { anchorName: anchorId } as React.CSSProperties,
      })}
      <div
        id={panelId}
        popover="auto"
        aria-label={label}
        className={cn(
          "m-0 max-w-[min(92vw,360px)] rounded-sm border border-line bg-surface-2 p-4 text-fg",
          "[&:not(:popover-open)]:hidden",
          className
        )}
        style={
          {
            positionAnchor: anchorId,
            positionArea,
            positionTryFallbacks: fallbacks,
            marginBlock: "8px",
            inset: "auto",
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </>
  )
}
