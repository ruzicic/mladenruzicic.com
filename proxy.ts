import { NextResponse, type NextRequest } from "next/server"

import { STORY_SLUGS } from "@/lib/content/schema"
import { DISCOVERY_LINKS } from "@/lib/mcp/info"
import { isTwinRoute, markdownNotFound } from "@/lib/seo/twins"
import { SITE } from "@/content/site"

/**
 * Content negotiation for agents: when the client ranks `text/markdown` at
 * least as high as anything else it accepts (`prefersMarkdown`), serve the
 * page's markdown twin from `app/md/[...path]` on the same URL. Every HTML
 * response from a twinned page also carries
 * `Link: <….md>; rel="alternate"; type="text/markdown"`, so an agent can find
 * the twin from the headers alone. On `/` the same header also links the API
 * catalog and the MCP server card (`DISCOVERY_LINKS`). The markdown branch
 * keeps the twin's own `Link: rel="canonical"` alone.
 *
 * `Vary: Accept` goes on both branches, so a CDN never hands the markdown to a
 * browser or the HTML to an agent. On the HTML branch Next's page handler
 * replaces this `Vary` with its own RSC list; `headers()` in
 * `next.config.ts` has the rest of that story.
 *
 * `X-Robots-Tag: noindex` goes on the `.md` and `/md/` URLs only, never on
 * the negotiated answer at the canonical URL: that URL is the page.
 *
 * Every way into `app/md/[...path]` goes through here (`Accept`, `<path>.md`,
 * `/md/<route>`), and only the routes in `lib/seo/twins.ts` get through. Any
 * other markdown request is answered here with a `no-store` 404: the route
 * handler is prerendered, and under Cache Components an unknown param would
 * be rendered on demand and cached per URL (and `connection()` there to stop
 * that throws DYNAMIC_SERVER_USAGE in a production build).
 *
 * Node runtime (the default in Next 16): do NOT add a `runtime` export.
 * Redirects in `next.config.ts` run before this, so `/uses` and the non-story
 * `/work/<slug>` URLs never get here as pages.
 */

const SITE_URL = SITE.url

const TWINNED = new Set(["/", "/work", "/mentoring", "/about", "/cv", "/press"])

/** `/` has no path segment, so its twin is `/md/index` (`/index.md`). */
const mdPath = (pathname: string) =>
  pathname === "/" ? "/md/index" : `/md${pathname}`

const mdUrl = (pathname: string) =>
  pathname === "/" ? `${SITE_URL}/index.md` : `${SITE_URL}${pathname}.md`

/**
 * Next's file-based metadata routes sit next to the stories in the URL space:
 * `/work/opengraph-image` is `app/work/opengraph-image.tsx`, not a slug. Only
 * the files that exist under `app/work/` belong here: any other name would
 * reach `/work/[slug]` and its fallback shell, a 200 "Not found".
 */
const METADATA_SEGMENTS = new Set(["opengraph-image"])

/**
 * A path no route, file or metadata route matches, used as the target of the
 * not-found rewrite. It must never become a page or a file in `public/`.
 */
const NO_ROUTE = "/_no-such-page"

const isStory = (slug: string) =>
  (STORY_SLUGS as readonly string[]).includes(slug)

export function proxy(request: NextRequest) {
  const accept = request.headers.get("accept") ?? ""
  const { pathname } = request.nextUrl

  // `<path>.md`. Anything under `/static/` is a file, never a twin (no `.md`
  // is stored there today; such a request is a plain 404).
  if (pathname.endsWith(".md")) {
    if (pathname.startsWith("/static/")) return NextResponse.next()
    return noindex(toTwin(request, pathname.slice(1, -".md".length)))
  }

  // `/md/<route>` asked for directly.
  if (pathname === "/md" || pathname.startsWith("/md/")) {
    const route = pathname.slice("/md/".length)
    return isTwinRoute(route)
      ? noindex(NextResponse.next())
      : markdownNotFound(SITE_URL)
  }

  if (pathname.startsWith("/work/")) {
    const rest = pathname.slice("/work/".length)
    if (METADATA_SEGMENTS.has(rest) || rest.includes("/")) {
      return NextResponse.next()
    }

    // Unknown slugs: under Cache Components the route would serve its
    // prerendered fallback shell (200) before `notFound()` runs, so the 404
    // happens here, by rewriting to a path that matches nothing. Next then
    // answers 404 with `app/not-found.tsx`, and so does Vercel's error
    // phase. Not `/404`: on Vercel that is a static file in the build
    // output, and a rewrite onto it answers 200 (a soft 404, seen on the
    // 14 Nov 2026 preview).
    if (!isStory(rest)) {
      if (prefersMarkdown(accept)) return markdownNotFound(SITE_URL)
      const url = request.nextUrl.clone()
      url.pathname = NO_ROUTE
      const notFound = NextResponse.rewrite(url)
      notFound.headers.set("Vary", "Accept")
      return notFound
    }
  }

  const twinned = TWINNED.has(pathname) || pathname.startsWith("/work/")

  if (!twinned) return NextResponse.next()

  if (!prefersMarkdown(accept)) {
    const pass = NextResponse.next()
    pass.headers.set("Vary", "Accept")
    pass.headers.set(
      "Link",
      [
        `<${mdUrl(pathname)}>; rel="alternate"; type="text/markdown"`,
        ...(pathname === "/" ? DISCOVERY_LINKS : []),
      ].join(", ")
    )
    return pass
  }

  return toTwin(request, mdPath(pathname).slice("/md/".length))
}

/** Marks a markdown response at a `.md` or `/md/` URL as not for the index. */
function noindex<T extends Response>(response: T): T {
  response.headers.set("X-Robots-Tag", "noindex")
  return response
}

/** Rewrite to the twin at `/md/<route>`, or answer the markdown 404. */
function toTwin(request: NextRequest, route: string) {
  if (!isTwinRoute(route)) return markdownNotFound(SITE_URL)
  const url = request.nextUrl.clone()
  url.pathname = `/md/${route}`
  const response = NextResponse.rewrite(url)
  response.headers.set("Vary", "Accept")
  return response
}

/**
 * True when `text/markdown` is listed with a quality at least as high as
 * every other type in the Accept header (wildcards included), ties going to
 * markdown. So `text/markdown, text/html` plus the any-type wildcard (what
 * agents such as Claude Code send) gets markdown, while `text/markdown;q=0.9, text/html` keeps HTML and a
 * browser's Accept, which never lists `text/markdown`, always gets HTML.
 */
function prefersMarkdown(accept: string): boolean {
  let markdown = 0
  let other = 0
  for (const part of accept.split(",")) {
    const [rawType, ...params] = part.trim().split(";")
    const type = rawType.trim().toLowerCase()
    if (!type) continue
    const q = params
      .map((p) => p.trim())
      .find((p) => p.startsWith("q="))
      ?.slice(2)
    const weight = q === undefined ? 1 : Number(q)
    if (Number.isNaN(weight)) continue
    if (type === "text/markdown") markdown = Math.max(markdown, weight)
    else other = Math.max(other, weight)
  }
  return markdown > 0 && markdown >= other
}

export const config = {
  matcher: [
    "/",
    "/work",
    "/mentoring",
    "/about",
    "/cv",
    "/press",
    "/work/:slug",
    "/md/:path*",
    "/:path*.md",
  ],
}
