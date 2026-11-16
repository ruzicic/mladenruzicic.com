"use client"

import { useEffect, useId, type CSSProperties, type ReactNode } from "react"
// clsx, not `cn`: this renders inside client islands, and `cn` pulls
// tailwind-merge (about 8 KB gzipped) into their chunks. No caller passes a
// class that conflicts with the ones set here, so there is nothing to merge.
import { clsx as cn } from "clsx"

/**
 * CSS anchor positioning is not Baseline yet (checked with modern-web-guidance
 * on 2026-11-11: "Limited availability"), so the polyfill stays. It loads once,
 * and only where the browser lacks native support.
 */
let polyfillPromise: Promise<unknown> | null = null
function ensureAnchorPositioning() {
  if (typeof window === "undefined") return
  if (CSS.supports("anchor-name: --a")) return
  polyfillPromise ??= import("@oddbird/css-anchor-positioning").catch(
    () => null
  )
  return polyfillPromise
}

export interface PopoverProps {
  /**
   * The invoker. Spread the props onto a real `<button>`: they carry
   * `popoverTarget`, the trigger `id` and the explicit `anchor-name` the
   * polyfill needs (it does not understand implicit popover anchors).
   */
  trigger: (props: {
    popoverTarget: string
    id: string
    style: CSSProperties
  }) => ReactNode
  children: ReactNode
  /**
   * Which side of the anchor the panel opens on. `below` (default) aligns the
   * panel's start edge with the anchor's start edge; `above` mirrors it.
   * Either one flips when it would overflow the viewport.
   */
  side?: "below" | "above"
  className?: string
  /** Accessible label for the panel (named as a `group`). */
  label?: string
  /**
   * The panel's element. `span` lets a popover live inside a `<p>`: the
   * panel is in the top layer while open, so it never lays out inline, and
   * keeping it right after its trigger keeps the reading order. Its content
   * must then be phrasing content (spans, links, buttons).
   */
  as?: "div" | "span"
}

/**
 * Popover API panel (`popover="auto"`: top layer, light dismiss, Escape),
 * tethered with CSS anchor positioning. Keyboard and touch behave the same as
 * a mouse; there is no hover-only path.
 *
 * It positions with `anchor()` on the inset properties rather than
 * `position-area`, because the polyfill cannot combine `position-area` with
 * `position-try-fallbacks`.
 */
export function Popover({
  trigger,
  children,
  side = "below",
  className,
  label,
  as: Panel = "div",
}: PopoverProps) {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, "")
  const panelId = `pop-${raw}`
  const anchorId = `--anchor-${raw}`
  useEffect(() => {
    ensureAnchorPositioning()
  }, [])

  const placement: CSSProperties =
    side === "below"
      ? { top: "anchor(bottom)", left: "anchor(left)", marginTop: "8px" }
      : { bottom: "anchor(top)", left: "anchor(left)", marginBottom: "8px" }

  return (
    <>
      {trigger({
        popoverTarget: panelId,
        id: `${panelId}-trigger`,
        style: { anchorName: anchorId } as CSSProperties,
      })}
      <Panel
        id={panelId}
        popover="auto"
        role={label ? "group" : undefined}
        aria-label={label}
        className={cn(
          "m-0 max-w-[min(calc(100vw-32px),360px)] rounded-panel border border-rule bg-surface p-4 text-ui text-ink",
          "shadow-[0_1px_2px_rgb(17_17_17/0.05),0_18px_44px_-14px_rgb(17_17_17/0.18)]",
          "[&:not(:popover-open)]:hidden",
          className
        )}
        style={
          {
            positionAnchor: anchorId,
            inset: "auto",
            ...placement,
            positionTryFallbacks:
              "flip-block, flip-inline, flip-block flip-inline",
          } as CSSProperties
        }
      >
        {children}
      </Panel>
    </>
  )
}
