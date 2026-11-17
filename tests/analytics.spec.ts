import { expect, test, type Locator, type Page } from "@playwright/test"

import { ASK } from "@/content/ask"
import { HOME } from "@/content/pages/home"
import { SITE } from "@/content/site"

import { gotoReady, projectLinks, timedDrag } from "./helpers"

/**
 * The six Fathom events (owner, 2026-11-17; `lib/analytics.ts`). Each fires
 * once, under its fixed name, on the interaction it counts, and nothing
 * else fires. The suite's builds have no `NEXT_PUBLIC_FATHOM_SITE_ID`, so
 * nothing reaches Fathom: the names are read through the test seam,
 * `window.__fathomEvents`, an array `track()` appends each name to when the
 * page defines it (here, before any script runs). The last test checks that
 * such a build sends nothing at all.
 */

declare global {
  interface Window {
    __fathomEvents?: string[]
  }
}

test.beforeEach(async ({ page, context }) => {
  await page.addInitScript(() => {
    window.__fathomEvents = []
  })
  // Other sites (a product's website, MentorCruise, the booking page) are
  // never really visited.
  await context.route(/^https:\/\/(?!localhost)/, (r) =>
    r.fulfill({ status: 200, contentType: "text/html", body: "ok" })
  )
})

const events = (page: Page) => page.evaluate(() => window.__fathomEvents ?? [])

/** Exactly `want`, in order, once the page has had time to send more. */
async function expectEvents(page: Page, want: string[]) {
  await expect.poll(() => events(page)).toEqual(want)
  await page.waitForTimeout(250)
  expect(await events(page)).toEqual(want)
}

/** Clicks a link that opens a new tab and closes the tab. */
async function clickNewTab(page: Page, link: Locator, button?: "middle") {
  const tab = page.context().waitForEvent("page")
  await link.click(button ? { button } : undefined)
  await (await tab).close()
}

/** Every row of the list, with its links as content defines them. */
const ROWS = HOME.list.groups.flatMap((g) =>
  g.rows.map((r) => ({ ref: r.ref, links: projectLinks(r.ref, r.name) }))
)

test.describe("1. Ask", () => {
  test("open, a prepared question, a typed one: three names, no text", async ({
    page,
  }) => {
    await gotoReady(page, "/")
    await page
      .getByRole("banner")
      .getByRole("button", { name: ASK.ariaOpen })
      .click()
    const dialog = page.getByRole("dialog", { name: ASK.title })
    await expect(dialog).toBeVisible()
    await expectEvents(page, ["ask: open"])

    const first = ASK.questions[0]
    await dialog
      .getByRole("group", { name: ASK.suggestionsLabel })
      .getByRole("button", { name: first.chip })
      .click()
    await expect(dialog.getByText(first.answer)).toBeVisible()
    await expectEvents(page, ["ask: open", "ask: prepared question"])
    // The answer has finished: the panel takes the next question.
    await expect(
      dialog.getByRole("button", { name: ASK.sendLabel })
    ).not.toHaveAttribute("aria-disabled", "true")

    const typed = "Which football team does he support?"
    const box = dialog.getByRole("textbox", { name: ASK.inputLabel })
    await box.fill(typed)
    await box.press("Enter")
    await expect(dialog.getByText(ASK.fallback.answer)).toBeVisible()
    await expectEvents(page, [
      "ask: open",
      "ask: prepared question",
      "ask: typed question",
    ])

    // 5. The fallback's email offer, from inside the panel.
    await dialog.locator('a[href^="mailto:"]').first().click()
    await expectEvents(page, [
      "ask: open",
      "ask: prepared question",
      "ask: typed question",
      "contact: email",
    ])
  })
})

test.describe("2. A product's website", () => {
  test("the Website action of a list row, by click and by middle click", async ({
    page,
  }) => {
    const row = ROWS.find((r) => r.links.website)!
    await gotoReady(page, "/work")
    const link = page
      .getByRole("main")
      .getByRole("link", { name: row.links.website!.name, exact: true })
    await link.hover()
    await clickNewTab(page, link)
    await expectEvents(page, [`website: ${row.ref}`])
    await clickNewTab(page, link, "middle")
    await expectEvents(page, [`website: ${row.ref}`, `website: ${row.ref}`])
  })

  test("a phone's whole-row link, when it leads to the website", async ({
    page,
  }) => {
    const row = ROWS.find((r) => !r.links.caseStudy && r.links.website)
    test.skip(!row, "no row with a website and no case study")
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoReady(page, "/work")
    const link = page
      .getByRole("main")
      .getByRole("link", { name: row!.links.website!.rowName, exact: true })
    await link.scrollIntoViewIfNeeded()
    await clickNewTab(page, link)
    await expectEvents(page, [`website: ${row!.ref}`])
  })

  test("a phone's whole-row link to a case study is not a website click", async ({
    page,
  }) => {
    const row = ROWS.find((r) => r.links.caseStudy)!
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoReady(page, "/work")
    await page
      .getByRole("main")
      .getByRole("link", { name: row.links.caseStudy!.rowName, exact: true })
      .click()
    await expect(page).toHaveURL(new RegExp(`${row.links.caseStudy!.href}$`))
    await expectEvents(page, [])
  })

  test("the site link on a case study's cover", async ({ page }) => {
    await gotoReady(page, "/work/tenderlift")
    const link = page.locator(".cs-cover a[data-external]")
    await expect(link).toHaveCount(1)
    await clickNewTab(page, link)
    await expectEvents(page, ["website: tenderlift"])
  })
})

test.describe("3. The CV", () => {
  test("About's button and /cv's Download PDF; the footer's CV is the page", async ({
    page,
  }) => {
    await gotoReady(page, "/about")
    let download = page.waitForEvent("download")
    await page.getByRole("main").locator(`a[href="${SITE.links.cv}"]`).click()
    expect((await download).suggestedFilename()).toBe(SITE.links.cvFilename)
    await expectEvents(page, ["cv: download"])

    // The footer's "CV" opens the page (owner, 17 Nov 2026): no download,
    // no event of its own.
    await page
      .getByRole("contentinfo")
      .getByRole("link", { name: "CV" })
      .click()
    await expect(page).toHaveURL(/\/cv$/)
    await expectEvents(page, ["cv: download"])

    // /cv's Download PDF is in its top row, where Ask is elsewhere.
    download = page.waitForEvent("download")
    await page
      .getByRole("banner")
      .getByRole("link", { name: "Download PDF" })
      .click()
    expect((await download).suggestedFilename()).toBe(SITE.links.cvFilename)
    await expectEvents(page, ["cv: download", "cv: download"])
  })
})

test.describe("4 and 5. Mentoring and email", () => {
  test("MentorCruise, the call and the email on /mentoring", async ({
    page,
  }) => {
    await gotoReady(page, "/mentoring")
    const main = page.getByRole("main")
    const profiles = main.locator(`a[href="${SITE.links.mentorcruise}"]`)
    const n = await profiles.count()
    expect(n, "a MentorCruise link on /mentoring").toBeGreaterThan(0)
    for (let i = 0; i < n; i++) await clickNewTab(page, profiles.nth(i))
    const mc = Array<string>(n).fill("mentoring: mentorcruise")
    await expectEvents(page, mc)

    await clickNewTab(page, main.locator(`a[href="${SITE.links.booking}"]`))
    await expectEvents(page, [...mc, "mentoring: call"])

    await main.locator('a[href^="mailto:"]').click()
    await expectEvents(page, [...mc, "mentoring: call", "contact: email"])
  })

  test('About\'s "Write to me"', async ({ page }) => {
    await gotoReady(page, "/about")
    await page.getByRole("main").locator('a[href^="mailto:"]').first().click()
    await expectEvents(page, ["contact: email"])
  })

  test("an email link carries its name in the HTML, whatever its href becomes", async ({
    request,
  }) => {
    // On the live site Cloudflare rewrites `mailto:` hrefs into
    // `/cdn-cgi/l/email-protection` links: the name must not depend on it.
    for (const path of ["/about", "/mentoring"]) {
      const html = await (await request.get(path)).text()
      const mails = html.match(/<a\b[^>]*href="mailto:[^"]*"[^>]*>/g) ?? []
      expect(mails.length, path).toBeGreaterThan(0)
      for (const a of mails)
        expect(a, path).toContain('data-track="contact: email"')
    }
  })
})

test.describe("6. Recent work", () => {
  const cards = HOME.recentWork.cards
  const strip = (page: Page) => page.locator("[data-strip]")
  const card = (page: Page, i: number) =>
    page.locator("[data-strip] > [data-card]").nth(i)
  const counter = (page: Page) => page.locator("#recent-work .lp-count")

  async function open(page: Page) {
    await gotoReady(page, "/")
    await strip(page).scrollIntoViewIfNeeded()
    await expect(counter(page)).toHaveText(`1 / ${cards.length}`)
  }

  async function clickAt(page: Page, el: Locator, fx = 0.5, fy = 0.55) {
    const b = (await el.boundingBox())!
    const x = Math.min(b.x + b.width * fx, page.viewportSize()!.width - 4)
    await page.mouse.click(Math.max(4, x), b.y + b.height * fy)
  }

  const first = cards[0]
  const firstRef = first.kind === "work" ? first.ref : ""

  test("a click on the card in focus opens it: one event", async ({ page }) => {
    const links = projectLinks(firstRef, "")
    expect(links.caseStudy, "the first card has a case study").toBeTruthy()
    await open(page)
    await clickAt(page, card(page, 0))
    await expect(page).toHaveURL(new RegExp(`${links.caseStudy!.href}$`))
    await expectEvents(page, [`recent work: ${firstRef}`])
  })

  test("Enter on the strip opens the card in focus: one event", async ({
    page,
  }) => {
    await open(page)
    await strip(page).focus()
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL(/\/work\//)
    await expectEvents(page, [`recent work: ${firstRef}`])
  })

  test("a card whose first action is its website: both events", async ({
    page,
  }) => {
    const i = cards.findIndex((c) => {
      if (c.kind !== "work") return false
      const l = projectLinks(c.ref, c.title)
      return !l.caseStudy && !!l.website
    })
    test.skip(i < 0, "no card with only a website")
    const ref = (cards[i] as { ref: string }).ref
    await open(page)
    await strip(page).focus()
    for (let j = 0; j < i; j++) await page.keyboard.press("ArrowRight")
    await expect(counter(page)).toHaveText(`${i + 1} / ${cards.length}`)
    const tab = page.context().waitForEvent("page")
    await clickAt(page, card(page, i))
    await (await tab).close()
    await expectEvents(page, [`recent work: ${ref}`, `website: ${ref}`])
  })

  test("a click that only brings a card into focus, and a drag, count nothing", async ({
    page,
  }) => {
    await open(page)
    // Card 2 out of focus: on its body, then on its Website pill if any.
    await clickAt(page, card(page, 1), 0.3, 0.6)
    await expect(counter(page)).toHaveText(`2 / ${cards.length}`)
    await clickAt(page, card(page, 0), 0.7, 0.6)
    await expect(counter(page)).toHaveText(`1 / ${cards.length}`)
    const web = card(page, 1).locator('a[target="_blank"]')
    if (await web.count()) {
      await clickAt(page, web)
      await expect(counter(page)).toHaveText(`2 / ${cards.length}`)
    }
    // A drag on the card in focus, there and back.
    const b = (await card(page, 0).boundingBox())!
    await timedDrag(page, b.x + b.width / 2, b.y + b.height / 2, 300)
    await page.waitForTimeout(400)
    const b2 = (await strip(page).boundingBox())!
    await timedDrag(page, b2.x + b2.width / 2, b2.y + b2.height / 2, -300)
    await page.waitForTimeout(400)
    await expect(page).toHaveURL(/\/$/)
    await expectEvents(page, [])
  })
})

test("a build without a site id sends nothing to Fathom", async ({ page }) => {
  test.skip(
    !!process.env.NEXT_PUBLIC_FATHOM_SITE_ID,
    "this run's build may have a site id"
  )
  const fathom: string[] = []
  page.on("request", (r) => {
    if (/usefathom\.com/.test(r.url())) fathom.push(r.url())
  })
  await page.addInitScript(() => {
    const w = window as unknown as { __beacons: number }
    w.__beacons = 0
    const send = navigator.sendBeacon.bind(navigator)
    navigator.sendBeacon = (url, data) => {
      if (String(url).includes("usefathom")) w.__beacons++
      return send(url, data)
    }
  })
  await gotoReady(page, "/mentoring")
  await page
    .getByRole("banner")
    .getByRole("button", { name: ASK.ariaOpen })
    .click()
  await expect(page.getByRole("dialog", { name: ASK.title })).toBeVisible()
  await page.keyboard.press("Escape")
  await clickNewTab(
    page,
    page.getByRole("main").locator(`a[href="${SITE.links.booking}"]`)
  )
  await expectEvents(page, ["ask: open", "mentoring: call"])
  expect(
    await page.evaluate(
      () => (window as unknown as { fathom?: unknown }).fathom
    )
  ).toBeUndefined()
  expect(
    await page.evaluate(
      () => (window as unknown as { __beacons: number }).__beacons
    )
  ).toBe(0)
  expect(fathom).toEqual([])
})
