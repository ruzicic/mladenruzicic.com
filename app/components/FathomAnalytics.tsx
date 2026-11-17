"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { load, trackPageview } from "fathom-client"

import { trackLink } from "@/lib/analytics"

const SITE_ID = process.env.NEXT_PUBLIC_FATHOM_SITE_ID

/**
 * Fathom, App Router pattern: the script loads once with `auto: false`, and
 * this component counts every page view itself, the first one included.
 *
 * - No site ID (local builds, previews without the env var): nothing loads,
 *   so a local run never requests `cdn.usefathom.com`.
 * - `auto: false` and no `spa` mode: with Fathom's own automatic and SPA
 *   tracking on, every client-side navigation was counted twice (once by the
 *   script's history listener, once by `trackPageview()` here).
 */
export default function FathomAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!SITE_ID) return
    load(SITE_ID, {
      auto: false,
      includedDomains: ["mladenruzicic.com"],
    })
  }, [])

  useEffect(() => {
    if (!SITE_ID) return
    trackPageview()
  }, [pathname, searchParams])

  // The link events (`lib/analytics.ts`): one listener for every link on
  // every page, so the Server Components that render them stay as they
  // are; a link says what it counts as with `data-track`, or by its `href`.
  // On `window`, in the bubble phase: a click a handler stopped (a drag's
  // last click, a click that only brings a strip card into focus) never
  // gets here. A middle click (`auxclick`, button 1) opens a new tab and
  // counts too. Nothing here waits or prevents anything: the navigation is
  // the browser's own. Mounted with or without a site id, so the tests can
  // read the names; `track` itself sends nothing without one.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== (e.type === "auxclick" ? 1 : 0)) return
      const link =
        e.target instanceof Element ? e.target.closest("a[href]") : null
      if (link) trackLink(link)
    }
    window.addEventListener("click", onClick)
    window.addEventListener("auxclick", onClick)
    return () => {
      window.removeEventListener("click", onClick)
      window.removeEventListener("auxclick", onClick)
    }
  }, [])

  return null
}
