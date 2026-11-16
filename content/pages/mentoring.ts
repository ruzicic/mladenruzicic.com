import {
  mentoringSchema,
  parseOrThrow,
  type Mentoring,
} from "@/lib/content/schema"

/**
 * `/mentoring`, ported verbatim from
 * `docs/v4-ideation/board/project/Landing-Mentoring.dc.html` (the phone board
 * carries the same copy). Testimonial text lives in `content/testimonials.ts`
 * and is never edited; `said.pile` only orders the cards and carries each
 * card's paper tone and tilt (the board's nine values, reused for all
 * seventeen so neighbours differ).
 *
 * Two board placeholders are filled from known facts: the closing block's
 * `mailto:[EMAIL]` is his address, and the MentorCruise profile
 * `mentorcruise.com/mentor/[HANDLE]` is `mentors.to/ruzicic`, the profile
 * link the About board uses. The booking link sits in that closing block
 * (`cta`), not in the footer (owner, 15 Nov 2026). The boards link EVO Touch to `/work/evo-touch`;
 * that story is told in `/work/zf-scalar`.
 */
export const MENTORING: Mentoring = parseOrThrow(
  mentoringSchema,
  {
    seo: {
      title: "Mentoring",
      description:
        "I've mentored on MentorCruise since 2021, with a 5.0 average from 51 reviews. These days I take someone on only when I can really help.",
    },
    section: "Mentoring",
    title: "Mentoring, for a strong fit.",
    intro: [
      { kind: "text", text: "I've mentored on " },
      {
        kind: "product",
        ref: "mentorcruise",
        text: "MentorCruise",
        // His profile, not the platform's home (owner, 15 Nov 2026).
        href: "https://mentors.to/ruzicic",
      },
      {
        kind: "text",
        text: " since 2021, with a 5.0 average from 51 reviews. These days I take someone on only when I can really help.",
      },
    ],
    // Read from his public MentorCruise profile (`mentors.to/ruzicic`) on
    // 2026-11-12: the rating and review count it shows, the date of the first
    // review (29 November 2021, said in the intro) and the longest mentorship
    // it lists (Luis, two years). Recheck them when reviews are added. "2021,
    // mentoring since" was removed as a number on 15 Nov 2026 (owner).
    numbers: [
      { value: "5.0", label: "average rating" },
      {
        value: "51",
        label: "reviews on MentorCruise",
        href: "https://mentors.to/ruzicic",
      },
      { value: "2 years", label: "longest mentorship" },
    ],
    said: {
      title: "What mentees said",
      body: "People I have mentored on MentorCruise since 2021, in their own words.",
      pile: [
        { testimonial: "maximilian", tone: "#FFFFFF", rot: -2, rest: -0.5 },
        {
          testimonial: "monikka-edgeston",
          tone: "#F4F2EC",
          rot: 1.5,
          rest: 0.4,
        },
        { testimonial: "juan", tone: "#EFEDE6", rot: -1.2, rest: -0.3 },
        {
          testimonial: "juliana-scapucin",
          tone: "#F9F8F4",
          rot: 2.2,
          rest: 0.5,
        },
        { testimonial: "aleksandar", tone: "#F2F0E9", rot: -0.8, rest: -0.4 },
        {
          testimonial: "jobany-aguilar",
          tone: "#FFFFFF",
          rot: 1.8,
          rest: 0.3,
        },
        { testimonial: "martynas", tone: "#F4F2EC", rot: -1.6, rest: -0.6 },
        {
          testimonial: "maciek-sitkowski",
          tone: "#FFFFFF",
          rot: 1.1,
          rest: 0.4,
        },
        {
          testimonial: "kristian-august",
          tone: "#F9F8F4",
          rot: -2.4,
          rest: -0.2,
        },
        { testimonial: "bruno-krauss", tone: "#EFEDE6", rot: 1.5, rest: 0.4 },
        { testimonial: "luis", tone: "#FFFFFF", rot: -1.2, rest: -0.3 },
        { testimonial: "eyal-fisher", tone: "#F2F0E9", rot: 2.2, rest: 0.5 },
        { testimonial: "ivan", tone: "#F9F8F4", rot: -0.8, rest: -0.4 },
        {
          testimonial: "richard-esquivel",
          tone: "#FFFFFF",
          rot: 1.8,
          rest: 0.3,
        },
        { testimonial: "roki", tone: "#F4F2EC", rot: -1.6, rest: -0.6 },
        { testimonial: "adam-gornas", tone: "#EFEDE6", rot: 1.1, rest: 0.4 },
        { testimonial: "andy-yudin", tone: "#F9F8F4", rot: -2.4, rest: -0.2 },
      ],
      // The caption's second line, set in mono capitals:
      // "MENTEE FOR 2 YEARS · 2024". Either half may be missing.
      durationFormat: "Mentee for {duration}",
      counterFormat: "{n} / {total}",
      // Starts with the visible counter ("1 / 17") so the name contains the
      // label (WCAG 2.5.3).
      nextLabelFormat:
        "{n} / {total}, testimonial {n} of {total}. Show the next one",
      pauseLabel: "Pause testimonials",
      playLabel: "Play testimonials",
    },
    // The items continue their heading, so they start in lower case.
    fit: {
      title: "We may be a good fit if…",
      items: [
        "you are switching into frontend or product engineering and want accountability, not hand-holding.",
        "you are a senior engineer moving toward product ownership, or leading a platform team for the first time.",
        "you are building your own product next to a full-time job.",
      ],
    },
    notFit: {
      title: "We're probably not a good fit if…",
      items: [
        "you want someone to do the work for you.",
        "you want interview answers to memorise.",
      ],
    },
    how: {
      title: "How it works",
      steps: [
        { n: "01", text: "A short intro call. No pitch." },
        { n: "02", text: "If it fits, we set goals you can measure." },
        {
          n: "03",
          text: "Tests, exercises and projects. I tell you honestly where you stand.",
        },
      ],
    },
    cta: {
      line: "Think it's a fit?",
      action: {
        label: "Book a 15-minute call",
        href: "https://cal.com/ruzicic/15m-discovery-session",
        external: true,
      },
      alt: [
        { kind: "text", text: "Or " },
        {
          kind: "link",
          text: "write to me",
          href: "mailto:me@mladenruzicic.com",
        },
        { kind: "text", text: "." },
      ],
    },
  },
  "content/pages/mentoring.ts"
)
