import { expect, test } from "@playwright/test"

/**
 * Machine-readability surfaces — docs/v3-redesign-plan.md §6 (`/llms.txt`,
 * `/llms-full.txt`, `/*.md` mirrors, `Accept: text/markdown` negotiation via
 * `proxy.ts`) and §5 (`Person` JSON-LD in `app/layout.tsx`).
 */

test("/llms.txt is text/plain and lists /work/tenderlift", async ({
  request,
  baseURL,
}) => {
  const res = await request.get(`${baseURL}/llms.txt`)
  expect(res.ok()).toBe(true)
  expect(res.headers()["content-type"] ?? "").toContain("text/plain")
  const body = await res.text()
  expect(body).toContain("/work/tenderlift")
})

test("/llms-full.txt is text/plain and lists /work/tenderlift", async ({
  request,
  baseURL,
}) => {
  const res = await request.get(`${baseURL}/llms-full.txt`)
  expect(res.ok()).toBe(true)
  expect(res.headers()["content-type"] ?? "").toContain("text/plain")
  const body = await res.text()
  expect(body).toContain("/work/tenderlift")
})

test("/work/tenderlift.md is text/markdown and contains the h1", async ({
  request,
  baseURL,
}) => {
  const res = await request.get(`${baseURL}/work/tenderlift.md`)
  expect(res.ok()).toBe(true)
  expect(res.headers()["content-type"] ?? "").toContain("text/markdown")
  const body = await res.text()
  expect(body).toContain("# TenderLift")
})

test("GET /work/tenderlift with Accept: text/markdown returns markdown", async ({
  request,
  baseURL,
}) => {
  const res = await request.get(`${baseURL}/work/tenderlift`, {
    headers: { accept: "text/markdown" },
  })
  expect(res.ok()).toBe(true)

  const contentType = res.headers()["content-type"] ?? ""
  const body = await res.text()
  const looksLikeMarkdown =
    contentType.includes("markdown") || body.trimStart().startsWith("#")
  expect(
    looksLikeMarkdown,
    `expected a markdown response for Accept: text/markdown, got content-type="${contentType}"`
  ).toBe(true)
  expect(body).toContain("TenderLift")
})

test('JSON-LD on / parses and declares a Person named "Mladen Ružičić"', async ({
  page,
}) => {
  await page.goto("/")

  const jsonLdTexts = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents()
  expect(
    jsonLdTexts.length,
    "at least one application/ld+json script is present"
  ).toBeGreaterThan(0)

  const parsed = jsonLdTexts.map((text) => JSON.parse(text) as Record<string, unknown>)
  const person = parsed.find((entry) => entry["@type"] === "Person")

  expect(person, "a Person JSON-LD block exists on /").toBeTruthy()
  expect(person?.name).toBe("Mladen Ružičić")
})
