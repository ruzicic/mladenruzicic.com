import { expect, test } from "@playwright/test"

import { gotoReady } from "./helpers"

/**
 * The site's own icon set (owner, 15 Nov 2026), `app/components/primitives/
 * Icon.tsx`: no unicode arrows left in the text, and the icons in their
 * controls: the header's back arrow, the list's actions, an outgoing link
 * and the Ask button.
 */

const UNICODE_ARROWS = /[→↗←↑↓×]/

for (const path of ["/", "/work"]) {
  test(`${path}: no unicode arrows in the page text`, async ({ page }) => {
    await gotoReady(page, path)
    const text = await page.locator("body").innerText()
    expect(text).not.toMatch(UNICODE_ARROWS)
  })
}

test("the header's back arrow is the icon set's left arrow", async ({
  page,
}) => {
  await gotoReady(page, "/work")
  const back = page.locator(
    'header a[data-home-link] svg.ico[data-icon="arrow-left"]'
  )
  await expect(back).toHaveCount(1)
  await expect(back).toHaveAttribute("aria-hidden", "true")
  // 1em of the name beside it (16 Nov 2026: the arrow is in the line).
  const box = await back.boundingBox()
  const em = await back.evaluate((el) =>
    parseFloat(getComputedStyle(el).fontSize)
  )
  expect(Math.round(box!.width)).toBe(Math.round(em))
})

test("the list's actions end in the set's arrows", async ({ page }) => {
  await gotoReady(page, "/work")
  const cs = page.locator('.ledger-dest[href^="/work/"]').first()
  await expect(cs.locator('svg.ico[data-icon="arrow-right"]')).toHaveCount(1)
  const site = page.locator('.ledger-dest[target="_blank"]').first()
  await expect(site.locator('svg.ico[data-icon="arrow-up-right"]')).toHaveCount(
    1
  )
})

test("an outgoing link ends in the up-right arrow, one stroke, no fill", async ({
  page,
}) => {
  await gotoReady(page, "/work/tenderlift")
  const icon = page.locator(".cs-live svg.ico[data-icon='arrow-up-right']")
  await expect(icon).toHaveCount(1)
  const style = await icon.evaluate((el) => {
    const cs = getComputedStyle(el)
    const path = el.querySelector("path")!
    return {
      fill: cs.fill,
      cap: cs.strokeLinecap,
      join: cs.strokeLinejoin,
      width: cs.strokeWidth,
      effect: getComputedStyle(path).vectorEffect,
      viewBox: el.getAttribute("viewBox"),
    }
  })
  expect(style).toEqual({
    fill: "none",
    cap: "butt",
    join: "miter",
    width: "1.5px",
    effect: "non-scaling-stroke",
    viewBox: "0 0 16 16",
  })
})

test("an arrow's head leads on hover: it moves forward, the tail stays", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await gotoReady(page, "/work/tenderlift")
  const link = page.locator(".cs-next-link")
  await link.scrollIntoViewIfNeeded()
  const head = link.locator(".ico-head")
  expect(await head.evaluate((el) => getComputedStyle(el).translate)).toBe(
    "none"
  )
  await link.hover()
  await expect
    .poll(() => head.evaluate((el) => getComputedStyle(el).translate))
    .toBe("2px")
})

test("the Ask button carries the plus, which turns into the close", async ({
  page,
}) => {
  await gotoReady(page, "/")
  const ask = page.locator("header .ask-btn").first()
  const icons = ask.locator('svg.ico[data-icon="plus-close"]')
  await expect(icons).toHaveCount(2)
  expect(
    await icons
      .first()
      .locator(".ico-x")
      .evaluate((el) => getComputedStyle(el).rotate)
  ).toBe("none")
})

test("/dev/icons is a 404 in production", async ({ request }) => {
  test.skip(
    !process.env.CI && process.env.PLAYWRIGHT_PROD !== "1",
    "only a production build hides it"
  )
  const res = await request.get("/dev/icons")
  expect(res.status()).toBe(404)
})
