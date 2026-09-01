import {
  mentoringSchema,
  parseOrThrow,
  type Mentoring,
} from "@/lib/content/schema"

import { SITE } from "../site"

/** SEED — minimal but valid. The copy agent owns the final wording. */
export const MENTORING: Mentoring = parseOrThrow(
  mentoringSchema,
  {
    seo: {
      title: "Mentoring",
      description:
        "One-to-one mentoring for engineers who want to ship: code reviews, career decisions, and the habit of finishing things.",
    },
    h1: "Mentoring engineers who want to {ship}.",
    lede: "Thirty-plus mentees on MentorCruise since 2021. Sessions are practical: your code, your decisions, your next step.",
    whoFor: [
      "Engineers stuck between mid and senior.",
      "Career switchers who can already write code and need direction.",
      "Founders who want a second pair of eyes on a technical decision.",
    ],
    howItWorks: [
      {
        title: "Discovery session",
        body: "A free fifteen minutes to work out whether I am the right mentor for what you are trying to do.",
      },
      {
        title: "A plan",
        body: "We agree on goals and a cadence, and I follow up with a proposal.",
      },
      {
        title: "The work",
        body: "Calls, code reviews and homework between sessions. You do the work; I keep you honest about it.",
      },
    ],
    topics: [
      "Frontend architecture",
      "Design systems",
      "Code review",
      "Product thinking for engineers",
      "Career decisions",
      "Interview preparation",
    ],
    expectations: [
      "You come with something specific to work on.",
      "You do the homework between sessions.",
      "I tell you what I actually think.",
    ],
    cta: {
      label: "Book a discovery session",
      url: SITE.links.calendar,
      note: "Fifteen minutes, free, no pitch.",
    },
  },
  "content/pages/mentoring.ts"
)
