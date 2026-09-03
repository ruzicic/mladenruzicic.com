import type { Home } from "@/lib/content/schema"

export const HOME = {
  hero: {
    eyebrow: ["Technical product owner", "Founder", "Builder", "Lausanne, CH"],
    // {systems} renders in Instrument Serif Italic.
    h1: "I build products, platforms and the {systems} around them.",
    // [[zf-scalar]] and [[tenderlift]] render as inline chips.
    lede: "Shipping since 2008, when studenti.rs went live: PSD-to-WordPress first, then IoT dashboards, AR/VR pipelines and consumer scale at Shopify. Today I own product for a driver-facing app at [[zf-scalar]] and build [[tenderlift]], a Swiss public-procurement platform, end to end.",
    scrollCue: "Scroll",
  },
  work: {
    eyebrow: "Selected work",
    allWorkLabel: "All work",
  },
  history: {
    eyebrow: "Work history",
    rangeLabel: "2008 – 2026",
    // The rail's two lanes. "Employed" / "Independent" described a contract;
    // "Main track" / "Side track" describes what the reader is looking at —
    // the run of jobs along the top, the products that ran beside them.
    employedLabel: "Main track",
    independentLabel: "Side track",
    alongsideLabel: "Worked alongside",
  },
  mentoring: {
    eyebrow: "Mentoring",
    // {ship} renders in Instrument Serif Italic.
    h2: "Mentoring engineers who want to {ship}.",
    lede: "Forty-plus engineers, mostly mid-level people trying to get to senior, and career switchers who need someone to be honest with them. Work between sessions, code review, real projects. Teaching is the fastest way I know to find out whether I actually understand something.",
    pageLink: "How mentoring works",
    externalLink: "MentorCruise",
    proof: {
      label: "See 50+ five-star ratings on mentors.to/ruzicic",
      href: "https://mentors.to/ruzicic",
    },
  },
  footer: {
    copyright: "© 2026 Mladen Ružičić",
  },
  preloader: {
    finalVerb: "Shipping",
    // Curated from docs/v3-design/spinner-verbs.json (186 Claude Code verbs).
    // Kept the ones that read as work; dropped Boogieing, Lollygagging,
    // Razzle-dazzling and friends.
    verbs: [
      "Architecting",
      "Bootstrapping",
      "Brewing",
      "Calculating",
      "Cascading",
      "Cerebrating",
      "Clauding",
      "Coalescing",
      "Cogitating",
      "Composing",
      "Computing",
      "Considering",
      "Contemplating",
      "Crafting",
      "Crunching",
      "Crystallizing",
      "Deciphering",
      "Deliberating",
      "Forging",
      "Generating",
      "Hashing",
      "Ideating",
      "Inferring",
      "Marinating",
      "Orchestrating",
      "Percolating",
      "Processing",
      "Reticulating",
      "Synthesizing",
      "Wrangling",
    ],
  },
} satisfies Home
