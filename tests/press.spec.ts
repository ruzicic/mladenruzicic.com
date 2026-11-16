import { readFileSync } from "node:fs"
import { join } from "node:path"
import { expect, test } from "@playwright/test"
import matter from "gray-matter"

import { ABOUT } from "@/content/pages/about"
import { MENTORING } from "@/content/pages/mentoring"
import { PRESS } from "@/content/pages/press"
import { PRODUCTS } from "@/content/products"
import { SITE } from "@/content/site"

import { gotoReady } from "./helpers"

/**
 * `/press` repeats facts that live elsewhere (owner, 16 Nov 2026: "ensure
 * PRESS page is always updated when changing about/work pages!"). Most are
 * derived in `content/pages/press.ts` and the rest are checked when the
 * content loads (`checkPress` in `lib/content/index.ts`). This spec holds
 * what is served, the page, its markdown twin and the Ask context, against
 * the sources themselves: `SITE`, the About CV, the product registry, the
 * mentoring figures and the case studies' front matter.
 */

const product = (slug: string) => PRODUCTS.find((p) => p.slug === slug)!
const role = (slug: string) =>
  String(
    matter(readFileSync(join("content", "work", `${slug}.mdx`), "utf8")).data
      .role
  )
const job = ABOUT.cv.rows.find((r) => r.ref === "zf-scalar")!
const number = (label: RegExp) =>
  MENTORING.numbers.find((n) => label.test(n.label))!.value

/** What each fact must say, from its source. */
const EXPECTED: Record<string, (v: string) => void> = {
  "BASED IN": (v) => expect(v).toBe(SITE.location.label),
  FROM: (v) => expect(v).toBe(SITE.from),
  LANGUAGES: (v) => expect(v.startsWith(SITE.languages.join(", "))).toBe(true),
  "BUILDING SINCE": (v) => expect(v).toBe(String(SITE.buildingSince)),
  "LONGEST-RUNNING": (v) =>
    expect(v).toBe(
      `${product("studenti-rs").name}, online since ${product("studenti-rs").year!.slice(0, 4)}`
    ),
  "DAY JOB": (v) => {
    expect(v.startsWith(`${job.role} at ${product("zf-scalar").name}, `)).toBe(
      true
    )
    // The team, as the ZF case study and the CV line name it.
    const team = v.split(", ").pop()!
    expect(role("zf-scalar").startsWith(`${job.role}, ${team}`)).toBe(true)
    expect(job.text).toContain(team)
  },
  "OWN PRODUCT": (v) =>
    expect(v).toBe(
      `${role("tenderlift").split(":")[0]} of ${product("tenderlift").name}`
    ),
  MENTORING: (v) =>
    expect(v).toBe(
      `${number(/rating/)} from ${number(/^reviews/)} reviews on MentorCruise, mentoring since ${MENTORING.seo.description.match(/since (\d{4})/)![1]}`
    ),
}

test("every fact on /press matches its source", async ({ page }) => {
  await gotoReady(page, "/press")
  const rows = page.locator(".ab-fact")
  const labels = await rows.locator("dt").allTextContents()
  expect(labels.sort()).toEqual(Object.keys(EXPECTED).sort())
  for (const row of await rows.all()) {
    const label = (await row.locator("dt").textContent())!
    const value = (await row.locator("dd").textContent())!
    EXPECTED[label](value)
  }
  // The one-liner is the line under his name.
  await expect(page.locator(".pr-line__text")).toHaveText([SITE.line])
})

test("the short bio states today's facts and none of the dropped ones", async ({
  page,
}) => {
  await gotoReady(page, "/press")
  const bio = (await page.locator("#pr-short-text").textContent())!
  expect(bio).toBe(PRESS.shortBio.text)
  for (const fact of [
    SITE.location.label,
    `${job.role} at ${product("zf-scalar").name}`,
    product("tenderlift").name,
    `${product("studenti-rs").name}, online since 2008`,
  ])
    expect(bio).toContain(fact)
  // TenderLift is co-founded: never its sole founder.
  expect(bio).not.toMatch(/(?<!co-)\bfound(?:er|ed)\b[^.]*\bTenderLift\b/i)
  expect(bio).not.toMatch(/\bTenderLift\b[^.]*(?<!co-)\bfound(?:er|ed)\b/i)
  // Removed on 16 Nov 2026.
  expect(bio).not.toMatch(/300\+|\blargest\b|\bbiggest\b/i)
})

test("the markdown twin and the Ask context say the same", async ({
  request,
}) => {
  const md = await (await request.get("/press.md")).text()
  const context = readFileSync(join("content", "ask", "context.md"), "utf8")
  expect(md).toContain(PRESS.shortBio.text)
  for (const f of PRESS.facts.items) {
    expect(md).toContain(f.value)
    expect(context).toContain(f.value)
  }
})
