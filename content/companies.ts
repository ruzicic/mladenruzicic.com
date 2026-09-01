import {
  companySchema,
  heroLogoSchema,
  parseOrThrow,
  type Company,
  type HeroLogo,
} from "@/lib/content/schema"
import { z } from "zod"

/**
 * SEED — minimal but valid. The copy agent owns the final prose.
 * Migrated from docs/v3-design/site-data.js.
 *
 * `approx: true` means the dates are not yet verified; the UI shows a badge.
 */
export const COMPANIES: Company[] = parseOrThrow(
  z.array(companySchema),
  [
    {
      id: "zf-scalar",
      name: "ZF SCALAR",
      short: "ZF",
      color: "#0057B8",
      mark: "ZF",
      from: 2023.75,
      to: "now",
      approx: false,
      yearsLabel: "Oct 2023 – now",
      role: "Global Product Owner, EVO Touch",
      prev: "Senior Engineer → UI Platform Engineer → Engineering Manager, UI Platform",
      summary:
        "Joined as a senior engineer on a platform migration, built the proof of concept for Velocity (the SCALAR design system), then led the UI Platform team that rolled it out. Now own vision, roadmap and delivery for EVO Touch, ZF's multi-platform app for commercial vehicle drivers.",
      fact: "Velocity became the official UI standard for new development within SCALAR.",
      people: [],
      workSlug: "zf-scalar",
    },
    {
      id: "shopify",
      name: "Shopify",
      short: "Shopify",
      // Shopify green. TODO: sample the exact value from the official Shopify
      // bag asset once it lands in public/static/logos/shopify.svg.
      color: "#96BF48",
      mark: "S",
      from: 2021.0,
      to: 2023.7,
      approx: true,
      yearsLabel: "~2021 – 2023",
      role: "Senior Software Engineer, Shop Minis",
      summary:
        "Worked on Shop Minis from zero: a system embedding mini React Native apps inside Shop.app, plus the SDK and partner ecosystem around it. Forward-deployed with the first partner builders. Also contributed to Shopify checkout.",
      fact: "A small team took Shop Minis from zero to the first ten building partners.",
      people: [],
      workSlug: "shopify",
    },
    {
      id: "hegias",
      name: "HEGIAS",
      short: "HEGIAS",
      color: "#6F246F",
      mark: "H",
      logo: "/static/logos/hegias.svg",
      from: 2019.5,
      to: 2021.0,
      approx: true,
      yearsLabel: "~2019 – 2021",
      role: "Full-stack team lead",
      prev: "Reported to the CTO",
      summary:
        "Helped move an AR/VR MVP toward a production-ready product: microservices on AWS, heavy 3D-model processing, in-app voice, and integrations with popular 3D model sites.",
      fact: "Frontend, backend and architecture in one of the more technically demanding domains I have worked in.",
      people: ["josip-kozic"],
      workSlug: "hegias",
    },
    {
      id: "wolkabout",
      name: "WolkAbout / Execom",
      short: "WolkAbout",
      color: "#12A3A8",
      mark: "W",
      logo: "/static/logos/wolkabout.svg",
      from: 2016.0,
      to: 2019.5,
      approx: true,
      yearsLabel: "~2016 – 2019",
      role: "Junior → Senior Frontend Engineer, team lead",
      prev: "Execom was the parent agency",
      summary:
        "Joined early in WolkAbout's startup phase and grew from junior to senior in about three years. Angular/RxJS frontends for IoT products pushing large volumes of live data, plus client work, websites and tooling. Led a remote team of five to six for the final six months.",
      fact: "Agency work meant new clients, industries and stacks every few weeks. It built adaptability.",
      people: ["radovan-skendzic", "igor-scekic"],
      workSlug: "wolkabout",
    },
    {
      id: "freelance",
      name: "Freelance",
      short: "Freelance",
      color: "#939597",
      mark: "~",
      from: 2011.0,
      to: 2016.0,
      approx: true,
      yearsLabel: "~2011 – 2016",
      role: "Independent web developer",
      summary:
        "Dozens of websites and web apps for various clients. The foundation of my practical engineering skills.",
      people: [],
    },
    {
      id: "nemestic",
      name: "Nemestic",
      short: "Nemestic",
      color: "#E8622C",
      mark: "N",
      from: 2008.0,
      to: 2011.0,
      approx: true,
      yearsLabel: "~2008 – 2011",
      role: "Web developer (while a student)",
      summary:
        "Roughly one website a month: PSD-to-WordPress, custom plugins, PHP. This is where studenti.rs was originally built.",
      fact: "Built studenti.rs here in 2008 while still an active student.",
      people: [],
    },
  ],
  "content/companies.ts"
)

/**
 * The six employer marks that appear as logo shards in the hero.
 * `execom` maps onto the `wolkabout` timeline band.
 *
 * TODO (owner): supply monochrome SVG marks for every id — including the
 * Shopify bag — under public/static/logos/. Until then `mark` is the fallback.
 */
export const HERO_LOGOS: HeroLogo[] = parseOrThrow(
  z.array(heroLogoSchema),
  [
    { id: "zf-scalar", label: "ZF SCALAR", bandId: "zf-scalar", mark: "ZF" },
    { id: "shopify", label: "Shopify", bandId: "shopify", mark: "S" },
    {
      id: "hegias",
      label: "HEGIAS",
      bandId: "hegias",
      logo: "/static/logos/hegias.svg",
      mark: "H",
    },
    {
      id: "wolkabout",
      label: "WolkAbout",
      bandId: "wolkabout",
      logo: "/static/logos/wolkabout.svg",
      mark: "W",
    },
    { id: "execom", label: "Execom", bandId: "wolkabout", mark: "E" },
    { id: "nemestic", label: "Nemestic", bandId: "nemestic", mark: "N" },
  ],
  "content/companies.ts (HERO_LOGOS)"
)
