import {
  aboutMarkdown,
  MD_CONTENT_TYPE,
  mentoringMarkdown,
  usesMarkdown,
  workIndexMarkdown,
  workMarkdown,
} from "@/lib/content/markdown"
import { getWorkSlugs } from "@/lib/content"

/**
 * Markdown mirrors. Reached two ways:
 *   1. `/:path*.md` — rewritten here by `next.config.ts`.
 *   2. `Accept: text/markdown` on the HTML path — rewritten here by `proxy.ts`.
 *
 * Everything is generated from `content/` via `lib/content/markdown.ts`, so the
 * mirrors carry exactly the claims the HTML does.
 */

export function generateStaticParams() {
  return [
    { path: ["about"] },
    { path: ["uses"] },
    { path: ["mentoring"] },
    { path: ["work"] },
    ...getWorkSlugs().map((slug) => ({ path: ["work", slug] })),
  ]
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const route = path.join("/")

  const body = render(route)
  if (!body) {
    return new Response("Not found\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }

  return new Response(body, {
    headers: {
      "Content-Type": MD_CONTENT_TYPE,
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}

function render(route: string): string | undefined {
  if (route === "about") return aboutMarkdown()
  if (route === "uses") return usesMarkdown()
  if (route === "mentoring") return mentoringMarkdown()
  if (route === "work") return workIndexMarkdown()
  if (route.startsWith("work/")) return workMarkdown(route.slice("work/".length))
  return undefined
}
