import { ViewTransition, type ReactNode } from "react"

/**
 * Cross-page transitions. `<ViewTransition>` comes from the React that Next
 * bundles, and `@types/react@19.3` declares it in `index.d.ts`, so no local
 * augmentation is needed any more.
 *
 * The 2027 site uses one quiet crossfade in both directions (`vt-fade` in
 * `app/globals.css`): no slides, no reveals. `NAV_FORWARD` / `NAV_BACK` stay
 * as transition types so a later builder can give back-navigation its own
 * class without touching the links.
 *
 * Wrap the BODY OF EACH `page.tsx`, not `layout.tsx`, or the persistent chrome
 * crossfades with the page. `PageFrame` does this for you.
 */

/** Transition types passed through `<Link transitionTypes>`. */
export const NAV_FORWARD = "nav-forward"
const NAV_BACK = "nav-back"

const FADE = {
  [NAV_FORWARD]: "vt-fade",
  [NAV_BACK]: "vt-fade",
  default: "vt-fade",
}

export interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <ViewTransition enter={FADE} exit={FADE} default="none">
      {children}
    </ViewTransition>
  )
}
