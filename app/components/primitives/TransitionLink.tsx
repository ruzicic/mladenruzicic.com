"use client"

import { useCallback, type ComponentProps } from "react"
import Link from "next/link"

import { NAV_BACK, NAV_FORWARD } from "./PageTransition"

type NavigationLike = {
  currentEntry?: { index?: number } | null
  addEventListener?: (t: string, l: (e: Event) => void) => void
  removeEventListener?: (t: string, l: (e: Event) => void) => void
}

function getNavigation(): NavigationLike | undefined {
  if (typeof window === "undefined") return undefined
  return (window as unknown as { navigation?: NavigationLike }).navigation
}

/**
 * Read-only use of the Navigation API (Baseline 2026) to tell a browser
 * back/forward traversal from a forward click. Returns a getter, not state, so
 * it never re-renders.
 */
export function useBackNavigationType() {
  return useCallback(() => {
    const nav = getNavigation()
    const index = nav?.currentEntry?.index
    if (typeof index !== "number") return NAV_FORWARD
    // Any entry other than the newest is a traversal.
    return index < (window.history.length ?? 0) - 1 ? NAV_BACK : NAV_FORWARD
  }, [])
}

export type TransitionLinkProps = ComponentProps<typeof Link>

/**
 * `next/link` that tags its navigation as `nav-forward` so `PageTransition`
 * picks the forward enter/exit classes. Browser back/forward is handled by the
 * router itself, which fires the `nav-back` type.
 */
export function TransitionLink({
  transitionTypes = [NAV_FORWARD],
  ...props
}: TransitionLinkProps) {
  return <Link transitionTypes={transitionTypes} {...props} />
}
