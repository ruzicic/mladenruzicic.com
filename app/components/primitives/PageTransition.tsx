import { ViewTransition, type ReactNode } from "react"

/**
 * Cross-page transitions — docs/v3-redesign-plan.md §5.3.
 *
 * `<ViewTransition>` ships in the React build Next 16.3 bundles; no
 * `experimental.viewTransition` flag exists any more. Types come from
 * `types/react-view-transition.d.ts`.
 *
 * Wrap the BODY OF EACH `page.tsx` — not `layout.tsx`, or the persistent chrome
 * crossfades with the page.
 */

/** Transition types passed through `<Link transitionTypes>`. */
export const NAV_FORWARD = "nav-forward"
export const NAV_BACK = "nav-back"

const ENTER = {
  [NAV_FORWARD]: "vt-in",
  [NAV_BACK]: "vt-in-back",
  default: "vt-fade",
}

const EXIT = {
  [NAV_FORWARD]: "vt-out",
  [NAV_BACK]: "vt-out-back",
  default: "vt-fade",
}

export interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <ViewTransition enter={ENTER} exit={EXIT} default="none">
      {children}
    </ViewTransition>
  )
}

/**
 * Shared-element wrapper. Put the same `name` on the work-card art tile and on
 * the case-study hero media; the pair morphs when the destination is prefetched
 * and degrades to the page enter/exit otherwise.
 */
export function SharedElement({
  name,
  children,
}: {
  name: string
  children: ReactNode
}) {
  return (
    <ViewTransition name={name} share="vt-morph">
      {children}
    </ViewTransition>
  )
}

/** Stable name for a work item's art tile, used on `/`, `/work` and `/work/[slug]`. */
export function workArtTransitionName(slug: string) {
  return `work-art-${slug}`
}
