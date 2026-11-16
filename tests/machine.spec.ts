import { expect, test } from "@playwright/test"

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
 * `/robots.txt`, a markdown twin of every page on the same URL
 * (`Accept: text/markdown`), JSON-LD on every page, and the read-only `/mcp`
 * endpoint.
 */

const SITE_ORIGIN = "https://mladenruzicic.com"

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
      expect(md.headers()["vary"] ?? "").toMatch(/\bAccept\b/)
      const body = await md.text()
      expect(body).toMatch(/^# \S/m)
      expect(body).not.toMatch(/<html|<body|<div/i)

      // A browser still gets HTML from the same URL, also varying on Accept.
      const html = await request.get(path, {
        headers: { Accept: "text/html,application/xhtml+xml" },
      })
      expect(html.headers()["content-type"]).toMatch(/^text\/html/)
      expect(html.headers()["vary"] ?? "").toMatch(/\bAccept\b/)
    })
  }

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
async function mcp(
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
  expect(res.status()).toBe(200)
  const text = await res.text()
  return JSON.parse(/^data: (.+)$/m.exec(text)?.[1] ?? text) as {
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
