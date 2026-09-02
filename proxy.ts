import { NextResponse, type NextRequest } from "next/server"

import { WORK_SLUGS } from "@/lib/content/schema"

/**
 * Content negotiation for agents: when the client prefers `text/markdown` over
 * `text/html`, serve the markdown mirror from `app/md/[...path]` instead of the
 * page. Node runtime (the default in Next 16) — do NOT add a `runtime` export.
 *
 * `Vary: Accept` goes on both branches, so a CDN never hands the markdown to a
 * browser or the HTML to an agent.
 *
 * See docs/v3-redesign-plan.md §6.
 */

const MIRRORED = new Set(["/about", "/uses", "/mentoring", "/work"])

/**
 * Next's file-based metadata routes sit next to the case studies in the URL
 * space — `/work/opengraph-image` is `app/work/opengraph-image.tsx`, not a slug.
 * Without this they would be rewritten to `/404` below and every crawler that
 * followed the `/work` card's `og:image` would get an HTML 404 instead.
 */
const METADATA_SEGMENTS = new Set([
  "opengraph-image",
  "twitter-image",
  "icon",
  "apple-icon",
])

export function proxy(request: NextRequest) {
  const accept = request.headers.get("accept") ?? ""

  const { pathname } = request.nextUrl
  if (
    pathname.startsWith("/work/") &&
    METADATA_SEGMENTS.has(pathname.slice("/work/".length))
  ) {
    return NextResponse.next()
  }

  const mirrored = MIRRORED.has(pathname) || pathname.startsWith("/work/")

  // Unknown case-study slugs: under Cache Components the route serves its
  // prerendered fallback shell (status 200) before `notFound()` can run, so the
  // 404 has to happen here. `/work/<slug>.md` is left alone for the rewrite.
  if (pathname.startsWith("/work/")) {
    const slug = pathname.slice("/work/".length).replace(/\.md$/, "")
    if (!(WORK_SLUGS as readonly string[]).includes(slug)) {
      const url = request.nextUrl.clone()
      url.pathname = "/404"
      return NextResponse.rewrite(url)
    }
  }

  if (!mirrored || !prefersMarkdown(accept)) {
    const pass = NextResponse.next()
    if (mirrored) pass.headers.set("Vary", "Accept")
    return pass
  }

  const url = request.nextUrl.clone()
  url.pathname = `/md${pathname}`
  const response = NextResponse.rewrite(url)
  response.headers.set("Vary", "Accept")
  return response
}

/**
 * True when `text/markdown` outranks `text/html` in the Accept header.
 * Quality values are honoured, so `Accept: text/markdown;q=0.9, text/html` keeps
 * serving HTML — the agent has to actually ask for markdown first.
 */
function prefersMarkdown(accept: string): boolean {
  let markdown = -1
  let html = -1
  for (const part of accept.split(",")) {
    const [type, ...params] = part.trim().split(";")
    const q = params
      .map((p) => p.trim())
      .find((p) => p.startsWith("q="))
      ?.slice(2)
    const weight = q === undefined ? 1 : Number(q)
    if (Number.isNaN(weight)) continue
    if (type === "text/markdown") markdown = Math.max(markdown, weight)
    if (type === "text/html") html = Math.max(html, weight)
  }
  return markdown > 0 && markdown > html
}

export const config = {
  matcher: ["/about", "/uses", "/mentoring", "/work", "/work/:slug"],
}
