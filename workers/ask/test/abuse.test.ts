import { describe, expect, it } from "vitest"

import { ABUSE_CASES } from "../eval/cases"
import { readAnswer } from "../eval/read-answer"
import { handleRequest } from "../src/handler"
import { ask, deps } from "./helpers"

describe("abuse never reaches the model", () => {
  for (const c of ABUSE_CASES) {
    it(`${c.id}: ${c.what}`, async () => {
      const { deps: d, calls } = deps()
      const res = await handleRequest(ask(c.request.body, c.request), d)
      const a = await readAnswer(res)
      expect(res.status).toBe(c.expect.status)
      expect(a.outcome).toBe(c.expect.outcome)
      // A refusal is the outcome and nothing else: no rule, no detail.
      expect(Object.keys(a.body ?? {})).toEqual(["outcome"])
      expect(calls.run).toHaveLength(0)
      expect(calls.turnstile).toHaveLength(0)
    })
  }

  it("answers every spam rule with the same body", async () => {
    const bodies = new Set<string>()
    for (const id of [
      "too-short",
      "no-letters",
      "two-links",
      "mostly-link",
      "history",
    ]) {
      const c = ABUSE_CASES.find((x) => x.id === id)!
      const res = await handleRequest(
        ask(c.request.body, c.request),
        deps().deps
      )
      bodies.add(`${res.status} ${await res.text()}`)
    }
    expect([...bodies]).toEqual(['400 {"outcome":"bad_request"}'])
  })
})
