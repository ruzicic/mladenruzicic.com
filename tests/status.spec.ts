import { readFileSync } from "node:fs"
import { expect, test } from "@playwright/test"

import nextConfig from "../next.config"
import { STORY_SLUGS } from "./helpers"

/**
 * Real status codes for unknown URLs, against a production build (`CI` or
 * `PLAYWRIGHT_PROD=1`). A "Not found" page sent with 200 is a soft 404, and
 * the owner's condition for the site is no negative SEO effect.
 *
 * Under Cache Components `/work/[slug]` has a prerendered fallback shell: an
 * unknown slug that reaches it gets the shell with 200 before `notFound()`
 * runs (`next start`). `proxy.ts` therefore answers every unknown slug
 * itself, by rewriting to a path no route matches. On Vercel the target must
 * not be `/404`, a static file in the build output that a rewrite serves with
 * 200 (the 14 Nov 2026 preview did exactly that).
 *
 * The same spec runs against a deployment:
 * `PLAYWRIGHT_PROD=1 PLAYWRIGHT_BASE_URL=https://<preview> pnpm exec
 * playwright test status.spec.ts --project="Desktop Chrome"`.
 */

const PROD = !!process.env.CI || process.env.PLAYWRIGHT_PROD === "1"
test.skip(
  !PROD,
  "status codes need a production build: set CI or PLAYWRIGHT_PROD=1"
)

const HTML = { Accept: "text/html,application/xhtml+xml" }
const MARKDOWN = { Accept: "text/markdown" }

/** Unknown, hidden, wrongly cased and odd story slugs, and metadata names that are not files. */
const UNKNOWN_STORY = [
  "/work/this-does-not-exist",
  "/work/bistoletti",
  "/work/Tenderlift",
  "/work/nope.rsc",
  "/work/twitter-image",
  "/work/icon",
  "/work/apple-icon",
  "/work/_no-such-page",
]

const UNKNOWN_OTHER = [
  "/no-such-page",
  "/work/tenderlift/nope",
  "/mentoring/nope",
  "/about/nope",
  "/press/nope",
  "/_no-such-page",
]

const UNKNOWN_MARKDOWN = [
  "/work/nope.md",
  "/work/bistoletti.md",
  "/md/work/nope",
  "/md/work/bistoletti",
  "/md/nope",
  "/md",
  "/nope.md",
]

const UNKNOWN_IMAGES = [
  "/work/nope/opengraph-image",
  "/work/bistoletti/opengraph-image",
]

test.describe("unknown URLs answer a real 404", () => {
  for (const path of [...UNKNOWN_STORY, ...UNKNOWN_OTHER]) {
    test(`${path}: 404 as HTML, the not-found page, noindex`, async ({
      request,
    }) => {
      const res = await request.get(path, { headers: HTML, maxRedirects: 0 })
      expect(res.status()).toBe(404)
      // A `.rsc` URL answers the not-found page as a flight payload.
      if (path.endsWith(".rsc")) return
      const html = await res.text()
      expect(html).toMatch(/<title>Not found\b/)
      expect(html).toMatch(/<meta name="robots" content="noindex/)
    })
  }

  for (const path of UNKNOWN_STORY) {
    test(`${path}: 404 as markdown and to a router request`, async ({
      request,
    }) => {
      const md = await request.get(path, { headers: MARKDOWN, maxRedirects: 0 })
      expect(md.status()).toBe(404)
      expect(md.headers()["content-type"]).toMatch(/^text\/markdown/)
      const rsc = await request.get(path, {
        headers: { RSC: "1" },
        maxRedirects: 0,
      })
      expect(rsc.status()).toBe(404)
    })
  }

  for (const path of UNKNOWN_MARKDOWN) {
    test(`${path}: markdown 404`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 })
      expect(res.status()).toBe(404)
      expect(res.headers()["content-type"]).toMatch(/^text\/markdown/)
      expect(res.headers()["cache-control"]).toMatch(/no-store/)
    })
  }

  for (const path of UNKNOWN_IMAGES) {
    test(`${path}: 404, not an image`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 })
      expect(res.status()).toBe(404)
      expect(res.headers()["content-type"] ?? "").not.toMatch(/^image\//)
    })
  }

  test("the dev specimen page is a 404 in production", async ({ request }) => {
    const res = await request.get("/dev/diagrams", { maxRedirects: 0 })
    expect(res.status()).toBe(404)
  })
})

test.describe("known URLs keep their status", () => {
  for (const slug of STORY_SLUGS) {
    test(`/work/${slug}: 200 as HTML and markdown, its card is an image`, async ({
      request,
    }) => {
      const html = await request.get(`/work/${slug}`, { headers: HTML })
      expect(html.status()).toBe(200)
      const md = await request.get(`/work/${slug}.md`)
      expect(md.status()).toBe(200)
      const card = await request.get(`/work/${slug}/opengraph-image`)
      expect(card.status()).toBe(200)
      expect(card.headers()["content-type"]).toMatch(/^image\//)
    })
  }

  test("/work/opengraph-image is the list's card", async ({ request }) => {
    const res = await request.get("/work/opengraph-image")
    expect(res.status()).toBe(200)
    expect(res.headers()["content-type"]).toMatch(/^image\//)
  })

  test("old story slugs still redirect where next.config.ts says", async ({
    request,
  }) => {
    const redirects = (await nextConfig.redirects?.()) ?? []
    const old = redirects.filter(
      (r) => r.source.startsWith("/work/") && r.destination.startsWith("/work")
    )
    expect(old.length).toBeGreaterThan(0)
    for (const r of old) {
      const res = await request.get(r.source, { maxRedirects: 0 })
      expect(res.status(), r.source).toBe(308)
      const to = new URL(res.headers().location, "http://x")
      expect(`${to.pathname}${to.hash}`, r.source).toBe(r.destination)
    }
  })
})

test("the proxy's not-found rewrite does not target a real route or /404", () => {
  const source = readFileSync("proxy.ts", "utf8")
  const target = /const NO_ROUTE = "([^"]+)"/.exec(source)?.[1]
  expect(target, "NO_ROUTE in proxy.ts").toBeTruthy()
  expect(target).not.toBe("/404")
  expect(source).not.toMatch(/pathname = "\/404"/)
})
