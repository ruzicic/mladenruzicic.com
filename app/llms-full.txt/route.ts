import { llmsFullTxt, TXT_CONTENT_TYPE } from "@/lib/content/markdown"

/** `/llms-full.txt` — every public page inlined as markdown. */
export function GET() {
  return new Response(llmsFullTxt(), {
    headers: {
      "Content-Type": TXT_CONTENT_TYPE,
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
