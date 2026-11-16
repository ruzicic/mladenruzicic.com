import { homeSchema, parseOrThrow, type Home } from "@/lib/content/schema"
import { PRODUCTS } from "@/content/products"

/**
 * `/`, ported verbatim from `docs/v4-ideation/board/project/Landing.dc.html`
 * (desktop) and `Landing-Mobile.dc.html` (phone). The phone copy is the same
 * everywhere except the touch region label and one popover heading
 * (`titleLong`). Board defaults are shipped and the other variants dropped:
 * story "working", footer ask "open", thinking "cells".
 *
 * One deliberate change: the boards link EVO Touch to `/work/evo-touch`, but
 * the EVO Touch story is told in `/work/zf-scalar` (one of the six) and
 * `/work/evo-touch` redirects. Those links and the strip card point at
 * `/work/zf-scalar`. The strip has no story sheet (owner, 12 Nov).
 *
 * Links (owner, 13 Nov 2026): a project's popover, strip card and list row
 * each carry at most two explicit links, "Case study" and "Website", made
 * from the product's `story` and `url` in `content/products.ts`, so one
 * source decides them. A popover `link` is only for a tile that is not a
 * project with either (Mentoring); `HOME` below refuses any other.
 */

const EVO_POPOVER = {
  eyebrow: "COMPANY · 2023 TO NOW",
  title: "ZF",
  body: "I’m Global Product Owner for several products here, tools truck drivers use every day. I came in as an individual contributor on a product team, became engineering manager of the platform team, then moved to the product side.",
  meta: "SINCE 2023",
}

const SHOPIFY_POPOVER = {
  eyebrow: "COMPANY · 2021 TO 2023",
  title: "Shopify",
  body: "Two years on the Shop app. I helped build Shop Minis from zero, with the best product people I ever worked with.",
  meta: "SHOP APP · 30M+ MONTHLY USERS",
}

const TL_POPOVER = {
  eyebrow: "PRODUCT · MINE",
  title: "TenderLift",
  body: "Swiss public tenders are published every day. TenderLift reads them and tells a company which ones it can actually win. I co-founded it and build the product.",
  meta: "SINCE 2025 · SWITZERLAND · DE FR IT EN",
}

const PARSED_HOME: Home = parseOrThrow(
  homeSchema,
  {
    seo: {
      title: "Mladen Ružičić",
      description:
        "Product + Tech, based in Switzerland. Global Product Owner by day, co-founder of TenderLift, and a few side projects that run themselves.",
    },

    headline: {
      srText:
        "I’m working with Swiss bid teams, designers on a budget, students in Serbia, people who write in Serbian and truck drivers.",
      prefix: "I’m working with",
      phrases: [
        {
          ref: "tenderlift",
          phrase: "Swiss bid teams",
          on: "on TenderLift",
        },
        {
          ref: "fontalternatives",
          phrase: "designers on a budget",
          on: "on FontAlternatives",
        },
        {
          ref: "studenti-rs",
          phrase: "students in Serbia",
          on: "on studenti.rs",
        },
        {
          ref: "zarez",
          phrase: "people who write in Serbian",
          on: "on Zarez",
        },
        {
          ref: "evo-touch",
          phrase: "truck drivers",
          on: "on Driver Experience, at ZF",
        },
      ],
      onSrText:
        "On TenderLift, on FontAlternatives, on studenti.rs, on Zarez and on Driver Experience at ZF.",
      paceMs: 2500,
      pauseLabel: "Pause the headline and the moving images",
      playLabel: "Play the headline and the moving images",
    },

    stance:
      "I’m most useful between the people with a problem and the technology that can solve it.",

    // Owner, 13 Nov 2026: a project has at most two explicit actions, a
    // case study and a website, both taken from content/products.ts
    // (`story`, `url`). Nothing else about it is a link.
    actions: {
      caseStudy: "Case study",
      website: "Website",
      caseStudyName: "{name} case study",
      websiteName: "{name} website, {domain}, opens in a new tab",
      // On phones a list row is itself the link (owner, 16 Nov 2026).
      rowCaseStudyName: "{name}, case study",
      rowWebsiteName: "{name}, website, opens in a new tab",
    },

    paragraphs: [
      [
        {
          kind: "text",
          text: "By day I’m a global product owner for several products at ",
        },
        {
          kind: "product",
          ref: "evo-touch",
          text: "ZF",
          popover: EVO_POPOVER,
        },
        {
          kind: "text",
          text: ", tools that truck drivers use every day. Before that I helped build Shop Minis at ",
        },
        {
          kind: "product",
          ref: "shopify",
          text: "Shopify",
          popover: SHOPIFY_POPOVER,
        },
        { kind: "text", text: "." },
      ],
      [
        { kind: "text", text: "Outside work hours I run " },
        {
          kind: "product",
          ref: "tenderlift",
          text: "TenderLift",
          popover: TL_POPOVER,
        },
        {
          kind: "text",
          text: ", which helps Swiss companies find their way through public procurement and win more tenders.",
        },
      ],
      [
        {
          kind: "text",
          text: "Next to that I have a few side projects, most of them automated or on a schedule: ",
        },
        {
          kind: "product",
          ref: "fontalternatives",
          text: "FontAlternatives",
          popover: {
            eyebrow: "PRODUCT · MINE",
            title: "FontAlternatives",
            body: "Free fonts that look like the expensive ones. It started as an experiment; now it gets about 16.4K visits a month, all from search (mid-2026).",
            meta: "2026 · 378 FONTS MATCHED",
          },
        },
        { kind: "text", text: ", " },
        {
          kind: "product",
          ref: "studenti-rs",
          text: "studenti.rs",
          popover: {
            eyebrow: "PRODUCT · MINE",
            title: "studenti.rs",
            body: "Where students in Serbia share study materials. I built it at my first job, bought it back in January 2022, and it still runs.",
            meta: "SINCE 2008 · 250K+ STUDENTS",
          },
        },
        { kind: "text", text: " and " },
        {
          kind: "product",
          ref: "zarez",
          text: "Zarez",
          popover: {
            eyebrow: "PRODUCT · MINE",
            title: "Zarez",
            body: "A spelling checker for Serbian. It underlines a mistake, explains it in one sentence and waits for you to accept.",
            meta: "LIVE",
          },
        },
        { kind: "text", text: "." },
      ],
      [
        {
          // Plain text (owner, 15 Nov 2026: "'a mentee' on landing page
          // should not be hoverable/link"); the Mentoring block below links
          // to /mentoring.
          kind: "text",
          text: "A few times a year I take on a small freelance project or a mentee, when the fit is really strong.",
        },
      ],
    ],

    recentWork: {
      title: "Recent work",
      counterFormat: "{n} / {total}",
      prevLabel: "Previous piece of work",
      nextLabel: "Next piece of work",
      regionLabel: "Recent work. Scrolls sideways; use the arrow keys.",
      regionLabelTouch: "Recent work. Swipe sideways.",
      cards: [
        {
          kind: "work",
          ref: "tenderlift",
          title: "TenderLift",
          caption: "Swiss public tenders, sorted by what you can actually win",
          bg: "#F3F4F6",
          fg: "#FFFFFF",
          media: {
            clip: {
              mp4: "/static/work/tenderlift/card-open-tender.mp4",
              webm: "/static/work/tenderlift/card-open-tender.webm",
              poster: "/static/work/tenderlift/card-open-tender-poster.webp",
              width: 1360,
              height: 840,
              fit: "bleed",
              alt: "TenderLift's public tender pages: the open tenders in Ticino, one tender opened, its AI summary and the fit check.",
              narrow: {
                mp4: "/static/work/tenderlift/card-open-tender-square.mp4",
                webm: "/static/work/tenderlift/card-open-tender-square.webm",
                poster:
                  "/static/work/tenderlift/card-open-tender-square-poster.webp",
                width: 1080,
                height: 1080,
              },
            },
          },
        },
        {
          kind: "work",
          ref: "evo-touch",
          title: "ZF",
          caption:
            "Tools truck drivers use every day. I’m a Global Product Owner.",
          bg: "#0057B7",
          fg: "#FFFFFF",
          // Not rendered since the strip lost its sheet (owner, 12 Nov). Kept
          // as data: `lib/ask/context.ts` reads the body and facts.
          sheet: {
            path: "/work/zf-scalar",
            title: "ZF",
            body: "At ZF I'm Global Product Owner, for the Driver Experience team, working on tools truck drivers use every day. Before that my scope was EVO Touch, the app truck drivers work in, and before that I built and led Velocity, the design system the SCALAR products share.",
            facts: [
              "ZF · since 2023",
              "Product, design and engineering in one loop",
            ],
            links: [{ label: "Read the case study", href: "/work/zf-scalar" }],
          },
        },
        {
          kind: "work",
          ref: "zarez",
          title: "Zarez",
          caption: "A spelling checker for Serbian.",
          bg: "#F3F2EC",
          fg: "#FFFFFF",
          media: {
            clip: {
              mp4: "/static/work/zarez/card-correction.mp4",
              webm: "/static/work/zarez/card-correction.webm",
              poster: "/static/work/zarez/card-correction-poster.webp",
              width: 1360,
              height: 840,
              alt: "The Zarez editor: a Serbian sentence with a spelling mistake, a suggestion popup, and the mistake corrected with one click.",
              narrow: {
                mp4: "/static/work/zarez/card-correction-square.mp4",
                webm: "/static/work/zarez/card-correction-square.webm",
                poster: "/static/work/zarez/card-correction-square-poster.webp",
                width: 1080,
                height: 1080,
              },
            },
          },
        },
        {
          kind: "work",
          ref: "fontalternatives",
          title: "FontAlternatives",
          caption: "Free fonts that look like the expensive ones",
          bg: "#FBFAF7",
          fg: "#FFFFFF",
          media: {
            clip: {
              mp4: "/static/work/fontalternatives/card-discover.mp4",
              webm: "/static/work/fontalternatives/card-discover.webm",
              poster: "/static/work/fontalternatives/card-discover-poster.webp",
              width: 1360,
              height: 840,
              fit: "bleed",
              alt: "FontAlternatives: the search opens and “elegant serif for a boutique hotel” is typed; four filters are read from the words and free and paid fonts are ranked; the page for Bodoni opens, with Libre Bodoni the closest free match at 88 percent.",
              narrow: {
                mp4: "/static/work/fontalternatives/card-discover-square.mp4",
                webm: "/static/work/fontalternatives/card-discover-square.webm",
                poster:
                  "/static/work/fontalternatives/card-discover-square-poster.webp",
                width: 1080,
                height: 1080,
              },
            },
          },
        },
        {
          kind: "work",
          ref: "studenti-rs",
          title: "studenti.rs",
          caption:
            "Where students in Serbia share study materials. Online since 2008.",
          bg: "#F1F4F7",
          fg: "#FFFFFF",
          media: {
            clip: {
              mp4: "/static/work/studenti-rs/card-search-open.mp4",
              webm: "/static/work/studenti-rs/card-search-open.webm",
              poster: "/static/work/studenti-rs/card-search-open-poster.webp",
              width: 1360,
              height: 840,
              fit: "bleed",
              alt: "studenti.rs: a search for an accounting subject, the results, and a document opened in the reader.",
              narrow: {
                mp4: "/static/work/studenti-rs/square-clip-search-open.mp4",
                webm: "/static/work/studenti-rs/square-clip-search-open.webm",
                poster:
                  "/static/work/studenti-rs/square-clip-search-open-poster.webp",
                width: 1080,
                height: 1080,
              },
            },
          },
          // Not rendered (see EVO Touch); read by `lib/ask/context.ts`.
          sheet: {
            path: "/work/studenti-rs",
            title: "studenti.rs",
            body: "A place where students in Serbia share study materials. I built it at my first job and seeded it by hand, one paper a day. I bought it back in January 2022 and it still runs, mostly on its own.",
            facts: ["Since 2008", "250k+ students", "40k+ documents"],
            links: [
              { label: "Read the case study", href: "/work/studenti-rs" },
              {
                label: "Open studenti.rs",
                href: "https://studenti.rs",
                external: true,
              },
            ],
          },
        },
        {
          kind: "work",
          ref: "ona",
          title: "ONA by Alma",
          caption:
            "Handmade crochet bags. I manage the Shopify store and social media, and produce the content.",
          bg: "#F3EEE4",
          fg: "#FFFFFF",
          media: {
            clip: {
              mp4: "/static/work/ona/card-hero-glide.mp4",
              webm: "/static/work/ona/card-hero-glide.webm",
              poster: "/static/work/ona/card-hero-glide-poster.webp",
              width: 1360,
              height: 840,
              fit: "bleed",
              alt: "The ONA shop: the opening page, then close-ups of crocheted bags and the yarn colours they come in.",
              narrow: {
                mp4: "/static/work/ona/card-hero-glide-square.mp4",
                webm: "/static/work/ona/card-hero-glide-square.webm",
                poster: "/static/work/ona/card-hero-glide-square-poster.webp",
                width: 1080,
                height: 1080,
              },
            },
          },
        },
        {
          kind: "work",
          ref: "bistoletti",
          title: "Bistoletti",
          caption:
            "An optician in Lugano since 1920. New website, launching soon.",
          pill: "PRE-LAUNCH",
          bg: "#1C1A18",
          fg: "#FFFFFF",
        },
        {
          kind: "work",
          ref: "amada",
          title: "Villa Amada",
          caption:
            "A farmhouse on the Danish Wadden Sea, and the site that books it",
          bg: "#F4EDE6",
          fg: "#FFFFFF",
          media: {
            clip: {
              mp4: "/static/work/amada/card-home-glide.mp4",
              webm: "/static/work/amada/card-home-glide.webm",
              poster: "/static/work/amada/card-home-glide-poster.webp",
              width: 1360,
              height: 840,
              fit: "bleed",
              alt: "The Villa Amada site: the opening page, the introduction and the house.",
              narrow: {
                mp4: "/static/work/amada/card-home-glide-square.mp4",
                webm: "/static/work/amada/card-home-glide-square.webm",
                poster: "/static/work/amada/card-home-glide-square-poster.webp",
                width: 1080,
                height: 1080,
              },
            },
          },
        },
        {
          kind: "work",
          ref: "shop-minis",
          title: "Shop Minis",
          caption:
            "Small apps inside Shopify's Shop app, built from zero with ten partners",
          pill: "2021 TO 2023",
          bg: "#95BF47",
          fg: "#FFFFFF",
          // Shopify's images from its 2023 Shop Minis page (Web Archive), shown
          // to name the product; provenance in
          // docs/v4-build/sources/work/shop-minis/SOURCES.md.
          // Desktop: the 2023 social card. Phones: the "Content Card" phone of
          // the 2023 entry-points artwork (the card's portrait frame cannot hold
          // the wordmark). One alt, true of both, because the picture's alt is
          // the desktop image's. The credit line follows it.
          media: {
            desktop: {
              src: "/static/work/shop-minis/social-2023-card.webp",
              alt: "Minis running inside the Shop app",
            },
            tablet: {
              src: "/static/work/shop-minis/entry-points-2023-phone.webp",
              alt: "Minis running inside the Shop app",
            },
            credit: "Shopify's own artwork for Shop Minis, 2023",
          },
          // Not rendered (see EVO Touch); read by `lib/ask/context.ts`.
          sheet: {
            path: "/work/shopify",
            title: "Shop Minis",
            body: "Two years on Shopify's Shop app. I helped build Shop Minis from zero, with the first ten partners, alongside the best product people I ever worked with.",
            facts: ["2021 to 2023", "Shop app · 30M+ monthly users"],
            links: [{ label: "Read the case study", href: "/work/shopify" }],
          },
        },
        {
          kind: "more",
          title: "That's not all, folks!",
          // `{n}` is counted from content: the /work entries with no card here.
          body: "{n} more products and jobs since 2008, with what happened to each.",
          link: { label: "See all work", href: "/work" },
        },
      ],
    },

    list: {
      id: "everything",
      title: "Stuff I've put real time into",
      showAllLabel: "Show all 17",
      showFewerLabel: "Show fewer",
      scrollingTag: "SCROLLING",
      groups: [
        {
          label: "PRODUCTS",
          visible: 5,
          rows: [
            {
              ref: "tenderlift",
              name: "TenderLift",
              year: "2025 to now",
              what: "Running. My main product.",
              preview: {
                caption: "TENDERLIFT · SWISS PUBLIC TENDERS",
                image: "/static/work/tenderlift/scroll.webp",
                scroll: true,
              },
            },
            {
              ref: "zarez",
              name: "Zarez",
              year: "2026",
              what: "The Serbian Grammarly. Live since November 2026.",
              preview: {
                caption: "ZAREZ · SPELLING CHECKER FOR SERBIAN",
                // zarez.rs, captured 16 Nov 2026; ends above the FAQ.
                image: "/static/work/zarez/scroll.webp",
                scroll: true,
              },
            },
            {
              ref: "fontalternatives",
              name: "FontAlternatives",
              year: "2026",
              what: "Experiment turned product, with serious organic traffic.",
              preview: {
                caption: "FONTALTERNATIVES · 378 FONTS MATCHED",
                image: "/static/work/fontalternatives/scroll.webp",
                scroll: true,
              },
            },
            {
              ref: "studenti-rs",
              name: "studenti.rs",
              year: "2008 to now",
              what: "A student community in Serbia with 250k sign-ups since 2008.",
              preview: {
                caption: "STUDENTI.RS · 250K+ STUDENTS SINCE 2008",
                image: "/static/work/studenti-rs/scroll.webp",
                scroll: true,
                // Owner's note on the board: the lower part of the capture
                // is unusable, so the glide stops at 88% (`--pv-end`).
                stopAt: 0.88,
              },
            },
            {
              ref: "ona",
              name: "ONA by Alma",
              // The owner's own wording (12 Nov 2026): the one deliberate
              // exception to the no-family rule. Do not "fix" it, and do not
              // carry family wording anywhere else.
              what: "My mom's ecommerce business. She crochets, I do the online part.",
              preview: {
                caption: "ONA BY ALMA · HANDMADE CROCHET BAGS",
                image: "/static/work/ona/scroll.webp",
                scroll: true,
              },
            },
            {
              // Owner, 16 Nov 2026: a row of its own, with its strip card's
              // sentence. A client site: no case study, only "Website", and
              // no year (none is known; none is invented).
              ref: "amada",
              name: "Villa Amada",
              what: "A farmhouse on the Danish Wadden Sea, and the site that books it.",
              preview: {
                caption: "VILLA AMADA · A FARMHOUSE ON THE WADDEN SEA",
                // stayamada.com, captured 16 Nov 2026; ends after the
                // gallery, above the block that names the host.
                image: "/static/work/amada/scroll.webp",
                scroll: true,
              },
            },
            {
              ref: "panciona",
              name: "Panciona",
              year: "2019 to 2023",
              what: "Retired. No founder-market fit.",
              preview: {
                caption: "PANCIONA · RETIRED",
                // The real website, built in 2026 from its last commit; the
                // home page's dashboard screenshot, its stock portraits and
                // its sample names are blurred.
                image: "/static/work/panciona/scroll.webp",
                scroll: true,
              },
            },
            {
              ref: "hi-fam",
              name: "Hi Fam",
              what: "Retired.",
              preview: {
                caption: "HI FAM · RETIRED",
                // Recorded from the app's web build, fed with four Wikimedia
                // Commons clips; the two unnamed street musicians are blurred
                // (credits in docs/v4-build/sources/work/hi-fam/SOURCES.md).
                image: "/static/work/hi-fam/scroll.webp",
                scroll: true,
              },
            },
            {
              ref: "flexmatch",
              name: "FlexMatch",
              what: "Retired.",
              preview: {
                caption: "FLEXMATCH · RETIRED",
                image: "/static/work/flexmatch/scroll.webp",
                scroll: true,
                // The landing page's lower half is a wall of invented
                // pre-launch reviews; the glide stops above it.
                stopAt: 0.49,
              },
            },
            {
              ref: "nunium",
              name: "Nunium",
              what: "Retired. The market was too small.",
              preview: {
                caption: "NUNIUM · RETIRED",
                // nunium.com, captured 16 Nov 2026; ends above the team.
                image: "/static/work/nunium/scroll.webp",
                scroll: true,
              },
            },
          ],
        },
        {
          label: "JOBS",
          visible: 2,
          rows: [
            {
              ref: "zf-scalar",
              name: "ZF",
              year: "2023 to now",
              what: "Global Product Owner on several products.",
              preview: {
                caption:
                  "EVO TOUCH · 2025 TO 2026 · THE APP TRUCK DRIVERS WORK IN",
                // The public Connectivity page of zf-scalar.com (EVO Touch
                // card), captured 16 Nov 2026; nothing internal.
                image: "/static/work/zf-scalar/scroll.webp",
                scroll: true,
              },
            },
            {
              ref: "shopify",
              name: "Shopify",
              year: "2021 to 2023",
              what: "Shipped Shop Minis from 0.",
              preview: {
                // The image is Shopify's, so the caption is its credit.
                caption: "FROM SHOPIFY'S SHOP MINIS PAGE, 2023",
                // shop.app/minis as archived on 15 Feb 2023 (Web Archive);
                // ends after its first three claims.
                image: "/static/work/shopify/scroll.webp",
                scroll: true,
              },
            },
            {
              ref: "hegias",
              name: "HEGIAS",
              year: "2020 to 2021",
              what: "Team lead of six, VR for architects.",
              preview: {
                caption: "VR AND AR FOR ARCHITECTURE",
                // hegias.com (German home), captured 11 Nov 2026.
                image: "/static/work/hegias/scroll.webp",
                scroll: true,
              },
            },
            {
              // Freelance, not a job; the list has no group for it, so it sits
              // here in date order.
              ref: "internxt",
              name: "Internxt",
              year: "2019",
              what: "Freelance. Built their first mobile app, then handed it on.",
              preview: {
                caption: "FREELANCE · THE FIRST MOBILE APP",
                // internxt.com as archived on 19 Nov 2019 (Web Archive); the
                // stock photo's face is blurred.
                image: "/static/work/internxt/scroll.webp",
                scroll: true,
              },
            },
            {
              ref: "wolkabout",
              name: "WolkAbout",
              year: "2017 to 2020",
              what: "Led the core of an IoT platform.",
              preview: {
                caption: "IOT PLATFORM · NOVI SAD",
                // wolkabout.com as archived on 14 Oct 2017 (Web Archive).
                image: "/static/work/wolkabout/scroll.webp",
                scroll: true,
              },
            },
            {
              ref: "execom",
              name: "Execom",
              year: "2016 to 2017",
              what: "Many client projects at a fast pace. I loved it.",
              preview: {
                caption: "CLIENT PROJECTS · FAST PACE",
                // execom.eu as archived on 20 Jun 2017 (Web Archive).
                image: "/static/work/execom/scroll.webp",
                scroll: true,
              },
            },
            {
              ref: "nemestic",
              name: "Nemestic Studio",
              year: "2010 to 2011",
              what: "Dozens of client projects.",
              preview: { caption: "SREMSKA KAMENICA · DOZENS OF PROJECTS" },
            },
          ],
        },
      ],
    },

    // The pressed paper (owner, 14 Nov 2026: "ova trenutna varijanta Memory
    // Sheet je super"). Its look is in app/components/landing/dent/settings.ts.
    dent: true,

    // His words: the titles of 11 Nov 2026 (DECISIONS.md), the bodies of
    // 16 Nov 2026. The "we" is his.
    howIWork: {
      id: "how-i-work",
      title: "How I work",
      steps: [
        {
          n: "01",
          title: "Listen",
          body: "I sit with the people who have the problem until I can say it back.",
        },
        {
          n: "02",
          title: "Prototype",
          body: "They get something they can touch within a week, then we throw away the parts that were wrong.",
        },
        {
          n: "03",
          title: "Ship",
          body: "We ship that, not a second version of the prototype.",
        },
        {
          n: "04",
          title: "Stay close",
          body: "I watch how people actually use it, and I stay on it after launch.",
        },
      ],
    },

    mentoring: {
      title: "Mentoring",
      body: "5.0 from 51 reviews on MentorCruise, mentoring since 2021. These days I take someone on only when I can really help.",
      testimonial: "monikka-edgeston",
      role: "Mentee",
      link: { label: "How mentoring works", href: "/mentoring" },
    },
  },
  "content/pages/home.ts"
)

/**
 * `HOME` is the page without the products marked `hidden` in
 * `content/products.ts` (Bistoletti, owner 13 Nov 2026): their strip cards and
 * list rows are dropped here, so every reader (the page, the mirrors, Ask,
 * the tests) sees one version. Remove `hidden` there to bring them back.
 */
for (const seg of PARSED_HOME.paragraphs.flat()) {
  if (seg.kind !== "product" || !seg.popover?.link) continue
  const product = PRODUCTS.find((p) => p.slug === seg.ref)
  if (product?.story || product?.url)
    throw new Error(
      `content/pages/home.ts: the "${seg.ref}" popover has a link, but its links come from content/products.ts (story, url)`
    )
}

const HIDDEN = new Set<string>(
  PRODUCTS.filter((p) => p.hidden).map((p) => p.slug)
)

export const HOME: Home = {
  ...PARSED_HOME,
  recentWork: {
    ...PARSED_HOME.recentWork,
    cards: PARSED_HOME.recentWork.cards.filter(
      (c) => c.kind !== "work" || !HIDDEN.has(c.ref)
    ),
  },
  list: {
    ...PARSED_HOME.list,
    groups: PARSED_HOME.list.groups.map((g) => ({
      ...g,
      rows: g.rows.filter((r) => !HIDDEN.has(r.ref)),
    })),
  },
}
