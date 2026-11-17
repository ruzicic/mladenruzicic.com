import { expect, test, type Page } from "@playwright/test"

import { SITE } from "@/content/site"

import { gotoReady } from "./helpers"

/**
 * One footer on every page (owner, 15 Nov 2026: "make footer consistent
 * across pages"): the same text and the same links, in the same order, on
 * all seven page types; the bottom row is only the station clock with
 * "Ticino" and the time there.
 */

const PAGES = [
  "/",
  "/work",
  "/work/tenderlift",
  "/mentoring",
  "/about",
  "/press",
  "/no-such-page",
]

/** The footer's text (the clock's time masked) and its links, in order. */
async function footerOf(page: Page) {
  const footer = page.locator("footer[data-site-footer]")
  await expect(footer).toHaveCount(1)
  return footer.evaluate((el) => ({
    text: (el as HTMLElement).innerText
      .replace(/\b\d{2}:\d{2}\b/g, "HH:MM")
      .replace(/\s+/g, " ")
      .trim(),
    links: [...el.querySelectorAll("a")].map((a) => ({
      text: (a.textContent ?? "").replace(/\s+/g, " ").trim(),
      href: a.getAttribute("href"),
      rel: a.getAttribute("rel"),
    })),
    structure: [...el.children].map((c) => c.className),
  }))
}

test("the footer's text and links are identical on all seven page types", async ({
  page,
}) => {
  let first: Awaited<ReturnType<typeof footerOf>> | null = null
  for (const path of PAGES) {
    await gotoReady(page, path)
    const f = await footerOf(page)
    if (!first) first = f
    else expect(f, path).toEqual(first)
  }
})

test("the footer's content: ask, contact, newsletter, six links, the clock", async ({
  page,
}) => {
  await gotoReady(page, "/mentoring")
  const footer = page.locator("footer[data-site-footer]")
  await expect(footer.getByText(SITE.footer.ask, { exact: true })).toBeVisible()
  // The visible words; the links also tell screen readers they open a tab.
  const contact = (await footer.locator("#contact").textContent()) ?? ""
  expect(contact.replace(/ \(opens in a new tab\)/g, "")).toBe(
    "If you're building something and need help or advice, or you're based in Ticino and want to meet, shoot me a message on X or LinkedIn, or book us a 15-minute call."
  )
  const contactLinks = footer.locator("#contact a")
  await expect(contactLinks).toHaveText([
    /^X/,
    /^LinkedIn/,
    /^book us a 15-minute call/,
  ])
  await expect(contactLinks.nth(0)).toHaveAttribute(
    "href",
    "https://x.com/ruzicic"
  )
  await expect(contactLinks.nth(1)).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/ruzicic/"
  )
  await expect(contactLinks.nth(2)).toHaveAttribute(
    "href",
    "https://cal.com/ruzicic/15m-discovery-session"
  )
  // His sentence has no email link.
  await expect(footer.locator('a[href^="mailto:"]')).toHaveCount(0)
  await expect(footer.locator(".news")).toHaveCount(1)

  const nav = footer.getByRole("navigation")
  const links = nav.getByRole("link")
  await expect(links).toHaveText([
    "Home",
    "All work",
    "Mentoring",
    "About",
    "CV",
    /^GitHub( \(opens in a new tab\))?$/,
  ])
  await expect(links.nth(0)).toHaveAttribute("href", "/")
  await expect(links.nth(1)).toHaveAttribute("href", "/work")
  await expect(links.nth(2)).toHaveAttribute("href", "/mentoring")
  await expect(links.nth(3)).toHaveAttribute("href", "/about")
  // The CV (owner, 17 Nov 2026): the page, which offers the PDF; About's
  // button still downloads the file.
  await expect(links.nth(4)).toHaveAttribute("href", "/cv")
  await expect(links.nth(4)).not.toHaveAttribute("download", /.*/)
  await expect(links.nth(4)).not.toHaveAttribute("target", /.*/)
  await expect(links.nth(5)).toHaveAttribute(
    "href",
    "https://github.com/ruzicic"
  )
  await expect(links.nth(5)).toHaveAttribute("rel", /\bme\b/)
  await expect(links.nth(5)).toHaveAttribute("target", "_blank")

  const text = await footer.innerText()
  expect(text).not.toMatch(/last updated/i)
  expect(text).not.toMatch(/\bago\b/)
  expect(text).not.toMatch(/MentorCruise/i)
  await expect(
    footer.locator('a[href*="mentorcruise"], a[href*="mentors.to"]')
  ).toHaveCount(0)
})

for (const width of [1440, 390]) {
  test.describe(`the bottom row at ${width}`, () => {
    test.use({ viewport: { width, height: 900 } })

    test("the dial, the current time, then the built-in line", async ({
      page,
    }) => {
      await gotoReady(page, "/")
      const row = page.locator("footer .clock-row")
      await expect(row).toHaveCount(1)
      const dial = row.locator("svg.clock")
      await expect(dial).toBeVisible()
      // The time in Switzerland, now (the dial's name says so).
      await expect(dial).toHaveAttribute(
        "aria-label",
        new RegExp(`^${SITE.footer.timeLabel}: \\d{2}:\\d{2}$`)
      )
      await expect(row).toHaveText(
        new RegExp(`^\\s*\\d{2}:\\d{2}\\s*${SITE.footer.builtIn}\\s*$`)
      )
      await expect(row.getByText(SITE.footer.builtIn)).toBeVisible()
      await expect(row).not.toContainText("Ticino")
      // Nothing else in the row: the dial and one cell.
      expect(
        await row.evaluate((el) =>
          [...el.children].map((c) => c.tagName.toLowerCase())
        )
      ).toEqual(["svg", "span"])
    })
  })
}

test("text selection is inverted on the dark footer and unchanged on the paper", async ({
  page,
}) => {
  await gotoReady(page, "/about")
  const selection = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el, "::selection")
        return { background: cs.backgroundColor, color: cs.color }
      })
  const paper = "rgb(252, 252, 250)"
  const ink = "rgb(17, 17, 17)"
  expect(await selection("footer #contact")).toEqual({
    background: paper,
    color: ink,
  })
  expect(await selection("footer .news input[type='email']")).toEqual({
    background: paper,
    color: ink,
  })
  expect(await selection(".ab-intro p.ab-para")).toEqual({
    background: ink,
    color: paper,
  })
})
