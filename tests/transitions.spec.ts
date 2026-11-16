import { expect, test, type Page } from "@playwright/test"

import { SITE } from "@/content/site"

import { gotoReady } from "./helpers"

/**
 * Moving between pages through the top block and the footer (Desktop Chrome
 * and Desktop Safari). The route changes in place (a client navigation, not
 * a reload), lands at the top of the new page with its own title and `<h1>`,
 * and leaves focus somewhere sensible: never on a node of the page that
 * left, never in the footer the reader clicked in. Animation internals are
 * not asserted.
 */

declare global {
  interface Window {
    __e2eSameDocument?: boolean
  }
}

/** Marks the document, so a full reload (which clears it) is detectable. */
async function markDocument(page: Page) {
  await page.evaluate(() => {
    window.__e2eSameDocument = true
  })
}

async function expectClientNavigation(page: Page) {
  expect(
    await page.evaluate(() => window.__e2eSameDocument === true),
    "navigated without a full reload"
  ).toBe(true)
}

/** Where focus is: a landmark name, or "body". */
async function focusRegion(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement
    if (!el || el === document.body || el === document.documentElement)
      return "body"
    if (!el.isConnected) return "detached"
    return (
      el.closest("header, main, footer, dialog")?.tagName.toLowerCase() ??
      (el.matches('a[href="#main"]') ? "skip" : "other")
    )
  })
}

/** Focus is not left on the page that went away, nor in the footer. */
async function expectSensibleFocus(page: Page) {
  const where = await focusRegion(page)
  expect(["body", "main", "header", "skip"], `focus is on ${where}`).toContain(
    where
  )
}

/**
 * The first Tab after a route change. `nextjs-portal` (the dev-only Next
 * devtools button, appended last to `<body>`) is stepped over, so this reads
 * the same against `next dev` and `next start`.
 */
async function firstTab(page: Page) {
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("Tab")
    const devtools = await page.evaluate(
      () => document.activeElement?.tagName.toLowerCase() === "nextjs-portal"
    )
    if (!devtools) break
  }
  return focusRegion(page)
}

async function expectArrived(page: Page, path: RegExp) {
  await expect(page).toHaveURL(path)
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1)
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => Math.round(window.scrollY)))
    .toBeLessThan(5)
}

const FOOTER_LINKS = [
  { name: "About", path: /\/about$/ },
  { name: "All work", path: /\/work$/ },
  { name: "Mentoring", path: /\/mentoring$/ },
]

for (const link of FOOTER_LINKS) {
  test(`footer "${link.name}" link navigates from / and lands at the top`, async ({
    page,
  }) => {
    await gotoReady(page, "/")
    const title = await page.title()
    await markDocument(page)
    const footerLink = page
      .getByRole("contentinfo")
      .getByRole("navigation")
      .getByRole("link", { name: link.name, exact: true })
    await footerLink.scrollIntoViewIfNeeded()
    await footerLink.click()
    await expectArrived(page, link.path)
    await expect(page).not.toHaveTitle(title)
    await expectClientNavigation(page)
    await expectSensibleFocus(page)
  })
}

// `PageMain` starts focus over after a client navigation; without it the
// sequential-focus start stayed where the old footer link was, and in Chrome
// the first Tab left the document.
test("after a footer link, the first Tab lands at the top of the new page", async ({
  page,
  browserName,
}) => {
  test.skip(browserName === "webkit", "WebKit: Tab skips links (README)")
  await gotoReady(page, "/")
  const link = page
    .getByRole("contentinfo")
    .getByRole("navigation")
    .getByRole("link", { name: "About", exact: true })
  await link.scrollIntoViewIfNeeded()
  await link.click()
  await expectArrived(page, /\/about$/)
  expect(["skip", "header", "main"]).toContain(await firstTab(page))
})

test("the name in the top block goes home from every other page", async ({
  page,
}) => {
  await gotoReady(page, "/about")
  await markDocument(page)
  for (const [from, next] of [
    ["/about", "/mentoring"],
    ["/mentoring", "/work"],
    ["/work", null],
  ] as const) {
    await expect(page).toHaveURL(new RegExp(`${from}$`))
    await page
      .getByRole("banner")
      .getByRole("link", { name: SITE.name })
      .click()
    await expectArrived(page, /\/$/)
    await expect(
      page.getByRole("banner").getByRole("button", { name: SITE.name })
    ).toBeVisible()
    await expectClientNavigation(page)
    if (!next) break
    const nav = page
      .getByRole("contentinfo")
      .getByRole("navigation")
      .getByRole("link", {
        name: next === "/work" ? "All work" : "Mentoring",
        exact: true,
      })
    await nav.click()
  }
})

test("keyboard: Enter on the home link navigates and focus starts over", async ({
  page,
}) => {
  await gotoReady(page, "/mentoring")
  await markDocument(page)
  const home = page.getByRole("banner").getByRole("link", { name: SITE.name })
  await home.focus()
  await page.keyboard.press("Enter")
  await expectArrived(page, /\/$/)
  await expectClientNavigation(page)
  expect(await focusRegion(page)).not.toBe("detached")
  expect(await focusRegion(page)).not.toBe("footer")
})

test("a list row opens its story, and Back returns to the list", async ({
  page,
}) => {
  await gotoReady(page, "/work")
  await markDocument(page)
  await page
    .getByRole("main")
    .getByRole("link", { name: "TenderLift case study" })
    .click()
  await expectArrived(page, /\/work\/tenderlift$/)
  await expectClientNavigation(page)
  await page.goBack()
  await expect(page).toHaveURL(/\/work$/)
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  await expectClientNavigation(page)
})

test("a story's next-story link and its All work link work", async ({
  page,
}) => {
  await gotoReady(page, "/work/tenderlift")
  await markDocument(page)
  const next = page.getByRole("navigation", { name: "Next case study" })
  const href = await next.getByRole("link").first().getAttribute("href")
  expect(href).toMatch(/^\/work\/[a-z0-9-]+$/)
  await next.getByRole("link").first().click()
  await expectArrived(page, new RegExp(`${href}$`))
  await expectClientNavigation(page)
  // The story's bar (its one header) holds the way back.
  await page
    .getByRole("banner")
    .getByRole("link", { name: "All work", exact: true })
    .click()
  await expectArrived(page, /\/work$/)
  await expectClientNavigation(page)
})

test("the header's two ends travel to a story as shared elements", async ({
  page,
}) => {
  await gotoReady(page, "/work")
  // Record the shared names on the page when each transition starts (React
  // names the old elements just before it calls startViewTransition).
  await page.evaluate(() => {
    const w = window as unknown as { __vtNames: string[][] }
    w.__vtNames = []
    const start = document.startViewTransition?.bind(document)
    if (!start) return
    document.startViewTransition = ((arg: never) => {
      w.__vtNames.push(
        [...document.querySelectorAll<HTMLElement>("*")]
          .map((el) => el.style.viewTransitionName)
          .filter(Boolean)
      )
      return start(arg)
    }) as typeof document.startViewTransition
  })
  await page
    .getByRole("main")
    .getByRole("link", { name: "TenderLift case study" })
    .click()
  await expectArrived(page, /\/work\/tenderlift$/)
  const supported = await page.evaluate(() => "startViewTransition" in document)
  test.skip(!supported, "no View Transitions in this engine")
  const names = await page.evaluate(
    () => (window as unknown as { __vtNames: string[][] }).__vtNames
  )
  expect(names.flat()).toEqual(
    expect.arrayContaining(["site-name", "site-ask"])
  )
})
