import type { Company, CompanyId, HeroLogoId } from "@/lib/content/schema"

/**
 * Timeline bands, newest first.
 *
 * Every range is verified against the owner's LinkedIn profile (captured
 * 2026-09-02), so `approx` is `false` throughout and no band shows the
 * "dates approximate" badge. `from` and `to` are decimal years: a start is the
 * first day of its month, `year + (month - 1) / 12`, and an end is the last,
 * `year + month / 12`. Keep both to two decimals — the rail only needs pixel
 * accuracy, and exact thirds read as noise in a diff.
 */
export const COMPANIES = [
  {
    id: "zf-scalar",
    name: "ZF SCALAR",
    short: "ZF",
    color: "#0057B8",
    from: 2023.75,
    to: "now",
    approx: false,
    yearsLabel: "Oct 2023 – now",
    role: "Global Product Owner, EVO Touch",
    prev: "Senior Software Engineer → UI Platform Engineer → Engineering Manager, UI Platform",
    summary:
      "Joined as a senior engineer on a platform migration, then built the proof of concept for Velocity, the SCALAR design system and React component library. Led the UI Platform team that took it from prototype to the standard for new development. Now own vision, roadmap and delivery for EVO Touch, ZF's multi-platform app for commercial vehicle drivers.",
    fact: "Platform work is what opened the product-ownership role: Velocity became the default UI answer inside SCALAR, and the product seat followed.",
    people: [],
    logo: "/static/logos/mono/zf-scalar.svg",
    mark: "ZF",
    workSlug: "zf-scalar",
  },
  {
    id: "shopify",
    name: "Shopify",
    short: "Shopify",
    // Shopify green, read straight out of the official Shopping Bag asset
    // (shopify_glyph.svg, `.st0`, in shopify-shopping-bag.zip from
    // shopify.com/brand-assets, retrieved 2026-09-02). The darker side face of
    // the bag is #5E8E3E. The timeline band and hero shard tint use this
    // instead of the older #5A31F4 (decision 8).
    color: "#95BF47",
    from: 2021.25,
    to: 2023.5,
    approx: false,
    yearsLabel: "Apr 2021 – Jun 2023",
    role: "Senior Software Engineer, Shop Minis",
    summary:
      "Worked on Shop Minis from zero: a system for embedding mini React Native apps inside Shop.app, plus the SDK and partner ecosystem around it. Forward-deployed with the first partner builders, from submission and review through promotion. Also contributed to Shopify checkout and spent six months interviewing.",
    fact: "Consumer scale changes the checklist: kill switches, spam controls and takedown flows shipped alongside the feature, not after it.",
    people: [],
    logo: "/static/logos/mono/shopify.svg",
    mark: "S",
    workSlug: "shopify",
  },
  {
    id: "hegias",
    name: "HEGIAS",
    short: "HEGIAS",
    color: "#6F246F",
    from: 2020.5,
    to: 2021.33,
    approx: false,
    yearsLabel: "Jul 2020 – Apr 2021",
    role: "Full-stack team lead",
    prev: "Reported to the CTO",
    summary:
      "Joined to move an AR/VR MVP toward a production-ready product. Microservices on AWS, heavy 3D-model processing through Blender pipelines, in-app voice communication, and integrations with third-party 3D model libraries. Frontend, backend and architecture in the same week.",
    fact: "Technically the densest domain I have worked in: browser-delivered 3D has no forgiving path between a 200 MB asset and a usable scene.",
    people: ["josip"],
    logo: "/static/logos/mono/hegias.svg",
    mark: "H",
    workSlug: "hegias",
  },
  {
    id: "wolkabout",
    name: "WolkAbout / Execom",
    short: "WolkAbout",
    color: "#12A3A8",
    from: 2016.08,
    to: 2020.5,
    approx: false,
    yearsLabel: "Feb 2016 – Jun 2020",
    role: "Junior → Senior Frontend Engineer, team lead",
    prev: "Execom first, from February 2016; WolkAbout from July 2017. One band, because it was one continuous stretch.",
    summary:
      "Started at Execom on the web team — client apps, internal tools, microservices — then moved to WolkAbout in 2017 and grew from junior to senior over the next three years. Angular and RxJS frontends for IoT products pushing large volumes of live data, plus client work, websites, internal tooling and technical interviews. Led a remote team of five to six for the last six months.",
    fact: "Agency work meant a new client, industry and stack every few weeks. It is the fastest way I know to learn how to start from nothing.",
    people: ["radovan", "milena", "tamara", "igor"],
    logo: "/static/logos/mono/wolkabout.svg",
    mark: "W",
    workSlug: "wolkabout",
  },
  {
    id: "freelance",
    name: "Freelance",
    short: "Freelance",
    color: "#939597",
    from: 2011.0,
    to: 2016.67,
    approx: false,
    // LinkedIn gives a year-only start for the freelance stretch, so `from`
    // stays on the year boundary. The end is exact: August 2016.
    yearsLabel: "2011 – Aug 2016",
    role: "Independent web developer",
    summary:
      "Dozens of websites and web apps for clients of every size, on whatever stack the job needed. This is where the practical engineering came from: scoping, delivering, supporting and getting paid.",
    fact: "Shipping for people who are paying you teaches scope control faster than any process does.",
    people: [],
    mark: "~",
  },
  {
    id: "nemestic",
    name: "Nemestic",
    short: "Nemestic",
    color: "#E8622C",
    from: 2010.08,
    to: 2011.58,
    approx: false,
    yearsLabel: "Feb 2010 – Jul 2011",
    role: "Web developer, while studying",
    summary:
      "Roughly one website a month: PSD-to-WordPress builds, custom plugins and PHP. studenti.rs came out of this studio and went live in 2008; the contract dates on this band start later, in 2010.",
    fact: "studenti.rs went live in 2008 and belonged to the studio. I bought it back in 2022 and still run it.",
    people: [],
    logo: "/static/logos/mono/nemestic.svg",
    mark: "N",
  },
] satisfies Company[]

/**
 * The six employer marks etched into the hero shards. Execom gets its own shard
 * but points at the WolkAbout band, because that is the one timeline row it
 * belongs to. Every `logo` is a real monochrome mark under
 * `public/static/logos/mono/` — see the sourcing notes in
 * `public/static/logos/mono/SOURCES.md`. `mark` stays as the text fallback the
 * rasteriser paints when an SVG is missing or fails to decode.
 */
export const HERO_LOGOS = [
  {
    id: "zf-scalar",
    label: "ZF SCALAR",
    bandId: "zf-scalar",
    logo: "/static/logos/mono/zf-scalar.svg",
    mark: "ZF",
  },
  {
    id: "shopify",
    label: "Shopify",
    bandId: "shopify",
    logo: "/static/logos/mono/shopify.svg",
    mark: "S",
  },
  {
    id: "hegias",
    label: "HEGIAS",
    bandId: "hegias",
    logo: "/static/logos/mono/hegias.svg",
    mark: "H",
  },
  {
    id: "wolkabout",
    label: "WolkAbout",
    bandId: "wolkabout",
    logo: "/static/logos/mono/wolkabout.svg",
    mark: "W",
  },
  {
    id: "execom",
    label: "Execom",
    bandId: "wolkabout",
    logo: "/static/logos/mono/execom.svg",
    mark: "E",
  },
  {
    id: "nemestic",
    label: "Nemestic",
    bandId: "nemestic",
    logo: "/static/logos/mono/nemestic.svg",
    mark: "N",
  },
] satisfies {
  id: HeroLogoId
  label: string
  bandId: CompanyId
  logo?: string
  mark: string
}[]
