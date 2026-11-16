import { getSite } from "@/lib/content"
import {
  markdownDoc,
  markdownRoutes,
  MD_CONTENT_TYPE,
  renderDoc,
} from "@/lib/seo/markdown"
import { markdownNotFound } from "@/lib/seo/twins"

/**
 * Markdown twins. Reached three ways:
 *   1. `/:path*.md`             rewritten here by `proxy.ts`.
 *   2. `Accept: text/markdown`  rewritten here by `proxy.ts`, same URL.
 *   3. Directly as `/md/<route>`, also checked by `proxy.ts`.
 *
 * Every public page has one (`/` is `index`): the landing, `/work`, the six
 * stories, `/mentoring`, `/about`, `/press`. Nothing else: `/uses` and the
 * non-story slugs are gone and answer a markdown 404.
 *
 * The response is `noindex` and names its canonical HTML page, so a twin never
 * competes with the real URL in search.
 */

export function generateStaticParams() {
  return markdownRoutes().map((route) => ({ path: route.split("/") }))
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const route = path.join("/")
  const site = getSite()

  const doc = markdownDoc(route)
  if (!doc) {
    // Not reached in practice: `proxy.ts` answers every markdown request for
    // a path outside `TWIN_ROUTES` (`lib/seo/twins.ts`) itself, because under
    // Cache Components an unknown param rendered here is cached as a new
    // entry, and `connection()` (to keep it out of that cache) makes a
    // prerendered handler throw DYNAMIC_SERVER_USAGE in production.
    return markdownNotFound(site.url)
  }

  const canonical = doc.path === "/" ? site.url : `${site.url}${doc.path}`
  return new Response(renderDoc(doc), {
    headers: {
      "Content-Type": MD_CONTENT_TYPE,
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "Last-Modified": new Date(`${doc.updated}T00:00:00Z`).toUTCString(),
      "X-Robots-Tag": "noindex",
      Link: `<${canonical}>; rel="canonical"`,
      Vary: "Accept",
    },
  })
}
