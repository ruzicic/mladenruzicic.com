import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test"

import {
  jsonLdNodes,
  PAGES,
  PLACEHOLDER_RE,
  readJsonLdBlocks,
  TESTIMONIAL_QUOTES,
} from "./helpers"

/**
 * The copy rules (PLAN.md §2 "Copy rules", docs/v4-build/PLACEHOLDERS.md),
 * checked on what the site actually serves: every page's text, title and
 * description, and every machine output (llms.txt, llms-full.txt, the
 * markdown twins, JSON-LD).
 *
 * - No em dash, except inside a testimonial (testimonial text is never
 *   edited, so a mentee's dash stays).
 * - Lausanne is never given as his location (he lives in Ticino; Lausanne
 *   is his employer's office).
 * - No bracket placeholder (`[YEAR]`, `[DATE]`, …) on any page, in its
 *   JSON-LD, in its markdown twin, or in `/llms.txt` and `/llms-full.txt`.
 */

const EM_DASH = "—"

/**
 * "Lausanne" stated as where he is: after a word about living or being
 * based, as a postal locality, or in his location line. A mention of a ZF
 * office would not match.
 */
const LAUSANNE_AS_HOME =
  /\b(?:based|lives?|living|located|resides?|home|from|in)\b[^.\n]{0,40}\bLausanne\b|"addressLocality"\s*:\s*"Lausanne"|\bLausanne,\s*(?:VD,\s*)?Switzerland\b/i

/** Removes every testimonial quote, the one place an em dash may appear. */
function withoutTestimonials(text: string): string {
  let out = text.replace(/\s+/g, " ")
  for (const q of TESTIMONIAL_QUOTES)
    out = out.split(q.replace(/\s+/g, " ")).join(" ")
  return out
}

function context(text: string, index: number): string {
  return text.slice(Math.max(0, index - 50), index + 50).replace(/\s+/g, " ")
}

function emDashes(text: string): string[] {
  const clean = withoutTestimonials(text)
  const hits: string[] = []
  let i = clean.indexOf(EM_DASH)
  while (i !== -1 && hits.length < 10) {
    hits.push(context(clean, i))
    i = clean.indexOf(EM_DASH, i + 1)
  }
  return hits
}

function placeholders(text: string): string[] {
  const re = new RegExp(PLACEHOLDER_RE.source, "g")
  return [...text.matchAll(re)].map((m) => m[0]).slice(0, 10)
}

/** Every string value in a JSON-LD block (keys and URLs are not copy). */
function jsonLdStrings(raw: string): string {
  const out: string[] = []
  const walk = (v: unknown) => {
    if (typeof v === "string") {
      if (!/^https?:|^mailto:/.test(v)) out.push(v)
    } else if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === "object") Object.values(v).forEach(walk)
  }
  walk(jsonLdNodes(JSON.parse(raw)))
  return out.join("\n")
}

/** The page's text as served: body copy (visible or not), title, description. */
async function pageText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const body = document.body.cloneNode(true) as HTMLElement
    body
      .querySelectorAll("script, style, template, noscript")
      .forEach((n) => n.remove())
    const labels = [
      ...document.querySelectorAll("[aria-label], [alt], [title]"),
    ]
      .flatMap((el) => [
        el.getAttribute("aria-label"),
        el.getAttribute("alt"),
        el.getAttribute("title"),
      ])
      .filter(Boolean)
    const description =
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content") ?? ""
    return [
      document.title,
      description,
      body.textContent ?? "",
      ...labels,
    ].join("\n")
  })
}

async function markdown(request: APIRequestContext, path: string) {
  const res = await request.get(path, { headers: { Accept: "text/markdown" } })
  expect(res.ok(), `${path} markdown twin`).toBe(true)
  return res.text()
}

test.describe("pages", () => {
  for (const path of PAGES) {
    test(`${path} follows the copy rules`, async ({ page }) => {
      await page.goto(path)
      const text = await pageText(page)
      const ld = (await readJsonLdBlocks(page)).map(jsonLdStrings).join("\n")

      expect(emDashes(text), `${path}: em dashes in the page`).toEqual([])
      expect(emDashes(ld), `${path}: em dashes in JSON-LD`).toEqual([])
      expect(text, `${path}: Lausanne as his location`).not.toMatch(
        LAUSANNE_AS_HOME
      )
      expect(ld).not.toMatch(LAUSANNE_AS_HOME)
      expect(placeholders(text), `${path}: bracket placeholders`).toEqual([])
      expect(placeholders(ld), `${path}: placeholders in JSON-LD`).toEqual([])
    })
  }
})

test.describe("machine outputs", () => {
  test("/llms.txt follows the copy rules", async ({ request }) => {
    const body = await (await request.get("/llms.txt")).text()
    expect(emDashes(body)).toEqual([])
    expect(body).not.toMatch(LAUSANNE_AS_HOME)
    expect(placeholders(body)).toEqual([])
  })

  test("/llms-full.txt follows the copy rules", async ({ request }) => {
    const body = await (await request.get("/llms-full.txt")).text()
    expect(emDashes(body)).toEqual([])
    expect(body).not.toMatch(LAUSANNE_AS_HOME)
    expect(placeholders(body)).toEqual([])
  })

  for (const path of PAGES) {
    test(`${path} markdown twin follows the copy rules`, async ({
      request,
    }) => {
      const body = await markdown(request, path)
      expect(emDashes(body), `${path}.md: em dashes`).toEqual([])
      expect(body).not.toMatch(LAUSANNE_AS_HOME)
      expect(placeholders(body), `${path}.md: placeholders`).toEqual([])
    })
  }
})
