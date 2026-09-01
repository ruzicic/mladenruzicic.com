import { llmsTxt } from "@/lib/content/markdown"

/** `/llms.txt` — the index, generated from `content/`. */
export function GET() {
  return new Response(llmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
