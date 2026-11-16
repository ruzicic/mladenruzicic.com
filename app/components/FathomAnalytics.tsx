"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { load, trackPageview } from "fathom-client"

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

  return null
}
