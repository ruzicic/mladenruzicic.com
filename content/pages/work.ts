import type { WorkPage } from "@/lib/content/schema"

/**
 * `/work` index copy. `{count}` is replaced with the number of entries by the
 * page and by the `/md/work` mirror, so the figure can never drift from the
 * content directory.
 */
export const WORK_PAGE = {
  seo: {
    title: "Work",
    description:
      "Case studies and products: companies I have worked for, things I have built on my own, and the experiments worth keeping.",
  },
  eyebrow: ["Work", "{count} entries", "featured first, then most recent"],
  // {shipped} renders in Instrument Serif Italic.
  h1: "Everything I have {shipped} that is mine to show.",
  lede: "Four employers, a handful of products I run on my own, and the experiments that taught me something. Company work is described at the level its confidentiality allows.",
  mirror: {
    description:
      "Case studies and products: companies worked for, products built independently, and experiments worth keeping.",
    intro: "{count} entries. Featured first, then most recent.",
  },
} satisfies WorkPage
