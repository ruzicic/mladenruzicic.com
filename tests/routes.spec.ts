import { expect, test } from "@playwright/test"

import {
  collectConsoleErrors,
  readSitemapUrls,
  toPathname,
  waitForRouteReady,
} from "./helpers"

/**
 * Route-level health check, driven entirely by `/sitemap.xml` so a new
 * `content/work/*.mdx` entry is covered without touching this file — see
 * docs/v3-content-contract.md.
 *
 * TIMING. Every route is checked in one test so the sitemap is fetched once and
 * one browser context is reused, but each route is its own `test.step` with its
 * own {@link PER_ROUTE_MS} budget: a route that hangs fails as that route
 * instead of eating the whole suite's clock and reporting as "test timeout".
 * The old shape waited for `networkidle` on every route, which never settles on
 * the pages with a hero canvas, a shader header or the scroll hairline running
 * rAF, so each of those silently burned its wait before a swallowed timeout —
 * hence the old 600 s budget. {@link waitForRouteReady} waits for document
 * load, the preloader and webfonts instead, all of which do settle.
 */

/** Per-route budget. Generous for a prod build; a hang still fails fast. */
const PER_ROUTE_MS = 20_000
/** 24 routes × PER_ROUTE_MS, plus room for the sitemap fetch and startup. */
const SUITE_MS = 180_000

test.describe("sitemap routes", () => {
  test("every /sitemap.xml URL renders: 200, one <h1>, <title>, meta description, canonical, no console errors", async ({
    page,
    request,
    baseURL,
  }) => {
    test.setTimeout(SUITE_MS)

    const urls = await readSitemapUrls(request, baseURL!)
    expect(urls.length, "sitemap.xml lists at least one URL").toBeGreaterThan(0)

    const consoleErrors = collectConsoleErrors(page)
    /** Routes that failed at least one soft check, for the summary at the end. */
    const failed: string[] = []

    for (const url of urls) {
      const pathname = toPathname(url, baseURL!)

      await test.step(pathname, async () => {
        const errorsBefore = consoleErrors.errors.length
        const softFailuresBefore = test.info().errors.length
        const deadline = Date.now() + PER_ROUTE_MS
        const left = () => Math.max(1_000, deadline - Date.now())

        const response = await page.goto(pathname, { timeout: left() })
        expect.soft(response?.status(), `${pathname} responds 200`).toBe(200)

        await expect
          .soft(page.locator("h1"), `${pathname} has exactly one <h1>`)
          .toHaveCount(1, { timeout: left() })

        await expect
          .soft(page, `${pathname} has a non-empty <title>`)
          .toHaveTitle(/.+/, { timeout: left() })

        const description = page.locator('meta[name="description"]')
        await expect
          .soft(description, `${pathname} has a meta description tag`)
          .toHaveCount(1, { timeout: left() })
        const descriptionContent = await description
          .getAttribute("content")
          .catch(() => null)
        expect
          .soft(
            descriptionContent !== null && descriptionContent.trim().length > 0,
            `${pathname} meta description is non-empty`
          )
          .toBe(true)

        const canonical = page.locator('link[rel="canonical"]')
        await expect
          .soft(canonical, `${pathname} has a canonical link`)
          .toHaveCount(1, { timeout: left() })

        // Hydration, the preloader and webfonts settle before errors are judged
        // — a route with a continuous rAF loop never goes network-idle.
        await waitForRouteReady(page, left())

        const newErrors = consoleErrors.errors.slice(errorsBefore)
        expect
          .soft(newErrors, `${pathname} logs zero console errors`)
          .toEqual([])

        if (test.info().errors.length > softFailuresBefore)
          failed.push(pathname)
      })
    }

    test.info().annotations.push({
      type: "routes:checked",
      description: `${urls.length} sitemap route(s); ${failed.length} with failures${
        failed.length ? `: ${failed.join(", ")}` : ""
      }`,
    })
  })
})

test.describe("redirects and error routes", () => {
  test("/mentorship redirects 308 to /mentoring", async ({
    request,
    baseURL,
  }) => {
    const redirect = await request.get(`${baseURL}/mentorship`, {
      maxRedirects: 0,
    })
    expect(redirect.status()).toBe(308)
    const location = redirect.headers()["location"]
    expect(location).toBeTruthy()
    expect(new URL(location!, baseURL).pathname).toBe("/mentoring")

    const followed = await request.get(`${baseURL}/mentorship`)
    expect(followed.status()).toBe(200)
    expect(new URL(followed.url()).pathname).toBe("/mentoring")
  })

  test("/cv redirects to /cv.pdf", async ({ request, baseURL }) => {
    const redirect = await request.get(`${baseURL}/cv`, { maxRedirects: 0 })
    expect([301, 302, 307, 308]).toContain(redirect.status())
    const location = redirect.headers()["location"]
    expect(location).toBeTruthy()
    expect(new URL(location!, baseURL).pathname).toBe("/cv.pdf")

    const followed = await request.get(`${baseURL}/cv`)
    expect(followed.status()).toBe(200)
    expect(followed.headers()["content-type"] ?? "").toContain("pdf")
  })

  test("/work/does-not-exist renders the 404 page", async ({ page }) => {
    const response = await page.goto("/work/does-not-exist")
    expect(response?.status()).toBe(404)

    await expect(page.locator("h1")).toHaveCount(1)
    await expect(page.getByText("404", { exact: false }).first()).toBeVisible()
  })
})
