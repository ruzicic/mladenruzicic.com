import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export interface MediaSlotProps {
  /**
   * Aspect ratio of the frame, as CSS `aspect-ratio` accepts it: `"16 / 10"`,
   * `"9 / 19.5"`, `"1"`. Reserving it means no layout shift when real media
   * replaces the slot.
   */
  ratio: string
  /**
   * What goes here, from content: "Clip: a tender being qualified, 12s".
   * Shown in mono when there are no children; always the frame's accessible
   * name.
   */
  label: string
  /** Real media (an image, a video). When present it fills the frame. */
  children?: ReactNode
  /**
   * Where the empty frame's label sits: `corner` (default) bottom-left, or
   * `center`, centred in the frame without the square (the early projects'
   * slides on /about).
   */
  align?: "corner" | "center"
  className?: string
}

/**
 * A frame for media that does not exist yet (docs/v4-build/PLAN.md §5). A
 * neutral tile with the right aspect ratio and a short mono label in the
 * corner, so it reads as a deliberate "coming" slot, not a broken image.
 *
 * With `children` it is just the frame: same ratio, same radius, the media
 * covers it, and the label stays as the accessible name.
 */
export function MediaSlot({
  ratio,
  label,
  children,
  align = "corner",
  className,
}: MediaSlotProps) {
  const empty = children == null
  return (
    <figure
      role={empty ? "img" : undefined}
      aria-label={label}
      data-media-slot={empty ? "empty" : "filled"}
      className={cn(
        "relative m-0 w-full overflow-hidden rounded-card bg-tile",
        "[&>img]:absolute [&>img]:inset-0 [&>img]:size-full [&>img]:object-cover",
        "[&>video]:absolute [&>video]:inset-0 [&>video]:size-full [&>video]:object-cover",
        className
      )}
      style={{ aspectRatio: ratio }}
    >
      {empty ? (
        <>
          {/* A hairline inner frame and a faint diagonal hatch: quiet, but
              clearly drawn on purpose. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_var(--color-rule)] [background-image:repeating-linear-gradient(135deg,transparent_0_11px,rgb(17_17_17/0.035)_11px_12px)]"
          />
          {/* A `span`, not a `figcaption`: ARIA in HTML allows
              `role="img"` on a figure only while it has no figcaption. */}
          {align === "center" ? (
            <span
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center p-3 text-center font-mono text-label leading-4 text-pretty text-muted"
            >
              <span className="min-w-0">{label}</span>
            </span>
          ) : (
            <span
              aria-hidden="true"
              className="absolute bottom-4 left-4 right-4 flex items-center gap-2 font-mono text-label leading-4 text-pretty text-muted"
            >
              <span className="size-[5px] flex-none bg-muted" />
              <span className="min-w-0">{label}</span>
            </span>
          )}
        </>
      ) : (
        children
      )}
    </figure>
  )
}
