import { expect, test } from "@playwright/test"

import { HOME } from "@/content/pages/home"
import { PRODUCTS } from "@/content/products"

import { gotoReady, STRIP_REGION } from "./helpers"

/**
 * The strip's print and its end title (`app/components/landing/Strip.tsx`,
 * `.lc-film` and `.lc-end` in `app/styles/landing.css`).
 *
 * - The last card is one link to `/work`, named by the plain sentence
 *   "That's not all, folks!" (the drawn line with its caret is hidden).
 * - The number in its body is counted from content: the `/work` entries
 *   with no card in the strip. Counted here on its own, not through the
 *   loader the card uses.
 * - No card says "Footage to come" any more, to anyone.
 * - The grain and veil layers are never what the pointer hits; a click on
 *   an action pill reaches its link.
 */

const cards = HOME.recentWork.cards
const end = cards.at(-1)
if (end?.kind !== "more") throw new Error("the strip's last card is not `more`")

/** `/work` rows that no strip card covers (its product, or its story). */
const covered = new Set(
  cards.flatMap((c) => {
    if (c.kind !== "work") return []
    const story = PRODUCTS.find((p) => p.slug === c.ref)?.story
    return story ? [c.ref, story] : [c.ref]
  })
)
const rest = HOME.list.groups
  .flatMap((g) => g.rows)
  .filter((r) => !covered.has(r.ref)).length

test("the end card is one link to /work, named by the plain sentence", async ({
  page,
}) => {
  await gotoReady(page, "/")
  const strip = page.getByRole("region", { name: STRIP_REGION })
  const last = strip.locator(":scope > [data-card]").last()
  await expect(last).toHaveAttribute("href", "/work")
  await expect(last).toHaveAccessibleName(/That's not all, folks!/)
  await expect(
    strip.getByRole("link", { name: /That's not all, folks!/ })
  ).toHaveAttribute("href", "/work")
  // One link, no second one inside it.
  await expect(last.locator("a, button")).toHaveCount(0)
  await expect(
    last.getByRole("heading", { name: "That's not all, folks!" })
  ).toHaveCount(1)
  // The drawn line, with its caret and NOT, is not read out.
  await expect(last.locator(".lc-end-line")).toHaveAttribute(
    "aria-hidden",
    "true"
  )
})

test("the end card's number is the count from content", async ({ page }) => {
  expect(rest).toBeGreaterThan(0)
  await gotoReady(page, "/")
  const body = page.locator("[data-strip] > .lc-end .lc-end-body")
  await expect(body).toHaveText(end.body.replace("{n}", String(rest)))
  const n = Number((await body.innerText()).match(/^\d+/)?.[0])
  expect(n).toBe(rest)
})

test("no card says it has no footage", async ({ page }) => {
  await gotoReady(page, "/")
  const html = await page.content()
  expect(html).not.toMatch(/footage to come/i)
  const strip = page.getByRole("region", { name: STRIP_REGION })
  expect(await strip.ariaSnapshot()).not.toMatch(/footage/i)
})

test("the grain and veil never take a click", async ({ page }) => {
  await gotoReady(page, "/")
  const strip = page.locator("[data-strip]")
  await strip.scrollIntoViewIfNeeded()
  const films = page.locator(".lc-film")
  expect(await films.count()).toBeGreaterThan(cards.length - 1)
  const hits = await films.evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect()
      const x = r.left + r.width / 2
      const y = r.top + r.height / 2
      const style = getComputedStyle(el)
      const hit = document.elementFromPoint(x, y)
      return {
        events: style.pointerEvents,
        hidden: el.getAttribute("aria-hidden"),
        onScreen: x > 0 && x < innerWidth && y > 0 && y < innerHeight,
        hitsFilm: !!hit?.closest(".lc-film"),
      }
    })
  )
  for (const h of hits) {
    expect(h.events).toBe("none")
    expect(h.hidden).toBe("true")
    if (h.onScreen) expect(h.hitsFilm).toBe(false)
  }

  // A click on an action pill of the card in focus reaches that link (the
  // card itself is not a link: owner, 13 Nov 2026).
  const first = strip.locator(":scope > [data-card]").first()
  const action = first.locator(".lc-act").first()
  const href = await action.getAttribute("href")
  const box = (await action.boundingBox())!
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await expect(page).toHaveURL(new RegExp(`${href}$`))
})
