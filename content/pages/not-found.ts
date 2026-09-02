import type { NotFound } from "@/lib/content/schema"

/** `app/not-found.tsx` — docs/v3-redesign-plan.md §5.2. */
export const NOT_FOUND = {
  eyebrow: ["404", "Not found"],
  code: "404",
  // {exist} renders in Instrument Serif Italic.
  h1: "That page does not {exist}.",
  lede: "It may have moved, or it may never have existed. The work index is a good place to start.",
} satisfies NotFound
