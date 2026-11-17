import { cvSchema, parseOrThrow, type Cv } from "@/lib/content/schema"
import { PRODUCTS } from "@/content/products"
import { SITE } from "@/content/site"

/**
 * `/cv` and the PDF made from it, `/cv.pdf` (owner, 17 Nov 2026: "/cv
 * postaje stranica na sajtu, sa opcijom 'download PDF'. /cv.pdf renderuje
 * pdf direktno. … necemo stavljati broj telefona uopste").
 *
 * Every word below is his CV document of 17 Nov 2026, transcribed as
 * written: the summary, every title, date and bullet. Do not reword, add or
 * drop anything without him. The one difference is the contact line, which
 * is the site's own (`content/site.ts`: the site's email, not his personal
 * one, and his LinkedIn written out). No phone number, ever: the repository
 * and the PDF are public.
 *
 * Tied to the rest of the site at build time (`checkCv` in
 * `lib/content/index.ts`): each company and role title against the About CV
 * row (`content/pages/about.ts`), the years against it, each project's name
 * and domain against `content/products.ts`, TenderLift's role against the
 * press kit and the case study, the MentorCruise figures against
 * `content/pages/mentoring.ts`. A change on one side the other does not
 * follow fails the build.
 *
 * After any change here, in `app/components/cv/` or in `app/styles/cv.css`,
 * regenerate the PDF (`pnpm cv:pdf`, needs a production build) and the Ask
 * context (`pnpm --dir workers/ask run context`). `pnpm cv:pdf --check` fails
 * while the committed PDF is older than this file.
 */

function url(slug: string): string {
  const p = PRODUCTS.find((x) => x.slug === slug)
  if (!p?.url) throw new Error(`content/pages/cv.ts: "${slug}" has no url.`)
  return p.url
}

/** "linkedin.com/in/ruzicic" from "https://www.linkedin.com/in/ruzicic/". */
const linkedin = SITE.links.linkedin
  .replace(/^https:\/\/(?:www\.)?/, "")
  .replace(/\/$/, "")

const SUMMARY = [
  "I'm most useful between the people with a problem and the technology that can solve it. Engineer since 2016, engineering manager from 2024, product owner since 2025.",
  "Outside work hours, I build and run my own products. Swiss citizen. Languages: Serbian (native), English (fluent, my working language), Italian (B1).",
]

export const CV: Cv = parseOrThrow(
  cvSchema,
  {
    seo: {
      title: "CV",
      // The summary's first sentence.
      description: SUMMARY[0].split(/(?<=\.) /)[0],
    },
    name: SITE.name,
    // The two lines under the name (owner, 17 Nov 2026), word for word:
    // his role, then where he lives, no separator. No employer in it;
    // `checkCv` holds the role to the About CV and the place to the site.
    headline: {
      role: "Global Product Owner with an engineering background",
      location: SITE.location.label,
    },
    headshot: SITE.headshot,
    contact: [
      { text: SITE.links.email, href: `mailto:${SITE.links.email}` },
      { text: SITE.domain, href: SITE.url },
      { text: linkedin, href: SITE.links.linkedin },
    ],
    summary: SUMMARY,
    download: { label: "Download PDF", href: SITE.links.cv },
    // The top row (owner, 17 Nov 2026: "download replaces 'ask' · my header
    // becomes just 'x'"): back to the page before, else About.
    close: { label: "Close CV", href: "/about" },
    experience: {
      title: "Experience",
      jobs: [
        {
          ref: "zf-scalar",
          company: "ZF",
          dates: "Oct 2023 to present",
          line: "From individual contributor to technical lead of a new project, to engineering manager, to product owner.",
          roles: [
            {
              title: "Global Product Owner",
              dates: "May 2025 to present",
              bullets: [
                "Own the vision, roadmap, and delivery of driver products for commercial vehicles, mobile, and in-vehicle, and keep their roadmaps aligned.",
                "Work with existing customers on what their drivers need and what the law asks of them, including the European rules on eco-driving.",
                "Moved into product ownership after delivering Velocity as its engineering manager.",
              ],
            },
            {
              title: "Engineering Manager, UI Platform team",
              dates: "Jun 2024 to May 2025",
              bullets: [
                "Led the team that built Velocity, the company's design system, and stayed about half hands-on.",
                "At handover, 50% of 300 engineers had adopted Velocity.",
              ],
            },
            {
              title: "Senior Software Engineer, then UI Platform Engineer",
              dates: "Oct 2023 to Jun 2024",
              bullets: [
                "Joined as an individual contributor in the middle of a platform migration, wrote up why everyday interface work was slow, and proposed a shared design system.",
                "Built its proof of concept, made the case for it across the organisation, and became technical lead of the new project, Velocity.",
              ],
            },
          ],
        },
        {
          ref: "shopify",
          company: "Shopify",
          role: "Senior Software Engineer",
          dates: "Apr 2021 to May 2023",
          bullets: [
            "Helped build Shop Minis from zero: small apps that other companies run inside the Shop app, with the SDK and CLI their developers use.",
            "The first ten partners shipped into an app with more than 30 million monthly active users.",
            "Automated how partner apps are submitted and tested, with a GitHub App and Actions.",
            "Ran 30+ technical interviews for senior roles.",
          ],
        },
        {
          ref: "hegias",
          company: "HEGIAS",
          role: "Senior Full Stack Developer",
          dates: "Jul 2020 to Apr 2021",
          bullets: [
            "Led a team of six building the web app behind browser-based VR for architects.",
            "Moved a monolithic Node.js app to an event-driven architecture on AWS, migrated in steps.",
            "Built a design system and released it as a UI library used across internal projects.",
          ],
        },
        {
          ref: "wolkabout",
          company: "WolkAbout",
          role: "Senior Frontend Engineer",
          dates: "Jul 2017 to Jun 2020",
          bullets: [
            "Built the Angular screens of an IoT platform: dashboards of live data, device lists, rules. Joined as a junior, team lead by the end.",
            "Started and led the WolkAbout SDK, and led a team of four on a client project.",
            "Led Ready2Wash, the customer app for self-service car wash stations, and built the X-Cloud mobile app alone in React Native.",
          ],
        },
        {
          ref: "execom",
          company: "Execom",
          role: "Frontend Engineer",
          dates: "Feb 2016 to Jul 2017",
          bullets: [
            "Many client projects at a fast pace: the company website, internal tools, and microservices in Angular and Node.js.",
          ],
        },
      ],
    },
    projects: {
      title: "Projects",
      items: [
        {
          ref: "tenderlift",
          name: "TenderLift",
          role: "Co-founder",
          dates: "Sep 2025 to present",
          domain: "tenderlift.ch",
          href: url("tenderlift"),
          text: "Swiss public tenders, sorted by what a company can actually win. 30,000+ tenders read, 1,500 open on average (October 2026).",
        },
        {
          ref: "studenti-rs",
          name: "studenti.rs",
          role: "Owner and sole developer",
          dates: "Sep 2022 to present",
          domain: "studenti.rs",
          href: url("studenti-rs"),
          // The owner, 17 Nov 2026: "at my first job", as the site says it.
          text: "A student community in Serbia: 250k sign-ups since 2008 and 40k shared documents. I built it at my first job, bought it back in 2022 and rebuilt it in 2026.",
        },
        {
          ref: "fontalternatives",
          name: "FontAlternatives",
          role: "Founder",
          dates: "2026",
          domain: "fontalternatives.com",
          href: url("fontalternatives"),
          text: "Free alternatives to paid typefaces. About 16.4K visits a month, all from search (mid-2026).",
        },
        {
          ref: "zarez",
          name: "Zarez",
          role: "Founder",
          dates: "2026",
          domain: "zarez.rs",
          href: url("zarez"),
          text: "A spelling checker for Serbian, in Latin and Cyrillic.",
        },
      ],
    },
    mentoring: {
      title: "Mentoring",
      items: [
        {
          name: "MentorCruise",
          dates: "2021 to present",
          domain: "mentors.to/ruzicic",
          href: SITE.links.mentorcruise,
          // The owner, 17 Nov 2026: the year is the row's, not repeated.
          text: "5.0 average from 51 reviews.",
        },
      ],
    },
    skills: {
      title: "Skills",
      items: [
        "Product strategy, discovery and roadmaps",
        "Stakeholder management",
        "Design systems",
        "Developer experience",
        "Team leadership",
        "B2B SaaS",
        "AI agents and automation",
        "Agent skills and MCP",
        "LLM evaluation",
        "TypeScript",
        "JavaScript",
        "React",
        "React Native",
        "Angular",
        "Node.js",
        "AWS",
        "CI/CD",
        "Mobile apps",
      ],
    },
  },
  "content/pages/cv.ts"
)
