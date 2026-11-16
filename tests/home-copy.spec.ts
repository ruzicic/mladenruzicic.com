import { expect, test } from "@playwright/test"

import { HOME } from "@/content/pages/home"

import { gotoReady, LIST_ROWS, LIST_TOGGLE } from "./helpers"

/**
 * The landing's copy after the 13 Nov 2026 round: four intro paragraphs with
 * a product chip on each bracketed word, no "crew of AI agents", no one-line
 * sentence, no hairlines in "How I work", Zarez live, and the About page's
 * CV line.
 */

const STORY = ".lp-story"
const CHIPS = [
  "ZF",
  "Shopify",
  "TenderLift",
  "FontAlternatives",
  "studenti.rs",
  "Zarez",
]

test.describe("landing intro", () => {
  test("four paragraphs, each chip is a tile plus its underlined name", async ({
    page,
  }) => {
    await gotoReady(page, "/")
    await expect(page.locator(`${STORY} p.lp-para`)).toHaveCount(4)
    const stance = page.locator(`${STORY} p.lp-stance`)
    await expect(stance).toHaveText(HOME.stance)
    await expect(stance).toHaveText(
      "I’m most useful between the people with a problem and the technology that can solve it."
    )
    expect(await stance.evaluate((el) => getComputedStyle(el).fontWeight)).toBe(
      "500"
    )
    for (const name of CHIPS) {
      const chip = page.locator(`${STORY} .lk`).filter({
        has: page.locator(".lk-w", { hasText: new RegExp(`^${name}$`) }),
      })
      await expect(chip, name).toHaveCount(1)
      await expect(chip.locator(".lk-chip .lk-w"), name).toBeVisible()
      await expect(
        chip.locator("button.lk-chip [data-tile]"),
        `${name} tile`
      ).toBeAttached()
      await expect(chip.locator("[popover]"), `${name} popover`).toHaveCount(1)
    }
    await expect(page.locator(`${STORY} .lk`)).toHaveCount(CHIPS.length)
  })

  test("the removed lines are gone from the page", async ({ page }) => {
    await gotoReady(page, "/")
    const text = (await page.locator("body").innerText()).toLowerCase()
    const html = (await page.content()).toLowerCase()
    for (const gone of [
      "crew of ai agents",
      "i find out what people need",
      "keep it alive",
      "zarez means comma",
      "avataurus",
      "montepop",
    ]) {
      expect(text, gone).not.toContain(gone)
      expect(html, gone).not.toContain(gone)
    }
  })

  test("a hidden product (Bistoletti) shows nowhere", async ({
    page,
    request,
  }) => {
    for (const path of ["/", "/work"]) {
      await gotoReady(page, path)
      const html = (await page.content()).toLowerCase()
      expect(html, path).not.toContain("bistoletti")
    }
    for (const path of ["/", "/work", "/llms.txt", "/llms-full.txt"]) {
      const res = await request.get(path, {
        headers: { Accept: "text/markdown" },
      })
      expect((await res.text()).toLowerCase(), path).not.toContain("bistoletti")
    }
  })

  test("the Zarez tile is the two-colour quill on white, studenti.rs is a bare mark", async ({
    page,
  }) => {
    await gotoReady(page, "/")
    const zarez = page.locator(`${STORY} [data-tile="zarez"]`)
    const art = await zarez.locator("[data-tile-art]").innerHTML()
    expect(art).toContain("#D0101A")
    expect(art).toContain("#003E7F")
    expect(art).toContain("#FFFFFF")
    const studenti = page.locator(`${STORY} [data-tile="studenti-rs"]`)
    const face = studenti.locator("[data-tile-face]")
    expect(await face.evaluate((el) => getComputedStyle(el).boxShadow)).toBe(
      "none"
    )
    expect(
      await face.evaluate((el) => getComputedStyle(el).backgroundColor)
    ).toBe("rgba(0, 0, 0, 0)")
    expect(await studenti.locator("[data-tile-art]").innerHTML()).not.toContain(
      "<rect"
    )
  })

  test("the new TenderLift and mentoring copy is on the landing", async ({
    page,
  }) => {
    await gotoReady(page, "/")
    const text = await page.locator("body").evaluate((b) => b.textContent ?? "")
    expect(text).toContain("I co-founded it and build the product.")
    expect(text).toContain(
      "5.0 from 51 reviews on MentorCruise, mentoring since 2021."
    )
    expect(text).not.toContain("40+")
    expect(text).not.toContain("top 2%")
  })

  // Polish round of 15 Nov 2026: his own product leads, the employer is last
  // (no employer in the identity line).
  test("the headline leads with TenderLift, ends with ZF, and Zarez is not 'soon'", async ({
    page,
  }) => {
    expect(HOME.headline.phrases).toHaveLength(5)
    expect(HOME.headline.phrases[0]?.ref).toBe("tenderlift")
    expect(HOME.headline.phrases.at(-1)?.ref).toBe("evo-touch")
    expect(HOME.headline.phrases.find((p) => p.ref === "zarez")?.on).toBe(
      "on Zarez"
    )
    await gotoReady(page, "/")
    const h1 = (
      await page.getByRole("heading", { level: 1 }).innerText()
    ).replace(/\s+/g, " ")
    expect(h1).toContain(
      "Swiss bid teams, designers on a budget, students in Serbia, people who write in Serbian and truck drivers."
    )
    expect(h1).not.toMatch(/AI agents/i)
  })

  test("the list's toggle counts the rows from content", async ({ page }) => {
    await gotoReady(page, "/")
    expect(HOME.list.showAllLabel).toBe(`Show all ${LIST_ROWS}`)
    await expect(page.getByRole("button", { name: LIST_TOGGLE })).toBeVisible()
  })
})

test.describe("How I work", () => {
  test("four steps and no rule above any of them", async ({ page }) => {
    await gotoReady(page, "/")
    const steps = page.locator("#how-i-work ol > li")
    await expect(steps).toHaveCount(4)
    for (let i = 0; i < 4; i++) {
      const top = await steps
        .nth(i)
        .evaluate((el) => getComputedStyle(el).borderTopWidth)
      expect(top, `step ${i + 1}`).toBe("0px")
    }
  })
})

test.describe("About and FontAlternatives copy", () => {
  test("About has no AI-agents line", async ({ page }) => {
    await gotoReady(page, "/about")
    const html = await page.content()
    expect(html).not.toContain("I build with AI agents")
  })

  test("FontAlternatives is no longer called vibe-coded", async ({
    request,
  }) => {
    const res = await request.get("/work/fontalternatives", {
      headers: { Accept: "text/markdown" },
    })
    expect((await res.text()).toLowerCase()).not.toContain("vibe")
  })
})

test.describe("About: the CV", () => {
  test("the CV line is the button alone: no placeholder, no PDF note", async ({
    page,
  }) => {
    await gotoReady(page, "/about")
    await expect(page.getByText("[DATE]")).toHaveCount(0)
    const cv = page.getByRole("link", { name: "Download my CV" })
    await expect(cv).toBeVisible()
    await expect(cv).toHaveAttribute("href", "/cv.pdf")
    await expect(page.getByText("PDF", { exact: true })).toHaveCount(0)
  })
})

for (const width of [1440, 1024, 768, 390]) {
  test.describe(`intro line breaks at ${width}`, () => {
    test.use({ viewport: { width, height: 900 } })

    test("no line of the intro starts with a punctuation mark", async ({
      page,
    }) => {
      await gotoReady(page, "/")
      const bad = await page.evaluate(() => {
        const out: string[] = []
        for (const p of document.querySelectorAll(".lp-story p.lp-para")) {
          const chars: { ch: string; top: number }[] = []
          const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT)
          for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            if ((n.parentElement as Element).closest("[popover]")) continue
            const text = n.textContent ?? ""
            for (let i = 0; i < text.length; i++) {
              if (/\s/.test(text[i])) continue
              const r = document.createRange()
              r.setStart(n, i)
              r.setEnd(n, i + 1)
              const box = r.getClientRects()[0]
              if (box) chars.push({ ch: text[i], top: box.top })
            }
          }
          chars.forEach((c, i) => {
            if (i > 0 && /[,.;:!?)]/.test(c.ch) && c.top - chars[i - 1].top > 6)
              out.push(
                `${chars[i - 1].ch}${c.ch} in "${p.textContent?.slice(0, 30)}"`
              )
          })
        }
        return out
      })
      expect(bad).toEqual([])
    })
  })
}
