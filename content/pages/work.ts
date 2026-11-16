import {
  parseOrThrow,
  workPageSchema,
  type WorkPage,
} from "@/lib/content/schema"

/**
 * `/work`: every product and job in one list (`getBuiltList()`, the landing's
 * list, complete) under a short intro. No board exists for the page; the
 * title is the list's heading and the intro is the board's "Everything else"
 * card (the strip's end card before it became "That's not all, folks!"),
 * both from `Landing.dc.html`.
 */
export const WORK_PAGE: WorkPage = parseOrThrow(
  workPageSchema,
  {
    seo: {
      title: "All work",
      description:
        "The products and jobs I put the most time into, with what happened to each.",
    },
    title: "Stuff I've put real time into",
    // The owner's words of 15 Nov 2026: the list is a selection, not all.
    intro:
      "Below is a list of projects I put a fairly significant chunk of time into. There's a lot more, but it would make the list too noisy.",
    story: {
      numbers: "In numbers",
      people: "Worked alongside",
      roles: "Roles, oldest first",
      next: "Next case study",
      nextCue: "Next",
      pause: "Pause clip",
      play: "Play clip",
      // The bar's link once it leads to the top of the page (owner, 16 Nov
      // 2026); the project's name, which the bar then shows, comes first.
      toTop: "{name}, back to top",
    },
  },
  "content/pages/work.ts"
)
