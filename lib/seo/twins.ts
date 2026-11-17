import { STORY_SLUGS } from "@/lib/content/schema"

/**
 * Every markdown twin, as `/md/<route>` segments (`index` is `/`).
 *
 * The one list both `app/md/[...path]/route.ts` (`generateStaticParams`) and
 * `proxy.ts` read. It imports only the schema constants, never the
 * filesystem loaders, so the proxy can use it. The proxy answers every other
 * markdown request with a 404 itself: under Cache Components an unknown param
 * that reached the prerendered route handler would be rendered on demand and
 * then cached, one stored entry per random URL.
 */
export const TWIN_ROUTES: readonly string[] = [
  "index",
  "work",
  ...STORY_SLUGS.map((slug) => `work/${slug}`),
  "mentoring",
  "about",
  "cv",
  "press",
]

const TWINS = new Set(TWIN_ROUTES)

export const isTwinRoute = (route: string) => TWINS.has(route)

/**
 * The markdown 404, from the proxy (and the route's unreachable fallback).
 * `no-store`, so no cache keeps one entry per random URL and a twin added
 * later is never shadowed by an old "Not found". The body does not echo the
 * path: that would let a crafted URL put its own markdown into text an agent
 * reads as the site's.
 */
export function markdownNotFound(siteUrl: string): Response {
  return new Response(
    [
      "# Not found",
      "",
      "There is no page at this address.",
      "",
      `- Index: ${siteUrl}/llms.txt`,
      `- Work he has put real time into: ${siteUrl}/work.md`,
      "",
    ].join("\n"),
    {
      status: 404,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
        Vary: "Accept",
      },
    }
  )
}
