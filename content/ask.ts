import { askSchema, parseOrThrow, type Ask } from "@/lib/content/schema"

import { updatedInWords } from "./site"

/** The date every answer's source line states: `SITE.updated`. */
const UPDATED = updatedInWords().toUpperCase()

/**
 * Ask, the small PR agent in the header. The panel copy is ported verbatim
 * from the `ASK_EX` table and the panel markup in
 * `docs/v4-ideation/board/project/Landing.dc.html`.
 *
 * The prepared questions (rewritten 2026-11-12) are thought from who opens
 * the panel: a recruiter or hiring manager (`now`, `cv`), a founder or
 * product lead (`work`), someone building in Switzerland (`tenderlift`), a
 * possible mentee (`mentor`), a journalist or event organiser (`bio`), a
 * curious developer (`agents`, `miss`), anyone (`where`). The first
 * `chipsShown` are offered as chips; the rest appear as those are asked.
 * Every answer is drawn only from site content, in the third person, and
 * awaits his read (docs/v4-build/PLACEHOLDERS.md).
 *
 * They answer instantly and without the live model. A typed question goes
 * to the live model (`workers/ask`) when `NEXT_PUBLIC_ASK_ENDPOINT` and
 * `NEXT_PUBLIC_TURNSTILE_SITE_KEY` are both set, and is otherwise matched
 * against `keywords` by simple overlap. `fallback` answers anything else;
 * `live` holds the copy for the model's answers and for every way a typed
 * question can end without one.
 *
 * The bio card's text is `PRESS.shortBio.text`, not repeated here. The
 * `work` id is read by `/mcp`'s `get_contact`.
 */
export const ASK: Ask = parseOrThrow(
  askSchema,
  {
    label: "Ask",
    closeLabel: "Close",
    ariaOpen: "Ask about Mladen's work",
    dialogLabel: "Ask about Mladen's work",
    title: "Ask about his work.",
    note: "Answers come from this site only.",
    suggestionsLabel: "Suggested questions",
    inputLabel: "Your question",
    placeholder: "Ask anything about his work",
    sendLabel: "Send",
    thinkingVerbs: ["Reading his work", "Checking the story", "Writing"],
    footNote: "PROTOTYPE · SCRIPTED ANSWERS",
    turnFormat: "TURN {n} OF {max} · QUESTIONS SAVED ANONYMOUSLY",
    maxTurns: 8,
    chipsShown: 6,
    questions: [
      {
        id: "now",
        chip: "What's he working on now?",
        question: "What is he working on now?",
        answer:
          "By day he is Global Product Owner at ZF, for the Driver Experience team, working on tools truck drivers use every day. The rest of the time he runs TenderLift, his own product for Swiss public tenders, and a few small products that mostly run themselves, like FontAlternatives and studenti.rs. Zarez, a spelling checker for Serbian, is live.",
        source: `FROM · HOME · UPDATED ${UPDATED}`,
        sourceHref: "/#recent-work",
        card: {
          kind: "link",
          href: "/work/zf-scalar",
          title: "ZF",
          body: "The day job, and how a design system led to it.",
          visual: { kind: "tile", ref: "zf-scalar" },
        },
        keywords: [
          "now",
          "current",
          "currently",
          "working",
          "doing",
          "today",
          "days",
          "busy",
          "lately",
          "latest",
          "zarez",
          "evo",
        ],
      },
      {
        id: "cv",
        chip: "Where has he worked?",
        question: "Where has he worked?",
        answer:
          "Since 2023 he has been at ZF: he built and led the Velocity design system, then became Global Product Owner: for EVO Touch until September 2026, and for the Driver Experience team since October 2026. Before that he spent two years at Shopify helping build Shop Minis from zero, led a team of six building VR for architects at HEGIAS, and led the core of an IoT platform at WolkAbout. Earlier came Execom, with many client projects at a fast pace, and Nemestic Studio, a small studio with dozens of client projects.",
        source: "FROM · ABOUT · CV",
        sourceHref: "/about",
        card: {
          kind: "link",
          href: "/about",
          title: "About and CV",
          body: "From engineering to product owner and founder: the longer story and the CV.",
          visual: {
            kind: "image",
            image: { src: "/mladen-ruzicic.png", alt: "Mladen Ružičić" },
          },
        },
        keywords: [
          "worked",
          "cv",
          "resume",
          "résumé",
          "experience",
          "career",
          "jobs",
          "employers",
          "companies",
          "background",
          "history",
          "shopify",
          "hegias",
          "wolkabout",
          "execom",
          "previously",
        ],
      },
      {
        id: "work",
        chip: "Can we work together?",
        question: "Can we work together?",
        answer:
          "He is happy to connect and meet new people: if you are building something and need help or advice, or you are based in Ticino and want to meet, message him on X or LinkedIn, or book a 15-minute call. A few times a year he also takes on a project or a mentee, when the fit is strong. The fastest way in is a 15-minute call.",
        source: `FROM · HOME · UPDATED ${UPDATED}`,
        sourceHref: "/#contact",
        card: {
          kind: "link",
          href: "https://cal.com/ruzicic/15m-discovery-session",
          title: "Book a 15-minute call",
          body: "cal.com/ruzicic",
          visual: { kind: "icon", icon: "calendar" },
        },
        keywords: [
          "together",
          "hire",
          "hiring",
          "freelance",
          "contract",
          "consulting",
          "partner",
          "partnership",
          "collaborate",
          "contact",
          "email",
          "reach",
          "available",
          "availability",
          "project",
        ],
      },
      {
        id: "tenderlift",
        chip: "What is TenderLift?",
        question: "What is TenderLift?",
        answer:
          "TenderLift reads the Swiss public tenders published every day and tells a company which ones it can actually win. It works in German, French, Italian and English. Mladen co-founded it in September 2025 and builds the product.",
        source: `FROM · TENDERLIFT CASE STUDY · UPDATED ${UPDATED}`,
        sourceHref: "/work/tenderlift",
        card: {
          kind: "product",
          ref: "tenderlift",
          href: "https://tenderlift.ch",
          image: {
            src: "/static/work/tenderlift/1440x1000.webp",
            alt: "TenderLift homepage",
          },
          title: "TenderLift",
          status: "LIVE",
          quote: "“Stop wasting hours on tenders you can't win.”",
          linkLabel: "Open tenderlift.ch",
        },
        keywords: [
          "tenderlift",
          "tender",
          "tenders",
          "procurement",
          "simap",
          "cantons",
          "founder",
          "founded",
          "startup",
          "behind",
          "switzerland",
          "swiss",
        ],
      },
      {
        id: "mentor",
        chip: "Does he take mentees?",
        question: "Does he take mentees?",
        answer:
          "Sometimes. He has mentored on MentorCruise since 2021 and holds a 5.0 average from 51 reviews, but these days he takes someone on only when he can really help. It fits people switching into frontend or product engineering, senior engineers moving toward product ownership, and people building a product next to a full-time job. It starts with a 15-minute call.",
        source: `FROM · MENTORING · UPDATED ${UPDATED}`,
        sourceHref: "/mentoring",
        card: {
          kind: "link",
          href: "/mentoring",
          title: "Mentoring",
          body: "How it works and who it fits.",
          visual: { kind: "tile", ref: "mentorcruise" },
        },
        keywords: [
          "mentor",
          "mentors",
          "mentee",
          "mentees",
          "mentoring",
          "mentorship",
          "mentorcruise",
          "coach",
          "coaching",
          "learn",
          "teach",
          "junior",
          "guidance",
        ],
      },
      {
        id: "bio",
        chip: "A short bio, please",
        question: "A short bio, please.",
        answer: "Here it is, ready to paste.",
        source: `FROM · PRESS KIT · UPDATED ${UPDATED}`,
        sourceHref: "/press",
        card: {
          kind: "bio",
          label: "SHORT BIO · ENGLISH",
          copyLabel: "Copy",
          copiedLabel: "Copied",
          failedLabel: "Copy failed",
          note: "Ask in Serbian or Italian and it answers in that language.",
          link: { label: "Open the press kit", href: "/press" },
        },
        keywords: [
          "bio",
          "biography",
          "short",
          "press",
          "kit",
          "introduce",
          "introduction",
          "headshot",
          "photo",
          "speaker",
          "journalist",
          "event",
          "podcast",
          "interview",
        ],
      },
      {
        id: "agents",
        chip: "What runs without him?",
        question: "What runs without him?",
        answer:
          "studenti.rs and FontAlternatives are fully automated, every flow. On top of that, several AI agents check all his projects, customers and inboxes every day, and alert him when they find something they can't resolve.",
        source: "FROM · STUDENTI.RS AND FONTALTERNATIVES CASE STUDIES",
        sourceHref: "/work/studenti-rs",
        card: {
          kind: "link",
          href: "/work/studenti-rs",
          title: "studenti.rs",
          body: "Eighteen years live, fully automated.",
          visual: { kind: "tile", ref: "studenti-rs" },
        },
        keywords: [
          "ai",
          "agents",
          "agent",
          "llm",
          "claude",
          "automation",
          "automate",
          "automated",
          "runs",
          "without",
          "autopilot",
          "tools",
          "stack",
          "vibe",
        ],
      },
      {
        id: "miss",
        chip: "What didn't work out?",
        question: "What didn't work out?",
        answer:
          "A few things, and he lists them. Panciona, Hi Fam, FlexMatch and Nunium are retired. They sit in the same list as the products that are running, with what happened to each.",
        source: `FROM · ALL WORK · UPDATED ${UPDATED}`,
        sourceHref: "/work",
        card: {
          kind: "link",
          href: "/work",
          title: "What he has built",
          body: "The products and jobs he put the most time into, running and retired.",
          visual: { kind: "icon", icon: "list" },
        },
        keywords: [
          "didn't",
          "didnt",
          "fail",
          "failed",
          "failure",
          "failures",
          "wrong",
          "retired",
          "paused",
          "dead",
          "closed",
          "stopped",
          "mistakes",
          "nunium",
          "panciona",
        ],
      },
      {
        id: "where",
        chip: "Where is he based?",
        question: "Where is he based?",
        answer:
          "He lives in Ticino, Switzerland, and is from Bosnia and Herzegovina, by way of Serbia. He works in Serbian, English and Italian; the Italian is seven years in and still improving.",
        source: `FROM · ABOUT · UPDATED ${UPDATED}`,
        sourceHref: "/about",
        card: {
          kind: "link",
          href: "/about",
          title: "The longer story",
          body: "From engineering to product owner and founder: the longer story and the CV.",
          visual: {
            kind: "image",
            image: { src: "/mladen-ruzicic.png", alt: "Mladen Ružičić" },
          },
        },
        keywords: [
          "based",
          "where",
          "live",
          "lives",
          "location",
          "located",
          "ticino",
          "country",
          "languages",
          "language",
          "speak",
          "italian",
          "serbian",
          "relocate",
          "remote",
        ],
      },
    ],
    fallback: {
      answer:
        "It can only answer the listed questions for now. For anything else, write to Mladen at me@mladenruzicic.com.",
      source: "PROTOTYPE · SCRIPTED ANSWERS",
      card: {
        kind: "link",
        href: "mailto:me@mladenruzicic.com",
        title: "Write to Mladen",
        body: "me@mladenruzicic.com",
        visual: { kind: "icon", icon: "mail" },
      },
    },
    live: {
      footNote: "ANSWERS FROM THIS SITE ONLY",
      sourcePrefix: "FROM",
      noSource: "FROM · THIS SITE",
      checking: "Making sure you're not a bot. This happens once a visit.",
      interactive:
        "One quick check before Ask answers: tick the box below the question field.",
      cutShort:
        "The answer was cut short. Asking again may give you all of it.",
      messages: {
        challenge_failed:
          "Ask couldn't confirm you're a person, so your question wasn't sent. The suggested questions still work, or write to Mladen at me@mladenruzicic.com.",
        rate_limited:
          "That's a lot of questions in a short time. Please try again in {wait}.",
        daily_limit:
          "That's all the questions Ask can take from one visitor today. Please come back tomorrow, or write to Mladen at me@mladenruzicic.com.",
        budget_reached:
          "Ask has answered all the questions it can for today. Please come back tomorrow, or write to Mladen at me@mladenruzicic.com.",
        unavailable:
          "Ask can't answer right now. Please try again in a little while, or write to Mladen at me@mladenruzicic.com.",
        bad_request:
          "Ask couldn't take that question. Try asking it in a few plain words, without links.",
      },
      wait: {
        moment: "a moment",
        minute: "a minute",
        minutes: "{n} minutes",
      },
    },
  },
  "content/ask.ts"
)
