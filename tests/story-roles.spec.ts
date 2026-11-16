import { readFileSync } from "node:fs"
import { join } from "node:path"
import { expect, test, type Page } from "@playwright/test"
import matter from "gray-matter"

import { gotoReady } from "./helpers"

/**
 * The role timeline in a story's panel (`panel.timeline`, `StoryRoles`), on
 * the ZF story, from content:
 *
 * - One native `<details>` per role, all in one exclusive group: the current
 *   role is open on load, opening another closes it.
 * - The summary row is a 44px target the keyboard reaches with Tab and opens
 *   with Enter; closed text stays in the DOM, never `hidden`.
 * - Opening eases over about 150ms; under reduced motion nothing moves.
 * - Without JavaScript the open role is there and the others open.
 * - With the tallest role open, the panel never runs into the column, the
 *   next story or the footer, at 1440x800 and at 390.
 * - The markdown mirror prints every role with its dates and blocks.
 */

const SLUG = "zf-scalar"
const PATH = `/work/${SLUG}`

interface Role {
  dates: string
  title: string
  current?: true
  blocks: { label: string; text: string }[]
}

const ROLES = matter(
  readFileSync(join(process.cwd(), "content", "work", `${SLUG}.mdx`), "utf8")
).data.panel.timeline as Role[]
const CURRENT = ROLES.findIndex((r) => r.current)

const items = (page: Page) => page.locator(".cs-roles > li > details")
const summary = (page: Page, i: number) => items(page).nth(i).locator("summary")
const openStates = (page: Page) =>
  items(page).evaluateAll((ds) => ds.map((d) => (d as HTMLDetailsElement).open))

/** Opens the role whose open height is largest, and returns its index. */
async function openTallest(page: Page): Promise<number> {
  const i = await page.evaluate(async () => {
    const ds = [
      ...document.querySelectorAll<HTMLDetailsElement>(
        ".cs-roles > li > details"
      ),
    ]
    let best = 0
    let max = 0
    for (const [n, d] of ds.entries()) {
      d.open = true
      await new Promise((r) => setTimeout(r, 250))
      const h = d.getBoundingClientRect().height
      if (h > max) [max, best] = [h, n]
    }
    ds[best].open = true
    await new Promise((r) => setTimeout(r, 250))
    return best
  })
  await expect
    .poll(() => openStates(page))
    .toEqual(ROLES.map((_, n) => n === i))
  return i
}

test.describe(PATH, () => {
  test("five roles in order, the current one open on load", async ({
    page,
  }) => {
    await gotoReady(page, PATH)
    expect(ROLES).toHaveLength(5)
    expect(CURRENT).toBe(ROLES.length - 1)
    await expect(items(page)).toHaveCount(ROLES.length)
    for (const [i, role] of ROLES.entries()) {
      await expect(summary(page, i)).toContainText(role.dates)
      await expect(summary(page, i)).toContainText(role.title)
    }
    expect(await openStates(page)).toEqual(ROLES.map((r) => !!r.current))
    for (const b of ROLES[CURRENT].blocks)
      await expect(page.getByText(b.text, { exact: true })).toBeVisible()

    // One exclusive group, and the current role's marker is the square.
    const names = await items(page).evaluateAll((ds) =>
      ds.map((d) => d.getAttribute("name"))
    )
    expect(new Set(names).size).toBe(1)
    expect(names[0]).toBeTruthy()
    await expect(page.locator(".cs-roles > li[data-current]")).toHaveCount(1)
  })

  test("opening another role closes the open one", async ({ page }) => {
    await gotoReady(page, PATH)
    await summary(page, 0).click()
    await expect
      .poll(() => openStates(page))
      .toEqual(ROLES.map((_, n) => n === 0))
    for (const b of ROLES[0].blocks)
      await expect(page.getByText(b.text, { exact: true })).toBeVisible()

    await summary(page, 2).click()
    await expect
      .poll(() => openStates(page))
      .toEqual(ROLES.map((_, n) => n === 2))
  })

  test("keyboard: Tab reaches a summary, Enter opens it", async ({ page }) => {
    await gotoReady(page, PATH)
    // From the last control before the panel: the first square's (its
    // clip's pause button), or the bar's Ask.
    await page.evaluate(() => {
      const before = document.querySelectorAll<HTMLElement>(
        ".cs-bar .ask-btn, .cs-cover a, .cs-lead button, .cs-lead a"
      )
      before[before.length - 1].focus()
    })
    await page.keyboard.press("Tab")
    const first = summary(page, 0)
    await expect(first).toBeFocused()
    const ring = await first.evaluate((el) => getComputedStyle(el).outlineStyle)
    expect(ring, "a visible focus ring").not.toBe("none")
    await page.keyboard.press("Enter")
    await expect
      .poll(() => openStates(page))
      .toEqual(ROLES.map((_, n) => n === 0))
    await page.keyboard.press("Tab")
    await expect(summary(page, 1)).toBeFocused()
  })

  test("each summary row is a 44px target; closed text stays in the DOM", async ({
    page,
  }) => {
    await gotoReady(page, PATH)
    for (let i = 0; i < ROLES.length; i++) {
      const box = await summary(page, i).boundingBox()
      expect(box!.height, `summary ${i + 1} height`).toBeGreaterThanOrEqual(44)
    }
    const list = page.locator(".cs-roles")
    await expect(list).toHaveAttribute("aria-label", /\S/)
    expect(await list.locator("[hidden], [aria-hidden]:not(svg)").count()).toBe(
      0
    )
    const text = (await list.textContent()) ?? ""
    for (const role of ROLES)
      for (const b of role.blocks) expect(text).toContain(b.text)
  })

  test("opening eases briefly; under reduced motion nothing moves", async ({
    page,
  }) => {
    const durations = () =>
      page.evaluate(() => {
        const d = document.querySelector(".cs-roles details")!
        // The plus-minus icon: its vertical bar turns (app/styles/icon.css).
        const chev = document.querySelector(".cs-role-chev .ico-v")!
        return {
          content: getComputedStyle(d, "::details-content").transitionDuration,
          chevron: getComputedStyle(chev).transitionDuration,
        }
      })
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await gotoReady(page, PATH)
    const moving = await durations()
    expect(moving.content).toContain("0.15s")
    expect(moving.chevron.split(/,\s*/)).toContain("0.16s")

    await page.emulateMedia({ reducedMotion: "reduce" })
    // The site's reduced-motion rule (app/globals.css) cuts every
    // transition to a thousandth of a second: no visible movement.
    const still = await durations()
    const secs = (list: string) => list.split(/,\s*/).map((d) => parseFloat(d))
    for (const d of [...secs(still.content), ...secs(still.chevron)])
      expect(d).toBeLessThanOrEqual(0.001)
    await summary(page, 0).click()
    await expect
      .poll(() => openStates(page))
      .toEqual(ROLES.map((_, n) => n === 0))
  })

  test("at 1440x800 the tallest role open: the panel meets nothing", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ width: 1440, height: 800 })
    await gotoReady(page, PATH)
    await openTallest(page)

    const read = () =>
      page.evaluate(() => {
        const r = (s: string) =>
          document.querySelector(s)!.getBoundingClientRect()
        const p = r(".cs-panel")
        return {
          top: p.top,
          bottom: p.bottom,
          right: p.right,
          height: p.height,
          column: r(".cs-column").left,
          next: r(".cs-next").top,
          foot: r("[data-site-footer]").top,
        }
      })

    for (const at of [0.25, 0.5, 0.75]) {
      await page.evaluate(
        (f) =>
          scrollTo({
            top: (document.documentElement.scrollHeight - innerHeight) * f,
            behavior: "instant",
          }),
        at
      )
      await page.waitForTimeout(100)
      const now = await read()
      expect(now.right, "left of the column").toBeLessThan(now.column)
      expect(now.bottom, "its foot is in view").toBeLessThanOrEqual(800 + 0.5)
      if (now.height > 800 - 48)
        expect(now.top, "a tall panel holds by its foot").toBeCloseTo(
          800 - now.height - 24,
          0
        )
    }

    await page.evaluate(() =>
      scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "instant",
      })
    )
    await page.waitForTimeout(100)
    const end = await read()
    expect(end.bottom, "above the next story").toBeLessThanOrEqual(
      end.next + 0.5
    )
    expect(end.bottom, "above the footer").toBeLessThanOrEqual(end.foot)
  })

  test("at 390 the tallest role open: the panel, then the squares", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoReady(page, PATH)
    await openTallest(page)
    const { panel, column, sideways } = await page.evaluate(() => ({
      panel: document.querySelector(".cs-panel")!.getBoundingClientRect()
        .bottom,
      column: document.querySelector(".cs-column")!.getBoundingClientRect().top,
      sideways: document.documentElement.scrollWidth - innerWidth,
    }))
    expect(column, "squares below the panel").toBeGreaterThanOrEqual(panel)
    expect(sideways, "no sideways scroll").toBe(0)
  })

  test("the markdown mirror lists every role", async ({ request }) => {
    const res = await request.get(PATH, {
      headers: { Accept: "text/markdown" },
    })
    expect(res.ok()).toBe(true)
    const md = await res.text()
    for (const role of ROLES) {
      expect(md).toMatch(new RegExp(`^#### ${role.title}`, "m"))
      expect(md).toContain(role.dates)
      for (const b of role.blocks) expect(md).toContain(b.text)
    }
  })
})

test.describe(`${PATH} without JavaScript`, () => {
  test.use({ javaScriptEnabled: false })

  test("the current role is open and the others open", async ({ page }) => {
    await page.goto(PATH)
    expect(await openStates(page)).toEqual(ROLES.map((r) => !!r.current))
    for (const b of ROLES[CURRENT].blocks)
      await expect(page.getByText(b.text, { exact: true })).toBeVisible()
    await summary(page, 1).click()
    await expect
      .poll(() => openStates(page))
      .toEqual(ROLES.map((_, n) => n === 1))
    for (const b of ROLES[1].blocks)
      await expect(page.getByText(b.text, { exact: true })).toBeVisible()
  })
})
