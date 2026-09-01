import { expect, test } from "@playwright/test"

/**
 * Desktop Chrome only (see playwright.config.ts). Cross-page transitions —
 * docs/v3-redesign-plan.md §5.3 (`<ViewTransition>`, shared `work-art-${slug}`
 * elements) and §5.4 ("Cache Components keeps up to three routes mounted in
 * `<Activity mode=\"hidden\">`, so an expanded timeline band … survives
 * back/forward for free").
 */

test("clicking the first work row's link navigates to its case study with a matching h1", async ({
  page,
}) => {
  await page.goto("/")

  const firstRow = page.locator('[data-testid="work-rows"] > *').first()
  await expect(firstRow).toBeVisible()
  const rowTitle = (
    await firstRow.locator("h1, h2, h3").first().textContent()
  )?.trim()

  // The design's expand affordance is a "⤢" icon link on the row; we match
  // any link into /work/<slug> so this also passes against the current
  // "Case study →" skeleton link before the shell agent wires up the icon.
  const link = firstRow.locator('a[href^="/work/"]').first()
  await expect(link, "first work row links into /work/<slug>").toBeVisible()
  const href = await link.getAttribute("href")

  await link.click()

  await expect(page).toHaveURL(/\/work\/[a-z0-9-]+$/)
  if (href) expect(page.url()).toContain(href)

  const h1 = page.getByRole("heading", { level: 1 })
  await expect(h1).toHaveCount(1)
  if (rowTitle) {
    await expect(
      h1,
      "case-study h1 matches the work row's title"
    ).toHaveText(rowTitle)
  }

  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
})

test("back navigation preserves an expanded timeline band when the route stays mounted", async ({
  page,
}) => {
  await page.goto("/")

  const band = page.locator('[data-testid="timeline-band"]').first()
  if ((await band.count()) === 0) {
    test.info().annotations.push({
      type: "skip-reason",
      description:
        "no [data-testid=timeline-band] found — work-history timeline not built yet",
    })
    test.skip()
    return
  }

  await band.click()
  const expandedBefore = await band.getAttribute("aria-expanded")

  const link = page
    .locator('[data-testid="work-rows"] a[href^="/work/"]')
    .first()
  await link.click()
  await expect(page).toHaveURL(/\/work\//)

  await page.goBack()
  await expect(page).toHaveURL(/\/$/)

  const expandedAfter = await page
    .locator('[data-testid="timeline-band"]')
    .first()
    .getAttribute("aria-expanded")

  if (expandedAfter !== expandedBefore) {
    test.info().annotations.push({
      type: "soft-fail",
      description: `expanded timeline-band state not preserved across back navigation (Cache Components route retention): before="${expandedBefore}" after="${expandedAfter}"`,
    })
  }

  expect
    .soft(
      expandedAfter,
      "expanded timeline-band state survives back navigation via Cache Components route retention"
    )
    .toBe(expandedBefore)
})
