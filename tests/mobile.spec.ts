import { expect, test, type Locator, type Page } from "@playwright/test"

import { ASK } from "@/content/ask"
import { MENTORING } from "@/content/pages/mentoring"
import { SITE } from "@/content/site"

import {
  escapeRe,
  gotoReady,
  hasHorizontalOverflow,
  HEADLINE_TOGGLE,
  LIST,
  LIST_ROWS,
  LIST_TOGGLE,
  PAGES,
  projectLinks,
  STRIP_REGION,
} from "./helpers"

/**
 * Phones (Mobile Safari project: WebKit, iPhone 14, 390x844, touch). No page
 * scrolls sideways, the main controls are at least 44px, Ask opens as a
 * side sheet with the page held behind it, and the list never loads its
 * desktop preview pictures.
 */

const MIN_TARGET = 44

async function expectTarget(
  target: Locator,
  label: string,
  { minWidth = MIN_TARGET } = {}
) {
  await expect(target, label).toBeVisible()
  const box = await target.boundingBox()
  expect(box, `${label} has a box`).not.toBeNull()
  expect(
    Math.round(box!.width),
    `${label} is at least ${minWidth}px wide`
  ).toBeGreaterThanOrEqual(minWidth)
  expect(
    Math.round(box!.height),
    `${label} is at least ${MIN_TARGET}px tall`
  ).toBeGreaterThanOrEqual(MIN_TARGET)
}

const askButton = (page: Page) =>
  page.getByRole("banner").getByRole("button", { name: ASK.ariaOpen })

for (const path of PAGES) {
  test(`${path} does not scroll sideways`, async ({ page }) => {
    await gotoReady(page, path)
    expect(await hasHorizontalOverflow(page)).toBe(false)
    // Also after scrolling to the end, where the footer and lazy media are.
    await page.keyboard.press("End")
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    expect(await hasHorizontalOverflow(page)).toBe(false)
  })
}

test.describe("touch targets", () => {
  test("top block on /: name and Ask", async ({ page }) => {
    await gotoReady(page, "/")
    await expectTarget(
      page.getByRole("banner").getByRole("button", { name: SITE.name }),
      "name"
    )
    await expectTarget(askButton(page), "Ask")
  })

  test("top block elsewhere: the home link", async ({ page }) => {
    await gotoReady(page, "/about")
    await expectTarget(
      page.getByRole("banner").getByRole("link", { name: SITE.name }),
      "home link"
    )
  })

  test("landing controls: headline pause, strip arrows, Show all", async ({
    page,
  }) => {
    await gotoReady(page, "/")
    await expectTarget(
      page.getByRole("button", { name: HEADLINE_TOGGLE }),
      "headline pause"
    )
    const recent = page.getByRole("region", {
      name: "Recent work",
      exact: true,
    })
    const prev = recent.getByRole("button", { name: /^Previous/ })
    const next = recent.getByRole("button", { name: /^Next/ })
    if (await next.isVisible()) {
      await expectTarget(prev, "strip previous")
      await expectTarget(next, "strip next")
    }
    const toggle = page
      .getByRole("region", { name: LIST.title })
      .getByRole("button", { name: LIST_TOGGLE })
    await toggle.scrollIntoViewIfNeeded()
    await expectTarget(toggle, LIST.showAllLabel)
  })

  test("testimonial pile controls on /mentoring", async ({ page }) => {
    await gotoReady(page, "/mentoring")
    const pile = page.getByRole("region", { name: MENTORING.said.title })
    await pile.scrollIntoViewIfNeeded()
    await expectTarget(
      pile.getByRole("button", { name: MENTORING.said.pauseLabel }),
      "pile pause"
    )
    await expectTarget(
      pile.getByRole("button", { name: /^\d+ \/ \d+, testimonial/ }),
      "pile counter"
    )
  })

  // Footer links are words in a row: the row is 44px tall and each word is
  // at least 24px wide (WCAG 2.5.8), with the row's gaps as spacing.
  test("footer links", async ({ page }) => {
    await gotoReady(page, "/")
    const nav = page.getByRole("contentinfo").getByRole("navigation")
    await nav.scrollIntoViewIfNeeded()
    const links = nav.getByRole("link")
    const n = await links.count()
    expect(n).toBeGreaterThan(0)
    for (let i = 0; i < n; i++)
      await expectTarget(links.nth(i), `footer link ${i + 1}`, {
        minWidth: 24,
      })
  })
})

/*
 * Ask on a phone (owner, 16 Nov 2026: "button at the top -> bottom sheet is
 * confusing"): a side sheet from the right edge, the side the button is on,
 * the full height of the screen, with its close exactly where the Ask
 * button is; the page behind is held still while it is open.
 */
test("Ask opens as a side sheet from the right, its close where Ask is", async ({
  page,
}) => {
  await gotoReady(page, "/")
  const ask = (await askButton(page).boundingBox())!
  await askButton(page).tap()
  const dialog = page.getByRole("dialog", { name: ASK.title })
  await expect(dialog).toBeVisible()
  const viewport = page.viewportSize()!

  // At rest, the sheet covers the screen edge to edge, top to bottom.
  const sheet = dialog.locator(".ask-panel")
  await expect
    .poll(async () => {
      const r = await sheet.boundingBox()
      return r ? [Math.round(r.x), Math.round(r.width)] : null
    })
    .toEqual([0, viewport.width])
  const r = (await sheet.boundingBox())!
  expect(Math.round(r.y)).toBe(0)
  expect(Math.round(r.height)).toBe(viewport.height)

  // The close is the Ask button's twin, on the same box.
  const close = dialog.getByRole("button", { name: ASK.closeLabel })
  const c = (await close.boundingBox())!
  expect(Math.round(c.x)).toBe(Math.round(ask.x))
  expect(Math.round(c.y)).toBe(Math.round(ask.y))
  expect(Math.round(c.width)).toBe(Math.round(ask.width))
  expect(Math.round(c.height)).toBeGreaterThanOrEqual(44)
  await expect(close).toHaveAttribute("data-on", "")

  await expect(
    dialog.getByRole("heading", { name: ASK.title })
  ).toBeInViewport()
  await expect(
    dialog.getByRole("textbox", { name: ASK.inputLabel })
  ).toBeInViewport()

  await dialog
    .getByRole("group", { name: ASK.suggestionsLabel })
    .getByRole("button", { name: ASK.questions[0].chip })
    .tap()
  await expect(dialog.getByText(ASK.questions[0].answer)).toBeVisible()
})

test("the page behind the Ask sheet holds still, and scrolls again after", async ({
  page,
}) => {
  await gotoReady(page, "/")
  const html = page.locator("html")
  await askButton(page).tap()
  const dialog = page.getByRole("dialog", { name: ASK.title })
  await expect(dialog).toBeVisible()
  await expect(html).toHaveAttribute("data-scroll-locked", "")
  expect(
    await page.evaluate(() => [
      getComputedStyle(document.documentElement).overflowY,
      getComputedStyle(document.documentElement).overscrollBehaviorY,
    ])
  ).toEqual(["hidden", "none"])
  // The sheet's own content scrolls inside it, and no further.
  expect(
    await dialog
      .locator(".ask-scroll")
      .evaluate((el) => [
        getComputedStyle(el).overflowY,
        getComputedStyle(el).overscrollBehaviorY,
      ])
  ).toEqual(["auto", "contain"])

  await dialog.getByRole("button", { name: ASK.closeLabel }).tap()
  await expect(dialog).toBeHidden()
  await expect(html).not.toHaveAttribute("data-scroll-locked")
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).overflowY
    )
  ).toBe("visible")
  await page.evaluate(() => window.scrollTo(0, 400))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(400)
})

test("the list loads no preview pictures on a phone", async ({ page }) => {
  const requested: string[] = []
  page.on("request", (req) => {
    if (req.resourceType() === "image") requested.push(req.url())
  })
  await gotoReady(page, "/")
  const list = page.getByRole("region", { name: LIST.title })
  await list.scrollIntoViewIfNeeded()
  await list.getByRole("button", { name: LIST_TOGGLE }).tap()
  await expect(list.getByRole("listitem")).toHaveCount(LIST_ROWS)

  // Touch the rows that have no link (a tap on a linked row navigates).
  const rows = list.getByRole("listitem")
  for (let i = 0; i < (await rows.count()); i++) {
    const row = rows.nth(i)
    if ((await row.getByRole("link").count()) === 0) {
      await row.scrollIntoViewIfNeeded()
      await row.tap()
    }
  }

  // The preview card's pictures are never given a source.
  const sources = await page
    .locator("[data-pv-still], [data-pv-capture]")
    .evaluateAll((imgs) =>
      imgs.map(
        (img) =>
          (img as HTMLImageElement).currentSrc || img.getAttribute("src") || ""
      )
    )
  expect(sources.filter(Boolean)).toEqual([])
  // And nothing fetched a full-length capture.
  expect(requested.filter((u) => /full|capture/i.test(u))).toEqual([])
})

/*
 * List rows on a phone (owner, 16 Nov 2026: "make all row items clickable
 * entirely. hide case study/website links - the whole row is clickable"):
 * each row with somewhere to go is one link, to its case study, else to its
 * website in a new tab, named "TenderLift, case study"; the two small
 * actions are hidden; an arrow at the row's end says it is a link; a row
 * with neither stays plain. Nothing nested, one tab stop per row.
 */
test("each list row is one link, at 358px too", async ({ page }) => {
  await page.setViewportSize({ width: 358, height: 780 })
  await gotoReady(page, "/")
  const list = page.getByRole("region", { name: LIST.title })
  await list.scrollIntoViewIfNeeded()
  await list.getByRole("button", { name: LIST_TOGGLE }).tap()
  await expect(list.getByRole("listitem")).toHaveCount(LIST_ROWS)
  expect(await hasHorizontalOverflow(page)).toBe(false)

  // The words are gone, on every row.
  for (const el of await list.locator(".ledger-to").all())
    await expect(el).toBeHidden()

  for (const group of LIST.groups)
    for (const r of group.rows) {
      const item = list.getByRole("listitem").filter({
        has: page.locator(".ledger-name", {
          hasText: new RegExp(`^${escapeRe(r.name)}$`),
        }),
      })
      const want = projectLinks(r.ref, r.name)
      const links = item.getByRole("link")
      const go = want.caseStudy ?? want.website
      if (!go) {
        await expect(links, `${r.name}: plain`).toHaveCount(0)
        continue
      }
      await expect(links, `${r.name}: one link`).toHaveCount(1)
      const link = links.first()
      await expect(link).toHaveAttribute("href", go.href)
      await expect(link).toHaveAccessibleName(go.rowName)
      if (want.caseStudy) await expect(link).not.toHaveAttribute("target", /.+/)
      else await expect(link).toHaveAttribute("target", "_blank")
      // The arrow at the row's end: right for a page here, up-right for a site.
      await expect(
        link.locator(
          `svg.ico[data-icon="${want.caseStudy ? "arrow-right" : "arrow-up-right"}"]`
        )
      ).toBeVisible()
      // The whole row is the target: its name and its description hit it.
      await item.scrollIntoViewIfNeeded()
      const hits = await item.evaluate((li) => {
        const a = li.querySelector(".ledger-go")!
        return [".ledger-name", ".ledger-what"].map((sel) => {
          const b = li.querySelector(sel)!.getBoundingClientRect()
          const hit = document.elementFromPoint(
            b.left + 8,
            b.top + b.height / 2
          )
          return hit === a || a.contains(hit)
        })
      })
      expect(hits, `${r.name}: name and description are the link`).toEqual([
        true,
        true,
      ])
    }
})

test("a tap on a row goes to its case study", async ({ page }) => {
  await gotoReady(page, "/work")
  const tl = projectLinks("tenderlift", "TenderLift")
  const item = page.locator("li#tenderlift")
  await item.scrollIntoViewIfNeeded()
  // A finger on the description: the row's link lies over it.
  const what = (await item.locator(".ledger-what").boundingBox())!
  await page.touchscreen.tap(what.x + 20, what.y + what.height / 2)
  await expect(page).toHaveURL(new RegExp(`${tl.caseStudy!.href}$`))
})

/**
 * How tall a link is to a finger: the run of points, down a vertical line
 * through its middle, that hit it (its words plus the invisible margin of
 * its `::before`).
 */
async function targetHeight(link: Locator) {
  return link.evaluate((el) => {
    const r = el.getBoundingClientRect()
    const x = r.left + r.width / 2
    let n = 0
    for (let y = Math.floor(r.top - 40); y <= r.bottom + 40; y++) {
      const hit = document.elementFromPoint(x, y)
      if (hit && (hit === el || el.contains(hit))) n++
    }
    return n
  })
}

test("a project's action links are at least 44px tall to a finger", async ({
  page,
}) => {
  await gotoReady(page, "/")
  const tl = projectLinks("tenderlift", "TenderLift")

  // Strip card pills: 26px of pill, 9px more above and below.
  const strip = page.getByRole("region", { name: STRIP_REGION })
  await strip.scrollIntoViewIfNeeded()
  // The card in focus, at full size (the rest sit back, scaled down).
  await expect(strip.locator(":scope > [data-on]").first()).toHaveCSS(
    "scale",
    "1"
  )
  for (const name of [tl.caseStudy!.name, tl.website!.name]) {
    const pill = strip.getByRole("link", { name })
    await expect(pill).toBeVisible()
    await expect
      .poll(() => targetHeight(pill), `strip: ${name}`)
      .toBeGreaterThanOrEqual(MIN_TARGET)
  }

  // List rows: the row is the link.
  const list = page.getByRole("region", { name: LIST.title })
  const row = list.getByRole("link", { name: tl.caseStudy!.rowName })
  await row.scrollIntoViewIfNeeded()
  expect(
    await targetHeight(row),
    "list: TenderLift row"
  ).toBeGreaterThanOrEqual(MIN_TARGET)

  // Popover links on the phone sheet.
  const chip = page
    .locator(".lp-story .lk")
    .filter({ has: page.locator(".lk-w", { hasText: /^TenderLift$/ }) })
    .locator("button.lk-chip")
  await chip.scrollIntoViewIfNeeded()
  await chip.tap()
  const sheet = page.locator(".lk-pop:popover-open")
  for (const name of [tl.caseStudy!.name, tl.website!.name])
    await expectTarget(sheet.getByRole("link", { name }), name, {
      minWidth: 0,
    })
})
