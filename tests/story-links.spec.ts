import { existsSync } from "node:fs"
import { join } from "node:path"
import { expect, test } from "@playwright/test"

import { MEDIA } from "@/content/media"

import { gotoReady, STORY_SLUGS, storyLinks } from "./helpers"

/**
 * Every link in a story's panel carries the linked site's favicon (owner,
 * 14 Nov 2026: "fix link favicons for all that are missing it"): a 32px PNG
 * under `public/static/work/<slug>/`, listed in `content/media.ts`, drawn at
 * 16 beside the link, and actually loaded by the browser.
 */

test("every story link in content has an icon file listed in content/media.ts", () => {
  let links = 0
  for (const slug of STORY_SLUGS)
    for (const link of storyLinks(slug)) {
      links++
      expect(link.icon, `${slug}: ${link.title}`).toMatch(
        /^\/static\/work\/[a-z0-9-]+\/favicon-[a-z0-9-]+\.png$/
      )
      expect(
        existsSync(join(process.cwd(), "public", link.icon!)),
        `${slug}: ${link.icon} exists`
      ).toBe(true)
      expect(MEDIA[link.icon!], `${slug}: ${link.icon} in media.ts`).toEqual(
        expect.objectContaining({ width: 32, height: 32 })
      )
    }
  expect(links).toBeGreaterThan(0)
})

for (const slug of STORY_SLUGS) {
  const links = storyLinks(slug)
  if (links.length === 0) continue

  test(`/work/${slug}: every panel link shows its favicon, loaded, at 16`, async ({
    page,
  }) => {
    await gotoReady(page, `/work/${slug}`)
    const items = page.locator(".cs-panel .cs-link")
    await expect(items).toHaveCount(links.length)
    for (let i = 0; i < links.length; i++) {
      const item = items.nth(i)
      await expect(item.getByRole("link")).toHaveAttribute(
        "href",
        links[i].href
      )
      const icon = item.locator("img.cs-link-icon")
      await expect(icon, links[i].title).toHaveAttribute("src", links[i].icon!)
      await icon.scrollIntoViewIfNeeded()
      await expect
        .poll(
          () =>
            icon.evaluate((img: HTMLImageElement) =>
              img.complete ? img.naturalWidth : 0
            ),
          { message: `${links[i].title}: the icon loads` }
        )
        .toBeGreaterThan(0)
      const box = await icon.boundingBox()
      expect(Math.round(box!.width)).toBe(16)
      expect(Math.round(box!.height)).toBe(16)
    }
  })
}

/* -------------------------------------------------------------------------- */
/* Branded links (owner, 15 Nov 2026)                                         */
/* -------------------------------------------------------------------------- */

/** `#RRGGBB` as the browser reports a colour. */
function rgb(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return `rgb(${r}, ${g}, ${b})`
}

/** A branded link's `--brand`, and the colour its underline is drawn in. */
async function brandOf(link: import("@playwright/test").Locator) {
  return link.evaluate((el) => ({
    brand: getComputedStyle(el).getPropertyValue("--brand").trim(),
    underline: getComputedStyle(el.querySelector(".blk-w")!)
      .textDecorationColor,
    thickness: getComputedStyle(el.querySelector(".blk-w")!)
      .textDecorationThickness,
  }))
}

for (const slug of STORY_SLUGS) {
  const links = storyLinks(slug) as (ReturnType<typeof storyLinks>[number] & {
    color?: string
  })[]
  if (links.length === 0) continue

  test(`/work/${slug}: every panel link is underlined in its favicon's colour`, async ({
    page,
  }) => {
    await gotoReady(page, `/work/${slug}`)
    const items = page.locator(".cs-panel .cs-link a.blk")
    await expect(items).toHaveCount(links.length)
    for (let i = 0; i < links.length; i++) {
      const color = links[i].color!
      expect(color, links[i].title).toMatch(/^#[0-9A-Fa-f]{6}$/)
      const got = await brandOf(items.nth(i))
      expect(got.brand.toUpperCase(), links[i].title).toBe(color.toUpperCase())
      expect(got.underline, links[i].title).toBe(rgb(color))
      expect(got.thickness, links[i].title).toBe("1.5px")
      // The favicon is inside the link, so the wash covers it too.
      await expect(items.nth(i).locator("img.cs-link-icon")).toHaveCount(1)
    }
  })
}

const LOCKUPS: {
  path: string
  selector: string
  name: string
  brand: string
}[] = [
  {
    path: "/",
    selector: ".lp-story .lk-chip.blk",
    name: "Zarez",
    brand: "#D0101A",
  },
  {
    path: "/",
    selector: ".lp-story .lk-chip.blk",
    name: "TenderLift",
    brand: "#1E2A3A",
  },
  {
    path: "/about",
    selector: ".ab-lk.blk",
    name: "TenderLift",
    brand: "#1E2A3A",
  },
  {
    path: "/mentoring",
    selector: ".ment-lk.blk",
    name: "MentorCruise",
    brand: "#1A4740",
  },
]

for (const l of LOCKUPS) {
  test(`${l.path}: the ${l.name} lockup is underlined in its brand colour and washes on hover`, async ({
    page,
  }) => {
    await gotoReady(page, l.path)
    const link = page
      .locator(l.selector)
      .filter({ has: page.locator(".blk-w", { hasText: l.name }) })
      .first()
    await link.scrollIntoViewIfNeeded()
    const rest = await brandOf(link)
    expect(rest.brand.toUpperCase()).toBe(l.brand)
    expect(rest.underline).toBe(rgb(l.brand))
    // The wash is a background that rises from the bottom edge, as the
    // buttons' fill does: no height at rest, the full box on hover.
    const wash = () =>
      link.evaluate((el) => {
        const cs = getComputedStyle(el)
        return {
          size: cs.backgroundSize,
          position: cs.backgroundPosition,
          image: cs.backgroundImage,
          transition: cs.transitionProperty,
        }
      })
    const before = await wash()
    expect(before.size).toBe("100% 0%")
    expect(before.position).toMatch(/^0(%|px) 100%$/)
    expect(before.image).toContain("gradient")
    expect(before.transition).toContain("background-size")

    await link.hover()
    await expect.poll(async () => (await wash()).size).toBe("100% 100%")
    await expect.poll(async () => (await brandOf(link)).thickness).toBe("3px")
  })
}

test("a story link washes on hover too, and nothing moves", async ({
  page,
}) => {
  await gotoReady(page, "/work/tenderlift")
  const link = page.locator(".cs-panel .cs-link a.blk").first()
  await link.scrollIntoViewIfNeeded()
  const before = await link.boundingBox()
  await link.hover()
  await expect
    .poll(() => link.evaluate((el) => getComputedStyle(el).backgroundSize))
    .toBe("100% 100%")
  const after = await link.boundingBox()
  expect(after).toEqual(before)
})

for (const width of [1440, 390]) {
  test.describe(`lockups and story links at ${width}`, () => {
    test.use({ viewport: { width, height: 900 } })

    test("the three lockup kinds space and align tile and name the same", async ({
      page,
    }) => {
      const kinds: [string, string][] = [
        ["/", ".lp-story .lk-chip.blk"],
        ["/about", ".ab-lk.blk"],
        ["/mentoring", ".ment-lk.blk"],
      ]
      const got: { gap: number; dy: number }[] = []
      for (const [path, selector] of kinds) {
        await gotoReady(page, path)
        got.push(
          await page
            .locator(selector)
            .first()
            .evaluate((el) => {
              const t = el.querySelector("[data-tile]")!.getBoundingClientRect()
              const n = el.querySelector(".blk-w")!.getBoundingClientRect()
              return {
                gap: n.left - t.right,
                dy: t.top + t.height / 2 - (n.top + n.height / 2),
              }
            })
        )
      }
      for (const g of got.slice(1)) {
        expect(Math.abs(g.gap - got[0].gap)).toBeLessThanOrEqual(1)
        expect(Math.abs(g.dy - got[0].dy)).toBeLessThanOrEqual(1)
      }
    })

    test("a story link's arrow follows its last word, on the same line", async ({
      page,
    }) => {
      for (const slug of STORY_SLUGS) {
        if (storyLinks(slug).length === 0) continue
        await gotoReady(page, `/work/${slug}`)
        const links = await page.evaluate(() =>
          [...document.querySelectorAll(".cs-panel .cs-link a.blk")].map(
            (a) => {
              const words = [...a.querySelectorAll(".blk-w")]
              const last = words.at(-1)!.getBoundingClientRect()
              const arrow = a
                .querySelector(".cs-link-arrow")!
                .getBoundingClientRect()
              const icon = a.querySelector("img")!.getBoundingClientRect()
              const lines = words.flatMap((w) => [...w.getClientRects()])
              return {
                title: a.textContent ?? "",
                gap: arrow.left - last.right,
                sameLine: Math.abs(arrow.bottom - last.bottom) < 6,
                // Every line of the title starts right of the favicon.
                indent: Math.min(...lines.map((r) => r.left)) - icon.right,
              }
            }
          )
        )
        for (const l of links) {
          expect(l.sameLine, `${slug}: ${l.title}`).toBe(true)
          expect(l.gap, `${slug}: ${l.title}`).toBeGreaterThanOrEqual(0)
          expect(l.gap, `${slug}: ${l.title}`).toBeLessThan(8)
          expect(l.indent, `${slug}: ${l.title}`).toBeGreaterThanOrEqual(6)
        }
      }
    })
  })
}
