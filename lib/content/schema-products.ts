import { z } from "zod"

import { hex, href, publicPath } from "./schema-base"

/* -------------------------------------------------------------------------- */
/* Products: one registry of every product, employer and project on the boards */
/* -------------------------------------------------------------------------- */

/**
 * Every slug in `content/products.ts`. Any `ref` anywhere in content is
 * checked against this list, so a typo fails the build with the file path.
 */
export const PRODUCT_SLUGS = [
  // Own products, businesses and experiments
  "tenderlift",
  "zarez",
  "fontalternatives",
  "studenti-rs",
  "ona",
  "panciona",
  "hi-fam",
  "flexmatch",
  "nunium",
  // Jobs, and the products he worked on inside them
  "zf-scalar",
  "evo-touch",
  "shopify",
  "shop-minis",
  "hegias",
  "wolkabout",
  "execom",
  "nemestic",
  // Freelance
  "bistoletti",
  "amada",
  "internxt",
  // Tiles that are not products but share the tile: the paragraph's
  // "a mentee", and MentorCruise.
  "mentoring",
  "mentorcruise",
] as const
export type ProductSlug = (typeof PRODUCT_SLUGS)[number]
export const productSlugSchema = z.enum(PRODUCT_SLUGS)

/**
 * The nine `/work/<slug>` stories, in the order the site presents them (his
 * own products first, then the jobs). Every other work slug 308-redirects to
 * `/work#<slug>`.
 */
export const STORY_SLUGS = [
  "tenderlift",
  "studenti-rs",
  "fontalternatives",
  "zarez",
  "panciona",
  "zf-scalar",
  "shopify",
  "hegias",
  "wolkabout",
] as const
export type StorySlug = (typeof STORY_SLUGS)[number]

/**
 * What a product is. `employer-product` is a product he worked on as an
 * employee (EVO Touch, Shop Minis); `concept` is a tile with no product
 * behind it (mentoring).
 */
const PRODUCT_KINDS = [
  "product",
  "business",
  "experiment",
  "employer",
  "employer-product",
  "client",
  "platform",
  "concept",
] as const
export type ProductKind = (typeof PRODUCT_KINDS)[number]

/**
 * The plain status words the boards use. The list uses the first five
 * ("Running. My main product."); the strip pills add the last three for
 * entries the list does not carry.
 */
const PRODUCT_STATUSES = [
  "Running",
  "Building",
  "Paused",
  "Experiment",
  "Retired",
  "Live",
  "Pre-launch",
  "Day job",
] as const
export type ProductStatus = (typeof PRODUCT_STATUSES)[number]

/**
 * The tile drawn in front of a product name, at headline-chip size and at
 * text size. FOUNDATION's `ProductTile` renders this shape.
 *
 * - `art`: the whole tile, a full-colour 64x64 SVG under
 *   `/static/logos/tiles/` (its own background rect, the mark centred). The
 *   loader reads and checks the file once and hands its markup over as
 *   `body`, so the tile draws it inline: no request, nothing to load when
 *   the headline swaps tiles, and it renders without JavaScript.
 * - `svg`: white-filled geometry under `/static/logos/`, painted with `fg`
 *   through `mask-image`.
 * - `letters` and `glyph`: text in `fg` on `bg` (`glyph` is a single display
 *   character, set larger than letters).
 */
export type ProductMark = {
  slug: string
  name: string
  bg: string
  fg: string
  /** The branded-link colour (`getProductMark().brand`): the lockup's underline and wash. */
  brand: string
  mark:
    | TileArt
    | { kind: "svg"; src: string; accent?: MarkAccent }
    | { kind: "letters"; text: string }
    | { kind: "glyph"; text: string }
}

/**
 * An `art` mark as the tile receives it. `body` is the file's inner markup,
 * already checked by the loader (`lib/content/tile-art.ts`). When the file
 * has ids (a gradient), every id and `url(#…)` in `body` carries the
 * `TILE_ART_ID` token (`lib/content/tile-art-id.ts`), which the tile replaces with an id of its own so two
 * tiles on one page never share one.
 */
export type TileArt = {
  kind: "art"
  src: string
  mono?: string
  body: string
  /**
   * A light ground (white, cream) that would lose its edge on the paper: the
   * tile draws a firmer 1px hairline. Derived from `bg` by the loader.
   */
  light: boolean
  /** No ground, no clip, no edge: the mark alone (`bare` on the product). */
  bare?: boolean
}

const markSvgSrc = z
  .string()
  .regex(/^\/static\/logos\/.+\.svg$/, "expected /static/logos/*.svg")

/**
 * A second colour inside an `svg` mark (TenderLift's red dot on navy). `src`
 * is a white-filled SVG on the same viewBox holding only the accent geometry;
 * the tile cuts it out of the main mark and paints it in `color`.
 */
const markAccentSchema = z.object({
  src: markSvgSrc,
  color: hex,
})
export type MarkAccent = z.infer<typeof markAccentSchema>

const tileArtSrc = z
  .string()
  .regex(
    /^\/static\/logos\/tiles\/[a-z0-9-]+\.svg$/,
    "expected /static/logos/tiles/<slug>.svg"
  )

const productMarkKindSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("art"),
    /** The complete tile: `viewBox="0 0 64 64"`, background rect first. */
    src: tileArtSrc,
    /**
     * The same mark as one-colour white geometry, for the places that paint
     * a mark in a single ink (the strip's "no footage yet" card). Optional:
     * without it those places show the label alone.
     */
    mono: markSvgSrc.optional(),
  }),
  z.object({
    kind: z.literal("svg"),
    src: markSvgSrc,
    accent: markAccentSchema.optional(),
  }),
  z.object({ kind: z.literal("letters"), text: z.string().min(1).max(2) }),
  z.object({ kind: z.literal("glyph"), text: z.string().min(1).max(1) }),
])

export const productSchema = z.object({
  slug: productSlugSchema,
  name: z.string().min(1),
  url: z.url().optional(),
  /** Omitted where the boards show no status word (employers). */
  status: z.enum(PRODUCT_STATUSES).optional(),
  /** The board's year label ("2025 to now", "2026"). Omitted where it has none. */
  year: z.string().min(1).optional(),
  kind: z.enum(PRODUCT_KINDS),
  /** One line, as the board words it. Omitted where the board has none. */
  description: z.string().min(1).optional(),
  /** The `/work/<slug>` story for this entry, if it is one of the nine. */
  story: z.enum(STORY_SLUGS).optional(),
  bg: hex,
  fg: hex,
  /**
   * The dominant colour of the tile artwork, for branded links (the
   * lockup's underline and hover wash). Optional: without it the loader
   * uses `bg`, or `fg` when `bg` is light (`getProductMark().brand`). Set it where
   * neither is the colour the mark is seen in (Zarez: its red quill).
   */
  brand: hex.optional(),
  mark: productMarkKindSchema,
  /**
   * Not shown yet. A hidden product is left out of every reader: its strip
   * card and list rows (`content/pages/home.ts`), the product list, the
   * markdown mirrors, `llms*.txt`, `/mcp`, JSON-LD and the Ask context. Its
   * data and files stay; delete this line (or set it to `false`) to bring it
   * back.
   */
  hidden: z.boolean().optional(),
  /**
   * A bare mark: the tile file has no background rect and the tile draws no
   * ground, no clip and no edge, just the mark (studenti.rs, owner 13 Nov
   * 2026). `bg` stays the brand colour for the places that need one.
   */
  bare: z.boolean().optional(),
})
export type Product = z.infer<typeof productSchema>

/* -------------------------------------------------------------------------- */
/* Shared shapes: links, media, rich text, popovers, media slots              */
/* -------------------------------------------------------------------------- */

export const linkSchema = z.object({
  label: z.string().min(1),
  href,
  /** Opens in a new tab. */
  external: z.boolean().optional(),
  /** `rel="me"`: his own profile elsewhere. */
  me: z.boolean().optional(),
})
export type Link = z.infer<typeof linkSchema>

/**
 * An image by public path. Width, height and the blur placeholder come from
 * `content/media.ts` (`MEDIA[src]`); the loader fails the build if `src` is not
 * listed there.
 */
export const mediaSchema = z.object({
  src: publicPath,
  alt: z.string(),
})
export type Media = z.infer<typeof mediaSchema>

export const popoverSchema = z.object({
  /** Mono label, "PRODUCT · MINE". */
  eyebrow: z.string().min(1),
  /** Dialog label on desktop, visible heading in the phone sheet. */
  title: z.string().min(1),
  /** Phone sheet heading where the phone board words it differently. */
  titleLong: z.string().min(1).optional(),
  body: z.string().min(1),
  /** Mono fact line, "SINCE 2025 · ALL 26 CANTONS · DE FR IT EN". */
  meta: z.string().min(1).optional(),
  /**
   * Only for a popover whose product has neither a case study nor a website
   * (Mentoring: "How it works"). A project's own links come from the product
   * (`projectActionsSchema` in schema-pages.ts); `content/pages/home.ts`
   * refuses a `link` on a project that has them.
   */
  link: linkSchema.optional(),
})
export type Popover = z.infer<typeof popoverSchema>

/**
 * Inline rich text. A paragraph is `RichSegment[]`, rendered in order:
 *   · `text`    plain words, spacing and punctuation included verbatim.
 *   · `product` the product's tile plus `text`. With `popover` it is a button
 *               that opens it (landing); with `href` it is a link (mentoring,
 *               about). Never both.
 *   · `link`    an ordinary link.
 */
export const richSegmentSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), text: z.string().min(1) }),
  z
    .object({
      kind: z.literal("product"),
      ref: productSlugSchema,
      text: z.string().min(1),
      href: href.optional(),
      popover: popoverSchema.optional(),
    })
    .refine(
      (s) => !(s.href && s.popover),
      "a product segment takes href or popover, not both"
    ),
  z.object({
    kind: z.literal("link"),
    text: z.string().min(1),
    href,
    external: z.boolean().optional(),
    me: z.boolean().optional(),
  }),
])
export type RichSegment = z.infer<typeof richSegmentSchema>
export const richTextSchema = z.array(richSegmentSchema).min(1)
export type RichText = z.infer<typeof richTextSchema>

/** A clip file: the slot's `src` is the `.mp4`; a `.webm` beside it is offered first. */
export const VIDEO_PATH = /\.(mp4|webm|mov)$/i

/**
 * Media that does not exist yet: a neutral frame of `ratio` (width:height)
 * with a short mono `label` saying what goes there. With `src` the slot is
 * filled by an existing image instead, and `label` doubles as its caption.
 *
 * - A clip: `src` is the `.mp4` (a `.webm` with the same name is offered
 *   first), and `poster` the still shown before it plays and instead of it
 *   when motion is reduced. The poster must be in `content/media.ts`.
 * - A row: `row` holds two to six stills of the same `ratio` side by side,
 *   each with its own caption ("then and now"). `label` names the row.
 * - `after`: the id of the body section (`## The website` is `the-website`)
 *   the slot follows. Without it, slots are spread evenly between sections.
 * - A mark: `mark.href` turns the slot into someone else's small official
 *   mark (a programme's stamp) set in the text column under the section it
 *   follows, about 120px wide and linked to `href`. `src` is the SVG, kept
 *   unaltered under `public/`; `alt` is its name; `label` is not shown.
 *   It is never one of the story's stills (sitemap, JSON-LD, mirrors).
 */
export const mediaSlotObject = z.object({
  ratio: z.string().regex(/^\d+:\d+$/, "expected width:height"),
  label: z.string().min(1),
  after: z
    .string()
    .regex(/^[a-z0-9-]+$/, "expected a section id, e.g. the-website")
    .optional(),
  src: publicPath.optional(),
  alt: z.string().optional(),
  poster: publicPath.optional(),
  row: z
    .array(
      z.object({
        src: publicPath,
        alt: z.string().min(1),
        caption: z.string().min(1),
      })
    )
    .min(2)
    .max(6)
    .optional(),
  mark: z.object({ href }).optional(),
})
export const mediaSlotSchema = mediaSlotObject
  .refine((slot) => !(slot.row && slot.src), {
    message: "a slot is either one picture (`src`) or a row, not both",
  })
  .refine(
    (slot) =>
      !slot.mark ||
      (slot.src?.endsWith(".svg") && slot.alt && !slot.row && !slot.poster),
    {
      message: "a mark slot is one `.svg` `src` with an `alt`, nothing else",
      path: ["mark"],
    }
  )
  .refine((slot) => !slot.src || !VIDEO_PATH.test(slot.src) || slot.poster, {
    message: "a clip slot needs a `poster` still",
    path: ["poster"],
  })
export type MediaSlot = z.infer<typeof mediaSlotSchema>
