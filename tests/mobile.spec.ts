import { expect, test } from "@playwright/test"

/**
 * Mobile Safari (iPhone 14, 390×844) only — see playwright.config.ts.
 * docs/v3-redesign-plan.md §5.8: "Mobile pill: … shows the current section
 * from a single IntersectionObserver …, tap opens the popover sheet …". The
 * sheet is a native Popover (§5.6), so "closed" is checked via `:popover-open`
 * rather than a guessed CSS class.
 */

test("/ has no horizontal overflow on a 390px viewport", async ({ page }) => {
  await page.goto("/")
  const fits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth
  )
  expect(
    fits,
    "document.documentElement.scrollWidth <= window.innerWidth"
  ).toBe(true)
})

test('mobile pill shows "Intro", opens a sheet with nav links, and "Work" closes it and scrolls to #work', async ({
  page,
}) => {
  await page.goto("/")

  const pill = page.locator('[data-testid="mobile-pill"]')
  await expect(pill, "[data-testid=mobile-pill] is visible").toBeVisible()
  await expect(
    pill,
    'pill shows the current section label ("Intro")'
  ).toContainText("Intro")

  await pill.tap()

  const sheetWorkLink = page.getByRole("link", { name: /^work$/i }).first()
  await expect(sheetWorkLink, "sheet nav shows a Work link").toBeVisible({
    timeout: 2_000,
  })
  await expect(
    page.getByRole("link", { name: /^mentoring$/i }).first(),
    "sheet nav shows a Mentoring link"
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: /^about$/i }).first(),
    "sheet nav shows an About link"
  ).toBeVisible()

  await sheetWorkLink.tap()
  await page.waitForTimeout(400)

  const workInView = await page.locator("#work").evaluate((el) => {
    const rect = el.getBoundingClientRect()
    return rect.top < window.innerHeight && rect.bottom > 0
  })
  expect(workInView, "tapping Work scrolls #work into view").toBe(true)

  const anyPopoverOpen = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[popover]")).some((el) =>
      (el as HTMLElement).matches(":popover-open")
    )
  )
  expect
    .soft(anyPopoverOpen, "the sheet popover closes after tapping Work")
    .toBe(false)
})
