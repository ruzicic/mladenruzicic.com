import { llmsFullTxt, TXT_CONTENT_TYPE } from "@/lib/seo/markdown"

/**
 * `/llms-full.txt`: the prepared answers, everything built with its status,
 * and every public page inlined as markdown.
 */
export function GET() {
  return new Response(llmsFullTxt(), {
    headers: {
      "Content-Type": TXT_CONTENT_TYPE,
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
