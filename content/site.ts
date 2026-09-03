import { parseOrThrow, siteSchema, type Site } from "@/lib/content/schema"

/**
 * Single source for name, links and identity. Migrated from `lib/constants.ts`
 * and the old `Footer.tsx` socials (Twitter and Instagram are dropped for v3).
 */
export const SITE: Site = parseOrThrow(
  siteSchema,
  {
    name: "Mladen Ružičić",
    domain: "mladenruzicic.com",
    url: "https://mladenruzicic.com",
    tagline: "I build products, platforms and the systems around them.",
    description:
      "Technical product owner, founder and builder in Lausanne. I build products, platforms and the systems around them.",
    location: { city: "Lausanne", country: "CH" },
    roles: ["Technical product owner", "Founder", "Builder"],
    links: {
      github: "https://github.com/ruzicic",
      linkedin: "https://www.linkedin.com/in/ruzicic/",
      mentorcruise: "https://mentors.to/ruzicic",
      calendar: "https://calendar.app.google/dETpNdfdug4LF81j7",
      cv: "/cv",
    },
    /*
     * 2008 → 2026. The anchor is the first product, not the first payslip:
     * studenti.rs went live in 2008 and still carries an "Aktivni od 2008"
     * badge on its homepage. Employment starts later — Nemestic, February
     * 2010 — so every surface that spends this number has to say "shipping",
     * never "employed". See content/OPEN-QUESTIONS.md.
     */
    yearsShipping: 18,
  },
  "content/site.ts"
)
