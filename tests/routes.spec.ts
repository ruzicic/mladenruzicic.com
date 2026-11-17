import { expect, test } from "@playwright/test"

import nextConfig from "../next.config"
import { BARE_PAGES, collectConsoleErrors, PAGES, STORY_SLUGS } from "./helpers"

/**
 * Route health: every real page answers 200 with one `<h1>`, a title, a meta
 * description and a canonical; every redirect `next.config.ts` declares
 * answers 308 to its destination; unknown paths answer 404 with a page of
 * their own.
 */

const CANONICAL_ORIGIN = "https://mladenruzicic.com"

test.describe("pages", () => {
  for (const path of PAGES) {
    test(`${path} renders: 200, one h1, title, description, canonical`, async ({
      page,
    }) => {
      const log = collectConsoleErrors(page)
      const res = await page.goto(path)
      expect(res?.status(), `${path} status`).toBe(200)

      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1)
      await expect(page.locator("h1")).toHaveCount(1)

      await expect(page).toHaveTitle(/\S/)
      const description = page.locator('head meta[name="description"]')
      await expect(description).toHaveCount(1)
      expect(
        (await description.getAttribute("content"))?.trim().length ?? 0,
        `${path} meta description is not empty`
      ).toBeGreaterThan(20)

      const canonical = page.locator('head link[rel="canonical"]')
      await expect(canonical).toHaveCount(1)
      const href = await canonical.getAttribute("href")
      expect(
        new URL(href ?? "", CANONICAL_ORIGIN).pathname.replace(/\/$/, "") ||
          "/",
        `${path} canonical points at itself`
      ).toBe(path)
      expect(href?.startsWith(CANONICAL_ORIGIN), "canonical is absolute").toBe(
        true
      )

      await expect(page.getByRole("main")).toBeVisible()
      await expect(page.getByRole("banner")).toBeVisible()
      if (BARE_PAGES.includes(path)) {
        // Only the CV: no footer, and no Ask whose no-JS link needs one.
        await expect(page.getByRole("contentinfo")).toHaveCount(0)
        await expect(page.locator(".ask-btn")).toHaveCount(0)
      } else {
        await expect(page.getByRole("contentinfo")).toBeVisible()
        // `#contact` is where the no-JS Ask link points, on every page.
        await expect(page.locator("#contact")).toHaveCount(1)
      }

      expect(log.errors, `${path} console errors`).toEqual([])
    })
  }
})

// The site's icon is its own mark (app/icon.svg), with PNG and ICO copies
// made from it for the browsers and devices that take no SVG.
test.describe("icons", () => {
  const ICONS: [string, string][] = [
    ["/favicon.ico", "image/x-icon"],
    ["/icon.svg", "image/svg+xml"],
    ["/icon1.png", "image/png"],
    ["/apple-icon.png", "image/png"],
    // The manifest's maskable icon (public/), full bleed.
    ["/icon-512.png", "image/png"],
  ]
  for (const [path, type] of ICONS) {
    test(`${path} answers 200 as ${type}`, async ({ request }) => {
      const res = await request.get(path)
      expect(res.status()).toBe(200)
      expect(res.headers()["content-type"]).toContain(type)
      expect((await res.body()).length).toBeGreaterThan(200)
    })
  }

  test("the page head links the favicon, the icons and the apple icon", async ({
    page,
  }) => {
    await page.goto("/")
    const head = page.locator("head")
    await expect(
      head.locator('link[rel="icon"][href^="/favicon.ico"]')
    ).toHaveCount(1)
    await expect(
      head.locator('link[rel="icon"][href^="/icon.svg"][type="image/svg+xml"]')
    ).toHaveCount(1)
    await expect(
      head.locator('link[rel="icon"][href^="/icon1.png"][sizes="192x192"]')
    ).toHaveCount(1)
    await expect(
      head.locator(
        'link[rel="apple-touch-icon"][href^="/apple-icon.png"][sizes="180x180"]'
      )
    ).toHaveCount(1)
    await expect(head.locator('link[href*="mladen-ruzicic"]')).toHaveCount(0)
  })
})

test.describe("redirects", () => {
  test("every redirect in next.config.ts answers 308 to its destination", async ({
    request,
  }) => {
    const redirects = (await nextConfig.redirects?.()) ?? []
    expect(redirects.length).toBeGreaterThan(0)
    for (const r of redirects) {
      expect(r.permanent, `${r.source} is permanent`).toBe(true)
      const res = await request.get(r.source, { maxRedirects: 0 })
      expect(res.status(), `${r.source} status`).toBe(308)
      const location = new URL(res.headers()["location"] ?? "", "http://x")
      expect(`${location.pathname}${location.hash}`, r.source).toBe(
        r.destination
      )
    }
  })

  test("/uses lands on /about", async ({ page }) => {
    await page.goto("/uses")
    await expect(page).toHaveURL(/\/about$/)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })

  test("a retired slug lands on its row on /work, or on /work", async ({
    page,
  }) => {
    await page.goto("/work/boxium")
    await expect(page).toHaveURL(/\/work$/)
  })

  // Removed from the site (13 Nov 2026): no page, no row, no tile.
  for (const slug of ["avataurus", "montepop"]) {
    test(`/work/${slug} lands on /work`, async ({ page }) => {
      await page.goto(`/work/${slug}`)
      await expect(page).toHaveURL(/\/work$/)
    })
  }

  // Every public path the previous site (main, v1) served or linked: none may
  // 404. Entries are [path, status]; redirects are checked by the loop above.
  const OLD_SITE: [string, number][] = [
    ["/", 200],
    ["/about", 200],
    ["/work", 200],
    ["/uses", 308],
    // A page since 17 Nov 2026 (a redirect to the PDF before).
    ["/cv", 200],
    ["/cv.pdf", 200],
    ["/manifest.json", 200],
    ["/mladen-ruzicic.png", 200],
    ["/sitemap.xml", 200],
    ["/robots.txt", 200],
    ["/icon", 308],
    ["/opengraph-image.png", 308],
    ["/static/images/opengraph-image.png", 308],
    ["/opengraph-image", 200],
    ["/mentorship", 308],
    ...[
      "bruno",
      "eyal",
      "jobany",
      "juliana",
      "maciek",
      "monikka",
      "richard",
    ].map((n): [string, number] => [`/static/mentees/${n}.webp`, 200]),
  ]
  for (const [path, status] of OLD_SITE) {
    test(`old URL ${path} answers ${status}, not 404`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 })
      expect(res.status()).toBe(status)
    })
  }

  test("/mentorship lands on /mentoring", async ({ page }) => {
    await page.goto("/mentorship")
    await expect(page).toHaveURL(/\/mentoring$/)
  })

  test("no story slug is redirected", async () => {
    const redirects = (await nextConfig.redirects?.()) ?? []
    const sources = redirects.map((r) => r.source)
    for (const slug of STORY_SLUGS)
      expect(sources).not.toContain(`/work/${slug}`)
  })
})

test.describe("not found", () => {
  test("an unknown story's share card is a 404, not a render", async ({
    request,
  }) => {
    for (const slug of ["nope", "boxium"]) {
      const res = await request.get(`/work/${slug}/opengraph-image`)
      expect(res.status(), slug).toBe(404)
    }
  })

  for (const path of ["/work/does-not-exist", "/no-such-page"]) {
    test(`${path} answers 404 with the not-found page`, async ({ page }) => {
      const res = await page.goto(path)
      expect(res?.status()).toBe(404)
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1)
      await expect(page).toHaveTitle(/\S/)
      await expect(
        page.getByRole("main").getByRole("link", { name: "Home" })
      ).toHaveAttribute("href", "/")
      const robots = await page
        .locator('meta[name="robots"]')
        .evaluateAll((els) => els.map((e) => e.getAttribute("content") ?? ""))
      expect(
        robots.some((c) => /noindex/.test(c)),
        "robots noindex"
      ).toBe(true)
    })
  }
})
