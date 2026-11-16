import { agentTextHeaders, llmsTxt, TXT_CONTENT_TYPE } from "@/lib/seo/markdown"

/**
 * `/llms.txt`: the index (llmstxt.org), generated from `content/`. Served as
 * `text/plain` so it opens in a browser tab, per the convention. `noindex`:
 * agents read it (robots.txt allows it), but it is not a page to rank
 * beside the real ones.
 */
export function GET() {
  const body = llmsTxt()
  return new Response(body, {
    headers: {
      "Content-Type": TXT_CONTENT_TYPE,
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex",
      ...agentTextHeaders(body),
    },
  })
}
