import { expect, test, type Locator, type Page } from "@playwright/test"

import { HOME } from "@/content/pages/home"

import {
  escapeRe,
  gotoReady,
  LIST,
  LIST_ROWS,
  LIST_TOGGLE,
  projectLinks,
  STRIP_REGION,
} from "./helpers"

/**
 * The owner's rule for `/` (13 Nov 2026): "2 explicit actions: website, case
 * study. nothing else is a link unless very obvious". Wherever a project
 * appears (an intro popover, a strip card, a list row) it has at most a
 * "Case study" link (`/work/<slug>`, same tab) and a "Website" link (its
 * own site, new tab), both from `content/products.ts`. Its name, picture,
 * card or row are not links. One exception (owner, 16 Nov 2026): a click on
 * a strip card in focus follows its first action, through that action, so
 * the card is still not a link of its own (`landing-strip.spec.ts`). Touch
 * targets are in `mobile.spec.ts`.
 */

type Expected = ReturnType<typeof projectLinks>

/** The exact links inside `scope`, in order, against what content says. */
async function expectLinks(scope: Locator, want: Expected, label: string) {
  const links = scope.getByRole("link")
  const expected = [want.caseStudy, want.website].filter(Boolean)
  await expect(links, `${label}: link count`).toHaveCount(expected.length)
  let i = 0
  if (want.caseStudy) {
    const link = links.nth(i++)
    await expect(link, label).toHaveAttribute("href", want.caseStudy.href)
    await expect(link, label).toHaveAccessibleName(want.caseStudy.name)
    await expect(link, label).not.toHaveAttribute("target", /.+/)
  }
  if (want.website) {
    const link = links.nth(i)
    await expect(link, label).toHaveAttribute("href", want.website.href)
    await expect(link, label).toHaveAccessibleName(want.website.name)
    await expect(link, label).toHaveAttribute("target", "_blank")
    const rel = ((await link.getAttribute("rel")) ?? "").split(/\s+/)
    expect(rel, label).toEqual(
      expect.arrayContaining(["noopener", "noreferrer"])
    )
  }
}

/* -------------------------------------------------------------------------- */
/* Intro popovers                                                             */
/* -------------------------------------------------------------------------- */

const OPEN = ".lk-pop:popover-open"

function chip(page: Page, name: string) {
  return page
    .locator(".lp-story .lk")
    .filter({
      has: page.locator(".lk-w", {
        hasText: new RegExp(`^${escapeRe(name)}$`),
      }),
    })
    .locator("button.lk-chip")
    .first()
}

test.describe("intro popovers", () => {
  for (const [ref, name] of [
    ["tenderlift", "TenderLift"],
    ["evo-touch", "ZF"],
  ] as const) {
    test(`${name}: the panel's links are its case study and website, nothing else`, async ({
      page,
    }) => {
      await gotoReady(page, "/")
      const trigger = chip(page, name)
      await expect(
        trigger,
        "the name opens a panel, it is not a link"
      ).toHaveJSProperty("tagName", "BUTTON")
      await trigger.click()
      const panel = page.locator(OPEN)
      await expect(panel).toHaveCount(1)
      await expectLinks(panel, projectLinks(ref, name), `${name} popover`)
    })
  }

  test("TenderLift: Case study comes first, then Website", async ({ page }) => {
    await gotoReady(page, "/")
    await chip(page, "TenderLift").click()
    const links = page.locator(OPEN).getByRole("link")
    await expect(links.nth(0)).toContainText(HOME.actions.caseStudy)
    await expect(links.nth(1)).toContainText(HOME.actions.website)
  })

  test('"a mentee" is plain text: no tile, no link, no popover', async ({
    page,
  }) => {
    await gotoReady(page, "/")
    const para = page.locator(".lp-story p.lp-para").last()
    await expect(para).toContainText(
      "A few times a year I take on a small freelance project or a mentee, when the fit is really strong."
    )
    await expect(para.locator(".lk, a, button, [data-tile]")).toHaveCount(0)
  })
})

/* -------------------------------------------------------------------------- */
/* Strip cards                                                                */
/* -------------------------------------------------------------------------- */

function card(page: Page, title: string) {
  return page
    .getByRole("region", { name: STRIP_REGION })
    .locator(":scope > [data-card]")
    .filter({
      has: page.locator(".lc-title", {
        hasText: new RegExp(`^${escapeRe(title)}$`),
      }),
    })
}

test.describe("strip cards", () => {
  test("no work card is a link of its own; the end card is", async ({
    page,
  }) => {
    await gotoReady(page, "/")
    const strip = page.getByRole("region", { name: STRIP_REGION })
    const tags = await strip
      .locator(":scope > [data-card]:not(.lc-end)")
      .evaluateAll((els) => els.map((el) => el.tagName))
    expect(tags.length).toBeGreaterThan(0)
    expect(new Set(tags)).toEqual(new Set(["DIV"]))
    await expect(strip.locator(":scope > .lc-end")).toHaveAttribute(
      "href",
      "/work"
    )
    // The pictures, clips and words of a card hold no link.
    await expect(strip.locator(".lc-txt a, .lc-clip a, picture a")).toHaveCount(
      0
    )
  })

  for (const [ref, title] of [
    ["tenderlift", "TenderLift"],
    ["evo-touch", "ZF"],
    ["ona", "ONA by Alma"],
  ] as const) {
    test(`${title}: the card's links are exactly its actions`, async ({
      page,
    }) => {
      await gotoReady(page, "/")
      const c = card(page, title)
      await expect(c).toHaveCount(1)
      await expectLinks(c, projectLinks(ref, title), `${title} card`)
    })
  }

  test("clicking the picture of the card in focus goes to its case study", async ({
    page,
  }) => {
    await gotoReady(page, "/")
    const c = card(page, "TenderLift")
    await c.scrollIntoViewIfNeeded()
    await expect(c).toHaveAttribute("data-on", "")
    const box = (await c.boundingBox())!
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    await expect(page).toHaveURL(
      new RegExp(`${projectLinks("tenderlift", "TenderLift").caseStudy!.href}$`)
    )
  })

  test("keyboard: Tab walks a card's actions in order, the arrows still step", async ({
    page,
  }) => {
    await gotoReady(page, "/")
    const tl = projectLinks("tenderlift", "TenderLift")
    const zf = projectLinks("evo-touch", "ZF")
    const strip = page.getByRole("region", { name: STRIP_REGION })
    await page.keyboard.press("Shift")
    await strip.getByRole("link", { name: tl.caseStudy!.name }).focus()
    await page.keyboard.press("Tab")
    await expect(
      strip.getByRole("link", { name: tl.website!.name })
    ).toBeFocused()
    await page.keyboard.press("Tab")
    const next = strip.getByRole("link", { name: zf.caseStudy!.name })
    await expect(next).toBeFocused()
    // Tabbing onto the second card brings it into focus position.
    await expect(card(page, "ZF")).toHaveAttribute("data-on", "")
    // Arrow keys still step from card to card and take focus along.
    await page.keyboard.press("ArrowLeft")
    await expect(
      strip.getByRole("link", { name: tl.caseStudy!.name })
    ).toBeFocused()
    await expect(card(page, "TenderLift")).toHaveAttribute("data-on", "")
    // The strip's own arrow buttons still work.
    const section = page.locator("#recent-work")
    await section
      .getByRole("button", { name: HOME.recentWork.nextLabel })
      .click()
    await expect(card(page, "ZF")).toHaveAttribute("data-on", "")
  })

  test("a case study action navigates in the same tab", async ({ page }) => {
    await gotoReady(page, "/")
    const tl = projectLinks("tenderlift", "TenderLift")
    await card(page, "TenderLift")
      .getByRole("link", { name: tl.caseStudy!.name })
      .click()
    await expect(page).toHaveURL(/\/work\/tenderlift$/)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })
})

/* -------------------------------------------------------------------------- */
/* The list                                                                   */
/* -------------------------------------------------------------------------- */

async function openList(page: Page) {
  await gotoReady(page, "/")
  const list = page.getByRole("region", { name: LIST.title })
  await list.getByRole("button", { name: LIST_TOGGLE }).click()
  await expect(list.getByRole("listitem")).toHaveCount(LIST_ROWS)
  return list
}

function row(list: Locator, name: string) {
  return list.getByRole("listitem").filter({
    has: list.page().locator(".ledger-name", {
      hasText: new RegExp(`^${escapeRe(name)}$`),
    }),
  })
}

test.describe("list rows", () => {
  test("no name is a link", async ({ page }) => {
    const list = await openList(page)
    await expect(list.locator(".ledger-name")).toHaveCount(LIST_ROWS)
    await expect(list.locator(".ledger-name a")).toHaveCount(0)
  })

  for (const [ref, name] of [
    ["tenderlift", "TenderLift"],
    ["zf-scalar", "ZF"],
    ["ona", "ONA by Alma"],
    ["hi-fam", "Hi Fam"],
  ] as const) {
    test(`${name}: the row's links are exactly its actions`, async ({
      page,
    }) => {
      const list = await openList(page)
      const r = row(list, name)
      await expect(r).toHaveCount(1)
      const want = projectLinks(ref, name)
      await expectLinks(r, want, `${name} row`)
      if (!want.caseStudy && !want.website)
        await expect(r.locator(".ledger-to")).toHaveCount(0)
    })
  }

  test("keyboard: each label is reached in order and shown while focused", async ({
    page,
  }) => {
    const list = await openList(page)
    const tl = projectLinks("tenderlift", "TenderLift")
    const r = row(list, "TenderLift")
    const to = r.locator(".ledger-to")
    await page.mouse.move(0, 0)
    await expect(to).toHaveCSS("opacity", "0")
    await page.keyboard.press("Shift")
    await r.getByRole("link", { name: tl.caseStudy!.name }).focus()
    await expect(to).toHaveCSS("opacity", "1")
    await page.keyboard.press("Tab")
    await expect(r.getByRole("link", { name: tl.website!.name })).toBeFocused()
    await expect(to).toHaveCSS("opacity", "1")
  })
})

/* -------------------------------------------------------------------------- */
/* /work                                                                      */
/* -------------------------------------------------------------------------- */

test.describe("/work rows", () => {
  test("no name is a link, and every row's links match the homepage's", async ({
    page,
  }) => {
    await gotoReady(page, "/work")
    const list = page.getByRole("main").locator(".ledger-list")
    await expect(list.locator(".ledger-name")).toHaveCount(LIST_ROWS)
    await expect(list.locator(".ledger-name a")).toHaveCount(0)
    for (const group of LIST.groups)
      for (const r of group.rows) {
        const item = list.locator(`li#${r.ref}`)
        await expectLinks(item, projectLinks(r.ref, r.name), `/work ${r.name}`)
      }
  })

  test("the actions fade in on hover and focus, and nothing moves", async ({
    page,
  }) => {
    await gotoReady(page, "/work")
    const item = page.locator("li#tenderlift")
    const to = item.locator(".ledger-to")
    await page.mouse.move(0, 0)
    await expect(to).toHaveCSS("opacity", "0")
    const before = await item.boundingBox()
    const what = (await item.locator(".ledger-what").boundingBox())!
    await page.mouse.move(what.x + 8, what.y + what.height / 2)
    await expect(to).toHaveCSS("opacity", "1")
    expect(await item.boundingBox()).toEqual(before)
    await page.mouse.move(0, 0)
    await expect(to).toHaveCSS("opacity", "0")
    const tl = projectLinks("tenderlift", "TenderLift")
    await page.keyboard.press("Shift")
    await item.getByRole("link", { name: tl.caseStudy!.name }).focus()
    await expect(to).toHaveCSS("opacity", "1")
  })
})
