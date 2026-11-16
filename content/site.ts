import { parseOrThrow, siteSchema, type Site } from "@/lib/content/schema"

/**
 * Name, the line under it, location, languages and links. Copy is ported from
 * the v4 boards (`docs/v4-ideation/board/project/Landing*.dc.html`); facts from
 * `docs/v4-ideation/board/BRIEF.md`.
 *
 * Location is Ticino, confirmed by him on 2026-11-10. Lausanne is his
 * employer's office, never his address: it must not appear here or in
 * anything built from this file.
 */
export const SITE: Site = parseOrThrow(
  siteSchema,
  {
    name: "Mladen Ružičić",
    domain: "mladenruzicic.com",
    url: "https://mladenruzicic.com",
    line: "Product + Tech, based in Switzerland.",
    // The line under the name plus what he does, both board copy.
    description:
      "Product + Tech, based in Switzerland. Global Product Owner by day, co-founder of TenderLift, and a few side projects that run themselves.",
    location: {
      region: "Ticino",
      country: "CH",
      label: "Ticino, Switzerland",
      timeZone: "Europe/Zurich",
    },
    from: "Bosnia and Herzegovina, by way of Serbia",
    languages: ["Serbian", "English", "Italian"],
    // His first websites (owner, 14 Nov 2026: "since 2004", with proof).
    buildingSince: 2004,
    updated: "2026-11-16",
    links: {
      booking: "https://cal.com/ruzicic/15m-discovery-session",
      email: "me@mladenruzicic.com",
      x: "https://x.com/ruzicic",
      linkedin: "https://www.linkedin.com/in/ruzicic/",
      github: "https://github.com/ruzicic",
      mentorcruise: "https://mentors.to/ruzicic",
      cv: "/cv.pdf",
    },
    headshot: { src: "/mladen-ruzicic.png", alt: "Mladen Ružičić" },
    newsletter: {
      // The landing footer's sign-up. Kit (ConvertKit) form 5347573, the
      // same list the live site writes to; the key is CONVERTKIT_API_KEY in
      // the hosting environment (app/components/site/subscribe.ts).
      enabled: true,
      line: "A few emails a year, when something ships.",
      inputLabel: "Your email",
      placeholder: "you@example.com",
      submitLabel: "Subscribe",
      thanks: "Thanks. Check your inbox to confirm.",
      honeypotLabel: "Leave this field empty",
      errors: {
        invalid: "That address does not look right.",
        unavailable: "Sign-up is offline right now. Try again later.",
        failed: "That did not go through. Please try again.",
      },
    },
    // One footer on every page (owner, 15 Nov 2026: "make footer consistent
    // across pages"): the ask line, the contact line, the newsletter, the
    // same six links, and the station clock with the time in Ticino.
    footer: {
      // The owner's two lines (15 Nov 2026): "happy to connect and meet new
      // people. if you're building sth and need help/advice, or you're based
      // in ticino and want to meet.... shoot me a message on X or LinkedIn,
      // or book us 15min call."
      ask: "Happy to connect and meet new people.",
      contact: [
        {
          kind: "text",
          text: "If you're building something and need help or advice, or you're based in Ticino and want to meet, shoot me a message on ",
        },
        {
          kind: "link",
          text: "X",
          href: "https://x.com/ruzicic",
          external: true,
          me: true,
        },
        { kind: "text", text: " or " },
        {
          kind: "link",
          text: "LinkedIn",
          href: "https://www.linkedin.com/in/ruzicic/",
          external: true,
          me: true,
        },
        { kind: "text", text: ", or " },
        {
          kind: "link",
          text: "book us a 15-minute call",
          href: "https://cal.com/ruzicic/15m-discovery-session",
          external: true,
        },
        { kind: "text", text: "." },
      ],
      links: [
        { label: "Home", href: "/" },
        { label: "All work", href: "/work" },
        { label: "Mentoring", href: "/mentoring" },
        { label: "About", href: "/about" },
        // The CV (owner, 16 Nov 2026): the file About's button downloads,
        // and downloaded the same way.
        { label: "CV", href: "/cv.pdf", download: true },
        {
          label: "GitHub",
          href: "https://github.com/ruzicic",
          external: true,
          me: true,
        },
      ],
      // The clock row (owner, 15 Nov 2026: "clock can display current time.
      // besides that, write: built in Switzerland"): the dial, the time,
      // then this line. `timeLabel` names the time for screen readers.
      builtIn: "Built in Switzerland",
      timeLabel: "Time in Switzerland",
    },
  },
  "content/site.ts"
)

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

/**
 * `SITE.updated` in words ("15 November 2026"): the one date the Ask
 * answers' source lines (`content/ask.ts`) state, and the one
 * `content/ask/notes.md` must state (`lib/ask/context.ts` fails the context
 * build, and `context:check`, when the notes say another).
 */
export function updatedInWords(iso: string = SITE.updated): string {
  const [y, m, d] = iso.split("-").map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}
