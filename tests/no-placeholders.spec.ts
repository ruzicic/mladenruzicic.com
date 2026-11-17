import { expect, test } from "@playwright/test"

import { placeholderMatches } from "../lib/content/placeholder"
import { PAGES, STORY_SLUGS } from "./helpers"

/**
 * No bracket placeholder (`[` and a capital letter, such as
 * `[CONFIRM THE BACKEND STACK]`) reaches a visitor or a machine: not in a
 * page, not in a markdown mirror, not in `/llms.txt` or `/llms-full.txt`.
 * The open questions live in docs/v4-build/PLACEHOLDERS.md. Markdown links
 * (`[Text](url)`) are fine; `<script>` blocks are skipped, since JSON and
 * the RSC payload legitimately hold arrays.
 */

const MIRRORS = ["/", "/work", "/mentoring", "/about", "/cv", "/press"].map(
  (p) => (p === "/" ? "/index.md" : `${p}.md`)
)
const STORY_MIRRORS = STORY_SLUGS.map((s) => `/work/${s}.md`)

function holds(body: string): string[] {
  return placeholderMatches(body.replace(/<script\b[\s\S]*?<\/script>/gi, ""))
}

for (const path of [
  ...PAGES,
  ...MIRRORS,
  ...STORY_MIRRORS,
  "/llms.txt",
  "/llms-full.txt",
]) {
  test(`${path} holds no bracket placeholder`, async ({ request }) => {
    const res = await request.get(path)
    expect(res.status(), `${path} status`).toBe(200)
    expect(holds(await res.text())).toEqual([])
  })
}
