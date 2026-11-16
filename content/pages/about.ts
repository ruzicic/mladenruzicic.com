import { aboutSchema, parseOrThrow, type About } from "@/lib/content/schema"

/**
 * `/about`. The four paragraphs are the owner's approved copy of 15 Nov 2026,
 * word for word; "How I work" and "Facts" were removed from this page that
 * day (the press kit keeps the facts, `content/pages/press.ts`). Bracketed
 * text would be a visible placeholder for a fact only he knows (see
 * docs/v4-build/PLACEHOLDERS.md). The CV download is the button alone,
 * "Download my CV" (owner, 15 Nov 2026: no "PDF" beside it). The early
 * sites' lines of context and the postscript are his words of 15 Nov 2026,
 * tidied; the postscript's cursor is his file of 16 Nov 2026. "People I owe"
 * was deleted at the owner's request on 15 Nov 2026 (git history has it).
 *
 * The v3 page (`about.mdx`) is gone; git history has it.
 */
export const ABOUT: About = parseOrThrow(
  aboutSchema,
  {
    seo: {
      title: "About",
      // The Ask card's line for this page.
      description:
        "From engineering to product owner and founder: the longer story, the early work and the CV.",
    },
    section: "About",
    headshot: { src: "/mladen-ruzicic.png", alt: "Mladen Ružičić" },
    title: "The longer story.",
    paragraphs: [
      [
        {
          kind: "text",
          text: "I keep ending up at the part of a problem nobody owns: the tool everyone works around, the market with no usable product in it. I like to sit with the people who have the problem, build something they can touch within a week, and stay close after it ships.",
        },
      ],
      [
        {
          kind: "text",
          text: "That has looked different every few years. I started while I was still at school: websites for shops, small Windows apps, PHP sites of my own. It earned real money.",
        },
      ],
      // The early projects' carousel sits here (`early.after`).
      [
        {
          kind: "text",
          text: "Client sites in a small studio near Novi Sad. An IoT platform. Virtual reality for architects, my first job in Switzerland. Two years on ",
        },
        {
          kind: "product",
          ref: "shopify",
          text: "Shopify",
          href: "/work/shopify",
        },
        {
          kind: "text",
          text: "'s Shop app. Since 2023 I have been at ",
        },
        {
          kind: "product",
          ref: "zf-scalar",
          text: "ZF",
          href: "/work/zf-scalar",
        },
        {
          kind: "text",
          text: ", today as a product owner on tools truck drivers use every day.",
        },
      ],
      [
        { kind: "text", text: "Next to the job I build products of my own. " },
        {
          kind: "product",
          ref: "tenderlift",
          text: "TenderLift",
          href: "/work/tenderlift",
        },
        {
          kind: "text",
          text: " helps Swiss companies find and win public tenders. ",
        },
        {
          kind: "product",
          ref: "studenti-rs",
          text: "studenti.rs",
          href: "/work/studenti-rs",
        },
        {
          kind: "text",
          text: " went online in 2008 and is still running. Jobs taught me what quality means when millions of people use a thing. My own products taught me what happens when there is nobody to hand the hard half to. I need both.",
        },
      ],
      [
        {
          kind: "text",
          text: "I'm from Bosnia and Herzegovina by way of Serbia, I live in Ticino (Switzerland), and I work in Serbian, English and Italian. If you came here to see who is behind one of those products, this is me. ",
        },
        {
          kind: "link",
          text: "Write to me",
          href: "mailto:me@mladenruzicic.com",
        },
        { kind: "text", text: "; I answer my own email." },
      ],
    ],
    early: {
      // Layout B (owner, 15 Nov 2026): one project at a time, inside the
      // story after the paragraph that ends on the early line.
      after: 2,
      label: "Early projects",
      counterFormat: "{n} / {total}",
      slideLabelFormat: "{n} of {total}",
      prevLabel: "Previous project",
      nextLabel: "Next project",
      // A frame without `src` stays an empty labelled slot. The pictures'
      // sources: docs/v4-build/ABOUT-SOURCES.md (private).
      frames: [
        {
          ratio: "4:3",
          label: "Baby Robin, a baby shop's website, 2005",
          src: "/static/about/baby-robin-2005.webp",
          alt: 'The Baby Robin shop website: a blue page, a photo of a crawling baby beside the words "BABY ROBIN" in white outlined capitals, a menu across the top, a welcome text with the shop\'s address, a sale offer on the right, and a photo of a baby at a laptop.',
          caption: "Baby Robin, 2005",
          text: "My early Photoshop and Dreamweaver days. A static website for a kids' store in Belgrade.",
        },
        {
          ratio: "4:3",
          label:
            "Sara Trade, a phone accessories and fishing shop's website, 2009",
          src: "/static/about/saratrade-2009.webp",
          alt: 'The Sara Trade website: the Sara Trade logo and a menu over a turquoise header with pine trees and birds, a large "Dobrodošli" between a mobile phone and a fishing rod, and three columns headed "O nama", "Katalog" and "Galerija".',
          caption: "Sara Trade, 2009",
          text: "A custom inventory app in PHP and a website with a shop, for a local business.",
        },
        {
          ratio: "4:3",
          label: "iglica.rs, a news magazine, 2011",
          src: "/static/about/iglica-2011.webp",
          alt: "The home page of iglica.rs, a Serbian news magazine: a gold logo on a green background, a dark menu bar and a grid of headlines with grey boxes where the photos were.",
          caption: "iglica.rs, 2011",
          text: "A digital magazine I ran for more than a year.",
        },
        {
          ratio: "4:3",
          label: "otompotom.com, a humour site, 2012",
          src: "/static/about/otompotom-2012.webp",
          alt: "The otompotom.com humour website: a toucan logo and a cloud of tags on a turquoise striped header, a menu, a welcome bar, and a grid of picture tiles: tomatoes, a pine branch, an old phone and red roses, with the tiles that show people blurred.",
          caption: "otompotom.com, 2012",
          text: "Co-founded with the owners of a huge Facebook community. It made money, and we never met in person.",
        },
      ],
    },
    cv: {
      title: "CV",
      // The roles (owner, 15 Nov 2026: "it's missing rolenames"), confirmed
      // with their lines by the owner on 16 Nov 2026.
      rows: [
        {
          ref: "zf-scalar",
          year: "2023 to now",
          role: "Global Product Owner",
          text: "Driver Experience team since October 2026, EVO Touch before that. Earlier I built and led the Velocity design system.",
        },
        {
          ref: "shopify",
          year: "2021 to 2023",
          role: "Senior Software Engineer",
          text: "Shop app. Helped build Shop Minis from zero.",
        },
        {
          ref: "hegias",
          year: "2020 to 2021",
          role: "Senior Full Stack Developer",
          text: "Led a team of six building VR and AR for architecture.",
        },
        {
          ref: "wolkabout",
          year: "2017 to 2020",
          role: "Senior Frontend Engineer",
          text: "Led the core of an IoT platform, as team lead by the end.",
        },
        {
          ref: "execom",
          year: "2016 to 2017",
          role: "Frontend Engineer",
          text: "Many client projects at once, something new to learn and pressure every day. I loved the pace.",
        },
        {
          ref: "nemestic",
          year: "2010 to 2011",
          role: "Web Developer",
          text: "Dozens of client projects in a small studio.",
        },
      ],
      download: {
        label: "Download my CV",
        href: "/cv.pdf",
      },
    },
    // The postscript (owner, 15 Nov 2026): his own sentence, tidied, after
    // the CV, and the button that plays Nocturne's "Paranoia" from the enemy
    // team's side (ported from the paper lab). Where the files came from:
    // docs/v4-build/ABOUT-SOURCES.md. The cursor is the League of Legends
    // gauntlet he supplied on 16 Nov 2026 (32 x 32), its hotspot on the
    // fingertip; remove `cursor` and the pointer stays the normal one.
    postscript: {
      enabled: true,
      effect: true,
      lead: "P.S.",
      before: "Deep down, I believe playing",
      game: {
        name: "League of Legends",
        icon: "/static/about/lol/league-of-legends.svg",
      },
      champions: [
        { name: "Nocturne", src: "/static/about/lol/nocturne-54.webp" },
        { name: "Morgana", src: "/static/about/lol/morgana-54.webp" },
      ],
      after: "until I hit Diamond must have helped somehow. Right!?",
      cta: "Experience the paranoia of the enemy team",
      sign: "Sound on. Mandatory.",
      status:
        "The page goes dark for six seconds. Press Escape to end it early.",
      sound: "/static/about/lol/cast.mp3",
      cursor: { src: "/static/about/lol/cursor.png", x: 1, y: 1 },
    },
  },
  "content/pages/about.ts"
)
