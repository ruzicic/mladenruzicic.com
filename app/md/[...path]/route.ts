import { getSite, getWorkSlugs } from "@/lib/content"
import {
  aboutMarkdown,
  homeMarkdown,
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
 *
 * `/` is mirrored too, as `index` — llms.txt promises "any page", so the home
 * page cannot be the one exception. An unknown route answers 404 with a
 * markdown body, not an HTML error page: the caller asked for markdown.
 */

export function generateStaticParams() {
  return [
    { path: ["index"] },
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

  const site = getSite()

  const body = render(route)
  if (!body) {
    // A markdown 404 for a markdown request: an agent that asked for
    // `text/markdown` gets a document it can parse, not an HTML error page.
    // The status is still 404.
    return new Response(
      [
        `# Not found`,
        "",
        `No page at \`/${route}\`.`,
        "",
        `- Index: ${site.url}/llms.txt`,
        `- Work: ${site.url}/work.md`,
        "",
      ].join("\n"),
      {
        status: 404,
        headers: {
          "Content-Type": MD_CONTENT_TYPE,
          "X-Robots-Tag": "noindex",
          Vary: "Accept",
        },
      }
    )
  }

  const canonical = route === "index" ? site.url : `${site.url}/${route}`

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
  // `/` has no path segment of its own, so the home mirror lives at
  // `/index.md`; `proxy.ts` rewrites `Accept: text/markdown` on `/` here too.
  if (route === "index") return homeMarkdown()
  if (route === "about") return aboutMarkdown()
  if (route === "uses") return usesMarkdown()
  if (route === "mentoring") return mentoringMarkdown()
  if (route === "work") return workIndexMarkdown()
  if (route.startsWith("work/"))
    return workMarkdown(route.slice("work/".length))
  return undefined
}
