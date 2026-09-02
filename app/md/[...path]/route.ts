import { getSite, getWorkSlugs } from "@/lib/content"
import {
  aboutMarkdown,
  MD_CONTENT_TYPE,
  mentoringMarkdown,
  usesMarkdown,
  workIndexMarkdown,
  workMarkdown,
} from "@/lib/content/markdown"

/**
 * Markdown mirrors. Reached three ways:
 *   1. `/:path*.md`                    — rewritten here by `next.config.ts`.
 *   2. `Accept: text/markdown`         — rewritten here by `proxy.ts`.
 *   3. Directly, from `llms.txt`.
 *
 * Everything is generated from `content/` via `lib/content/markdown.ts`, so the
 * mirrors carry exactly the claims the HTML does: private metrics never appear,
 * unverified ones are tagged, and `limited`/`high` entries carry their notice.
 *
 * The response is `noindex` and points at its canonical HTML page, so the
 * mirror can never compete with the real URL in search.
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

  const canonical = `${getSite().url}/${route}`

  return new Response(body, {
    headers: {
      "Content-Type": MD_CONTENT_TYPE,
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex",
      Link: `<${canonical}>; rel="canonical"`,
      Vary: "Accept",
    },
  })
}

function render(route: string): string | undefined {
  if (route === "about") return aboutMarkdown()
  if (route === "uses") return usesMarkdown()
  if (route === "mentoring") return mentoringMarkdown()
  if (route === "work") return workIndexMarkdown()
  if (route.startsWith("work/"))
    return workMarkdown(route.slice("work/".length))
  return undefined
}
