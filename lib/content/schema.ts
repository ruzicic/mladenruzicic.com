import { z } from "zod"

/**
 * Content schemas — the exact shape agreed in docs/v3-content-contract.md.
 * Everything under `content/` validates against these; a failure throws with
 * the offending file path so the build fails on bad content.
 */

/* -------------------------------------------------------------------------- */
/* Companies                                                                  */
/* -------------------------------------------------------------------------- */

export const COMPANY_IDS = [
  "zf-scalar",
  "shopify",
  "hegias",
  "wolkabout",
  "freelance",
  "nemestic",
] as const
export type CompanyId = (typeof COMPANY_IDS)[number]

export const HERO_LOGO_IDS = [
  "zf-scalar",
  "shopify",
  "hegias",
  "wolkabout",
  "execom",
  "nemestic",
] as const
export type HeroLogoId = (typeof HERO_LOGO_IDS)[number]

export type PersonId = string

/**
 * Every `content/work/*.mdx` slug, hand-maintained because `proxy.ts` is the
 * one consumer that cannot read the filesystem — it runs in the proxy, and the
 * loaders in `lib/content/index.ts` are server-only.
 *
 * KEEP IN SYNC, and mind that the two directions fail differently. ADDING an
 * `.mdx` without adding it here fails loudly: the zod `slug` enum rejects the
 * file and `next build` stops with the path. REMOVING an `.mdx` and leaving
 * the entry here fails silently — the proxy waves the slug through, the case
 * study route serves its prerendered fallback shell, and the visitor gets a
 * 200 for a page that no longer exists. Delete the entry in the same commit as
 * the file.
 */
export const WORK_SLUGS = [
  "zf-scalar",
  "shopify",
  "hegias",
  "wolkabout",
  "tenderlift",
  "evo-touch",
  "studenti-rs",
  "fontalternatives",
  "amada",
  "fontswap",
  "avataurus",
  "montepop",
  "boxium",
  "panciona",
  "hi-fam",
  "flexmatch",
  "nunium",
  "internxt",
  "trello-boosted-boards",
  "mladenruzicic-com",
] as const
export type WorkSlug = (typeof WORK_SLUGS)[number]

const hex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "expected a 6-digit hex colour")

export const companyIdSchema = z.enum(COMPANY_IDS)
export const workSlugSchema = z.enum(WORK_SLUGS)
export const personIdSchema = z
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

export const heroLogoSchema = z.object({
  id: z.enum(HERO_LOGO_IDS),
  label: z.string().min(1),
  bandId: companyIdSchema,
  logo: z.string().startsWith("/static/logos/").optional(),
  mark: z.string().min(1).max(2),
})
export type HeroLogo = z.infer<typeof heroLogoSchema>

/* -------------------------------------------------------------------------- */
/* People                                                                     */
/* -------------------------------------------------------------------------- */

export const personSchema = z.object({
  id: personIdSchema,
  name: z.string().min(1),
  where: z.string().min(1),
  /**
   * 320x320 WebP under `public/static/people/`. Optional: `PersonPopover`
   * falls back to the initials disc, which is what every entry rendered
   * before photos existed.
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
})
export type Testimonial = z.infer<typeof testimonialSchema>

/* -------------------------------------------------------------------------- */
/* Work                                                                       */
/* -------------------------------------------------------------------------- */

export const WORK_KINDS = ["company", "product", "experiment"] as const
export type WorkKind = (typeof WORK_KINDS)[number]

export const WORK_STATUSES = [
  "current",
  "active",
  "maintained",
  "paused",
  "completed",
  "archived",
] as const
export type WorkStatus = (typeof WORK_STATUSES)[number]

export const CONFIDENCES = [
  "verified",
  "needs-verification",
  "private",
] as const
export type Confidence = (typeof CONFIDENCES)[number]

export const CONFIDENTIALITIES = ["public", "limited", "high"] as const
export type Confidentiality = (typeof CONFIDENTIALITIES)[number]

export const workFrontmatterSchema = z.object({
  slug: workSlugSchema,
  title: z.string().min(1),
  shortTitle: z.string().min(1).optional(),
  kind: z.enum(WORK_KINDS),
  status: z.enum(WORK_STATUSES),
  featured: z.boolean(),
  highlightRank: z.number().int().min(1).max(5).optional(),
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
   * `content/pages/uses.mdx` claiming all twenty case studies changed.
   */
  updated: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD")
    .optional(),
  role: z.string().min(1),
  location: z.string().min(1).optional(),
  accent: hex,
  tech: z.array(z.string().min(1)),
  line: z.string().min(1).max(120),
  detail: z.string().min(1),
  url: z.url().optional(),
  links: z
    .array(z.object({ label: z.string().min(1), url: z.url() }))
    .optional(),
  media: z
    .array(
      z.object({
        src: z.string().min(1),
        alt: z.string().min(1),
        caption: z.string().min(1).optional(),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        kind: z.enum(["image", "video"]),
        /**
         * 16px-wide base64 data URI used as `next/image`'s `placeholder="blur"`.
         * Optional: `WorkArt` and `MediaGallery` already read it defensively and
         * fall back to `placeholder="empty"` when it is absent.
         */
        blurDataURL: z.string().startsWith("data:image/").optional(),
      })
    )
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

/* -------------------------------------------------------------------------- */
/* Site                                                                       */
/* -------------------------------------------------------------------------- */

export const siteSchema = z.object({
  name: z.literal("Mladen Ružičić"),
  domain: z.literal("mladenruzicic.com"),
  url: z.literal("https://mladenruzicic.com"),
  tagline: z.string().min(1),
  description: z.string().min(1).max(160),
  location: z.object({
    city: z.literal("Lausanne"),
    country: z.literal("CH"),
  }),
  roles: z.array(z.string().min(1)),
  links: z.object({
    github: z.url(),
    linkedin: z.url(),
    mentorcruise: z.url(),
    calendar: z.url(),
    cv: z.literal("/cv"),
  }),
  yearsShipping: z.number().int().positive(),
})
export type Site = z.infer<typeof siteSchema>

/* -------------------------------------------------------------------------- */
/* Pages                                                                      */
/* -------------------------------------------------------------------------- */

export const homeSchema = z.object({
  hero: z.object({
    eyebrow: z.array(z.string().min(1)),
    /** `{braces}` mark the italic accent word. */
    h1: z.string().min(1),
    /** May contain `[[zf-scalar]]` / `[[tenderlift]]` inline chip tokens. */
    lede: z.string().min(1),
    scrollCue: z.string().min(1),
  }),
  work: z.object({
    eyebrow: z.string().min(1),
    countLabel: z.string().min(1),
    allWorkLabel: z.string().min(1),
  }),
  history: z.object({
    eyebrow: z.string().min(1),
    rangeLabel: z.string().min(1),
    employedLabel: z.string().min(1),
    independentLabel: z.string().min(1),
    alongsideLabel: z.string().min(1),
  }),
  mentoring: z.object({
    eyebrow: z.string().min(1),
    /** `{braces}` mark the italic accent word. */
    h2: z.string().min(1),
    lede: z.string().min(1),
    pageLink: z.string().min(1),
    externalLink: z.string().min(1),
  }),
  footer: z.object({ copyright: z.string().min(1) }),
  preloader: z.object({
    finalVerb: z.literal("Shipping"),
    verbs: z.array(z.string().min(1)).min(1),
  }),
})
export type Home = z.infer<typeof homeSchema>

export const mentoringSchema = z.object({
  seo: z.object({
    title: z.string().min(1),
    description: z.string().min(1).max(160),
  }),
  eyebrow: z.array(z.string().min(1)).min(1),
  /** `{braces}` mark the italic accent word. */
  h1: z.string().min(1),
  lede: z.string().min(1),
  whoFor: z.array(z.string().min(1)),
  howItWorks: z.array(
    z.object({ title: z.string().min(1), body: z.string().min(1) })
  ),
  topics: z.array(z.string().min(1)),
  expectations: z.array(z.string().min(1)),
  cta: z.object({
    label: z.string().min(1),
    url: z.string().min(1),
    note: z.string().min(1).optional(),
  }),
  closing: z.object({
    /** `{braces}` mark the italic accent word. */
    h2: z.string().min(1),
  }),
})
export type Mentoring = z.infer<typeof mentoringSchema>

/**
 * `/work` index copy. `{count}` in `eyebrow` and `mirror.intro` is replaced
 * with the number of entries; `{braces}` in `h1` mark the italic accent word.
 */
export const workPageSchema = z.object({
  seo: z.object({
    title: z.string().min(1),
    description: z.string().min(1).max(160),
  }),
  eyebrow: z.array(z.string().min(1)).min(1),
  h1: z.string().min(1),
  lede: z.string().min(1),
  /** The `/md/work` mirror, which introduces the list rather than the page. */
  mirror: z.object({
    description: z.string().min(1).max(160),
    intro: z.string().min(1),
  }),
})
export type WorkPage = z.infer<typeof workPageSchema>

/** `app/not-found.tsx`. `{braces}` in `h1` mark the italic accent word. */
export const notFoundSchema = z.object({
  eyebrow: z.array(z.string().min(1)).min(1),
  /** The oversized numeral. `aria-hidden`; the eyebrow carries it for AT. */
  code: z.string().min(1),
  h1: z.string().min(1),
  lede: z.string().min(1),
})
export type NotFound = z.infer<typeof notFoundSchema>

export const SITE_LINK_KEYS = [
  "github",
  "linkedin",
  "mentorcruise",
  "calendar",
  "cv",
] as const
export type SiteLinkKey = (typeof SITE_LINK_KEYS)[number]

export const pageFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1).max(160),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD"),
  /**
   * Page header copy. `{braces}` mark the italic accent word in `h1`;
   * `[years]` / `[Years]` expands to `SITE.yearsShipping` spelled out, and
   * `{updated}` in an eyebrow item expands to the `updated` date. Both are
   * resolved by the loader, so consumers only ever see finished strings.
   */
  h1: z.string().min(1),
  eyebrow: z.array(z.string().min(1)).min(1),
  /**
   * The designed links block. `key` points at `SITE.links`, so a URL is never
   * written twice; `note` is the right-hand hint.
   */
  links: z
    .array(
      z.object({
        key: z.enum(SITE_LINK_KEYS),
        label: z.string().min(1),
        note: z.string().min(1),
      })
    )
    .optional(),
})
export type PageFrontmatter = z.infer<typeof pageFrontmatterSchema>

export interface PageEntry extends PageFrontmatter {
  slug: "about" | "uses"
  body: string
}

/* -------------------------------------------------------------------------- */
/* Validation helper                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Parses `value` and, on failure, throws an Error naming the source file and
 * every offending path — so `next build` fails loudly on bad content.
 */
export function parseOrThrow<T extends z.ZodType>(
  schema: T,
  value: unknown,
  source: string
): z.infer<T> {
  const result = schema.safeParse(value)
  if (result.success) return result.data
  const issues = result.error.issues
    .map((i) => `  · ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n")
  throw new Error(`Invalid content in ${source}:\n${issues}`)
}
