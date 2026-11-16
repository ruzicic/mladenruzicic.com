import { expect, test, type Page } from "@playwright/test"

import { ASK } from "@/content/ask"
import { HOME } from "@/content/pages/home"
import { MENTORING } from "@/content/pages/mentoring"
import { PRESS } from "@/content/pages/press"
import { SITE } from "@/content/site"
import { TESTIMONIALS } from "@/content/testimonials"

import {
  gotoReady,
  LIST,
  LIST_ROWS,
  LIST_TOGGLE,
  LIST_VISIBLE,
  STRIP_REGION,
} from "./helpers"

/**
 * Everything on the site works from the keyboard. Desktop Chrome only: see
 * "The WebKit caveat" in tests/README.md for why Tab order is not run on
 * WebKit.
 */

/** Describes the focused element: its tag, role and accessible-ish name. */
async function focused(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null
    if (!el || el === document.body) return { tag: "BODY", name: "", in: "" }
    const name = el.getAttribute("aria-label") ?? (el.textContent ?? "").trim()
    const landmark = el.closest("header, main, footer, dialog")
    return {
      tag: el.tagName,
      name,
      in: landmark ? landmark.tagName.toLowerCase() : "",
    }
  })
}

const askButton = (page: Page) =>
  page.getByRole("banner").getByRole("button", { name: ASK.ariaOpen })

test.describe("skip link and top block", () => {
  test("Tab reaches the skip link first and it moves focus to main", async ({
    page,
  }) => {
    await gotoReady(page, "/")
    await page.keyboard.press("Tab")
    const skip = page.getByRole("link", { name: "Skip to content" })
    await expect(skip).toBeFocused()
    await expect(skip).toBeInViewport()
    await page.keyboard.press("Enter")
    await expect(page.getByRole("main")).toBeFocused()
    // The next Tab continues inside the page content, not back at the top.
    await page.keyboard.press("Tab")
    expect((await focused(page)).in).toBe("main")
  })

  test("Tab order through the top block: skip link, name, Ask, then main", async ({
    page,
  }) => {
    await gotoReady(page, "/")
    await page.keyboard.press("Tab")
    await expect(
      page.getByRole("link", { name: "Skip to content" })
    ).toBeFocused()
    await page.keyboard.press("Tab")
    await expect(
      page.getByRole("banner").getByRole("button", { name: SITE.name })
    ).toBeFocused()
    await page.keyboard.press("Tab")
    await expect(askButton(page)).toBeFocused()
    await page.keyboard.press("Tab")
    expect((await focused(page)).in).toBe("main")
  })

  test("on other pages the name is a link home, before Ask", async ({
    page,
  }) => {
    await gotoReady(page, "/about")
    await page.keyboard.press("Tab")
    await page.keyboard.press("Tab")
    const home = page.getByRole("banner").getByRole("link", { name: SITE.name })
    await expect(home).toBeFocused()
    await expect(home).toHaveAttribute("href", "/")
    await page.keyboard.press("Tab")
    await expect(askButton(page)).toBeFocused()
  })

  test("focused controls show a visible focus indicator", async ({ page }) => {
    await gotoReady(page, "/")
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab")
      const ring = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement
        const s = getComputedStyle(el)
        const outline =
          s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0
        const shadow = s.boxShadow !== "none" && s.boxShadow !== ""
        return { outline, shadow, focusVisible: el.matches(":focus-visible") }
      })
      expect(ring.focusVisible, `Tab ${i + 1} is :focus-visible`).toBe(true)
      expect(
        ring.outline || ring.shadow,
        `Tab ${i + 1} draws an outline or ring`
      ).toBe(true)
    }
  })
})

test.describe("Ask", () => {
  test("opens from the keyboard, traps focus, Escape closes and returns focus", async ({
    page,
  }) => {
    await gotoReady(page, "/")
    await askButton(page).focus()
    await page.keyboard.press("Enter")
    const dialog = page.getByRole("dialog", { name: ASK.title })
    await expect(dialog).toBeVisible()
    await expect
      .poll(async () => (await focused(page)).in, { message: "focus moved in" })
      .toBe("dialog")

    // Twenty Tabs and Shift+Tabs never leave the dialog.
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press(i % 3 === 2 ? "Shift+Tab" : "Tab")
      const f = await focused(page)
      expect(f.in, `Tab ${i + 1} stays in the dialog (on ${f.tag})`).toBe(
        "dialog"
      )
    }

    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
    await expect(askButton(page)).toBeFocused()
    await expect(page.locator("html")).not.toHaveAttribute("data-ask-open")
  })

  test("Enter in the question box asks the question", async ({ page }) => {
    await gotoReady(page, "/")
    await askButton(page).focus()
    await page.keyboard.press("Enter")
    const dialog = page.getByRole("dialog", { name: ASK.title })
    const box = dialog.getByRole("textbox", { name: ASK.inputLabel })
    await expect(box).toBeVisible()
    await box.focus()
    await page.keyboard.type(ASK.questions[2].question)
    await page.keyboard.press("Enter")
    await expect(dialog.getByText(ASK.questions[2].answer)).toBeVisible()
  })
})

test.describe("press menu on the name", () => {
  test("Shift+F10 opens it, arrows move, Escape closes and returns focus", async ({
    page,
  }) => {
    await gotoReady(page, "/")
    const name = page.getByRole("banner").getByRole("button", {
      name: SITE.name,
    })
    await name.focus()
    await page.keyboard.press("Shift+F10")
    const menu = page.getByRole("menu", { name: PRESS.menu.ariaLabel })
    await expect(menu).toBeVisible()
    await expect(name).toHaveAttribute("aria-expanded", "true")
    const items = menu.getByRole("menuitem")
    await expect(items).toHaveCount(3)
    await expect(items.first()).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await expect(items.nth(1)).toBeFocused()
    await page.keyboard.press("End")
    await expect(
      menu.getByRole("menuitem", { name: PRESS.menu.pressKitLabel })
    ).toBeFocused()
    await page.keyboard.press("Escape")
    await expect(menu).toBeHidden()
    await expect(name).toBeFocused()
    await expect(name).toHaveAttribute("aria-expanded", "false")
  })

  test("Shift+F10 on the home link opens it on other pages too", async ({
    page,
  }) => {
    await gotoReady(page, "/mentoring")
    const name = page.getByRole("banner").getByRole("link", { name: SITE.name })
    await name.focus()
    await page.keyboard.press("Shift+F10")
    const menu = page.getByRole("menu", { name: PRESS.menu.ariaLabel })
    await expect(menu).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(menu).toBeHidden()
    await expect(name).toBeFocused()
    await expect(page).toHaveURL(/\/mentoring$/)
  })
})

test.describe("Recent work strip", () => {
  test("arrow keys step through the cards and update the counter", async ({
    page,
  }) => {
    await gotoReady(page, "/")
    const strip = page.getByRole("region", { name: STRIP_REGION })
    const section = page.getByRole("region", {
      name: "Recent work",
      exact: true,
    })
    const counter = section.getByText(/^\d+ \/ \d+$/)
    const total = (await counter.innerText()).split("/")[1].trim()
    await expect(counter).toHaveText(`1 / ${total}`)

    await strip.focus()
    await page.keyboard.press("ArrowRight")
    await expect(counter).toHaveText(`2 / ${total}`)
    await page.keyboard.press("ArrowRight")
    await expect(counter).toHaveText(`3 / ${total}`)
    await page.keyboard.press("ArrowLeft")
    await expect(counter).toHaveText(`2 / ${total}`)
    await page.keyboard.press("End")
    await expect(counter).toHaveText(`${total} / ${total}`)
    await expect(section.getByRole("button", { name: /^Next/ })).toBeDisabled()
    await page.keyboard.press("Home")
    await expect(counter).toHaveText(`1 / ${total}`)
    await expect(
      section.getByRole("button", { name: /^Previous/ })
    ).toBeDisabled()
  })

  // Owner, 13 Nov 2026: a card is not a link. Its actions are, and they go
  // where they say: "Case study" to its page here, "Website" out to its
  // site in a new tab. Enter on a case study navigates, with no dialog.
  test("every card's actions go where they say; no card is a link", async ({
    page,
  }) => {
    await gotoReady(page, "/")
    const strip = page.getByRole("region", { name: STRIP_REGION })
    const cards = strip.locator(":scope > [data-card]:not(.lc-end)")
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
    const studies: { name: string; href: string }[] = []
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i)
      const title = (await card.locator(".lc-title").innerText()).trim()
      expect(await card.evaluate((el) => el.tagName), title).not.toBe("A")
      for (const link of await card.getByRole("link").all()) {
        const href = (await link.getAttribute("href"))!
        const word = (await link.innerText()).trim()
        if (word === HOME.actions.caseStudy) {
          expect(href, `${title}: to its case study`).toMatch(
            /^\/work\/[a-z0-9-]+$/
          )
          await expect(link, title).not.toHaveAttribute("target", /.+/)
          studies.push({ name: title, href })
        } else {
          expect(word, title).toBe(HOME.actions.website)
          expect(href, title).toMatch(/^https:\/\//)
          await expect(link, title).toHaveAttribute("target", "_blank")
        }
        await expect(link, title).not.toHaveAttribute("aria-haspopup")
      }
    }
    expect(studies.length).toBeGreaterThan(0)
    for (const { name, href } of studies) {
      const link = strip.locator(`.lc-acts a[href="${href}"]`).first()
      await link.focus()
      await page.keyboard.press("Enter")
      await expect(page, name).toHaveURL(new RegExp(`${href}$`))
      await expect(page.getByRole("dialog")).toHaveCount(0)
      await gotoReady(page, "/")
    }
  })
})

test.describe("the list", () => {
  test(`"${LIST.showAllLabel}" expands the list and collapses it again`, async ({
    page,
  }) => {
    await gotoReady(page, "/")
    const list = page.getByRole("region", { name: LIST.title })
    const rows = list.getByRole("listitem")
    await expect(rows).toHaveCount(LIST_VISIBLE)

    const toggle = list.getByRole("button", { name: LIST_TOGGLE })
    await expect(toggle).toHaveText(LIST.showAllLabel)
    await expect(toggle).toHaveAttribute("aria-expanded", "false")
    await toggle.focus()
    await page.keyboard.press("Enter")
    await expect(toggle).toHaveAttribute("aria-expanded", "true")
    await expect(toggle).toHaveText(LIST.showFewerLabel)
    await expect(rows).toHaveCount(LIST_ROWS)
    await expect(toggle).toBeFocused()

    await page.keyboard.press("Space")
    await expect(toggle).toHaveAttribute("aria-expanded", "false")
    await expect(rows).toHaveCount(LIST_VISIBLE)
  })

  test("collapsed rows are not in the Tab order", async ({ page }) => {
    await gotoReady(page, "/")
    const list = page.getByRole("region", { name: LIST.title })
    const links = await list.getByRole("link").count()
    await list.getByRole("link").first().focus()
    // Tab through the visible links: the next stop after them is the toggle.
    for (let i = 1; i < links; i++) await page.keyboard.press("Tab")
    await page.keyboard.press("Tab")
    await expect(list.getByRole("button", { name: LIST_TOGGLE })).toBeFocused()
  })
})

test.describe("testimonial pile", () => {
  const said = MENTORING.said
  const byId = new Map(TESTIMONIALS.map((t) => [t.id, t]))
  const order = said.pile.map((p) => byId.get(p.testimonial)!)
  const total = order.length

  test("pause and the counter work from the keyboard", async ({ page }) => {
    await gotoReady(page, "/mentoring")
    const pile = page.getByRole("region", { name: said.title })

    const pause = pile.getByRole("button", { name: said.pauseLabel })
    await pause.focus()
    await page.keyboard.press("Enter")
    await expect(
      pile.getByRole("button", { name: said.playLabel })
    ).toBeFocused()

    const counter = pile.getByRole("button", {
      name: /^\d+ \/ \d+, testimonial/,
    })
    await expect(counter).toHaveText(`1 / ${total}`)
    await counter.focus()
    await page.keyboard.press("Enter")
    await expect(counter).toHaveText(`2 / ${total}`)
    await expect(counter).toHaveAccessibleName(
      said.nextLabelFormat
        .replaceAll("{n}", "2")
        .replaceAll("{next}", "3")
        .replaceAll("{total}", String(total))
    )
    // The new top card is announced.
    await expect(pile.getByRole("status")).toContainText(order[1].author)

    await page.keyboard.press("Space")
    await expect(counter).toHaveText(`3 / ${total}`)
    await expect(pile.getByRole("status")).toContainText(order[2].author)
  })

  test("every quote stays readable to assistive tech", async ({ page }) => {
    await gotoReady(page, "/mentoring")
    const pile = page.getByRole("region", { name: said.title })
    await expect(pile.getByRole("figure")).toHaveCount(total)
  })
})
