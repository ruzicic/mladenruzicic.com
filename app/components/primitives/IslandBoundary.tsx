"use client"

import { useEffect, type ReactNode } from "react"
import { catchError, type ErrorInfo } from "next/error"

export interface IslandBoundaryProps {
  /**
   * What the island is without JavaScript: the plain list, a `<video>` with
   * native controls. Defaults to nothing.
   */
  fallback?: ReactNode
  /** Called once when the island fails (for example to follow its link). */
  onError?: (error: unknown) => void
}

function Failed({
  fallback,
  onError,
  error,
}: IslandBoundaryProps & { error: unknown }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production")
      console.error("Island failed", error)
    onError?.(error)
  }, [error, onError])
  return fallback ?? null
}

/**
 * A small error boundary for one client island. A chunk that fails to load
 * (a flaky network, or a deploy mid-session) or a render error inside the
 * island degrades it to its no-JavaScript behaviour instead of letting the
 * error reach the route and replace the whole page.
 *
 * Built on Next's `catchError` (`node_modules/next/dist/docs/01-app/
 * 03-api-reference/04-functions/catchError.md`) rather than a hand-written
 * class: it lets `notFound()` and `redirect()` through and clears itself on
 * a client navigation.
 */
export const IslandBoundary = catchError(
  (props: IslandBoundaryProps, { error }: ErrorInfo) => (
    <Failed {...props} error={error} />
  )
)
