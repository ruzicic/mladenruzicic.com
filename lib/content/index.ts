import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import matter from "gray-matter"

import { ASK } from "@/content/ask"
import { COMPANIES } from "@/content/companies"
import { MEDIA } from "@/content/media"
import { ABOUT } from "@/content/pages/about"
import { ERROR_PAGE } from "@/content/pages/error"
import { HOME } from "@/content/pages/home"
import { MENTORING } from "@/content/pages/mentoring"
import { NOT_FOUND } from "@/content/pages/not-found"
import { DAY_JOB_TEAM, OWN_PRODUCT_ROLE, PRESS } from "@/content/pages/press"
import { WORK_PAGE } from "@/content/pages/work"
import { PEOPLE } from "@/content/people"
import { PRODUCTS } from "@/content/products"
import { SITE } from "@/content/site"
import { TESTIMONIALS } from "@/content/testimonials"

import { brandOf, contrast, MIN_BRAND_CONTRAST, PAPER } from "./brand-color"
import { findPlaceholders } from "./placeholder"
import {
  errorPageSchema,
  parseOrThrow,
  PRODUCT_SLUGS,
  STORY_SLUGS,
  VIDEO_PATH,
  workFrontmatterSchema,
  type About,
  type Ask,
  type BuiltList,
  type Company,
  type Home,
  type ListRow,
  type MediaSlot,
  type Mentoring,
  type NotFound,
  type Person,
  type Press,
  type Product,
  type ProductMark,
  type ProjectLinks,
  type Site,
  type Story,
  type StoryItem,
  type StoryPanel,
  type StorySlug,
  type Testimonial,
  type WorkEntry,
  type WorkPage,
} from "./schema"
import { isLightTile, readTileArt } from "./tile-art"

/**
 * Content loaders. SERVER ONLY: this module reads the filesystem. Client
 * components import types and schemas from `@/lib/content/schema`.
 *
 * Everything is read synchronously at module init from `content/`, validated
 * with zod, cross-checked below, and memoised for the process, so no loader is
 * async and none of this interacts with Cache Components / `use cache`.
 *
 * A schema failure or a broken cross-reference throws with the file path,
 * which fails `next build`.
 */

const WORK_DIR = join(process.cwd(), "content", "work")
const PUBLIC_DIR = join(process.cwd(), "public")

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

  // Order does not matter: entries are found by slug, and the stories go
  // in `STORY_SLUGS` order.
  return entries
}

const WORK = loadWork()

/* -------------------------------------------------------------------------- */
/* Cross-references: everything zod cannot see from inside one file          */
/* -------------------------------------------------------------------------- */

function fail(source: string, message: string): never {
  throw new Error(`Invalid content in ${source}: ${message}`)
}

/**
 * A branded link's colour (a product's `brand`, a story link's `color`) must
 * show on the paper: below 1.6:1 the underline is invisible.
 */
function checkBrand(color: string, source: string, what: string) {
  const ratio = contrast(color, PAPER)
  if (ratio < MIN_BRAND_CONTRAST)
    fail(
      source,
      `${what}: brand colour ${color} has a contrast of ${ratio.toFixed(2)}:1 against the paper ${PAPER}, below ${MIN_BRAND_CONTRAST}:1, so its underline would not show.`
    )
}

function checkMedia(src: string | undefined, source: string) {
  if (src && !(src in MEDIA)) {
    fail(
      source,
      `"${src}" is not in content/media.ts (no dimensions, no blur placeholder).`
    )
  }
}

/**
 * A clip's files: the `.webm` (offered first) and the `.mp4` beside it, the
 * ones that exist under `public/`. Read once per path, at module init for
 * every clip in content.
 */
export interface VideoSource {
  src: string
  type: "video/webm" | "video/mp4"
}
const VIDEO_SOURCES = new Map<string, VideoSource[]>()

function videoSourcesOf(src: string): VideoSource[] {
  const cached = VIDEO_SOURCES.get(src)
  if (cached) return cached
  const base = src.replace(VIDEO_PATH, "")
  const sources = (
    [
      { src: `${base}.webm`, type: "video/webm" },
      { src: `${base}.mp4`, type: "video/mp4" },
    ] as const
  ).filter((s) => existsSync(join(process.cwd(), "public", s.src)))
  VIDEO_SOURCES.set(src, sources)
  return sources
}

/** A slot's media must exist: its picture, its clip and poster, its row. */
function checkSlot(slot: MediaSlot, source: string) {
  if (slot.mark) {
    // A third-party mark is an SVG drawn at a fixed width: no blur, no
    // entry in content/media.ts, but the file must be there.
    if (slot.src && !existsSync(join(process.cwd(), "public", slot.src)))
      fail(source, `mark "${slot.src}" is not under public/.`)
    return
  }
  if (slot.src && VIDEO_PATH.test(slot.src)) {
    if (videoSourcesOf(slot.src).length === 0)
      fail(source, `clip "${slot.src}" has no .webm or .mp4 under public/.`)
    checkMedia(slot.poster, source)
  } else {
    checkMedia(slot.src, source)
  }
  for (const still of slot.row ?? []) checkMedia(still.src, source)
}

/** A case-study page's files and references (`panel`, `column`). */
function checkStory(panel: StoryPanel, column: StoryItem[], source: string) {
  for (const link of panel.links?.items ?? [])
    if (!existsSync(join(PUBLIC_DIR, link.icon)))
      fail(source, `link icon "${link.icon}" is not under public/.`)
    else checkMedia(link.icon, source)
  for (const link of panel.links?.items ?? [])
    checkBrand(link.color, source, `link "${link.title}"`)
  for (const id of panel.people ?? [])
    if (!PEOPLE.some((p) => p.id === id))
      fail(source, `panel.people: "${id}" is not in content/people.ts.`)
  for (const item of column) {
    if (item.kind === "image") checkMedia(item.src, source)
    if (item.kind === "clip") {
      const files = videoSourcesOf(item.src).map((s) => s.type)
      if (files.length !== 2)
        fail(
          source,
          `clip "${item.src}" needs both a .webm and an .mp4 under public/.`
        )
      checkMedia(item.poster, source)
    }
  }
}

/**
 * Logo files the boards draw but no builder has written yet (requested from
 * ASSETS, see docs/v4-build/PLACEHOLDERS.md). Reported, not thrown, so one
 * missing tile does not block every page; the warning below names them.
 */
const MISSING_MARKS: string[] = []

/** The checked inner markup of every `art` tile, by product slug. */
const TILE_ART = new Map<string, string>()

function crossCheck() {
  // Products: every slug registered exactly once.
  const seen = new Set<string>()
  for (const p of PRODUCTS) {
    if (seen.has(p.slug))
      fail("content/products.ts", `duplicate slug "${p.slug}".`)
    seen.add(p.slug)
    checkBrand(brandOf(p), "content/products.ts", `"${p.slug}"`)
    if (p.mark.kind === "svg") {
      for (const src of [p.mark.src, p.mark.accent?.src]) {
        if (src && !existsSync(join(PUBLIC_DIR, src))) MISSING_MARKS.push(src)
      }
    }
    if (p.mark.kind === "art") {
      // Thrown, not reported: an art tile has nothing to draw without its file.
      const art = readTileArt(
        join(PUBLIC_DIR, p.mark.src),
        `${p.mark.src} (content/products.ts, "${p.slug}")`,
        p.bare
      )
      // `bg` is what the face, the share image and the list preview paint
      // under or around the artwork: it has to be the artwork's own ground.
      if (!p.bare && art.background !== p.bg.toUpperCase()) {
        fail(
          "content/products.ts",
          `"${p.slug}" has bg ${p.bg}, but ${p.mark.src} is drawn on ${art.background}.`
        )
      }
      TILE_ART.set(p.slug, art.body)
      if (p.mark.mono && !existsSync(join(PUBLIC_DIR, p.mark.mono)))
        MISSING_MARKS.push(p.mark.mono)
    }
  }
  for (const slug of PRODUCT_SLUGS) {
    if (!seen.has(slug)) fail("content/products.ts", `no entry for "${slug}".`)
  }

  // Stories: the nine, and only the nine, carry `story: true`, and each has
  // the case-study page's `panel` and `column`, with every file in place.
  for (const slug of STORY_SLUGS) {
    const source = `content/work/${slug}.mdx`
    const entry = WORK.find((w) => w.slug === slug)
    if (!entry) fail(source, "story file is missing.")
    if (!entry.story) fail(source, "expected `story: true`.")
    if (!entry.panel) fail(source, "a story needs a `panel`.")
    if (!entry.column) fail(source, "a story needs a `column`.")
    checkStory(entry.panel, entry.column, source)
  }
  for (const entry of WORK) {
    if (
      entry.story &&
      !(STORY_SLUGS as readonly string[]).includes(entry.slug)
    ) {
      fail(
        `content/work/${entry.slug}.mdx`,
        "`story: true` on an entry that is not one of the nine."
      )
    }
  }

  // Landing media and testimonial.
  const home = "content/pages/home.ts"
  for (const card of HOME.recentWork.cards) {
    if (card.kind !== "work") continue
    checkMedia(card.media?.desktop?.src, home)
    checkMedia(card.media?.tablet?.src, home)
    checkMedia(card.media?.phone?.src, home)
    const clip = card.media?.clip
    if (clip) {
      for (const take of clip.narrow ? [clip, clip.narrow] : [clip]) {
        for (const file of [take.webm, take.mp4])
          if (!existsSync(join(PUBLIC_DIR, file)))
            fail(home, `${card.ref}: clip file "${file}" is not under public/.`)
        checkMedia(take.poster, home)
        const poster = MEDIA[take.poster]
        if (
          Math.abs(poster.width / poster.height - take.width / take.height) >
          0.01
        )
          fail(
            home,
            `${card.ref}: the poster "${take.poster}" is ${poster.width}x${poster.height}, its clip ${take.width}x${take.height}; they must share one shape.`
          )
      }
    }
  }
  const rows = HOME.list.groups.flatMap((g) => g.rows)
  for (const row of rows) checkMedia(row.preview.image, home)
  // The board's rows plus Internxt (2026-11-12) and Villa Amada
  // (2026-11-16), less the hidden ones. The toggle names
  // the count, so the two have to move together.
  if (!new RegExp(`\\b${rows.length}$`).test(HOME.list.showAllLabel))
    fail(
      home,
      `the list has ${rows.length} rows, but its toggle says "${HOME.list.showAllLabel}".`
    )
  if (!TESTIMONIALS.some((t) => t.id === HOME.mentoring.testimonial)) {
    fail(home, `unknown testimonial "${HOME.mentoring.testimonial}".`)
  }

  // Ask, About, Press, Site media.
  for (const q of [...ASK.questions, ASK.fallback]) {
    if (q.card.kind === "product")
      checkMedia(q.card.image.src, "content/ask.ts")
    if (q.card.kind === "link" && q.card.visual.kind === "image") {
      checkMedia(q.card.visual.image.src, "content/ask.ts")
    }
  }
  checkMedia(ABOUT.headshot.src, "content/pages/about.ts")
  for (const frame of ABOUT.early.frames)
    checkSlot(frame, "content/pages/about.ts")
  // The postscript's files: the game's icon, the champions, the sound and
  // the optional cursor.
  const ps = ABOUT.postscript
  if (ps) {
    for (const file of [
      ps.game.icon,
      ps.sound,
      ...ps.champions.map((c) => c.src),
      ...(ps.cursor ? [ps.cursor.src] : []),
    ])
      if (!existsSync(join(PUBLIC_DIR, file)))
        fail(
          "content/pages/about.ts",
          `postscript file "${file}" is not under public/.`
        )
  }
  checkMedia(PRESS.headshot.image.src, "content/pages/press.ts")
  for (const v of PRESS.headshot.variants)
    checkMedia(v, "content/pages/press.ts")
  checkMedia(SITE.headshot.src, "content/site.ts")

  // Mentoring pile: every testimonial, each once.
  const pile = MENTORING.said.pile.map((c) => c.testimonial)
  for (const id of pile) {
    if (!TESTIMONIALS.some((t) => t.id === id)) {
      fail("content/pages/mentoring.ts", `unknown testimonial "${id}".`)
    }
  }
  if (new Set(pile).size !== TESTIMONIALS.length) {
    fail(
      "content/pages/mentoring.ts",
      "the pile must hold every testimonial exactly once."
    )
  }

  if (MISSING_MARKS.length > 0 && process.env.NODE_ENV !== "production") {
    console.warn(
      `[content] tile marks not on disk yet: ${MISSING_MARKS.join(", ")}`
    )
  }
}

/**
 * No bracket placeholder in anything that is served: the owner's open
 * questions live in docs/v4-build/PLACEHOLDERS.md, not in content. Story
 * front matter and diagrams are checked by their schemas; this covers the
 * story bodies and every string in the page, product, ask and site files.
 */
function checkNoPlaceholders() {
  const found: string[] = []
  const scan = (source: string, value: unknown) => {
    for (const hit of findPlaceholders(value))
      found.push(`${source}${hit.path ? ` (${hit.path})` : ""}: ${hit.text}`)
  }
  for (const entry of WORK)
    scan(`content/work/${entry.slug}.mdx body`, entry.body)
  scan("content/pages/home.ts", HOME)
  scan("content/pages/about.ts", ABOUT)
  scan("content/pages/mentoring.ts", MENTORING)
  scan("content/pages/press.ts", PRESS)
  scan("content/pages/work.ts", WORK_PAGE)
  scan("content/pages/not-found.ts", NOT_FOUND)
  scan("content/pages/error.ts", ERROR_PAGE)
  scan("content/products.ts", PRODUCTS)
  scan("content/ask.ts", ASK)
  scan("content/site.ts", SITE)
  if (found.length > 0)
    throw new Error(
      `Bracket placeholders in content (leave the fact out and list the question in docs/v4-build/PLACEHOLDERS.md):\n  ${found.join("\n  ")}`
    )
}

/**
 * Press repeats About, the home page and the case studies (owner, 16 Nov
 * 2026: "ensure PRESS page is always updated when changing about/work
 * pages!"). Its facts are derived in `content/pages/press.ts`; what is
 * still typed there is held against its source here, so a change on About
 * or a case study that Press does not follow fails the build.
 */
function checkPress() {
  const src = "content/pages/press.ts"
  const story = (slug: string) => WORK.find((w) => w.slug === slug)
  const name = (slug: string) =>
    PRODUCTS.find((p) => p.slug === slug)?.name ?? slug
  const tl = story("tenderlift")
  if (!tl?.role.startsWith(`${OWN_PRODUCT_ROLE}:`))
    fail(
      src,
      `OWN_PRODUCT_ROLE is "${OWN_PRODUCT_ROLE}", but content/work/tenderlift.mdx gives the role as "${tl?.role}".`
    )
  const job = ABOUT.cv.rows.find((r) => r.ref === "zf-scalar")
  if (!job) return fail(src, "ZF is not in the About CV.")
  if (!job.text.includes(DAY_JOB_TEAM))
    fail(
      src,
      `DAY_JOB_TEAM is "${DAY_JOB_TEAM}", but the About CV line for ZF reads "${job.text}".`
    )
  const zf = story("zf-scalar")
  if (!zf?.role.startsWith(`${job.role}, ${DAY_JOB_TEAM}`))
    fail(
      src,
      `the day job is "${job.role}, ${DAY_JOB_TEAM}", but content/work/zf-scalar.mdx gives the role as "${zf?.role}".`
    )

  // The short bio is prose, so it is held to the facts it states.
  const bio = PRESS.shortBio.text
  const studenti = PRODUCTS.find((p) => p.slug === "studenti-rs")
  const since = studenti?.year?.match(/\d{4}/)?.[0]
  const states = [
    SITE.name,
    SITE.location.label,
    `${job.role} at ${name("zf-scalar")}`,
    DAY_JOB_TEAM,
    name("tenderlift"),
    `${name("studenti-rs")}, online since ${since}`,
    name("shopify"),
    name("shop-minis"),
  ]
  for (const fact of states)
    if (!bio.includes(fact))
      fail(
        src,
        `the short bio no longer says "${fact}" (About, the CV or the products changed).`
      )
  // TenderLift is co-founded: the bio may call him a founder (Zarez,
  // FontAlternatives) but must not make him TenderLift's sole founder.
  const soleFounder =
    /(?<!co-)\bfound(?:er|ed)\b[^.]*\bTenderLift\b|\bTenderLift\b[^.]*(?<!co-)\bfound(?:er|ed)\b/i
  if (OWN_PRODUCT_ROLE !== "Founder" && soleFounder.test(bio))
    fail(
      src,
      `the short bio calls him TenderLift's founder; he is its ${OWN_PRODUCT_ROLE.toLowerCase()}.`
    )
  // Claims the owner removed on 16 Nov 2026.
  const press = JSON.stringify(PRESS)
  const dropped = press.match(/\b300\+|\blargest\b|\bbiggest\b/i)
  if (dropped)
    fail(src, `"${dropped[0]}" was removed from the site on 16 Nov 2026.`)
}

crossCheck()
checkPress()
checkNoPlaceholders()

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/** Site identity, location, links, newsletter line and footer meta. */
export function getSite(): Site {
  return SITE
}

/**
 * Every product, employer and project on the boards, in registry order,
 * without the ones marked `hidden` in `content/products.ts`.
 */
export function getProducts(): Product[] {
  return PRODUCTS.filter((p) => !p.hidden)
}

/**
 * One registry entry, or `undefined`. A `hidden` entry is unknown here too,
 * so no reader (pages, mirrors, `/mcp`, JSON-LD, Ask) can reach it by slug.
 */
export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug && !p.hidden)
}

/** "tenderlift.ch" from "https://www.tenderlift.ch/…". */
function domainOf(href: string): string {
  return new URL(href).hostname.replace(/^www\./, "")
}

/**
 * A project's links on `/` (owner, 13 Nov 2026): "Case study" when the
 * product has a `story`, "Website" when it has a `url`, nothing else. Every
 * surface of the landing (popovers, strip cards, list rows) reads this, so
 * `content/products.ts` alone decides where a project goes. `name` is the
 * project's name as that surface shows it ("ZF" for EVO Touch's card).
 */
export function getProjectLinks(ref: string, name: string): ProjectLinks {
  const product = getProduct(ref)
  const words = HOME.actions
  const fill = (t: string, domain = "") =>
    t.replaceAll("{name}", name).replaceAll("{domain}", domain)
  const links: ProjectLinks = {}
  if (product?.story)
    links.caseStudy = {
      href: `/work/${product.story}`,
      label: words.caseStudy,
      name: fill(words.caseStudyName),
      rowName: fill(words.rowCaseStudyName),
    }
  if (product?.url) {
    const domain = domainOf(product.url)
    links.website = {
      href: product.url,
      label: words.website,
      name: fill(words.websiteName, domain),
      rowName: fill(words.rowWebsiteName, domain),
      domain,
    }
  }
  return links
}

/** The tile for one entry, in the exact shape `ProductTile` takes. */
export function getProductMark(slug: string): ProductMark | undefined {
  const p = getProduct(slug)
  if (!p) return undefined
  const mark: ProductMark["mark"] =
    p.mark.kind === "art"
      ? {
          ...p.mark,
          body: TILE_ART.get(p.slug)!,
          light: isLightTile(p.bg),
          bare: p.bare,
        }
      : p.mark
  return {
    slug: p.slug,
    name: p.name,
    bg: p.bg,
    fg: p.fg,
    brand: brandOf(p),
    mark,
  }
}

/** A clip's `<source>` files, `.webm` first (a story's `clip` squares). */
export function getVideoSources(src: string): VideoSource[] {
  return videoSourcesOf(src)
}

/** Width, height and blur placeholder for a public image path (`content/media.ts`). */
export function getMedia(
  src: string
): { width: number; height: number; blurDataURL: string } | undefined {
  return MEDIA[src]
}

/** `/` copy and data. */
export function getHome(): Home {
  return HOME
}

/** The landing list ("Stuff I've put real time into"), also `/work`. */
export function getBuiltList(): BuiltList {
  return HOME.list
}

/**
 * The `/work` entries that have no card in "Recent work", in list order: what
 * the strip's end card counts (`{n}` in its body) and shows as tile credits.
 * A card covers a row when it is that row's product or its product's story
 * is that row's (EVO Touch covers ZF, Shop Minis covers Shopify).
 */
export function getStripRest(): ListRow[] {
  const covered = new Set(
    HOME.recentWork.cards.flatMap((card) => {
      if (card.kind !== "work") return []
      const story = getProduct(card.ref)?.story
      return story ? [card.ref, story] : [card.ref]
    })
  )
  return HOME.list.groups
    .flatMap((g) => g.rows)
    .filter((row) => !covered.has(row.ref))
}

/** Ask: the six prepared questions, their answers, and the fallback. */
export function getAsk(): Ask {
  return ASK
}

/** `/mentoring` copy. */
export function getMentoring(): Mentoring {
  return MENTORING
}

/** `/about` copy. */
export function getAbout(): About {
  return ABOUT
}

/** `/press` copy, including the press menu on his name. */
export function getPress(): Press {
  return PRESS
}

/** `/work` index copy. */
export function getWorkPage(): WorkPage {
  return WORK_PAGE
}

/** 404 copy. */
export function getNotFound(): NotFound {
  return NOT_FOUND
}

// `content/pages/error.ts` is a plain object (the error boundary is a client
// component that imports it directly); validate it here so a bad edit still
// fails the build.
parseOrThrow(errorPageSchema, ERROR_PAGE, "content/pages/error.ts")

/** One work entry, or `undefined` if the slug does not exist. */
export function getWorkBySlug(slug: string): WorkEntry | undefined {
  return WORK.find((entry) => entry.slug === slug)
}

/** The nine `/work/<slug>` stories, in `STORY_SLUGS` order. */
export function getStories(): Story[] {
  return STORY_SLUGS.map(
    (slug) => WORK.find((entry) => entry.slug === slug) as Story
  )
}

/** One story, or `undefined` if the slug is not one of the nine. */
export function getStory(slug: string): Story | undefined {
  return (STORY_SLUGS as readonly string[]).includes(slug)
    ? (WORK.find((entry) => entry.slug === slug) as Story)
    : undefined
}

/** Is this slug one of the nine stories? */
export function isStorySlug(slug: string): slug is StorySlug {
  return (STORY_SLUGS as readonly string[]).includes(slug)
}

/** The employers in `content/companies.ts`, newest first. */
export function getCompanies(): Company[] {
  return [...COMPANIES].sort((a, b) => b.from - a.from)
}

/** Company by id. */
function getCompany(id: string): Company | undefined {
  return COMPANIES.find((company) => company.id === id)
}

/**
 * The people attached to one company band, in the order that band lists them.
 * Unknown ids yield an empty list, the signal to render no section at all.
 */
export function getPeopleForCompany(id: string | undefined): Person[] {
  if (!id) return []
  const company = getCompany(id)
  if (!company) return []
  const people: Person[] = PEOPLE
  return company.people
    .map((personId) => people.find((person) => person.id === personId))
    .filter((person): person is Person => Boolean(person))
}

/** People by id, in the order given (`panel.people` on a story). */
export function getPeopleById(ids: readonly string[]): Person[] {
  const people: Person[] = PEOPLE
  return ids
    .map((id) => people.find((person) => person.id === id))
    .filter((person): person is Person => Boolean(person))
}

/** One testimonial by id. */
export function getTestimonial(id: string): Testimonial | undefined {
  return TESTIMONIALS.find((t) => t.id === id)
}

/** The mentoring page's pile, resolved: testimonial plus the card's tone and tilt. */
export function getTestimonialPile(): (Testimonial & {
  tone: string
  rot: number
  rest: number
})[] {
  return MENTORING.said.pile.map((card) => ({
    ...TESTIMONIALS.find((t) => t.id === card.testimonial)!,
    tone: card.tone,
    rot: card.rot,
    rest: card.rest,
  }))
}

/*
 * No type re-exports here on purpose. Types live in `./schema`, which is
 * filesystem-free and therefore importable from a client component; this
 * module is server-only.
 */
