import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import matter from "gray-matter"

import { COMPANIES, HERO_LOGOS } from "@/content/companies"
import { PEOPLE } from "@/content/people"
import { HOME } from "@/content/pages/home"
import { MENTORING } from "@/content/pages/mentoring"
import { SITE } from "@/content/site"
import { TESTIMONIALS } from "@/content/testimonials"

import {
  pageFrontmatterSchema,
  parseOrThrow,
  workFrontmatterSchema,
  type Company,
  type HeroLogo,
  type Home,
  type Mentoring,
  type PageEntry,
  type Person,
  type Site,
  type Testimonial,
  type WorkEntry,
  type WorkSlug,
} from "./schema"

/**
 * Content loaders. SERVER ONLY — this module reads the filesystem. Client
 * components must import types and schemas from `@/lib/content/schema`.
 *
 * Content loaders. Everything is read synchronously at module init from
 * `content/`, validated with zod, and memoised for the process — so no loader is
 * async and none of this interacts with Cache Components / `use cache`.
 *
 * A schema failure throws with the file path, which fails `next build`.
 */

const WORK_DIR = join(process.cwd(), "content", "work")
const PAGES_DIR = join(process.cwd(), "content", "pages")

function loadWork(): WorkEntry[] {
  const files = readdirSync(WORK_DIR).filter((f) => f.endsWith(".mdx"))
  const entries = files.map((file) => {
    const source = join("content", "work", file)
    const raw = readFileSync(join(WORK_DIR, file), "utf8")
    const { data, content } = matter(raw)
    const frontmatter = parseOrThrow(workFrontmatterSchema, data, source)
    if (frontmatter.slug !== file.replace(/\.mdx$/, "")) {
      throw new Error(
        `Invalid content in ${source}: frontmatter slug "${frontmatter.slug}" does not match the filename.`
      )
    }
    return { ...frontmatter, body: content.trim() }
  })

  // Featured first by highlightRank, then most recent first.
  return entries.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1
    if (a.featured && b.featured) {
      return (a.highlightRank ?? 99) - (b.highlightRank ?? 99)
    }
    return periodSortKey(b) - periodSortKey(a)
  })
}

function periodSortKey(entry: WorkEntry): number {
  const to = entry.period.to === "now" ? "9999" : entry.period.to
  return Number(to.slice(0, 4)) * 100 + Number(to.slice(5, 7) || "0")
}

function loadPage(slug: PageEntry["slug"]): PageEntry {
  const source = join("content", "pages", `${slug}.mdx`)
  const raw = readFileSync(join(PAGES_DIR, `${slug}.mdx`), "utf8")
  const { data, content } = matter(raw)
  const frontmatter = parseOrThrow(pageFrontmatterSchema, data, source)
  return { ...frontmatter, slug, body: content.trim() }
}

const WORK = loadWork()
const PAGES: Record<PageEntry["slug"], PageEntry> = {
  about: loadPage("about"),
  uses: loadPage("uses"),
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/** Every case study, featured first (by `highlightRank`), then newest first. */
export function getWork(): WorkEntry[] {
  return WORK
}

/** One case study, or `undefined` if the slug does not exist. */
export function getWorkBySlug(slug: string): WorkEntry | undefined {
  return WORK.find((entry) => entry.slug === slug)
}

/** The five homepage rows, ordered by `highlightRank`. */
export function getFeaturedWork(): WorkEntry[] {
  return WORK.filter((entry) => entry.featured)
}

/** Timeline bands, newest first. */
export function getCompanies(): Company[] {
  return [...COMPANIES].sort((a, b) => b.from - a.from)
}

/** Company by id. */
export function getCompany(id: string): Company | undefined {
  return COMPANIES.find((company) => company.id === id)
}

/** The six hero logo shards. `bandId` points at the timeline band to highlight. */
export function getHeroLogos(): HeroLogo[] {
  return HERO_LOGOS
}

/** "Worked alongside" people. */
export function getPeople(): Person[] {
  return PEOPLE
}

/** Mentee feedback. Pass `{ featured: true }` for the six homepage bubbles. */
export function getTestimonials(options?: {
  featured?: boolean
}): Testimonial[] {
  if (options?.featured) return TESTIMONIALS.filter((t) => t.featured)
  return TESTIMONIALS
}

/** Homepage copy. */
export function getHome(): Home {
  return HOME
}

/** `/mentoring` copy. */
export function getMentoring(): Mentoring {
  return MENTORING
}

/** Site identity and links. */
export function getSite(): Site {
  return SITE
}

/** `/about` or `/uses`: frontmatter plus the raw MDX body. */
export function getPage(slug: PageEntry["slug"]): PageEntry {
  return PAGES[slug]
}

/**
 * Raw frontmatter and body for a case study, for the `/md/` mirrors and
 * `llms-full.txt`. Returns `undefined` for an unknown slug.
 */
export function getWorkMarkdown(
  slug: string
): { frontmatter: Omit<WorkEntry, "body">; body: string } | undefined {
  const entry = getWorkBySlug(slug)
  if (!entry) return undefined
  const { body, ...frontmatter } = entry
  return { frontmatter, body }
}

/** Every work slug, for `generateStaticParams` and the sitemap. */
export function getWorkSlugs(): WorkSlug[] {
  return WORK.map((entry) => entry.slug)
}

export type {
  Company,
  CompanyId,
  Confidence,
  Confidentiality,
  HeroLogo,
  HeroLogoId,
  Home,
  Mentoring,
  PageEntry,
  PageFrontmatter,
  Person,
  PersonId,
  Site,
  Testimonial,
  WorkEntry,
  WorkFrontmatter,
  WorkKind,
  WorkSlug,
  WorkStatus,
} from "./schema"
