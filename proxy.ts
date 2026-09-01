import { NextResponse, type NextRequest } from "next/server"

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

export function proxy(request: NextRequest) {
  const accept = request.headers.get("accept") ?? ""

  const { pathname } = request.nextUrl
  const mirrored = MIRRORED.has(pathname) || pathname.startsWith("/work/")

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
