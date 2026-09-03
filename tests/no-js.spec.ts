import { expect, test } from "@playwright/test"

/**
 * "Nothing important lives only in a canvas" — docs/v3-redesign-plan.md §4.
 * Loads every route with JS disabled and checks the copy is still there:
 * `/`, `/work`, `/about`, `/uses`, `/mentoring` and one `/work/<slug>`.
 */
test.use({ javaScriptEnabled: false })

const HERO_H1 = "I build products, platforms and the systems around them."

test.describe("/ renders without JS", () => {
  test("hero h1, work rows, timeline bands and mentoring bubbles are present", async ({
    page,
  }) => {
    await page.goto("/")

    // Hero h1 — server-rendered, must not depend on hydration.
    const h1 = page.getByRole("heading", { level: 1 })
    await expect(h1).toHaveCount(1)
    await expect(h1).toHaveText(HERO_H1)

    // Selected-work rows. `work-rows` is the row container test id the shell
    // agent is adding; count its direct children so this doesn't depend on
    // the row's element type.
    const workRows = page.locator('[data-testid="work-rows"]')
    await expect(
      workRows,
      '[data-testid="work-rows"] container is present without JS'
    ).toHaveCount(1)
    const rowCount = await workRows.locator(":scope > *").count()
    expect(
      rowCount,
      "at least 5 work rows render without JS"
    ).toBeGreaterThanOrEqual(5)

    // Work-history timeline bands.
    const bands = page.locator('[data-testid="timeline-band"]')
    const bandCount = await bands.count()
    expect(
      bandCount,
      "at least 6 timeline bands render without JS"
    ).toBeGreaterThanOrEqual(6)

    // Mentoring bubbles — no dedicated test id in the brief, so this is
    // scoped to the mentoring section landmark and checks quote content
    // renders as static HTML (no client-side mount required).
    const mentoringSection = page.locator("#mentoring")
    await expect(mentoringSection).toHaveCount(1)
    const bubbles = mentoringSection.locator("li")
    const bubbleCount = await bubbles.count()
    expect(
      bubbleCount,
      "mentoring bubbles render without JS"
    ).toBeGreaterThanOrEqual(1)
  })
})

test.describe("/work renders without JS", () => {
  test("every case-study card is in the HTML document", async ({ page }) => {
    await page.goto("/work")

    const h1 = page.getByRole("heading", { level: 1 })
    await expect(h1).toHaveCount(1)

    // The index is a client island (the filter row) wrapping server-rendered
    // cards. If the island ever goes dynamic again — `useSearchParams`,
    // `cookies()`, a Suspense boundary around it — the cards fall out of the
    // static HTML into the flight payload and this drops to zero.
    const cards = page.locator('a[href^="/work/"]')
    const cardCount = await cards.count()
    expect(
      cardCount,
      "at least 20 case-study links render without JS"
    ).toBeGreaterThanOrEqual(20)

    const cardHeadings = page.getByRole("heading", { level: 3 })
    expect(
      await cardHeadings.count(),
      "each card ships its own h3 without JS"
    ).toBeGreaterThanOrEqual(20)
  })
})

for (const path of ["/about", "/uses", "/mentoring"]) {
  test.describe(`${path} renders without JS`, () => {
    test("h1 and body copy are server-rendered", async ({ page }) => {
      await page.goto(path)

      const h1 = page.getByRole("heading", { level: 1 })
      await expect(h1).toHaveCount(1)
      expect((await h1.innerText()).trim().length).toBeGreaterThan(0)

      const sectionHeadings = page.getByRole("heading", { level: 2 })
      expect(
        await sectionHeadings.count(),
        "at least one section heading renders without JS"
      ).toBeGreaterThanOrEqual(1)

      const bodyText = await page.locator("main").innerText()
      expect(
        bodyText.trim().length,
        "the page body is not empty without JS"
      ).toBeGreaterThan(400)
    })
  })
}

test.describe("/work/tenderlift renders without JS", () => {
  test("case-study body sections render", async ({ page }) => {
    await page.goto("/work/tenderlift")

    const h1 = page.getByRole("heading", { level: 1 })
    await expect(h1).toHaveCount(1)
    await expect(h1).toHaveText("TenderLift")

    // Body sections come from the MDX `## ` headings (Summary, Role and
    // scope, Context, Decisions, …) — content/v3-content-contract.md.
    const sectionHeadings = page.getByRole("heading", { level: 2 })
    const sectionCount = await sectionHeadings.count()
    expect(
      sectionCount,
      "at least one MDX body section (## heading) renders without JS"
    ).toBeGreaterThanOrEqual(1)

    const bodyText = await page.locator("body").innerText()
    expect(bodyText).toContain("Swiss public-procurement")
  })
})
