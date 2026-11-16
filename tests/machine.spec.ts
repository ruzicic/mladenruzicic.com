import { expect, test } from "@playwright/test"

import { CONTENT_SIGNAL } from "../lib/seo/robots"
import nextConfig from "../next.config"
import {
  hasType,
  jsonLdNodes,
  PAGES,
  readJsonLdBlocks,
  readSitemapPaths,
  STORY_SLUGS,
} from "./helpers"

/**
 * The machine doors: `/llms.txt`, `/llms-full.txt`, `/sitemap.xml`,
 * `/robots.txt` (with Content Signals), a markdown twin of every page on the
 * same URL (`Accept: text/markdown`) and at `<path>.md`, the discovery files
 * (`/.well-known/mcp/server-card.json`, `/.well-known/api-catalog`, the
 * `Link` header on `/`), JSON-LD on every page, the share-card titles, and
 * the read-only `/mcp` endpoint.
 */

const SITE_ORIGIN = "https://mladenruzicic.com"

/** True when a comma-separated header (`Vary`) lists `token` itself. */
const listsToken = (header: string | undefined, token: string) =>
  (header ?? "")
    .split(",")
    .some((t) => t.trim().toLowerCase() === token.toLowerCase())

/** `x-markdown-tokens` as the routes compute it: UTF-8 bytes / 4, rounded up. */
const tokensOf = (body: string) =>
  String(Math.ceil(Buffer.byteLength(body, "utf8") / 4))

/** What Chrome sends for a page load. */
const BROWSER_ACCEPT =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"

async function redirectedSources(): Promise<string[]> {
  const redirects = (await nextConfig.redirects?.()) ?? []
  return redirects.map((r) => r.source)
}

test.describe("llms.txt", () => {
  test("/llms.txt is plain text that names him and links every story", async ({
    request,
  }) => {
    const res = await request.get("/llms.txt")
    expect(res.status()).toBe(200)
    expect(res.headers()["content-type"]).toMatch(/^text\/(plain|markdown)/)
    const body = await res.text()
    expect(body).toMatch(/^# \S/)
    expect(body).toMatch(/^> \S/m)
    for (const slug of STORY_SLUGS)
      expect(body, `links /work/${slug}`).toContain(
        `${SITE_ORIGIN}/work/${slug}`
      )
    expect(body).toContain(`${SITE_ORIGIN}/llms-full.txt`)
    // No link to a page that only redirects.
    for (const source of await redirectedSources())
      expect(body, `does not link ${source}`).not.toMatch(
        new RegExp(`${SITE_ORIGIN}${source}(?![\\w-])`)
      )
  })

  test("/llms.txt and /llms-full.txt are noindex and carry the agent headers", async ({
    request,
  }) => {
    for (const path of ["/llms.txt", "/llms-full.txt"]) {
      const res = await request.get(path)
      expect(res.status(), path).toBe(200)
      const headers = res.headers()
      expect(headers["x-robots-tag"], path).toBe("noindex")
      expect(headers["content-signal"], path).toBe(CONTENT_SIGNAL)
      expect(headers["x-markdown-tokens"], path).toBe(
        tokensOf(await res.text())
      )
    }
  })

  test("/llms.txt lists its links as markdown links", async ({ request }) => {
    const body = await (await request.get("/llms.txt")).text()
    // Every list item opens with a link, so no entry is a bare URL.
    const items = body.split("\n").filter((l) => l.startsWith("- "))
    expect(items.length).toBeGreaterThan(10)
    for (const item of items) expect(item, item).toMatch(/^- \[[^\]]+\]\(\S+\)/)
    // No URL outside link syntax in any list item.
    for (const item of items)
      expect(
        item.replace(/\]\([^)]+\)/g, "]"),
        `${item}: no bare URL`
      ).not.toMatch(/https?:\/\//)
    // The discovery files are listed under machine access.
    expect(body).toContain(`(${SITE_ORIGIN}/.well-known/mcp/server-card.json)`)
    expect(body).toContain(`(${SITE_ORIGIN}/.well-known/api-catalog)`)
  })

  test("/llms-full.txt inlines every page", async ({ request }) => {
    const res = await request.get("/llms-full.txt")
    expect(res.status()).toBe(200)
    expect(res.headers()["content-type"]).toMatch(/^text\/(plain|markdown)/)
    const body = await res.text()
    // Each page's markdown twin opens with a `# ` title; each title appears.
    for (const path of PAGES) {
      const md = await request.get(path, {
        headers: { Accept: "text/markdown" },
      })
      if (!md.ok()) continue // reported by the twin test below
      const title = /^# (.+)$/m.exec(await md.text())?.[1]
      expect(title, `${path} twin has a title`).toBeTruthy()
      expect(body, `llms-full.txt carries ${path}`).toContain(`# ${title}`)
    }
  })
})

test.describe("sitemap and robots", () => {
  test("/sitemap.xml lists exactly the real pages", async ({ request }) => {
    const paths = await readSitemapPaths(request)
    const normal = paths.map((p) => p.replace(/\/$/, "") || "/")
    expect([...normal].sort()).toEqual([...PAGES].sort())
    for (const source of await redirectedSources())
      expect(normal).not.toContain(source)
  })

  test("every sitemap URL answers 200", async ({ request }) => {
    for (const path of await readSitemapPaths(request)) {
      const res = await request.get(path, { maxRedirects: 0 })
      expect(res.status(), path).toBe(200)
    }
  })

  test("/robots.txt allows crawling and points at the sitemap", async ({
    request,
  }) => {
    const res = await request.get("/robots.txt")
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toMatch(/^User-Agent:\s*\*/im)
    expect(body).not.toMatch(/^Disallow:\s*\/\s*$/im)
    expect(body).toContain(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`)
  })

  test("/robots.txt says the Content Signals in every group", async ({
    request,
  }) => {
    const body = await (await request.get("/robots.txt")).text()
    const groups = body.split(/\n\s*\n/).filter((g) => /^User-Agent:/im.test(g))
    expect(groups.length).toBeGreaterThanOrEqual(3)
    for (const group of groups) {
      const lines = group.trim().split("\n")
      expect(
        lines.filter((l) => /^Content-Signal:/i.test(l)),
        `${lines[0]}: one Content-Signal`
      ).toEqual([`Content-Signal: ${CONTENT_SIGNAL}`])
      // Under the group's User-Agent lines, before its rules.
      const firstRule = lines.findIndex((l) => !/^User-Agent:/i.test(l))
      expect(lines[firstRule], lines[0]).toMatch(/^Content-Signal:/)
    }
    // Nothing blocks the discovery files or the llms files.
    const disallowed = [...body.matchAll(/^Disallow:\s*(\S+)/gim)].map(
      (m) => m[1]
    )
    for (const path of [
      "/.well-known/mcp/server-card.json",
      "/.well-known/api-catalog",
      "/llms.txt",
      "/llms-full.txt",
    ])
      for (const prefix of disallowed)
        expect(path.startsWith(prefix), `${prefix} blocks ${path}`).toBe(false)
  })

  test("the sitemap leaves out the discovery and llms files", async ({
    request,
  }) => {
    const paths = await readSitemapPaths(request)
    for (const path of paths) expect(path).not.toMatch(/well-known|llms/)
  })
})

test.describe("markdown twins", () => {
  for (const path of PAGES) {
    test(`${path} answers markdown to Accept: text/markdown`, async ({
      request,
    }) => {
      const md = await request.get(path, {
        headers: { Accept: "text/markdown" },
      })
      expect(md.status()).toBe(200)
      expect(md.headers()["content-type"]).toMatch(/^text\/markdown/)
      // The token itself: `\bAccept\b` would also match `Accept-Encoding`.
      expect(listsToken(md.headers()["vary"], "Accept")).toBe(true)
      const body = await md.text()
      expect(body).toMatch(/^# \S/m)
      expect(body).not.toMatch(/<html|<body|<div/i)

      // A browser still gets HTML from the same URL, with the twin linked.
      const html = await request.get(path, {
        headers: { Accept: "text/html,application/xhtml+xml" },
      })
      expect(html.headers()["content-type"]).toMatch(/^text\/html/)
      expect(html.headers()["link"] ?? "").toContain(
        `; rel="alternate"; type="text/markdown"`
      )
    })
  }

  // The HTML branch's `Vary: Accept`: Next's page handler replaces the
  // proxy's `Vary` with its RSC list, under `next start` too, so it cannot
  // be read off a local response. `next.config.ts` declares it for every
  // twinned page (the fix aimed at Vercel); a preview has to show it lands.
  test("next.config.ts declares Vary: Accept for every twinned page", async () => {
    const rules = (await nextConfig.headers?.()) ?? []
    for (const page of [
      "/",
      "/work",
      "/work/:slug",
      "/mentoring",
      "/about",
      "/press",
    ]) {
      const rule = rules.find((r) => r.source === page)
      const vary = rule?.headers.find((h) => h.key === "Vary")?.value
      expect(listsToken(vary, "Accept"), page).toBe(true)
      // Next's own list kept, should the platform let this value win.
      expect(listsToken(vary, "rsc"), page).toBe(true)
    }
  })

  test("which Accept headers get markdown", async ({ request }) => {
    const cases: [string, "markdown" | "html"][] = [
      // What Claude Code's fetch sends: a tie at q=1 goes to markdown.
      ["text/markdown, text/html, */*", "markdown"],
      ["text/markdown", "markdown"],
      ["text/html;q=0.9, text/markdown", "markdown"],
      ["text/markdown, */*;q=0.8", "markdown"],
      // Markdown ranked below HTML, or not listed: HTML.
      ["text/markdown;q=0.9, text/html", "html"],
      ["text/markdown;q=0, text/html", "html"],
      [BROWSER_ACCEPT, "html"],
      ["*/*", "html"],
    ]
    for (const [accept, want] of cases) {
      const res = await request.get("/about", { headers: { Accept: accept } })
      expect(res.status(), accept).toBe(200)
      expect(res.headers()["content-type"], accept).toMatch(
        want === "markdown" ? /^text\/markdown/ : /^text\/html/
      )
    }
  })

  test("the negotiated answer is not noindex; the .md and /md/ URLs are", async ({
    request,
  }) => {
    const negotiated = await request.get("/about", {
      headers: { Accept: "text/markdown" },
    })
    const headers = negotiated.headers()
    expect(headers["x-robots-tag"]).toBeUndefined()
    expect(headers["link"]).toContain(`<${SITE_ORIGIN}/about>; rel="canonical"`)
    expect(listsToken(headers["vary"], "Accept")).toBe(true)
    const body = await negotiated.text()
    expect(headers["content-signal"]).toBe(CONTENT_SIGNAL)
    expect(headers["x-markdown-tokens"]).toBe(tokensOf(body))

    for (const path of ["/about.md", "/md/about", "/index.md"]) {
      const res = await request.get(path)
      expect(res.status(), path).toBe(200)
      expect(res.headers()["x-robots-tag"], path).toBe("noindex")
      expect(res.headers()["link"], path).toContain(`rel="canonical"`)
      expect(res.headers()["content-signal"], path).toBe(CONTENT_SIGNAL)
      expect(res.headers()["x-markdown-tokens"], path).toBe(
        tokensOf(await res.text())
      )
    }
  })

  test("an unknown story slug answers 404 in markdown too", async ({
    request,
  }) => {
    const md = await request.get("/work/does-not-exist", {
      headers: { Accept: "text/markdown" },
    })
    expect(md.status()).toBe(404)
  })
})

test.describe("JSON-LD", () => {
  for (const path of PAGES) {
    test(`${path}: every block parses`, async ({ page }) => {
      await page.goto(path)
      const blocks = await readJsonLdBlocks(page)
      expect(blocks.length, `${path} has JSON-LD`).toBeGreaterThan(0)
      for (const raw of blocks) {
        let parsed: unknown
        expect(() => {
          parsed = JSON.parse(raw)
        }, `${path}: block parses`).not.toThrow()
        const nodes = jsonLdNodes(parsed)
        expect(nodes.length).toBeGreaterThan(0)
        for (const node of nodes.filter((n) => n !== parsed))
          expect(
            node["@type"] ?? node["@id"],
            `${path}: node has @type or @id`
          ).toBeTruthy()
      }
    })
  }

  test("/ carries the Person node", async ({ page }) => {
    await page.goto("/")
    const nodes = (await readJsonLdBlocks(page)).flatMap((raw) =>
      jsonLdNodes(JSON.parse(raw))
    )
    const person = nodes.find((n) => hasType(n, "Person"))
    expect(person, "a Person node").toBeTruthy()
    expect(person!.name).toBe("Mladen Ružičić")
    expect(String(person!.url ?? "")).toMatch(new RegExp(`^${SITE_ORIGIN}/?$`))
    expect(person!["@id"]).toBeTruthy()
  })
})

test.describe("/mcp", () => {
  test("answers a JSON-RPC initialize", async ({ request }) => {
    const res = await request.post("/mcp", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      data: {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "e2e", version: "1.0.0" },
        },
      },
    })
    expect(res.status()).toBe(200)
    const text = await res.text()
    // Streamable HTTP may answer as JSON or as one SSE `data:` event.
    const json = JSON.parse(/^data: (.+)$/m.exec(text)?.[1] ?? text) as {
      jsonrpc: string
      id: number
      result?: { protocolVersion?: string; serverInfo?: { name?: string } }
    }
    expect(json.jsonrpc).toBe("2.0")
    expect(json.id).toBe(1)
    expect(json.result?.protocolVersion).toBeTruthy()
    expect(json.result?.serverInfo?.name).toBeTruthy()
  })
})

/** One JSON-RPC call to `/mcp` (stateless: no session needed). */
async function mcpCall(
  request: import("@playwright/test").APIRequestContext,
  method: string,
  params: Record<string, unknown>
) {
  const res = await request.post("/mcp", {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    data: { jsonrpc: "2.0", id: 2, method, params },
  })
  expect(res.status(), method).toBe(200)
  const text = await res.text()
  return JSON.parse(/^data: (.+)$/m.exec(text)?.[1] ?? text) as {
    result?: unknown
    error?: unknown
  }
}

async function mcp(
  request: import("@playwright/test").APIRequestContext,
  method: string,
  params: Record<string, unknown>
) {
  return (await mcpCall(request, method, params)) as {
    result?: { content?: { type: string; text: string }[] }
    error?: unknown
  }
}

test.describe("/mcp and hidden products", () => {
  test("a hidden product (Bistoletti) is unknown to every tool", async ({
    request,
  }) => {
    const byName = async (name: string, args: Record<string, unknown> = {}) =>
      (
        await mcp(request, "tools/call", { name, arguments: args })
      ).result?.content
        ?.map((c) => c.text)
        .join("\n") ?? ""
    const work = await byName("get_work", { slug: "bistoletti" })
    expect(work).toContain("No entry with that slug")
    expect(work.toLowerCase()).not.toContain("optician")
    const list = await byName("list_work")
    expect(list.length).toBeGreaterThan(100)
    expect(list.toLowerCase()).not.toContain("bistoletti")
    // A visible product still answers.
    expect(await byName("get_work", { slug: "ona" })).toContain("ONA")
  })
})

test.describe("discovery files", () => {
  test("/ links the API catalog and the server card in its Link header", async ({
    request,
  }) => {
    const res = await request.get("/", { headers: { Accept: BROWSER_ACCEPT } })
    const link = res.headers()["link"] ?? ""
    expect(link).toContain(
      `<${SITE_ORIGIN}/index.md>; rel="alternate"; type="text/markdown"`
    )
    expect(link).toContain(
      `<${SITE_ORIGIN}/.well-known/api-catalog>; rel="api-catalog"`
    )
    expect(link).toContain(
      `<${SITE_ORIGIN}/.well-known/mcp/server-card.json>; rel="service-desc"`
    )
  })

  test("the server card describes /mcp as it answers", async ({ request }) => {
    const res = await request.get("/.well-known/mcp/server-card.json")
    expect(res.status()).toBe(200)
    expect(res.headers()["content-type"]).toMatch(/^application\/json/)
    const card = (await res.json()) as {
      $schema: string
      name: string
      version: string
      description: string
      serverInfo: { name: string; version: string }
      url: string
      transport: { type: string }
      capabilities: { tools?: boolean }
      remotes: { type: string; url: string }[]
      tools: { name: string }[]
    }
    // The checker's fields.
    expect(card.url).toBe(`${SITE_ORIGIN}/mcp`)
    expect(card.transport.type).toBe("streamable-http")
    expect(card.capabilities.tools).toBe(true)
    // The SEP-2127 v1 fields.
    expect(card.$schema).toBe(
      "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json"
    )
    expect(card.name).toMatch(/^[a-zA-Z0-9.-]+\/[a-zA-Z0-9._-]+$/)
    expect(card.description.length).toBeLessThanOrEqual(100)
    expect(card.remotes).toContainEqual(
      expect.objectContaining({
        type: "streamable-http",
        url: `${SITE_ORIGIN}/mcp`,
      })
    )
    expect(card.version).toBe(card.serverInfo.version)

    // The same identity and tools as the live server.
    const init = await mcpCall(request, "initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "e2e", version: "1.0.0" },
    })
    expect(card.serverInfo).toEqual(
      (init.result as { serverInfo: unknown }).serverInfo
    )
    const list = await mcpCall(request, "tools/list", {})
    const names = (list.result as { tools: { name: string }[] }).tools.map(
      (t) => t.name
    )
    expect(card.tools.map((t) => t.name)).toEqual(names)
  })

  test("the API catalog is an RFC 9727 linkset for /mcp", async ({
    request,
  }) => {
    const res = await request.get("/.well-known/api-catalog")
    expect(res.status()).toBe(200)
    expect(res.headers()["content-type"]).toMatch(
      /^application\/linkset\+json; profile="https:\/\/www\.rfc-editor\.org\/info\/rfc9727"$/
    )
    const { linkset } = (await res.json()) as {
      linkset: Record<string, unknown>[]
    }
    expect(linkset).toEqual([
      {
        anchor: `${SITE_ORIGIN}/mcp`,
        "service-desc": [
          {
            href: `${SITE_ORIGIN}/.well-known/mcp/server-card.json`,
            type: "application/json",
          },
        ],
        "service-doc": [
          { href: `${SITE_ORIGIN}/llms.txt`, type: "text/plain" },
        ],
      },
    ])
    // RFC 9727 section 2: HEAD answers with the api-catalog link.
    const head = await request.head("/.well-known/api-catalog")
    expect(head.status()).toBe(200)
    expect(head.headers()["link"]).toContain(`rel="api-catalog"`)
  })
})

test.describe("share cards and structured data", () => {
  /** The `content` of a `<meta>` by `property` or `name`, from raw HTML. */
  const meta = (html: string, key: string) =>
    new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`).exec(
      html
    )?.[1]
  const title = (html: string) => /<title>([^<]*)<\/title>/.exec(html)?.[1]
  const unescape = (s: string | undefined) =>
    s
      ?.replaceAll("&amp;", "&")
      .replaceAll("&#x27;", "'")
      .replaceAll("&quot;", '"')

  for (const path of PAGES) {
    test(`${path}: og:title and twitter:title are the <title>`, async ({
      request,
    }) => {
      const html = await (await request.get(path)).text()
      const tab = unescape(title(html))
      expect(tab, `${path} has a title`).toBeTruthy()
      expect(unescape(meta(html, "og:title"))).toBe(tab)
      expect(unescape(meta(html, "twitter:title"))).toBe(tab)
    })
  }

  for (const slug of STORY_SLUGS) {
    test(`/work/${slug}: article:modified_time matches the Article`, async ({
      page,
    }) => {
      await page.goto(`/work/${slug}`)
      const modified = await page
        .locator('meta[property="article:modified_time"]')
        .getAttribute("content")
      expect(modified).toMatch(/^\d{4}-\d{2}-\d{2}/)
      const nodes = (await readJsonLdBlocks(page)).flatMap((raw) =>
        jsonLdNodes(JSON.parse(raw))
      )
      const article = nodes.find((n) => hasType(n, "Article"))
      expect(article?.dateModified).toBe(modified)
      expect(article?.datePublished).toBeUndefined()
    })
  }

  test("/ names its WebPage node <origin>/#webpage", async ({ page }) => {
    await page.goto("/")
    const nodes = (await readJsonLdBlocks(page)).flatMap((raw) =>
      jsonLdNodes(JSON.parse(raw))
    )
    const ids = nodes.map((n) => n["@id"]).filter(Boolean)
    expect(ids).toContain(`${SITE_ORIGIN}/#webpage`)
    expect(ids).not.toContain(`${SITE_ORIGIN}#webpage`)
  })
})

test.describe("images that load eagerly are not preloaded", () => {
  // React's server renderer turns a non-lazy `<img>` into a preload unless
  // its priority is low; these two load at once but must not compete with
  // the page's text (StoryColumn's lead square, the About portrait).
  for (const path of ["/about", "/work/tenderlift", "/work/zarez"]) {
    test(`${path}: no image preload from next/image`, async ({ request }) => {
      const res = await request.get(path)
      const html = await res.text()
      expect(html).not.toMatch(
        /<link rel="preload" as="image"[^>]*\/_next\/image/
      )
      expect(res.headers()["link"] ?? "").not.toContain("/_next/image")
    })
  }
})
