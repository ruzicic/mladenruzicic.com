import { homeSchema, parseOrThrow, type Home } from "@/lib/content/schema"

/**
 * SEED — minimal but valid. The copy agent owns the final wording.
 * `{braces}` mark the italic accent word; `[[slug]]` tokens in `lede` render as
 * inline chips.
 */
export const HOME: Home = parseOrThrow(
  homeSchema,
  {
    hero: {
      eyebrow: [
        "Technical product owner",
        "Founder",
        "Builder",
        "Lausanne, CH",
      ],
      h1: "I build products, platforms and the {systems} around them.",
      lede: "Currently product owner for [[zf-scalar]] and founder of [[tenderlift]]. Eighteen years of shipping, from PHP sites as a student to AI-native products.",
      scrollCue: "Scroll",
    },
    work: {
      eyebrow: "Selected work",
      countLabel: "of many · most recent first",
      allWorkLabel: "All work",
    },
    history: {
      eyebrow: "Work history",
      rangeLabel: "Today → 2008 · drag sideways",
      employedLabel: "Employed",
      independentLabel: "Independent",
      alongsideLabel: "Worked alongside",
    },
    mentoring: {
      eyebrow: "Mentoring",
      h2: "Mentoring engineers who want to {ship}.",
      lede: "Thirty-plus mentees on MentorCruise. Code reviews, career decisions, and the habit of finishing things.",
      pageLink: "How mentoring works",
      externalLink: "Book on MentorCruise",
    },
    footer: {
      copyright: "© 2026 Mladen Ružičić",
    },
    preloader: {
      finalVerb: "Shipping",
      // ~30 curated from docs/v3-design/spinner-verbs.json.
      verbs: [
        "Architecting",
        "Assembling",
        "Bootstrapping",
        "Brewing",
        "Calibrating",
        "Churning",
        "Clauding",
        "Cogitating",
        "Compiling",
        "Composing",
        "Computing",
        "Considering",
        "Crafting",
        "Deliberating",
        "Distilling",
        "Drafting",
        "Elucidating",
        "Forging",
        "Formulating",
        "Marinating",
        "Mulling",
        "Percolating",
        "Pondering",
        "Refining",
        "Reticulating",
        "Simmering",
        "Sketching",
        "Synthesizing",
        "Tinkering",
        "Wrangling",
      ],
    },
  },
  "content/pages/home.ts"
)
