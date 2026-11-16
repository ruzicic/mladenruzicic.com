import { llmsTxt, TXT_CONTENT_TYPE } from "@/lib/seo/markdown"

/**
 * `/llms.txt`: the index (llmstxt.org), generated from `content/`. Served as
 * `text/plain` so it opens in a browser tab, per the convention.
 */
export function GET() {
  return new Response(llmsTxt(), {
    headers: {
      "Content-Type": TXT_CONTENT_TYPE,
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
