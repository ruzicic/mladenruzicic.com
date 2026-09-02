import { expect, test, type Page } from "@playwright/test"

/**
 * Keyboard-only walkthrough — docs/v3-redesign-plan.md §8 ("keyboard-only
 * walkthrough of header/pill/dialog") and §5.6 (native `<dialog>`/Popover
 * primitives, so nothing here is canvas-only).
 */

/** Tabs forward up to `maxTabs` times looking for a focused element whose
 * accessible name matches `pattern`. Returns the matching locator, or
 * `undefined` if it was never reached. */
async function tabUntil(
  page: Page,
  pattern: RegExp,
  maxTabs = 15
): Promise<ReturnType<Page["locator"]> | undefined> {
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press("Tab")
    const focused = page.locator(":focus")
    if ((await focused.count()) === 0) continue
    const name = (
      (await focused.getAttribute("aria-label")) ??
      (await focused.textContent()) ??
      ""
    ).trim()
    if (pattern.test(name)) return focused
  }
  return undefined
}

test("Tab reaches the skip link, then header nav links, then the sound toggle", async ({
  page,
}) => {
  await page.goto("/")

  await page.keyboard.press("Tab")
  const first = page.locator(":focus")
  await expect(first, "first Tab stop is the skip link").toHaveAttribute(
    "href",
    "#main"
  )

  for (const label of [/work/i, /mentoring/i, /about/i]) {
    const link = await tabUntil(page, label)
    expect(
      link,
      `header nav link matching ${label} is Tab-reachable`
    ).toBeTruthy()
  }

  const soundToggle = await tabUntil(page, /sound/i)
  expect(
    soundToggle,
    "a sound toggle control is Tab-reachable after the nav links"
  ).toBeTruthy()
})

test("focused elements keep a visible focus indicator", async ({ page }) => {
  await page.goto("/")
  await page.keyboard.press("Tab") // skip link
  await page.keyboard.press("Tab") // first real interactive element

  const style = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null
    if (!el) return null
    const cs = window.getComputedStyle(el)
    return {
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      boxShadow: cs.boxShadow,
    }
  })

  expect(style, "an element is focused").not.toBeNull()
  const hasOutline =
    style!.outlineStyle !== "none" && parseFloat(style!.outlineWidth) > 0
  const hasBoxShadow = style!.boxShadow !== "none"
  expect(
    hasOutline || hasBoxShadow,
    `focused element needs a visible indicator, got outline-style=${style!.outlineStyle} outline-width=${style!.outlineWidth} box-shadow=${style!.boxShadow}`
  ).toBe(true)
})

test("timeline band: Enter expands, Escape collapses, ArrowRight scrolls the rail", async ({
  page,
}) => {
  await page.goto("/")

  const band = page.locator('[data-testid="timeline-band"]').first()
  test.skip(
    (await band.count()) === 0,
    "no [data-testid=timeline-band] found — work-history timeline not built yet"
  )

  await band.scrollIntoViewIfNeeded()
  await band.focus()
  await expect(band).toBeFocused()

  await page.keyboard.press("Enter")
  await expect(band, "aria-expanded=true after Enter").toHaveAttribute(
    "aria-expanded",
    "true"
  )

  await page.keyboard.press("Escape")
  await expect(band, "aria-expanded=false after Escape").toHaveAttribute(
    "aria-expanded",
    "false"
  )

  const rail = page.locator('[data-testid="timeline"]')
  const scrollBefore = await rail.evaluate((el) => el.scrollLeft)
  await band.focus()
  await page.keyboard.press("ArrowRight")
  const scrollAfter = await rail.evaluate((el) => el.scrollLeft)
  expect(
    scrollAfter,
    "ArrowRight while a band has focus scrolls the timeline rail"
  ).toBeGreaterThan(scrollBefore)
})

test('"worked alongside" popover opens with Enter and closes with Escape', async ({
  page,
}) => {
  await page.goto("/")

  const alongsideHeading = page.getByRole("heading", {
    name: /worked alongside/i,
  })
  test.skip(
    (await alongsideHeading.count()) === 0,
    '"Worked alongside" heading not found — people list not built yet'
  )
  await alongsideHeading.scrollIntoViewIfNeeded()

  // Scope to the heading's own wrapping block (its parent container), not an
  // unbounded document-order scan, so this can't accidentally focus an
  // unrelated interactive element further down the page (e.g. the footer).
  const trigger = alongsideHeading
    .locator("xpath=./parent::*//*[self::button or self::a or @role='button']")
    .first()
  test.skip(
    (await trigger.count()) === 0,
    'no focusable person trigger found near "Worked alongside" — popover not built yet'
  )
  await trigger.focus()
  await page.keyboard.press("Enter")

  const popover = page.locator('[popover], [role="dialog"]').first()
  await expect(popover, "popover opens on Enter").toBeVisible({
    timeout: 2_000,
  })

  await page.keyboard.press("Escape")
  await expect(popover, "popover closes on Escape").toBeHidden()
})
