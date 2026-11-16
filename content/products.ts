import { z } from "zod"

import { parseOrThrow, productSchema, type Product } from "@/lib/content/schema"

/**
 * One registry of every product, employer and project that appears on the v4
 * boards: the headline chips, the paragraph tiles, the "Recent work" strip,
 * the list ("Stuff I've put real time into") and the About CV. Every `ref` elsewhere
 * in content points here, and the tile (`bg`, `fg`, `mark`) is the `ProductMark` that
 * `ProductTile` draws at chip size and at text size.
 *
 * Tiles: the owner's own products, the freelance sites and the two concept
 * tiles draw complete full-colour artwork (`kind: "art"`,
 * `public/static/logos/tiles/`, provenance in the private notes,
 * docs/v4-build/sources/logos/tiles/SOURCES.md); `bg` and
 * `fg` repeat the artwork's background and ink for the surfaces that paint
 * a mark themselves. `mono` is the one-colour mark for those surfaces.
 *
 * Sources: tile colours and marks as the boards draw them
 * (`docs/v4-ideation/board/project/Landing.dc.html`, the list and the
 * lockups); status words and year labels from the list; `description` from the
 * strip caption, or the list line where there is no card. `year` and
 * `description` are left out where the board has none: no year is invented.
 *
 * Two marks the boards draw inline were requested from the ASSETS builder
 * (see docs/v4-build/PLACEHOLDERS.md): the EVO Touch truck and the mentee
 * figure. At the owner's request (2026-11-12) the truck became ZF's logo.
 */
export const PRODUCTS: Product[] = parseOrThrow(
  z.array(productSchema),
  [
    /* Own products, businesses and experiments --------------------------- */
    {
      slug: "tenderlift",
      name: "TenderLift",
      url: "https://tenderlift.ch",
      status: "Running",
      year: "2025 to now",
      kind: "product",
      description: "Swiss public tenders, sorted by what you can actually win",
      story: "tenderlift",
      bg: "#1E2A3A",
      fg: "#FFFFFF",
      // The brand kit's navy badge: white "t", red step.
      mark: {
        kind: "art",
        src: "/static/logos/tiles/tenderlift.svg",
        mono: "/static/logos/work/tenderlift.svg",
      },
    },
    {
      slug: "zarez",
      name: "Zarez",
      url: "https://zarez.rs",
      status: "Live",
      year: "2026",
      kind: "product",
      description: "A spelling checker for Serbian, in Latin and Cyrillic.",
      story: "zarez",
      // The brand's two-colour quill (red upper vane, navy lower vane) on
      // pure white, as its BRAND.md requires (owner, 13 Nov 2026). `bg` is
      // light, so the tile gets the firm 1px edge. `fg` is the ink for text on
      // the tile's ground (the list preview's caption).
      bg: "#FFFFFF",
      fg: "#17180F",
      // The red of the quill in the tile (public/static/logos/tiles/zarez.svg):
      // the fallback (bg white, so fg) would give ink.
      brand: "#D0101A",
      mark: { kind: "art", src: "/static/logos/tiles/zarez.svg" },
    },
    {
      slug: "fontalternatives",
      name: "FontAlternatives",
      url: "https://fontalternatives.com",
      status: "Running",
      year: "2026",
      kind: "product",
      description: "Free fonts that look like the expensive ones",
      story: "fontalternatives",
      // The favicon's orange brackets on the site's paper.
      bg: "#FBFAF7",
      fg: "#E55D28",
      mark: {
        kind: "art",
        src: "/static/logos/tiles/fontalternatives.svg",
        mono: "/static/logos/work/fontalternatives.svg",
      },
    },
    {
      slug: "studenti-rs",
      name: "studenti.rs",
      url: "https://studenti.rs",
      status: "Running",
      year: "2008 to now",
      kind: "product",
      description:
        "Where students in Serbia share study materials. Online since 2008.",
      story: "studenti-rs",
      // The brand's primary mark, bare: no tile ground, no edge (owner,
      // 13 Nov 2026). `bg` stays the brand green for the plate and the list.
      bare: true,
      bg: "#008060",
      fg: "#FFFFFF",
      mark: {
        kind: "art",
        src: "/static/logos/tiles/studenti-rs.svg",
        mono: "/static/logos/work/studenti-rs.svg",
      },
    },
    {
      slug: "ona",
      name: "ONA by Alma",
      url: "https://onatorba.com",
      status: "Running",
      kind: "business",
      description:
        "Handmade crochet bags. I manage the Shopify store and social media, and produce the content.",
      // The shop's icon: the gold ring with its cut, on espresso.
      bg: "#3A2B22",
      fg: "#C8AE76",
      mark: { kind: "art", src: "/static/logos/tiles/ona.svg" },
    },
    {
      slug: "panciona",
      name: "Panciona",
      status: "Retired",
      // A freelance job from 2019, a product until 2023: the code history
      // (first commit April 2019, last July 2023), confirmed by the owner.
      year: "2019 to 2023",
      kind: "product",
      story: "panciona",
      // The app icon from its own brand kit: the white mark on Primary.
      bg: "#5850EC",
      fg: "#FFFFFF",
      mark: {
        kind: "art",
        src: "/static/logos/tiles/panciona.svg",
        mono: "/static/logos/work/panciona.svg",
      },
    },
    {
      slug: "hi-fam",
      name: "Hi Fam",
      status: "Retired",
      kind: "product",
      // The app's own hand-lettered "fam" mark on its pink (docs/v4-build/sources/logos/tiles/SOURCES.md).
      bg: "#EF3F5B",
      fg: "#FFFFFF",
      mark: { kind: "art", src: "/static/logos/tiles/hi-fam.svg" },
    },
    {
      slug: "flexmatch",
      name: "FlexMatch",
      status: "Retired",
      kind: "product",
      // It never had a logo, only a "FlexMatch" text wordmark: a designed
      // bold F in its black, white and purple (docs/v4-build/sources/logos/tiles/SOURCES.md), owner to
      // approve.
      bg: "#000000",
      fg: "#FFFFFF",
      mark: { kind: "art", src: "/static/logos/tiles/flexmatch.svg" },
    },
    {
      slug: "nunium",
      name: "Nunium",
      status: "Retired",
      kind: "product",
      bg: "#FCFCFC",
      fg: "#000000",
      mark: {
        kind: "art",
        src: "/static/logos/tiles/nunium.svg",
        mono: "/static/logos/work/nunium.svg",
      },
    },

    /* Jobs, and the products inside them --------------------------------- */
    {
      slug: "zf-scalar",
      name: "ZF",
      year: "2023 to now",
      kind: "employer",
      description:
        "Tools truck drivers use every day. I’m a Global Product Owner.",
      story: "zf-scalar",
      bg: "#0057B7",
      fg: "#FFFFFF",
      mark: {
        kind: "art",
        src: "/static/logos/tiles/zf-scalar.svg",
        mono: "/static/logos/mono/zf-scalar.svg",
      },
    },
    {
      slug: "evo-touch",
      name: "EVO Touch",
      year: "2025 to 2026",
      kind: "employer-product",
      description:
        "The app truck drivers work in. I was its Global Product Owner until September 2026.",
      story: "zf-scalar",
      // The tile is ZF's logo, white on ZF blue, at the owner's request
      // (2026-11-12). EVO Touch has no product icon of its own. The copy rule
      // is unchanged: no employer in any headline or identity line.
      bg: "#0057B7",
      fg: "#FFFFFF",
      mark: {
        kind: "art",
        src: "/static/logos/tiles/evo-touch.svg",
        mono: "/static/logos/work/evo-touch.svg",
      },
    },
    {
      slug: "shopify",
      name: "Shopify",
      year: "2021 to 2023",
      kind: "employer",
      description: "Built Shop Minis from zero.",
      story: "shopify",
      bg: "#FFFFFF",
      fg: "#95BF47",
      mark: {
        kind: "art",
        src: "/static/logos/tiles/shopify.svg",
        mono: "/static/logos/mono/shopify.svg",
      },
    },
    {
      slug: "shop-minis",
      name: "Shop Minis",
      year: "2021 to 2023",
      kind: "employer-product",
      description:
        "Small apps inside Shopify's Shop app, built from zero with ten partners",
      story: "shopify",
      bg: "#000026",
      fg: "#5433EB",
      mark: {
        kind: "art",
        src: "/static/logos/tiles/shop-minis.svg",
        mono: "/static/logos/work/shop-minis.svg",
      },
    },
    {
      slug: "hegias",
      name: "HEGIAS",
      year: "2020 to 2021",
      kind: "employer",
      description: "Team lead of six, VR for architects.",
      // The story: the CMS run again in 2026 (content/work/hegias.mdx).
      story: "hegias",
      bg: "#FFFFFF",
      fg: "#29526D",
      mark: {
        kind: "art",
        src: "/static/logos/tiles/hegias.svg",
        mono: "/static/logos/mono/hegias.svg",
      },
    },
    {
      slug: "wolkabout",
      name: "WolkAbout",
      year: "2017 to 2020",
      kind: "employer",
      description: "Led the core of an IoT platform.",
      story: "wolkabout",
      bg: "#323232",
      fg: "#FFFFFF",
      mark: {
        kind: "art",
        src: "/static/logos/tiles/wolkabout.svg",
        mono: "/static/logos/mono/wolkabout.svg",
      },
    },
    {
      slug: "execom",
      name: "Execom",
      year: "2016 to 2017",
      kind: "employer",
      description: "Many client projects at a fast pace. I loved it.",
      bg: "#FFFFFF",
      fg: "#FB4B4F",
      mark: {
        kind: "art",
        src: "/static/logos/tiles/execom.svg",
        mono: "/static/logos/mono/execom.svg",
      },
    },
    {
      slug: "nemestic",
      name: "Nemestic Studio",
      year: "2010 to 2011",
      kind: "employer",
      description: "Dozens of client projects.",
      bg: "#FFFFFF",
      fg: "#231F20",
      mark: {
        kind: "art",
        src: "/static/logos/tiles/nemestic.svg",
        mono: "/static/logos/mono/nemestic.svg",
      },
    },

    /* Freelance ----------------------------------------------------------- */
    {
      slug: "bistoletti",
      name: "Bistoletti",
      // Not shown at launch (owner, 13 Nov 2026). Remove this line to bring
      // it back: the strip card, the product list, every mirror and Ask.
      hidden: true,
      status: "Pre-launch",
      kind: "client",
      description:
        "An optician in Lugano since 1920. New website, launching soon.",
      // The new site's monogram favicon: ink on cream.
      bg: "#F4F0E6",
      fg: "#11161E",
      mark: {
        kind: "art",
        src: "/static/logos/tiles/bistoletti.svg",
        mono: "/static/logos/work/bistoletti.svg",
      },
    },
    {
      // A strip card, and a row in the list since 16 Nov 2026 (owner). The
      // tile is the site's favicon: the low sun over the Wadden Sea, on cream.
      slug: "amada",
      name: "Villa Amada",
      url: "https://stayamada.com",
      status: "Live",
      kind: "client",
      description:
        "A farmhouse on the Danish Wadden Sea, and the site that books it",
      bg: "#F4EFE6",
      fg: "#8A4F3F",
      mark: {
        kind: "art",
        src: "/static/logos/tiles/amada.svg",
        mono: "/static/logos/work/amada.svg",
      },
    },
    {
      // Freelance in 2019: the first version of the Internxt Drive mobile app.
      // A row in the list under JOBS (it has no group of its own), no story,
      // and not one of his products: `kind: "client"`, no status. The tile is
      // the company's own app icon (docs/v4-build/sources/logos/tiles/SOURCES.md).
      slug: "internxt",
      name: "Internxt",
      url: "https://internxt.com",
      year: "2019",
      kind: "client",
      description:
        "Freelance. Built their first mobile app, then handed it on.",
      bg: "#060C40",
      fg: "#FFFFFF",
      mark: {
        kind: "art",
        src: "/static/logos/tiles/internxt.svg",
        mono: "/static/logos/work/internxt.svg",
      },
    },

    /* Tiles that are not products ----------------------------------------- */
    {
      slug: "mentoring",
      name: "Mentoring",
      kind: "concept",
      bg: "#111111",
      fg: "#FFFFFF",
      mark: {
        kind: "art",
        src: "/static/logos/tiles/mentoring.svg",
        mono: "/static/logos/work/mentoring.svg",
      },
    },
    {
      slug: "mentorcruise",
      name: "MentorCruise",
      url: "https://mentors.to/ruzicic",
      kind: "platform",
      bg: "#1A4740",
      fg: "#FAEEDC",
      mark: {
        kind: "art",
        src: "/static/logos/tiles/mentorcruise.svg",
      },
    },
  ],
  "content/products.ts"
)
