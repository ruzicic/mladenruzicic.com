import { expect, test, type Locator, type Page } from "@playwright/test"

import { HOME } from "@/content/pages/home"
import { PRODUCTS } from "@/content/products"

import {
  escapeRe,
  gotoReady,
  hasHorizontalOverflow,
  LIST,
  LIST_ROWS,
  LIST_TOGGLE,
  projectLinks,
} from "./helpers"

/**
 * The landing's list after the owner's choice of 13 Nov 2026 (`CopyE.dc.html`
 * E2, option c, without the arrows after the names): the year is a small
 * label above the name, the description has the wide column, and where a row
 * goes is said in words that show on hover and focus where the device hovers
 * (the touch side is in `mobile.spec.ts`). `/work` keeps its own rows.
 */

const ARROWS = /[→↗]/

/** Every row as content describes it, in page order. */
const ROWS = LIST.groups.flatMap((g) =>
  g.rows.map((row) => {
    const product = PRODUCTS.find((p) => p.slug === row.ref)
    const links = projectLinks(row.ref, row.name)
    return {
      ref: row.ref,
      name: row.name,
      year: row.year ?? product?.year,
      linked: Boolean(links.caseStudy || links.website),
    }
  })
)

async function openList(page: Page): Promise<Locator> {
  await gotoReady(page, "/")
  const list = page.getByRole("region", { name: LIST.title })
  await list.getByRole("button", { name: LIST_TOGGLE }).click()
  await expect(list.getByRole("listitem")).toHaveCount(LIST_ROWS)
  return list
}

async function opacityOf(target: Locator) {
  return Number(await target.evaluate((el) => getComputedStyle(el).opacity))
}

test("the year sits above the name, and no row has an empty year line", async ({
  page,
}) => {
  const list = await openList(page)
  const items = list.getByRole("listitem")
  for (const [i, row] of ROWS.entries()) {
    const item = items.nth(i)
    const when = item.locator(".ledger-when")
    if (!row.year) {
      await expect(when, `${row.name} has no year label`).toHaveCount(0)
      continue
    }
    await expect(when).toHaveText(row.year)
    const yearBox = await when.boundingBox()
    const nameBox = await item.locator(".ledger-name").boundingBox()
    expect(
      yearBox!.y + yearBox!.height,
      `${row.name}: the year is above the name`
    ).toBeLessThanOrEqual(nameBox!.y + 1)
    expect(Math.abs(yearBox!.x - nameBox!.x)).toBeLessThan(1)
  }
})

test("no arrow after the names", async ({ page }) => {
  const list = await openList(page)
  const names = list.locator(".ledger-name")
  await expect(names).toHaveCount(LIST_ROWS)
  for (const text of await names.allTextContents())
    expect(text, `"${text}"`).not.toMatch(ARROWS)
  await expect(list.locator(".ledger-name .ico")).toHaveCount(0)
})

test("every row's links are its words, with the destination in the visible text", async ({
  page,
}) => {
  const list = await openList(page)
  const items = list.getByRole("listitem")
  for (const [i, row] of ROWS.entries()) {
    const item = items.nth(i)
    const links = item.getByRole("link")
    const want = projectLinks(row.ref, row.name)
    const n = Number(!!want.caseStudy) + Number(!!want.website)
    await expect(links, row.name).toHaveCount(n)
    if (!n) {
      await expect(item.locator(".ledger-to")).toHaveCount(0)
      continue
    }
    if (want.caseStudy)
      await expect(links.first()).toHaveText(
        new RegExp(`^${escapeRe(HOME.actions.caseStudy)}`)
      )
    if (want.website)
      await expect(links.last()).toHaveText(
        new RegExp(`^${escapeRe(want.website.domain)}`)
      )
  }
})

test("the destination words are faded out at rest and show on hover and on focus", async ({
  page,
}) => {
  const list = await openList(page)
  const items = list.getByRole("listitem")
  await page.mouse.move(0, 0)

  const linked = ROWS.flatMap((row, i) => (row.linked ? [{ row, i }] : []))
  expect(linked.length).toBeGreaterThan(0)

  for (const { row, i } of linked) {
    const to = items.nth(i).locator(".ledger-to")
    // Faded, not removed: still laid out and in the accessibility tree.
    await expect(to).toBeAttached()
    await expect(to).not.toHaveCSS("display", "none")
    await expect(to).not.toHaveCSS("visibility", "hidden")
    expect(await opacityOf(to), `${row.name} at rest`).toBe(0)
  }

  // Hover: shown, and nothing moves.
  const first = items.nth(linked[0].i)
  await first.scrollIntoViewIfNeeded()
  const before = await first.boundingBox()
  // The row link's box covers the row, so the pointer lands on it there.
  const what = (await first.locator(".ledger-what").boundingBox())!
  await page.mouse.move(what.x + 8, what.y + what.height / 2)
  await expect.poll(() => opacityOf(first.locator(".ledger-to"))).toBe(1)
  expect(await first.boundingBox()).toEqual(before)

  // Keyboard focus: shown.
  await page.mouse.move(0, 0)
  const second = items.nth(linked[1].i)
  await second.getByRole("link").first().focus()
  await expect.poll(() => opacityOf(second.locator(".ledger-to"))).toBe(1)
  // The other rows stay faded.
  expect(await opacityOf(first.locator(".ledger-to"))).toBe(0)
})

test('no visitor reads "Story" in the list, here or on /work', async ({
  page,
}) => {
  const list = await openList(page)
  await expect(list.getByText(/^story$/i)).toHaveCount(0)
  await gotoReady(page, "/work")
  await expect(page.getByRole("main").getByText(/^story$/i)).toHaveCount(0)
  // /work uses the homepage's row (owner, 14 Nov 2026): the years sit
  // above the names, and every row has its id for `/work#<slug>`.
  const rows = page.locator("main .ledger-item")
  await expect(rows).toHaveCount(LIST_ROWS)
  const tl = page.locator("li#tenderlift")
  const when = (await tl.locator(".ledger-when").boundingBox())!
  const name = (await tl.locator(".ledger-name").boundingBox())!
  expect(when.y + when.height).toBeLessThanOrEqual(name.y + 1)
})

test("at 358px nothing in the list overflows and the page does not scroll sideways", async ({
  page,
}) => {
  await page.setViewportSize({ width: 358, height: 800 })
  const list = await openList(page)
  expect(await hasHorizontalOverflow(page)).toBe(false)
  const box = await list.locator(".ledger-list").boundingBox()
  // The phone row link's press wash reaches 6px into the gutter on purpose
  // (`.ledger-go::before`); its box is the row's.
  const wide = await list
    .locator(".ledger-row > :not(.ledger-go)")
    .evaluateAll(
      (els, right) =>
        els
          .filter(
            (el) =>
              el.getBoundingClientRect().right > right + 0.5 ||
              el.scrollWidth > el.clientWidth + 1
          )
          .map((el) => el.textContent),
      box!.x + box!.width
    )
  expect(wide).toEqual([])
})
