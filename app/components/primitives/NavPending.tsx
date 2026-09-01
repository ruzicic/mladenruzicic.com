"use client"

import { useLinkStatus } from "next/link"

/**
 * 1px accent hairline at the top of the viewport while a `<Link>` navigation is
 * pending. `animation-delay: 100ms` means prefetched (instant) navigations never
 * flash it. Must be rendered as a CHILD of a `<Link>` — `useLinkStatus` reads
 * the nearest link's pending state.
 */
export function NavPending() {
  const { pending } = useLinkStatus()
  if (!pending) return null
  return (
    <>
      <span
        aria-hidden
        data-nav-pending=""
        className="pointer-events-none fixed inset-x-0 top-0 z-[300] h-px origin-left bg-accent"
      />
      <style>{NAV_PENDING_CSS}</style>
    </>
  )
}

const NAV_PENDING_CSS = `
@keyframes nav-pending { from { transform: scaleX(0) } to { transform: scaleX(1) } }
[data-nav-pending] {
  opacity: 0;
  animation: nav-pending 1.4s var(--ease-reveal) 100ms forwards,
             nav-pending-show 1ms linear 100ms forwards;
}
@keyframes nav-pending-show { to { opacity: 1 } }
@media (prefers-reduced-motion: reduce) {
  [data-nav-pending] { animation: nav-pending-show 1ms linear 100ms forwards; transform: scaleX(1) }
}
`
