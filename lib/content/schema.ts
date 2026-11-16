import { z } from "zod"

import { hex } from "./schema-base"

/**
 * Content schemas. Everything under `content/` validates against these; a
 * failure throws with the offending file path so the build fails on bad
 * content. The v4 product registry and page schemas live in
 * `./schema-products` and `./schema-pages` and are re-exported from here, so
 * `@/lib/content/schema` stays the one import path (and stays filesystem-free,
 * safe for client components).
 */

/* -------------------------------------------------------------------------- */
/* Companies                                                                  */
/* -------------------------------------------------------------------------- */

const COMPANY_IDS = [
  "zf-scalar",
  "shopify",
  "hegias",
  "wolkabout",
  "freelance",
  "nemestic",
] as const
export type CompanyId = (typeof COMPANY_IDS)[number]

export type PersonId = string

/**
 * Every `content/work/*.mdx` slug: the `slug` enum of the front matter, so a
 * new `.mdx` fails the build until it is added here. Only the nine
 * `STORY_SLUGS` have pages; `proxy.ts` answers every other `/work/<slug>`
 * with a 404 (the old ones redirect, `next.config.ts`).
 */
const WORK_SLUGS = [
  "zf-scalar",
  "shopify",
  "hegias",
  "wolkabout",
  "tenderlift",
  "studenti-rs",
  "fontalternatives",
  "panciona",
  "hi-fam",
  "flexmatch",
  "nunium",
  "zarez",
] as const
export type WorkSlug = (typeof WORK_SLUGS)[number]

const companyIdSchema = z.enum(COMPANY_IDS)
const workSlugSchema = z.enum(WORK_SLUGS)
const personIdSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected a kebab-case id")

export const companySchema = z.object({
  id: companyIdSchema,
  name: z.string().min(1),
  short: z.string().min(1),
  /** Shopify uses Shopify green (bag mark decided), not #5A31F4. */
  color: hex,
  from: z.number(),
  to: z.union([z.number(), z.literal("now")]),
  approx: z.boolean(),
  yearsLabel: z.string().min(1),
  role: z.string().min(1),
  prev: z.string().min(1).optional(),
  summary: z.string().min(1),
  fact: z.string().min(1).optional(),
  people: z.array(personIdSchema),
  logo: z.string().startsWith("/static/logos/").optional(),
  mark: z.string().min(1).max(2).optional(),
  workSlug: workSlugSchema.optional(),
})
export type Company = z.infer<typeof companySchema>

/* -------------------------------------------------------------------------- */
/* People                                                                     */
/* -------------------------------------------------------------------------- */

export const personSchema = z.object({
  id: personIdSchema,
  name: z.string().min(1),
  where: z.string().min(1),
  /**
   * 320x320 WebP under `public/static/people/`. Optional: "Worked alongside"
   * in a story's panel (`StoryPanel`) falls back to an initials disc.
   */
  avatar: z.string().startsWith("/static/people/").optional(),
  /** Full URL or omitted. Never a placeholder. */
  linkedin: z.url().optional(),
  why: z.string().min(1),
  note: z.string().min(1).optional(),
})
export type Person = z.infer<typeof personSchema>

/* -------------------------------------------------------------------------- */
/* Testimonials                                                               */
/* -------------------------------------------------------------------------- */

export const testimonialSchema = z.object({
  id: z.string().min(1),
  author: z.string().min(1),
  avatar: z.string().startsWith("/static/mentees/").optional(),
  quote: z.string().min(1),
  source: z.enum(["mentorcruise", "linkedin", "direct"]),
  sourceUrl: z.url().optional(),
  permission: z.literal("public"),
  featured: z.boolean().optional(),
  /** How long the mentorship ran, as the source shows it ("2 years"). */
  duration: z.string().min(1).optional(),
  /** The year of the review. */
  year: z.number().int().min(2000).max(2100).optional(),
})
export type Testimonial = z.infer<typeof testimonialSchema>

/* -------------------------------------------------------------------------- */
/* Work                                                                       */
/* -------------------------------------------------------------------------- */

const CONFIDENCES = ["verified", "needs-verification", "private"] as const
export type Confidence = (typeof CONFIDENCES)[number]

const CONFIDENTIALITIES = ["public", "limited", "high"] as const
export type Confidentiality = (typeof CONFIDENTIALITIES)[number]

/* -------------------------------------------------------------------------- */
/* Case-study page: the panel and the column of squares                      */
/* -------------------------------------------------------------------------- */

/**
 * A bracketed, upper-case stand-in such as `[NUMBER]` or `[HIS WORDS]`. Never
 * on a story page: the owner's open questions live in
 * docs/v4-build/PLACEHOLDERS.md, not in `panel` or `column`.
 */
const BRACKET = /\[[A-Z]/
const plain = z
  .string()
  .min(1)
  .refine((s) => !BRACKET.test(s), {
    message: "no bracket placeholders on a story page",
  })

/** A clip file: an `.mp4`, with a `.webm` of the same name offered first. */
const CLIP_PATH = /^\/[^/].*\.mp4$/
/** A still: WebP, PNG or JPEG under `public/`, registered in `content/media.ts`. */
const STILL_PATH = /^\/[^/].*\.(webp|png|jpe?g)$/

const storyMediaFields = {
  /** The one caption line under the square. */
  caption: plain,
  /**
   * Whose picture it is, when it is not his ("Source: zf-scalar.com, ©
   * ZF Friedrichshafen AG"): a muted mono line under the caption.
   */
  credit: plain.optional(),
  alt: plain,
  /** The reading-progress label in the panel ("Search and open"). Optional. */
  short: plain.optional(),
  /**
   * Where a wide picture would be cut once it is reshot square ("0% 50%").
   * The fallback shows a non-square file whole on the story's plate, so the
   * page does not use it yet.
   */
  focus: z
    .string()
    .regex(/^\d{1,3}% \d{1,3}%$/, 'expected "x% y%"')
    .optional(),
}

const storyImageSchema = z.object({
  kind: z.literal("image"),
  src: z.string().regex(STILL_PATH, "expected a .webp, .png or .jpg path"),
  ...storyMediaFields,
})

const storyClipSchema = z.object({
  kind: z.literal("clip"),
  /** The `.mp4`; the `.webm` beside it must exist too. */
  src: z.string().regex(CLIP_PATH, "expected an .mp4 path"),
  /** The still shown first, and instead of the clip under reduced motion. */
  poster: z.string().regex(STILL_PATH, "expected a .webp, .png or .jpg path"),
  ...storyMediaFields,
})

const storyDiagramSchema = z.object({
  kind: z.literal("diagram"),
  /**
   * `<story>/<name>`, one of `DIAGRAM_IDS` in `app/components/diagram` (the
   * page checks it). Caption and text alternative come from `diagramText`.
   */
  id: z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/, "expected <story>/<name>"),
  short: plain.optional(),
})

export const storyItemSchema = z.discriminatedUnion("kind", [
  storyImageSchema,
  storyClipSchema,
  storyDiagramSchema,
])
export type StoryItem = z.infer<typeof storyItemSchema>

/**
 * One role in a story's timeline (`panel.timeline`): its dates, its title and
 * one or two short blocks ("What happened", "How I moved on"). The page shows
 * each as a `<details>` in the panel; the mirrors print them all.
 */
export const storyRoleSchema = z.object({
  /** "Oct 2023 to Jan 2024", as he writes it. */
  dates: plain,
  title: plain,
  /** The role he holds now: open on load, drawn with a filled marker. */
  current: z.literal(true).optional(),
  blocks: z
    .array(z.object({ label: plain, text: plain }))
    .min(1)
    .max(2),
})
export type StoryRole = z.infer<typeof storyRoleSchema>

export const storyPanelSchema = z
  .object({
    /** The line under the name. */
    summary: plain,
    /** The compact mono line: status, years, role, stage, in that order. */
    meta: z.array(plain).min(1).max(5),
    /** The live product, beside the name. */
    live: z.object({ label: plain, href: z.url() }).optional(),
    /** Up to three highlight numbers; public figures only. */
    numbers: z
      .array(
        z.object({
          value: plain,
          /** The label, one entry per line as the board breaks it. */
          lines: z.array(plain).min(1).max(3),
        })
      )
      .max(3)
      .optional(),
    /**
     * When the numbers were read, as the visitor sees it ("As of 14
     * November 2026"): one quiet line under the row. Only with `numbers`.
     */
    numbersAsOf: plain.optional(),
    /** Three to four paragraphs at most (the owner's words). */
    paragraphs: z.array(plain).min(1).max(4).optional(),
    /**
     * The roles, oldest first, in place of the paragraphs: a story has one or
     * the other (`StoryRoles`).
     */
    timeline: z.array(storyRoleSchema).min(2).max(8).optional(),
    links: z
      .object({
        heading: plain,
        items: z
          .array(
            z.object({
              title: plain,
              href: z.url(),
              /** Where it was published ("Medium"). */
              place: plain.optional(),
              /**
               * The linked site's own favicon, a 32px PNG under `public/`
               * (`public/static/work/<slug>/favicon-<name>.png`, listed in
               * `content/media.ts`), shown at 16. Required: every link
               * carries one (owner, 14 Nov 2026).
               */
              icon: z
                .string()
                .regex(/^\/static\/work\/[a-z0-9-]+\/favicon-[a-z0-9-]+\.png$/),
              /**
               * The favicon's dominant colour: the link's underline and
               * hover wash (owner, 15 Nov 2026, "fully branded links").
               * Required, and it must show on the paper (the loader checks
               * a contrast of at least 1.6:1).
               */
              color: hex,
              /** Its language when it is not English (`sr`). */
              lang: z
                .string()
                .regex(/^[a-z]{2}$/)
                .optional(),
            })
          )
          .min(1)
          .max(3),
      })
      .optional(),
    /** "Worked alongside": ids in `content/people.ts`. */
    people: z.array(personIdSchema).min(1).max(6).optional(),
    /**
     * The story's plate: the ground a non-square picture sits on, whole, inside
     * its square.
     */
    plate: hex,
  })
  .superRefine((panel, ctx) => {
    if (!panel.paragraphs === !panel.timeline)
      ctx.addIssue({
        code: "custom",
        message: "a story panel has either `paragraphs` or `timeline`",
      })
    if (panel.numbersAsOf && !panel.numbers?.length)
      ctx.addIssue({
        code: "custom",
        path: ["numbersAsOf"],
        message: "`numbersAsOf` dates the numbers: set `numbers` too",
      })
    if ((panel.timeline ?? []).filter((r) => r.current).length > 1)
      ctx.addIssue({
        code: "custom",
        path: ["timeline"],
        message: "at most one role is `current`",
      })
  })
export type StoryPanel = z.infer<typeof storyPanelSchema>

export const workFrontmatterSchema = z.object({
  slug: workSlugSchema,
  title: z.string().min(1),
  company: companyIdSchema.optional(),
  period: z.object({
    from: z.string().regex(/^\d{4}(-\d{2})?$/, "expected YYYY or YYYY-MM"),
    to: z.union([
      z.string().regex(/^\d{4}(-\d{2})?$/, "expected YYYY or YYYY-MM"),
      z.literal("now"),
    ]),
    approx: z.boolean().optional(),
  }),
  /**
   * `YYYY-MM-DD`, the last time this case study's copy actually changed.
   * Optional: entries without one fall back to `LAST_UPDATED`, which is what
   * every entry used before this field existed. It is the sitemap's per-entry
   * `<lastmod>`, so setting it here is the only way to stop an edit to
   * a page edit claiming all twenty case studies changed.
   */
  updated: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD")
    .optional(),
  role: z.string().min(1),
  accent: hex,
  tech: z.array(z.string().min(1)),
  line: z.string().min(1).max(120),
  detail: z.string().min(1),
  url: z.url().optional(),
  links: z
    .array(z.object({ label: z.string().min(1), url: z.url() }))
    .optional(),
  metrics: z
    .array(
      z.object({
        value: z.string().min(1),
        label: z.string().min(1),
        confidence: z.enum(CONFIDENCES),
      })
    )
    .optional(),
  confidentiality: z.enum(CONFIDENTIALITIES),
  /**
   * v4: one of the nine `/work/<slug>` stories (`getStories()`). Every other
   * entry 308-redirects to `/work#<slug>`.
   */
  story: z.boolean().optional(),
  /**
   * The case-study page (`/work/<slug>`, 2026-11 layout): the pinned panel on
   * the left. Required on the nine stories (`lib/content/index.ts`).
   */
  panel: storyPanelSchema.optional(),
  /** The stack of identical squares on the right, in page order. */
  column: z.array(storyItemSchema).min(1).max(16).optional(),
  seo: z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).max(160),
  }),
})
export type WorkFrontmatter = z.infer<typeof workFrontmatterSchema>

/** Frontmatter plus the raw MDX body. */
export interface WorkEntry extends WorkFrontmatter {
  body: string
}

/**
 * One of the nine stories: `lib/content/index.ts` checks at load that each has
 * its case-study `panel` and `column`.
 */
export interface Story extends WorkEntry {
  panel: StoryPanel
  column: StoryItem[]
}

/** The stills a column shows (pictures and clip posters), for sitemaps, mirrors and JSON-LD. */
export function columnStills(
  column: StoryItem[]
): { src: string; alt: string }[] {
  return column.flatMap((item) =>
    item.kind === "image"
      ? [{ src: item.src, alt: item.alt }]
      : item.kind === "clip"
        ? [{ src: item.poster, alt: item.alt }]
        : []
  )
}

/* -------------------------------------------------------------------------- */
/* Products, pages, shared shapes                                             */
/* -------------------------------------------------------------------------- */

export * from "./schema-base"
export * from "./schema-products"
export * from "./schema-pages"
