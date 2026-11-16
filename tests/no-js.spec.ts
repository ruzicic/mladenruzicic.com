import { expect, test } from "@playwright/test"

import { ASK } from "@/content/ask"
import { HOME } from "@/content/pages/home"
import { TESTIMONIALS } from "@/content/testimonials"

import { LIST, LIST_ROWS, PAGES, projectLinks, STRIP_REGION } from "./helpers"

/**
 * The site without JavaScript (PLAN.md §2 "Works without JavaScript"): all
 * copy readable, the headline a full sentence showing its first phrase, the
 * list complete, story cards plain links, Ask a link to the contact line,
 * every testimonial present.
 */
test.use({ javaScriptEnabled: false })

for (const path of PAGES) {
  test(`${path}: every block of copy is rendered and visible`, async ({
    page,
  }) => {
    await page.goto(path)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

    // Every text block in main and the footer paints: nothing waits for
    // JavaScript to fade in or to be revealed. Visually hidden text (the
    // 1px screen-reader copy) is skipped; it is meant to be invisible.
    const hidden = await page.evaluate(() => {
      const blocks = document.querySelectorAll(
        "main :is(h1, h2, h3, p, li, dt, dd, blockquote, figcaption), footer :is(p, li, a)"
      )
      const out: string[] = []
      for (const el of blocks) {
        const text = (el.textContent ?? "").trim()
        if (!text) continue
        const r = el.getBoundingClientRect()
        if (r.width <= 1 && r.height <= 1) continue // visually hidden copy
        if (el.closest("[aria-hidden='true']")) continue
        // A closed <details> (a story's roles) is collapsed by the browser,
        // not by script: its summary shows, and it opens without JavaScript
        // (story-roles.spec.ts).
        const fold = el.closest("details")
        if (fold && !fold.open && !el.closest("summary")) continue
        const visible = el.checkVisibility({
          opacityProperty: true,
          visibilityProperty: true,
        })
        if (!visible) out.push(`${el.tagName}: ${text.slice(0, 60)}`)
      }
      return out
    })
    expect(hidden, `${path}: copy hidden without JavaScript`).toEqual([])
  })
}

test.describe("/", () => {
  test("the headline is one full sentence and shows its first phrase", async ({
    page,
  }) => {
    await page.goto("/")
    const h1 = page.getByRole("heading", { level: 1 })
    await expect(h1).toHaveAccessibleName(HOME.headline.srText)
    await expect(h1).toContainText(HOME.headline.prefix)
    await expect(h1).toContainText(HOME.headline.phrases[0].phrase)
    // The swapping line paints the first phrase.
    const slot = page.locator("#headline h1 > [aria-hidden='true']").last()
    await expect(slot).toBeVisible()
    await expect(slot).toHaveText(HOME.headline.phrases[0].phrase)
  })

  test(`the list is complete: all ${LIST_ROWS} rows`, async ({ page }) => {
    await page.goto("/")
    const list = page.getByRole("region", { name: LIST.title })
    await expect(list.getByRole("listitem")).toHaveCount(LIST_ROWS)
    for (const group of LIST.groups)
      for (const row of group.rows)
        await expect(
          list.getByRole("listitem").filter({ hasText: row.name }).first()
        ).toBeVisible()
    // The toggle needs JavaScript, so it is not offered.
    await expect(list.getByRole("button")).toHaveCount(0)
  })

  test("card actions are plain links; the cards are not", async ({ page }) => {
    await page.goto("/")
    const strip = page.getByRole("region", { name: STRIP_REGION })
    const studies = HOME.recentWork.cards.flatMap((c) => {
      if (c.kind !== "work") return []
      const href = projectLinks(c.ref, c.title).caseStudy?.href
      return href ? [href] : []
    })
    expect(studies.length).toBeGreaterThan(0)
    await expect(strip.locator(":scope > a:not(.lc-end)")).toHaveCount(0)
    for (const href of new Set(studies)) {
      const link = strip.locator(`.lc-acts a[href="${href}"]`)
      await expect(link.first()).toBeVisible()
      await expect(link.first()).not.toHaveAttribute("aria-haspopup", /.+/)
    }
    // Following one is a real navigation to the case study.
    await strip.locator(`.lc-acts a[href="${studies[0]}"]`).first().click()
    await expect(page).toHaveURL(new RegExp(`${studies[0]}$`))
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })

  test("the strip scrolls natively", async ({ page }) => {
    await page.goto("/")
    const strip = page.getByRole("region", { name: STRIP_REGION })
    const before = await strip.evaluate((el) => el.scrollLeft)
    await strip.evaluate((el) =>
      el.scrollBy({ left: 600, behavior: "instant" })
    )
    await expect
      .poll(() => strip.evaluate((el) => el.scrollLeft))
      .toBeGreaterThan(before)
  })
})

test("the Ask button is a link to the contact line on every page", async ({
  page,
}) => {
  for (const path of PAGES) {
    await page.goto(path)
    const ask = page
      .getByRole("banner")
      .getByRole("link", { name: ASK.ariaOpen })
    await expect(ask, path).toHaveAttribute("href", "#contact")
    await expect(page.locator("#contact"), path).toBeVisible()
    await expect(
      page
        .locator("#contact")
        .locator('a[href="https://cal.com/ruzicic/15m-discovery-session"]'),
      `${path}: the contact line has the booking link`
    ).toBeAttached()
  }
})

test("/mentoring: every testimonial is present and readable", async ({
  page,
}) => {
  await page.goto("/mentoring")
  const main = page.getByRole("main")
  for (const t of TESTIMONIALS) {
    await expect(main.getByText(t.author, { exact: true })).toBeVisible()
    await expect(main.getByText(t.quote)).toBeVisible()
  }
  await expect(main.getByRole("figure")).toHaveCount(TESTIMONIALS.length)
})

test("/work lists every row with its id", async ({ page }) => {
  await page.goto("/work")
  for (const group of LIST.groups)
    for (const row of group.rows)
      await expect(page.locator(`[id="${row.ref}"]`)).toBeVisible()
})

// Owner, 12 Nov: no arrows in the footer. Links out still open a new tab.
test("footer links to other sites open a new tab and carry no arrow", async ({
  page,
}) => {
  for (const path of ["/", "/work/tenderlift", "/mentoring", "/about"]) {
    await page.goto(path)
    const footer = page.locator("[data-site-footer]")
    const outbound = footer.locator('a[href^="http"]')
    const count = await outbound.count()
    expect(count, `${path}: has links out`).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      const link = outbound.nth(i)
      const href = await link.getAttribute("href")
      await expect(link, `${path} ${href}`).toHaveAttribute("target", "_blank")
      await expect(link, `${path} ${href}`).toHaveAttribute("rel", /noopener/)
    }
    await expect(
      footer.locator("svg.ico"),
      `${path}: no arrows in the footer`
    ).toHaveCount(0)
  }
})
