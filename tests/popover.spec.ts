import { expect, test, type Page } from "@playwright/test"

import { gotoReady } from "./helpers"

/**
 * The product popovers in the landing's story (`PopoverLockup`, the
 * `Popover` primitive). Desktop Chrome: the pointer can travel from the name
 * into the panel and use the link inside, even when the straight line there
 * crosses another product name (the ZF paragraph sits right above the TenderLift one).
 */

const OPEN = ".lk-pop:popover-open"

async function center(page: Page, selector: string) {
  const box = await page.locator(selector).first().boundingBox()
  expect(box, selector).not.toBeNull()
  return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 }
}

/** The story's popover trigger for a product, by its name. */
function trigger(page: Page, name: string) {
  return page
    .locator(".lp-story .lk")
    .filter({ has: page.locator(".lk-w", { hasText: name }) })
    .locator("button.lk-chip")
    .first()
}

test.describe("story popovers", () => {
  test("the pointer moves from the name into the panel and clicks its link", async ({
    page,
  }) => {
    await gotoReady(page, "/")
    const name = trigger(page, "ZF")
    await name.scrollIntoViewIfNeeded()
    const box = (await name.boundingBox())!
    const from = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    await page.mouse.move(from.x, from.y)
    const panel = page.locator(OPEN)
    await expect(panel).toHaveCount(1)
    const panelId = await panel.getAttribute("id")
    const link = panel.locator(".lk-pop-link")
    const href = await link.getAttribute("href")
    const to = await center(page, `#${panelId} .lk-pop-link`)

    // A straight line at a reader's pace (about 0.6s), over the gap and
    // over the next line's product name.
    const steps = 36
    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(
        from.x + ((to.x - from.x) * i) / steps,
        from.y + ((to.y - from.y) * i) / steps
      )
      await page.waitForTimeout(16)
    }
    await expect(page.locator(OPEN), "the same panel is still open").toHaveId(
      panelId!
    )
    await page.mouse.down()
    await page.mouse.up()
    await expect(page).toHaveURL(new RegExp(`${href}$`))
  })

  test("it closes soon after the pointer goes elsewhere", async ({ page }) => {
    await gotoReady(page, "/")
    const name = trigger(page, "TenderLift")
    await name.scrollIntoViewIfNeeded()
    await name.hover()
    await expect(page.locator(OPEN)).toHaveCount(1)
    await page.mouse.move(8, 8)
    await expect(page.locator(OPEN)).toHaveCount(0, { timeout: 1000 })
  })

  test("keyboard: focus opens it, Tab reaches the link, Escape returns focus", async ({
    page,
  }) => {
    await gotoReady(page, "/")
    const name = trigger(page, "ZF")
    await name.scrollIntoViewIfNeeded()
    // Focus from the keyboard (`:focus-visible`), as Tab would.
    await page.keyboard.press("Shift")
    await name.focus()
    const panel = page.locator(OPEN)
    await expect(panel).toHaveCount(1)
    await page.keyboard.press("Tab") // the close button
    await page.keyboard.press("Tab") // the link
    await expect(panel.locator(".lk-pop-link")).toBeFocused()
    await page.keyboard.press("Escape")
    await expect(page.locator(OPEN)).toHaveCount(0)
    await expect(name).toBeFocused()
  })
})
