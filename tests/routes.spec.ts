import { expect, test } from "@playwright/test"

import { collectConsoleErrors, readSitemapUrls, toPathname } from "./helpers"

/**
 * Route-level health check, driven entirely by `/sitemap.xml` so a new
 * `content/work/*.mdx` entry is covered without touching this file — see
 * docs/v3-content-contract.md.
 */

test.describe("sitemap routes", () => {
  test("every /sitemap.xml URL renders: 200, one <h1>, <title>, meta description, canonical, no console errors", async ({
    page,
    request,
    baseURL,
  }) => {
    test.setTimeout(180_000)

    const urls = await readSitemapUrls(request, baseURL!)
    expect(urls.length, "sitemap.xml lists at least one URL").toBeGreaterThan(0)

    const consoleErrors = collectConsoleErrors(page)

    for (const url of urls) {
      const pathname = toPathname(url, baseURL!)

      await test.step(pathname, async () => {
        const errorsBefore = consoleErrors.errors.length

        const response = await page.goto(pathname)
        expect.soft(response?.status(), `${pathname} responds 200`).toBe(200)

        await expect
          .soft(page.locator("h1"), `${pathname} has exactly one <h1>`)
          .toHaveCount(1)

        await expect
          .soft(page, `${pathname} has a non-empty <title>`)
          .toHaveTitle(/.+/)

        const description = page.locator('meta[name="description"]')
        await expect
          .soft(description, `${pathname} has a meta description tag`)
          .toHaveCount(1)
        const descriptionContent = await description.getAttribute("content")
        expect
          .soft(
            descriptionContent && descriptionContent.trim().length > 0,
            `${pathname} meta description is non-empty`
          )
          .toBe(true)

        const canonical = page.locator('link[rel="canonical"]')
        await expect
          .soft(canonical, `${pathname} has a canonical link`)
          .toHaveCount(1)

        // Let hydration and any client fetches settle before judging errors.
        await page.waitForLoadState("networkidle").catch(() => {})

        const newErrors = consoleErrors.errors.slice(errorsBefore)
        expect
          .soft(newErrors, `${pathname} logs zero console errors`)
          .toEqual([])
      })
    }
  })
})

test.describe("redirects and error routes", () => {
  test("/mentorship redirects 308 to /mentoring", async ({ request, baseURL }) => {
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
