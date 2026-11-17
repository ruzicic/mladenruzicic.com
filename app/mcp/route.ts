import { createMcpHandler } from "mcp-handler"
import { z } from "zod"

import {
  getAsk,
  getBuiltList,
  getPress,
  getProduct,
  getSite,
  getStories,
  isStorySlug,
} from "@/lib/content"
import { MCP_SERVER_INFO, type McpToolName } from "@/lib/mcp/info"
import {
  aboutDoc,
  absolute,
  builtListMarkdown,
  canonical,
  contactMarkdown,
  identity,
  mentoringDoc,
  ownProducts,
  productDescription,
  productStatusLine,
  storyDoc,
} from "@/lib/seo/markdown"
import { match } from "@/app/components/ask/answer"

/**
 * `/mcp`: a read-only Model Context Protocol server, so anyone can point
 * their own assistant at the site and ask about him. Streamable HTTP,
 * stateless, through `mcp-handler` (MCP SDK v2): no sessions, no auth, no
 * storage.
 *
 * Every tool reads `lib/content` (the same text the pages and the markdown
 * twins carry) and nothing else: no fetch, no secrets, no writes. User input
 * reaches exactly two places: `get_work`'s slug, checked against a pattern
 * and looked up in content, and `ask`'s question, which only feeds the
 * keyword match in `app/components/ask/answer.ts` (the same one the Ask panel
 * uses) and is never echoed back.
 *
 * Every tool is registered under a name from `MCP_TOOL_NAMES`
 * (`lib/mcp/info.ts`), the list the server card and `/llms.txt` print;
 * `tests/machine.spec.ts` holds `tools/list` to it.
 *
 * Only POST is exported: Streamable HTTP lets a stateless server answer GET
 * with 405, which Next does for any method a route does not export. That also
 * keeps the build from trying to prerender a GET.
 */

const site = getSite()

const text = (body: string) => ({
  content: [{ type: "text" as const, text: body }],
})

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const

function profile(): string {
  const press = getPress()
  const about = aboutDoc()
  return [
    `# ${site.name}`,
    "",
    identity(),
    "",
    `- Website: ${site.url}`,
    `- Based in: ${site.location.label}`,
    `- From: ${site.from}`,
    `- Languages: ${site.languages.join(", ")}`,
    `- Building websites since: ${site.buildingSince}`,
    `- CV: ${canonical("/cv")} (markdown: ${canonical("/cv")}.md, PDF: ${absolute(site.links.cv)})`,
    "",
    "## Short bio",
    "",
    press.shortBio.text,
    "",
    about.body,
  ].join("\n")
}

function workList(): string {
  return [
    `# Work ${site.name} has put real time into`,
    "",
    "Use `get_work` with a slug for detail. Slugs with a case study are marked.",
    "",
    "## His own products",
    "",
    ...ownProducts().map((p) => {
      const parts = [
        productDescription(p),
        productStatusLine(p.slug),
        p.url,
        p.story ? `case study: ${canonical(`/work/${p.story}`)}` : undefined,
      ].filter(Boolean)
      return `- \`${p.slug}\` **${p.name}**: ${parts.join(" · ")}`
    }),
    "",
    "## The list on the site",
    "",
    builtListMarkdown(3),
    "## Case studies",
    "",
    ...getStories().map(
      (s) =>
        `- \`${s.slug}\` [${s.title}](${canonical(`/work/${s.slug}`)}): ${s.line}`
    ),
    "",
  ].join("\n")
}

function work(slug: string): string {
  if (isStorySlug(slug)) {
    const doc = storyDoc(slug)
    if (doc) return doc.body
  }
  const product = getProduct(slug)
  const row = getBuiltList()
    .groups.flatMap((g) => g.rows)
    .find((r) => r.ref === slug)
  if (!product || (!row && product.kind === "concept")) {
    return [
      `No entry with that slug. Known slugs:`,
      "",
      ...getBuiltList()
        .groups.flatMap((g) => g.rows)
        .map((r) => `- \`${r.ref}\` ${r.name}`),
    ].join("\n")
  }
  return [
    `# ${product.name}`,
    "",
    productDescription(product),
    row && row.what !== productDescription(product)
      ? `On the site: ${row.what}`
      : undefined,
    "",
    product.status ? `- Status: ${product.status}` : undefined,
    product.year ? `- When: ${product.year}` : undefined,
    product.url ? `- Website: ${product.url}` : undefined,
    product.story
      ? `- Story: ${canonical(`/work/${product.story}`)}`
      : // Only rows on the list carry an anchor on `/work`.
        `- On the list: ${absolute(row ? `/work#${slug}` : "/work")}`,
  ]
    .filter((l): l is string => l !== undefined)
    .join("\n")
}

function contact(): string {
  return [
    `# Contacting ${site.name}`,
    "",
    getAsk().questions.find((q) => q.id === "work")?.answer ?? "",
    "",
    contactMarkdown(),
  ].join("\n")
}

function ask(question: string): string {
  const prepared = getAsk()
  const hit = match(question, prepared.questions)
  const answer = hit
    ? hit.card.kind === "bio"
      ? `${hit.answer}\n\n${getPress().shortBio.text}`
      : hit.answer
    : prepared.fallback.answer
  const source = !hit
    ? undefined
    : hit.card.kind === "bio"
      ? absolute(hit.card.link.href)
      : absolute(hit.card.href)
  return [
    hit
      ? `Matched the prepared question: "${hit.question}"`
      : "No prepared question matched.",
    "",
    answer,
    "",
    source ? `More: ${source}` : `More: ${site.url}/llms.txt`,
    "",
    `Prepared questions: ${prepared.questions.map((q) => `"${q.question}"`).join(", ")}`,
  ].join("\n")
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "get_profile" satisfies McpToolName,
      {
        title: "Profile",
        description: `Who ${site.name} is: short bio, location, languages, the longer story, facts, CV and links.`,
        inputSchema: z.object({}),
        annotations: READ_ONLY,
      },
      async () => text(profile())
    )

    server.registerTool(
      "list_work" satisfies McpToolName,
      {
        title: "List work",
        description: `The work ${site.name} has put real time into, every product and job, with status, links and the slugs get_work accepts.`,
        inputSchema: z.object({}),
        annotations: READ_ONLY,
      },
      async () => text(workList())
    )

    server.registerTool(
      "get_work" satisfies McpToolName,
      {
        title: "Get work",
        description:
          "One product, job or case study by slug (from list_work), e.g. tenderlift, studenti-rs, zf-scalar. Case studies return their full text.",
        inputSchema: z.object({
          slug: z
            .string()
            .min(1)
            .max(40)
            .regex(/^[a-z0-9-]+$/, "a lowercase slug from list_work"),
        }),
        annotations: READ_ONLY,
      },
      async ({ slug }) => text(work(slug))
    )

    server.registerTool(
      "get_mentoring" satisfies McpToolName,
      {
        title: "Mentoring",
        description: `Whether and how ${site.name} mentors: who it fits, how it works, what mentees said.`,
        inputSchema: z.object({}),
        annotations: READ_ONLY,
      },
      async () => text(mentoringDoc().body)
    )

    server.registerTool(
      "get_contact" satisfies McpToolName,
      {
        title: "Contact",
        description: `How to reach ${site.name}: email and profiles.`,
        inputSchema: z.object({}),
        annotations: READ_ONLY,
      },
      async () => text(contact())
    )

    server.registerTool(
      "ask" satisfies McpToolName,
      {
        title: "Ask",
        description: `Ask a question about ${site.name}'s work. Answers come from the site's prepared answers (${getAsk()
          .questions.map((q) => `"${q.question}"`)
          .join(", ")}); anything else gets an honest fallback with his email.`,
        inputSchema: z.object({ question: z.string().min(1).max(300) }),
        annotations: READ_ONLY,
      },
      async ({ question }) => text(ask(question))
    )
  },
  {
    // The same identity the server card (`/.well-known/mcp/server-card.json`)
    // publishes.
    serverInfo: MCP_SERVER_INFO,
    instructions: `Read-only facts about ${site.name}, from ${site.url}. Start with get_profile or list_work. Everything here is public; cite ${site.url} as the source.`,
    // Stateless and read-only: no long-lived subscription streams.
    maxSubscriptions: 0,
  }
)

/**
 * The largest request body `/mcp` reads. A real call (initialize, a tool
 * list, a 300-character question) is well under 2 KB; without a cap
 * `mcp-handler` would parse any JSON the platform lets through (about 4.5 MB
 * on Vercel).
 */
const MAX_BODY_BYTES = 16 * 1024

const tooLarge = () =>
  Response.json(
    {
      jsonrpc: "2.0",
      error: { code: -32600, message: "Request body too large" },
      id: null,
    },
    { status: 413 }
  )

/**
 * Reads at most `MAX_BODY_BYTES` of the body, so a missing or false
 * `Content-Length` (a chunked upload) cannot get past the cap either, then
 * hands an identical request to the handler.
 */
export async function POST(req: Request) {
  const declared = Number(req.headers.get("content-length") ?? "0")
  if (declared > MAX_BODY_BYTES) return tooLarge()

  const chunks: Uint8Array[] = []
  let size = 0
  if (req.body) {
    const reader = req.body.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BODY_BYTES) {
        await reader.cancel()
        return tooLarge()
      }
      chunks.push(value)
    }
  }
  const body = new Uint8Array(size)
  let at = 0
  for (const c of chunks) {
    body.set(c, at)
    at += c.byteLength
  }
  return handler(
    new Request(req.url, { method: "POST", headers: req.headers, body })
  )
}
