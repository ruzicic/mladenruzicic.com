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
    // 2008 (first paid work at Nemestic) → 2026.
    yearsShipping: 18,
  },
  "content/site.ts"
)
