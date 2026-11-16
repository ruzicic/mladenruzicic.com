import {
  notFoundSchema,
  parseOrThrow,
  type NotFound,
} from "@/lib/content/schema"

/** `app/not-found.tsx`. Short, plain, first person; home and the list. */
export const NOT_FOUND: NotFound = parseOrThrow(
  notFoundSchema,
  {
    seo: { title: "Not found", description: "That page does not exist." },
    label: "404",
    title: "Nothing here.",
    line: "That page does not exist, or it moved. Everything I've built is on one list now.",
    links: [
      { label: "Home", href: "/" },
      { label: "Everything I've built", href: "/work" },
    ],
  },
  "content/pages/not-found.ts"
)
