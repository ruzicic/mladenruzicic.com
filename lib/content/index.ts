import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import matter from "gray-matter"

import { COMPANIES, HERO_LOGOS } from "@/content/companies"
import { HOME } from "@/content/pages/home"
import { MENTORING } from "@/content/pages/mentoring"
import { NOT_FOUND } from "@/content/pages/not-found"
import { WORK_PAGE } from "@/content/pages/work"
import { PEOPLE } from "@/content/people"
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
  type NotFound,
  type PageEntry,
  type Person,
  type Site,
  type Testimonial,
  type WorkEntry,
  type WorkPage,
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

/** 0–99 spelled out, so a headline never hardcodes a figure content owns. */
const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
]
const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
]

export function spellOut(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 99) return String(value)
  if (value < 20) return ONES[value]
  const tens = TENS[Math.floor(value / 10)]
  const ones = value % 10
  return ones === 0 ? tens : `${tens}-${ONES[ones]}`
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * Expands the page-header tokens documented on `pageFrontmatterSchema`:
 * `[years]` / `[Years]` from `SITE.yearsShipping`, `{updated}` from the page's
 * own date. Everything downstream — the page, the metadata, the mirrors — then
 * sees a finished string.
 */
function expandTokens(value: string, updated: string): string {
  const years = spellOut(SITE.yearsShipping)
  return value
    .replaceAll("[Years]", capitalise(years))
    .replaceAll("[years]", years)
    .replaceAll("{updated}", updated)
}

function loadPage(slug: PageEntry["slug"]): PageEntry {
  const source = join("content", "pages", `${slug}.mdx`)
  const raw = readFileSync(join(PAGES_DIR, `${slug}.mdx`), "utf8")
  const { data, content } = matter(raw)
  const frontmatter = parseOrThrow(pageFrontmatterSchema, data, source)
  return {
    ...frontmatter,
    h1: expandTokens(frontmatter.h1, frontmatter.updated),
    eyebrow: frontmatter.eyebrow.map((item) =>
      expandTokens(item, frontmatter.updated)
    ),
    slug,
    body: content.trim(),
  }
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

/** `/work` index copy. */
export function getWorkPage(): WorkPage {
  return WORK_PAGE
}

/** 404 copy. */
export function getNotFound(): NotFound {
  return NOT_FOUND
}

/** `/about` or `/uses`: frontmatter plus the raw MDX body. */
export function getPage(slug: PageEntry["slug"]): PageEntry {
  return PAGES[slug]
}

/**
 * `content/pages/about.mdx` ends with a `## Links` list. `/about` renders those
 * links as a designed block from `SITE.links` instead, so the narrative stops
 * just before that heading — and the markdown mirrors have to make the same cut
 * or they publish claims (an email address, for one) the HTML page does not.
 *
 * If the heading is ever removed from the MDX this is a no-op.
 */
export function aboutNarrative(body: string = getPage("about").body): string {
  const index = body.search(/^##\s+Links\s*$/m)
  return index === -1 ? body : body.slice(0, index).trimEnd()
}

/** The designed `/about` links block, resolved against `SITE.links`. */
export function getAboutLinks(): {
  label: string
  href: string
  note: string
}[] {
  return (getPage("about").links ?? []).map((link) => ({
    label: link.label,
    href: SITE.links[link.key],
    note: link.note,
  }))
}

/** Every work slug, for `generateStaticParams` and the sitemap. */
export function getWorkSlugs(): WorkSlug[] {
  return WORK.map((entry) => entry.slug)
}

/*
 * No type re-exports here on purpose. Types live in `./schema`, which is
 * filesystem-free and therefore importable from a client component; this
 * module is server-only. Re-exporting them would offer a second, worse path to
 * the same types — one that drags a `node:fs` import along behind it.
 */
