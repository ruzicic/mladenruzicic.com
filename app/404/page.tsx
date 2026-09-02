import { notFound } from "next/navigation"

/**
 * A real 404 for paths the proxy rewrites here (unknown `/work/<slug>`).
 * Calling `notFound()` during prerender makes Next serve `app/not-found.tsx`
 * with a 404 status for this route, which the dynamic case-study route cannot
 * do once its fallback shell has been flushed.
 */
export default function NotFoundRoute(): never {
  notFound()
}
