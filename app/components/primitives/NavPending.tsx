"use client"

import { useLinkStatus } from "next/link"

/**
 * 1px accent hairline at the top of the viewport while a `<Link>` navigation is
 * pending. `animation-delay: 100ms` means prefetched (instant) navigations never
 * flash it. Must be rendered as a CHILD of a `<Link>` — `useLinkStatus` reads
 * the nearest link's pending state.
 *
 * The `[data-nav-pending]` rules live in `app/styles/shell.css`, which the root
 * layout imports once. They used to ship as a `<style>` element rendered inside
 * the `<a>` — invalid nesting that browsers tolerate, re-inserted on every
 * pending navigation.
 */
export function NavPending() {
  const { pending } = useLinkStatus()
  if (!pending) return null
  return (
    <span
      aria-hidden
      data-nav-pending=""
      className="pointer-events-none fixed inset-x-0 top-0 z-[300] h-px origin-left bg-accent"
    />
  )
}
