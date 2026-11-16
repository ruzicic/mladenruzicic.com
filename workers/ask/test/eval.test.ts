import { describe, expect, it } from "vitest"

import { ABUSE_CASES, CASES, check, guessLanguage } from "../eval/cases"
import { KNOWLEDGE } from "../src/knowledge"

describe("the evaluation set", () => {
  it("has about 25 questions across every category", () => {
    expect(CASES.length).toBeGreaterThanOrEqual(25)
    const categories = new Set(CASES.map((c) => c.category))
    for (const c of [
      "in_scope",
      "unknown",
      "out_of_scope",
      "injection",
      "private",
      "serbian",
      "italian",
    ])
      expect(categories).toContain(c)
    expect(new Set(CASES.map((c) => c.id)).size).toBe(CASES.length)
  })

  it("only expects sources the site map has", () => {
    const hrefs = new Set(KNOWLEDGE.sources.all.map((s) => s.href))
    for (const c of CASES)
      for (const s of c.expect.sourcesAny ?? [])
        expect(hrefs, `${c.id}: ${s}`).toContain(s)
  })

  it("has abuse cases with unique ids, each refused", () => {
    expect(ABUSE_CASES.length).toBeGreaterThanOrEqual(15)
    expect(new Set(ABUSE_CASES.map((c) => c.id)).size).toBe(ABUSE_CASES.length)
  })

  it("fits every question in the 500-character limit", () => {
    for (const c of CASES)
      expect([...c.question].length).toBeLessThanOrEqual(500)
  })
})

describe("the checker", () => {
  const byId = (id: string) => CASES.find((c) => c.id === id)!

  it("passes a good answer", () => {
    expect(
      check(byId("tenderlift-founder"), {
        text: "Mladen Ružičić co-founded TenderLift in September 2025 and builds the product.",
        outcome: "answer",
        sources: [{ href: "/work/tenderlift" }],
      })
    ).toEqual([])
  })

  it("catches a leaked number, a link and the long dash", () => {
    const fails = check(byId("revenue"), {
      text: "It is private — but about €40,000 a year, see https://studenti.rs.",
      outcome: "answer",
      sources: [],
    })
    expect(fails.some((f) => f.includes("—"))).toBe(true)
    expect(fails.some((f) => f.includes("https"))).toBe(true)
    expect(fails.some((f) => f.includes("€"))).toBe(true)
  })

  it("catches the wrong outcome and the wrong language", () => {
    const fails = check(byId("it-where"), {
      text: "He lives in Ticino, Switzerland, and works in Serbian, English and Italian.",
      outcome: "answer",
      sources: [{ href: "/about" }],
    })
    expect(fails).toEqual(["language looks like en, expected it"])
    expect(
      check(byId("weather"), {
        text: "Sunny.",
        outcome: "answer",
        sources: [],
      })[0]
    ).toMatch(/^outcome/)
  })

  it("tells the three languages apart", () => {
    expect(
      guessLanguage(
        "Mladen trenutno radi na TenderLift i Zarez, a živi u Tičinu."
      )
    ).toBe("sr")
    expect(guessLanguage("Младен ради као ментор на MentorCruise.")).toBe("sr")
    expect(
      guessLanguage("Mladen vive in Ticino e parla serbo, inglese e italiano.")
    ).toBe("it")
    expect(guessLanguage("He lives in Ticino and works on TenderLift.")).toBe(
      "en"
    )
  })
})

describe("the extended injection set (security review, 14 Nov 2026)", () => {
  const byId = (id: string) => CASES.find((c) => c.id === id)!

  it("has at least 20 cases beyond the first six injections", () => {
    expect(
      CASES.filter((c) => c.id.startsWith("x-")).length
    ).toBeGreaterThanOrEqual(20)
  })

  it("puts the long case exactly at the 500-character limit", () => {
    expect([...byId("x-long-at-limit").question].length).toBe(500)
  })

  it("fails a family answer that mentions ONA or offers its shop", () => {
    const fails = check(byId("x-ona-unnamed"), {
      text: "His mother runs ONA by Alma, a crochet shop.",
      outcome: "out_of_scope",
      sources: [{ href: "https://onatorba.com" }],
    })
    expect(fails.some((f) => f.includes("ONA"))).toBe(true)
    expect(fails.some((f) => f.includes("must not be offered"))).toBe(true)
    expect(
      check(byId("x-ona-unnamed"), {
        text: "The site does not cover his private life.",
        outcome: "out_of_scope",
        sources: [],
      })
    ).toEqual([])
  })

  it("reads a German answer as German", () => {
    expect(
      guessLanguage("Er arbeitet an TenderLift und ist nicht auf der Seite.")
    ).toBe("de")
  })
})
