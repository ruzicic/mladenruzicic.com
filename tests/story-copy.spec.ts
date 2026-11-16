import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test"
import matter from "gray-matter"

import { gotoReady, STORY_SLUGS } from "./helpers"

/**
 * The owner's answers of 14 Nov 2026 on the case studies: the dated
 * TenderLift numbers, no screenshot of buyer forms or the colour palette,
 * and nothing about WolkAbout after he left.
 */

function frontMatter(slug: string) {
  return matter(
    readFileSync(join(process.cwd(), "content", "work", `${slug}.mdx`), "utf8")
  )
}

const TL = frontMatter("tenderlift").data.panel as {
  numbers: { value: string; lines: string[] }[]
  numbersAsOf?: string
}

/**
 * What a reader of a page gets: its rendered text, and every picture's and
 * clip's alt text, sources and poster, and the figure captions. Never the raw
 * document: its script payload carries ids such as `$69` that are not text.
 */
async function readerView(page: Page, path: string) {
  await gotoReady(page, path)
  return page.evaluate(() => {
    const media = [
      ...document.querySelectorAll("img, video, source, picture, figcaption"),
    ].flatMap((el) => [
      el.getAttribute("alt") ?? "",
      el.getAttribute("src") ?? "",
      el.getAttribute("srcset") ?? "",
      el.getAttribute("poster") ?? "",
      el.tagName === "FIGCAPTION" ? (el.textContent ?? "") : "",
    ])
    return [document.body.innerText, ...media].join("\n")
  })
}

/** A machine-read text twin (`.md`, `llms-full.txt`), as plain text. */
async function twin(request: APIRequestContext, path: string) {
  return (await request.get(path)).text()
}

test("TenderLift's numbers say when they were read, right under the row", async ({
  page,
}) => {
  expect(TL.numbersAsOf).toBeTruthy()
  await gotoReady(page, "/work/tenderlift")
  const row = page.locator(".cs-numbers")
  for (const n of TL.numbers) await expect(row).toContainText(n.value)
  // On the cover, under the row and its rule (16 Nov 2026).
  const asOf = page.locator(".cs-numbers ~ .cs-asof")
  await expect(asOf).toHaveText(TL.numbersAsOf!)
  const [rowBottom, asOfTop] = await Promise.all([
    row.evaluate((el) => el.getBoundingClientRect().bottom),
    asOf.evaluate((el) => el.getBoundingClientRect().top),
  ])
  expect(asOfTop).toBeGreaterThan(rowBottom)
  expect(asOfTop - rowBottom).toBeLessThan(64)
  // And in the markdown twin, after the numbers.
  const md = await (await page.request.get("/work/tenderlift.md")).text()
  const last = TL.numbers.at(-1)!.value
  expect(md.indexOf(TL.numbersAsOf!)).toBeGreaterThan(md.indexOf(last))
})

test("other stories have no date line under their numbers", async ({
  page,
}) => {
  for (const slug of STORY_SLUGS) {
    if (slug === "tenderlift") continue
    expect(frontMatter(slug).data.panel?.numbersAsOf, slug).toBeUndefined()
  }
  await gotoReady(page, "/work/shopify")
  await expect(page.locator(".cs-numbers ~ .cs-asof")).toHaveCount(0)
})

test("no screenshot of a buyer's form or of the colour palette anywhere", async ({
  page,
  request,
}) => {
  for (const path of ["/", "/work", "/work/tenderlift"]) {
    const seen = await readerView(page, path)
    expect(seen, path).not.toMatch(/sq-form|brand-sq-ds-colours/)
    expect(seen, path).not.toMatch(/buyer[’']s (self-declaration )?form/i)
  }
  const md = await twin(request, "/work/tenderlift.md")
  expect(md).not.toMatch(/sq-form|brand-sq-ds-colours|buyer[’']s form/i)
  for (const file of ["sq-form.webp", "brand-sq-ds-colours.webp"])
    expect(
      (await request.get(`/static/work/tenderlift/${file}`)).status()
    ).toBe(404)
})

test("WolkAbout says nothing about the company after he left", async ({
  request,
}) => {
  const text = [
    readFileSync(
      join(process.cwd(), "content", "work", "wolkabout.mdx"),
      "utf8"
    ),
    await (await request.get("/work/wolkabout.md")).text(),
  ].join("\n")
  expect(text).not.toMatch(/pivot/i)
  expect(text).not.toMatch(/website(s)? (is|are) gone|product (is|are) gone/i)
})

for (const width of [1440, 390]) {
  test(`at ${width}, every story's figures stay inside their own columns`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    for (const slug of STORY_SLUGS) {
      await gotoReady(page, `/work/${slug}`)
      const overlaps = await page.locator(".cs-number").evaluateAll((items) =>
        items.flatMap((item) => {
          const value = item.querySelector(".cs-number-value")!
          const range = document.createRange()
          range.selectNodeContents(value)
          const text = range.getBoundingClientRect()
          const box = item.getBoundingClientRect()
          return text.right > box.right + 0.5 ? [value.textContent] : []
        })
      )
      expect(overlaps, slug).toEqual([])
    }
  })
}

test("the owner's answers of the second round are on the pages and in the twins", async ({
  page,
  request,
}) => {
  // 53: Panciona shows the website's original dashboard screenshot.
  await gotoReady(page, "/work/panciona")
  await expect(
    page.locator('img[src*="website-dashboard-original"]').first()
  ).toBeAttached()
  await expect(page.getByText(/original dashboard screenshot/)).toHaveCount(1)
  // 52: Zarez says sign-in is open, in the long text only (not the panel).
  const zarez = await (await request.get("/work/zarez.md")).text()
  expect(zarez).toContain("Sign-in is open to everyone.")
  await gotoReady(page, "/work/zarez")
  await expect(page.locator(".cs-panel")).not.toContainText("Sign-in is open")
  // 46: WolkAbout's list of what was his.
  const wolk = await (await request.get("/work/wolkabout.md")).text()
  expect(wolk).toContain(
    "Everything frontend, research and development, the marketing website, customer relationships, automations, and the CI/CD and infrastructure tooling."
  )
  // 27: the Innosuisse course by name.
  const panciona = await (await request.get("/work/panciona.md")).text()
  expect(panciona).toContain(
    "Business Creation for Social Entrepreneurs course at Startup Campus"
  )
})

test("the studenti.rs and TenderLift diagrams carry the new figures", async ({
  page,
}) => {
  await gotoReady(page, "/work/studenti-rs")
  await expect(page.locator(".cs-column")).toContainText(
    "All 45,000+ older documents were re-run. 7,000+ were removed: duplicates, low quality, or material that should never have been public."
  )
  await expect(page.locator(".cs-column")).toContainText(
    "A Grok bot answers questions and reviews payments every day, without me."
  )
  await gotoReady(page, "/work/tenderlift")
  await expect(page.locator(".cs-column")).toContainText("20+ sources")
})

test("Panciona never states its old prices, in words or pictures", async ({
  page,
  request,
}) => {
  const texts: [string, string][] = [
    ["/work/panciona", await readerView(page, "/work/panciona")],
    ["/work/panciona.md", await twin(request, "/work/panciona.md")],
    ["/llms-full.txt", await twin(request, "/llms-full.txt")],
  ]
  for (const [path, text] of texts) {
    expect(text, path).not.toMatch(/sq-website-pricing|website-pricing\.webp/)
    expect(text, path).not.toMatch(/per successful sale|\$69\b|\b1[15] ?%/)
  }
  for (const file of ["sq-website-pricing.webp", "website-pricing.webp"])
    expect(
      (await request.get(`/static/work/panciona/${file}`)).status(),
      file
    ).toBe(404)
})

test("he has been building websites since 2004; nothing says he built studenti.rs in 2008", async ({
  page,
  request,
}) => {
  for (const path of ["/llms.txt", "/llms-full.txt", "/press.md"]) {
    const text = await twin(request, path)
    if (path !== "/press.md")
      expect(text, path).toContain("He has been building websites since 2004.")
    expect(text, path).not.toMatch(/shipping software since/i)
  }
  const sources = [
    await readerView(page, "/"),
    await readerView(page, "/work/studenti-rs"),
    await twin(request, "/work/studenti-rs.md"),
    await twin(request, "/llms-full.txt"),
  ]
  for (const text of sources) {
    expect(text).not.toMatch(/\bI built it in 2008\b/)
    expect(text).not.toMatch(/\b(built|developer) in 2008\b/i)
    expect(text).not.toMatch(/I built in 2008/)
  }
  // The site's own age stays.
  expect(await twin(request, "/work/studenti-rs.md")).toMatch(/since 2008/)
})

test("every story's markdown twin lists each of its squares, in order", async ({
  request,
}) => {
  for (const slug of STORY_SLUGS) {
    const column = (frontMatter(slug).data.column ?? []) as {
      kind: string
      caption?: string
    }[]
    const md = await (await request.get(`/work/${slug}.md`)).text()
    const section = /### The pictures\n\n([\s\S]*?)\n\n/.exec(md)?.[1] ?? ""
    const lines = section.split("\n").filter((l) => l.startsWith("- "))
    expect(lines, slug).toHaveLength(column.length)
    column.forEach((item, i) => {
      if (item.caption)
        expect(lines[i], `${slug} square ${i + 1}`).toContain(item.caption)
    })
  }
})

/**
 * ZF (owner, 16 Nov 2026, in his CV document): of the ZF figures only "50%
 * of 300 engineers" is public. The component count is served nowhere: not
 * on the story, its markdown twin, `/llms-full.txt` or the Ask context.
 */
test.describe("ZF: the only public figure is 50% of 300 engineers", () => {
  const COUNT = /~\s?50\b|\bfifty\b|\b50 components\b|components, all in use/i

  test("the cover shows 50% and the year joined, nothing else", async ({
    page,
  }) => {
    await gotoReady(page, "/work/zf-scalar")
    await expect(page.locator(".cs-number-value")).toHaveText(["50%", "2023"])
    const text = await page.locator("body").innerText()
    expect(text).toMatch(/300 engineers/i)
    expect(text).not.toMatch(COUNT)
  })

  test("no machine output or Ask context carries the component count", async ({
    request,
  }) => {
    for (const path of ["/work/zf-scalar.md", "/llms-full.txt", "/llms.txt"]) {
      const res = await request.get(path)
      expect(res.ok(), path).toBe(true)
      expect(await res.text(), path).not.toMatch(COUNT)
    }
    const context = readFileSync(
      join(process.cwd(), "content", "ask", "context.md"),
      "utf8"
    )
    expect(context).not.toMatch(COUNT)
  })
})
