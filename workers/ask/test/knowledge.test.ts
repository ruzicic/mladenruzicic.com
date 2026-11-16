import { describe, expect, it } from "vitest"

import CONTEXT from "../../../content/ask/context.md"
import { KNOWLEDGE } from "../src/knowledge"
import { MARKER } from "../src/prompt"
import { normalize, validateSources } from "../src/sources"

describe("the knowledge", () => {
  it("fills every placeholder in the rules", () => {
    expect(KNOWLEDGE.systemPrompt).not.toMatch(/\{\{[A-Z]+\}\}/)
    expect(KNOWLEDGE.systemPrompt).toContain(MARKER)
    expect(KNOWLEDGE.email).toBe("me@mladenruzicic.com")
  })

  it("puts the rules first and the context last, with no per-request data", () => {
    const p = KNOWLEDGE.systemPrompt
    expect(p.indexOf("# How you speak")).toBeLessThan(p.indexOf("# CONTEXT"))
    expect(p).not.toMatch(/\d{4}-\d{2}-\d{2}T/)
  })

  it("has no visible placeholders and no em dashes outside quotes", () => {
    expect(CONTEXT).not.toMatch(/\[[A-Z][A-Z0-9 ]{1,}[^\]]*\](?!\()/)
  })

  it("keeps the ONA row to the one line the site has", () => {
    const ona = CONTEXT.split("\n").filter((l) => /\bmom\b|\bmother\b/i.test(l))
    expect(ona).toEqual([
      expect.stringContaining("In the list: \"My mom's ecommerce business."),
    ])
  })

  it("never names his employer in the identity lines", () => {
    const who = CONTEXT.split("## Who he is and where")[1].split(
      "His own words"
    )[0]
    expect(who).not.toMatch(/\bZF\b|Shopify|SCALAR/)
  })

  it("ends every fact with its source", () => {
    const facts = CONTEXT.split("## Site map")[0]
      .split("\n")
      .filter((l) => l.startsWith("- "))
    expect(facts.length).toBeGreaterThan(100)
    for (const l of facts) expect(l).toMatch(/\(source: \/[^)]*\)$/)
  })

  it("parses a site map of real paths", () => {
    const hrefs = KNOWLEDGE.sources.all.map((s) => s.href)
    for (const path of [
      "/",
      "/work",
      "/about",
      "/mentoring",
      "/press",
      "/work/tenderlift",
    ])
      expect(hrefs).toContain(path)
    expect(hrefs).toContain("mailto:me@mladenruzicic.com")
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })
})

describe("sources", () => {
  it("turns the site's absolute URLs into paths", () => {
    expect(
      normalize("https://mladenruzicic.com/about", "https://mladenruzicic.com")
    ).toBe("/about")
    expect(
      normalize("https://mladenruzicic.com", "https://mladenruzicic.com")
    ).toBe("/")
    expect(
      normalize(
        "https://mladenruzicic.com#contact",
        "https://mladenruzicic.com"
      )
    ).toBe("/#contact")
  })

  it("keeps known links, drops the rest, at most three", () => {
    const out = validateSources(
      [
        "/about",
        "/about/",
        "/nope",
        { href: "/press" },
        7,
        "/mentoring",
        "/work",
      ],
      KNOWLEDGE.sources
    )
    expect(out.map((s) => s.href)).toEqual(["/about", "/press", "/mentoring"])
    expect(validateSources("not a list", KNOWLEDGE.sources)).toEqual([])
  })
})
