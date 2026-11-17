import {
  getAbout,
  getAsk,
  getBuiltList,
  getCompanies,
  getCv,
  getHome,
  getMentoring,
  getPeopleForCompany,
  getPress,
  getProduct,
  getProducts,
  getProjectLinks,
  getSite,
  getStories,
  getStory,
  getStripRest,
  getTestimonial,
  getTestimonialPile,
  getWorkBySlug,
  getWorkPage,
} from "@/lib/content"
import { dropPlaceholderLines } from "@/lib/content/placeholder"
import {
  columnStills,
  type Link,
  type Product,
  type RichText,
  type Story,
  type StoryItem,
  type StoryRole,
  type Testimonial,
  type WorkEntry,
} from "@/lib/content/schema"
import {
  API_CATALOG_URL,
  MCP_TOOL_NAMES,
  MCP_URL,
  SERVER_CARD_URL,
} from "@/lib/mcp/info"
import { CONTENT_SIGNAL } from "@/lib/seo/robots"
import { isTwinRoute, TWIN_ROUTES } from "@/lib/seo/twins"
import { DIAGRAMS } from "@/content/diagrams"

/**
 * Markdown twins of every public page, plus `/llms.txt`, `/llms-full.txt` and
 * the text the `/mcp` tools return. One renderer per page, all reading
 * `lib/content`, so a twin carries exactly the claims its HTML page does:
 *
 *   · `confidence: 'private'` metrics never appear; `needs-verification` ones
 *     are tagged `(unverified)`.
 *   · `limited` / `high` entries carry their confidentiality note.
 *   · A field whose whole value is a bracket placeholder ("[YEAR]") is left
 *     out, and `lines()` drops every sentence that holds one (the build
 *     already fails on them; this is the second line of defence).
 *   · Every link is absolute.
 */

export const MD_CONTENT_TYPE = "text/markdown; charset=utf-8"
export const TXT_CONTENT_TYPE = "text/plain; charset=utf-8"

/**
 * The headers every markdown and llms text response carries for agents:
 * `x-markdown-tokens`, the rough size an agent can budget for (a quarter of
 * the UTF-8 bytes, rounded up, as Cloudflare's Markdown for Agents counts
 * it), and `Content-Signal`, the same AI-use preferences as `robots.txt`.
 */
export function agentTextHeaders(body: string): Record<string, string> {
  const bytes = new TextEncoder().encode(body).byteLength
  return {
    "x-markdown-tokens": String(Math.ceil(bytes / 4)),
    "Content-Signal": CONTENT_SIGNAL,
  }
}

const site = getSite()

/**
 * The date anything without its own `updated` reports: the content's date
 * (`SITE.updated`), never the clock, so a rebuild never moves a `<lastmod>`.
 */
export const LAST_UPDATED = site.updated

/* -------------------------------------------------------------------------- */
/* Primitives                                                                 */
/* -------------------------------------------------------------------------- */

/** Absolute URL for a content href. `/` is the bare origin, like the canonical. */
export function absolute(href: string): string {
  if (/^(https?:|mailto:)/.test(href)) return href
  if (href === "/") return site.url
  if (href.startsWith("#")) return `${site.url}/${href}`
  return `${site.url}${href}`
}

/** Canonical URL for a path with a leading slash. */
export function canonical(path: string): string {
  return path === "/" ? site.url : `${site.url}${path}`
}

/** The markdown twin's URL for a page path (`/` has no segment: `/index.md`). */
function markdownUrl(path: string): string {
  return path === "/" ? `${site.url}/index.md` : `${site.url}${path}.md`
}

/** True when the whole value is one bracket placeholder, "[YEAR]". */
export function isPlaceholder(value: string): boolean {
  return /^\[[^\]]+\]$/.test(value.trim())
}

/**
 * A story body without the `##` sections whose only text is a placeholder
 * ("[STORY TO COME]"): an empty heading tells a reader nothing.
 */
function withoutPlaceholderSections(body: string): string {
  return body
    .split(/\n(?=## )/)
    .filter((section) => {
      const [, ...rest] = section.split("\n")
      const text = rest.join("\n").trim()
      return !section.startsWith("## ") || !isPlaceholder(text)
    })
    .join("\n")
    .trim()
}

function yamlString(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
}

function mdLink(text: string, href: string) {
  return `[${text}](${absolute(href)})`
}

/** A project's two links on `/` as markdown, "[Case study](…) · [Website](…)". */
function projectLinksLine(ref: string, name: string): string {
  const { caseStudy, website } = getProjectLinks(ref, name)
  return [caseStudy, website]
    .flatMap((l) => (l ? [mdLink(l.label, l.href)] : []))
    .join(" · ")
}

/**
 * Rich text as markdown: product names with a page become links, as in the
 * HTML. On the landing a popover's project links follow the name in
 * brackets ("TenderLift ([Case study](…) · [Website](…))"), its other link
 * (Mentoring's) is the name's.
 */
function richTextToMarkdown(text: RichText): string {
  return text
    .map((s) => {
      if (s.kind === "text") return s.text
      if (s.kind === "link") return mdLink(s.text, s.href)
      if (s.href) return mdLink(s.text, s.href)
      if (!s.popover) return s.text
      if (s.popover.link) return mdLink(s.text, s.popover.link.href)
      const links = projectLinksLine(s.ref, s.text)
      return links ? `${s.text} (${links})` : s.text
    })
    .join("")
}

function linkLine(link: Pick<Link, "label" | "href">) {
  return `- ${mdLink(link.label, link.href)}`
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

function periodPart(value: string) {
  if (value === "now") return "now"
  const [year, month] = value.split("-")
  return month ? `${MONTHS[Number(month) - 1] ?? month} ${year}` : year
}

/** "September 2025 to now", or `undefined` where the year is a stand-in. */
export function period(entry: WorkEntry): string | undefined {
  const from = periodPart(entry.period.from)
  const to = periodPart(String(entry.period.to))
  const range = from === to ? from : `${from} to ${to}`
  return entry.period.approx ? `${range} (approximate)` : range
}

const CONFIDENTIALITY_NOTE: Record<string, string> = {
  limited:
    "Public surfaces only. Employed work: role, domain and the shape of the contribution are described; private metrics, internal screenshots and system details are omitted.",
  high: "Public surfaces only. Sensitive work: the description is deliberately generic. No screenshots, no system details, no non-public company claims.",
}

/* -------------------------------------------------------------------------- */
/* Documents                                                                  */
/* -------------------------------------------------------------------------- */

export interface MarkdownDoc {
  title: string
  description: string
  /** Path with a leading slash. */
  path: string
  /** `YYYY-MM-DD`. */
  updated: string
  /** Everything under the front matter, starting with the `# title`. */
  body: string
}

/** Who "I" is on a first-person page. */
function byline(): string {
  return `By [${site.name}](${site.url}).`
}

/** A twin as served: YAML front matter, then the body. */
export function renderDoc(doc: MarkdownDoc): string {
  return [
    "---",
    `title: ${yamlString(doc.title)}`,
    `description: ${yamlString(doc.description)}`,
    `canonical: ${yamlString(canonical(doc.path))}`,
    `last_modified: ${yamlString(doc.updated)}`,
    `author: ${yamlString(site.name)}`,
    `language: "en"`,
    "---",
    "",
    doc.body,
  ].join("\n")
}

/** A twin inlined into `/llms-full.txt`: no YAML, a source line instead. */
function inlineDoc(doc: MarkdownDoc): string {
  return [
    `<!-- ${canonical(doc.path)} · updated ${doc.updated} -->`,
    "",
    doc.body,
  ].join("\n")
}

type Part = string | false | undefined | Part[]

/** Join lines, flattening nested arrays and dropping `false` / `undefined`. */
function lines(...parts: Part[]): string {
  const out: string[] = []
  const walk = (p: Part) => {
    if (Array.isArray(p)) p.forEach(walk)
    else if (typeof p === "string") out.push(p)
  }
  parts.forEach(walk)
  return dropPlaceholderLines(out.join("\n"))
}

/* -------------------------------------------------------------------------- */
/* Shared blocks                                                              */
/* -------------------------------------------------------------------------- */

/** Status word for a list row, e.g. "Running", or the year label for a job. */
function rowLine(ref: string, name: string, year?: string, what?: string) {
  const product = getProduct(ref)
  const parts: string[] = []
  const label = product?.url ? `[${name}](${product.url})` : name
  parts.push(`**${label}**`)
  if (year) parts.push(` (${year})`)
  if (what) parts.push(`: ${what}`)
  if (product?.story)
    parts.push(` Case study: ${canonical(`/work/${product.story}`)}`)
  return `- ${parts.join("")}`
}

/** The landing list: one section per group, one line per row. */
export function builtListMarkdown(level = 3): string {
  const list = getBuiltList()
  const h = "#".repeat(level)
  const out: string[] = []
  for (const group of list.groups) {
    const label = group.label.charAt(0) + group.label.slice(1).toLowerCase()
    out.push(`${h} ${label}`, "")
    for (const row of group.rows)
      out.push(rowLine(row.ref, row.name, row.year, row.what))
    out.push("")
  }
  return out.join("\n")
}

/** The ways to reach him, as a list. */
export function contactMarkdown(): string {
  return lines(
    `- [Book a call](${site.links.booking})`,
    `- [Email](mailto:${site.links.email}): ${site.links.email}`,
    `- [X](${site.links.x})`,
    `- [LinkedIn](${site.links.linkedin})`,
    `- [GitHub](${site.links.github})`,
    `- [MentorCruise](${site.links.mentorcruise})`,
    `- [Press kit](${canonical("/press")}): bio, headshot, facts`
  )
}

function quote(t: Testimonial) {
  return lines(
    t.quote
      .split("\n")
      .map((l) => `> ${l}`)
      .join("\n"),
    ">",
    `> ${t.author}${t.source === "direct" ? "" : `, via ${sourceName(t.source)}`}${tenure(t)}`
  )
}

/** " (mentee for 2 years, 2024)", from the testimonial's optional fields. */
function tenure(t: Testimonial) {
  const parts = [
    t.duration ? `mentee for ${t.duration}` : undefined,
    t.year ? String(t.year) : undefined,
  ].filter(Boolean)
  return parts.length > 0 ? ` (${parts.join(", ")})` : ""
}

function sourceName(source: Testimonial["source"]) {
  return source === "mentorcruise" ? "MentorCruise" : "LinkedIn"
}

/* -------------------------------------------------------------------------- */
/* /                                                                          */
/* -------------------------------------------------------------------------- */

function homeDoc(): MarkdownDoc {
  const home = getHome()
  const testimonial = getTestimonial(home.mentoring.testimonial)
  return {
    title: home.seo.title,
    description: home.seo.description,
    path: "/",
    updated: LAST_UPDATED,
    body: lines(
      `# ${site.name}`,
      "",
      `> ${site.line}`,
      "",
      home.headline.srText,
      "",
      home.headline.onSrText,
      "",
      home.stance,
      "",
      home.paragraphs.flatMap((p) => [richTextToMarkdown(p), ""]),
      `## ${home.recentWork.title}`,
      "",
      home.recentWork.cards.map((card) => {
        if (card.kind === "more")
          return `- ${mdLink(card.title, card.link.href)}: ${card.body.replace("{n}", String(getStripRest().length))}`
        const pill = card.pill
          ? ` (${card.pill.charAt(0) + card.pill.slice(1).toLowerCase()})`
          : ""
        const links = projectLinksLine(card.ref, card.title)
        const line = `- **${card.title}**${pill}: ${card.caption}${links ? ` ${links}` : ""}`
        // A clip is described by its alt; the file itself is not linked.
        const clip = card.media?.clip
        return clip ? [line, `  - Clip: ${clip.alt}`] : line
      }),
      "",
      `## ${home.list.title}`,
      "",
      builtListMarkdown(3),
      `## ${home.howIWork.title}`,
      "",
      home.howIWork.steps.map((s, i) => `${i + 1}. **${s.title}**: ${s.body}`),
      "",
      `## ${home.mentoring.title}`,
      "",
      home.mentoring.body,
      "",
      testimonial ? [quote(testimonial), ""] : undefined,
      linkLine(home.mentoring.link),
      "",
      "## Contact",
      "",
      site.footer.ask,
      "",
      richTextToMarkdown(site.footer.contact),
      "",
      contactMarkdown(),
      ""
    ),
  }
}

/* -------------------------------------------------------------------------- */
/* /work                                                                      */
/* -------------------------------------------------------------------------- */

function workIndexDoc(): MarkdownDoc {
  const copy = getWorkPage()
  return {
    title: copy.seo.title,
    description: copy.seo.description,
    path: "/work",
    updated: LAST_UPDATED,
    body: lines(
      `# ${copy.title}`,
      "",
      byline(),
      "",
      copy.intro,
      "",
      builtListMarkdown(2),
      "## Case studies",
      "",
      getStories().map(
        (s) => `- [${s.title}](${canonical(`/work/${s.slug}`)}): ${s.line}`
      ),
      ""
    ),
  }
}

/* -------------------------------------------------------------------------- */
/* /work/<slug>: the nine stories                                            */
/* -------------------------------------------------------------------------- */

/** The registry entry a story is about (`tenderlift`, or `evo-touch` for ZF). */
function storyProduct(entry: WorkEntry): Product | undefined {
  return (
    getProduct(entry.slug) ?? getProducts().find((p) => p.story === entry.slug)
  )
}

/**
 * A diagram's caption and text alternative, for the mirror. The page takes
 * them from `diagramText` (`app/components/diagram`); that module is JSX, which
 * plain Node cannot load for the Ask context build, so the mirror reads the
 * same data from `content/diagrams` directly.
 */
function diagramWords(id: string): { caption?: string; alt?: string } {
  const d = DIAGRAMS.get(id) as { caption?: unknown; alt?: unknown } | undefined
  const str = (v: unknown) =>
    typeof v === "string"
      ? v
      : Array.isArray(v)
        ? v.map((x) => (typeof x === "string" ? x : (x?.text ?? ""))).join("")
        : undefined
  return { caption: str(d?.caption), alt: str(d?.alt) }
}

/** One square of the column, as a list line. */
function columnLine(item: StoryItem): string | undefined {
  switch (item.kind) {
    case "image":
      return `- ${item.caption} (Picture: ${item.alt})${item.credit ? ` ${item.credit}` : ""}`
    case "clip":
      return `- ${item.caption} (Clip: ${item.alt})${item.credit ? ` ${item.credit}` : ""}`
    case "diagram": {
      const { caption, alt } = diagramWords(item.id)
      const head = caption ?? item.short
      if (!head && !alt) return undefined
      return `- ${head ?? "Diagram"}${alt ? ` (Diagram: ${alt})` : ""}`
    }
  }
}

/** A story's roles (`panel.timeline`), one heading each, oldest first. */
function rolesMarkdown(roles: StoryRole[]): string[] {
  return [
    "### Roles",
    "",
    ...roles.flatMap((r) => [
      `#### ${r.title}${r.current ? " (now)" : ""}`,
      "",
      r.dates,
      "",
      ...r.blocks.flatMap((b) => [`**${b.label}.** ${b.text}`, ""]),
    ]),
  ]
}

/**
 * What the case-study page itself shows: the panel (summary, the meta line,
 * the numbers, the paragraphs or the roles, the links) and one line per
 * square, with each picture's and diagram's text alternative.
 */
function storyPageMarkdown(entry: Story): (string | undefined)[] {
  const { panel, column } = entry
  const squares = column.map(columnLine).filter((l): l is string => !!l)
  return [
    "## On the page",
    "",
    panel.summary,
    "",
    panel.meta.join(" · "),
    "",
    panel.numbers?.length
      ? [
          panel.numbers.map((n) => `- **${n.value}** ${n.lines.join(" ")}`),
          "",
          ...(panel.numbersAsOf ? [panel.numbersAsOf, ""] : []),
        ].flat()
      : undefined,
    ...(panel.paragraphs ?? []).flatMap((p) => [p, ""]),
    ...(panel.timeline ? rolesMarkdown(panel.timeline) : []),
    panel.links
      ? [
          `${panel.links.heading}:`,
          "",
          panel.links.items.map(
            (l) => `- [${l.title}](${l.href})${l.place ? `, ${l.place}` : ""}`
          ),
          "",
        ].flat()
      : undefined,
    squares.length > 0 ? ["### The pictures", "", ...squares, ""] : undefined,
  ].flat()
}

export function storyDoc(slug: string): MarkdownDoc | undefined {
  const entry = getStory(slug)
  if (!entry) return undefined

  const company = entry.company
    ? getCompanies().find((c) => c.id === entry.company)
    : undefined
  const product = storyProduct(entry)
  const metrics = (entry.metrics ?? []).filter(
    (m) => m.confidence !== "private"
  )
  const alongside = getPeopleForCompany(entry.company)
  const others = getStories().filter((s) => s.slug !== entry.slug)
  const images = columnStills(entry.column)

  const facts = [
    ["Status", product?.status],
    ["When", period(entry)],
    ["Role", entry.role],
    ["Company", company?.name],
    ["Website", entry.url],
  ].filter((pair): pair is [string, string] => Boolean(pair[1]))

  return {
    title: entry.seo.title ?? entry.title,
    description: entry.seo.description,
    path: `/work/${entry.slug}`,
    updated: entry.updated ?? LAST_UPDATED,
    body: lines(
      `# ${entry.title}`,
      "",
      `> ${entry.line}`,
      "",
      `By [${site.name}](${site.url}). ${entry.detail}`,
      "",
      facts.map(([k, v]) => `- **${k}**: ${v}`),
      "",
      entry.confidentiality !== "public"
        ? [`_${CONFIDENTIALITY_NOTE[entry.confidentiality]}_`, ""]
        : undefined,
      metrics.length > 0
        ? [
            "## In numbers",
            "",
            metrics.map(
              (m) =>
                `- ${m.value}: ${m.label}${m.confidence === "needs-verification" ? " (unverified)" : ""}`
            ),
            "",
          ]
        : undefined,
      withoutPlaceholderSections(entry.body),
      "",
      storyPageMarkdown(entry),
      images.length > 0
        ? [
            "## Images",
            "",
            images.map((s) => `![${s.alt}](${absolute(s.src)})`),
            "",
          ]
        : undefined,
      entry.links?.length
        ? [
            "## Links",
            "",
            entry.links.map((l) => `- [${l.label}](${l.url})`),
            "",
          ]
        : undefined,
      alongside.length > 0
        ? [
            "## Worked alongside",
            "",
            alongside.map(
              (p) =>
                `- **${p.name}**: ${p.why}${p.linkedin ? ` (${p.linkedin})` : ""}`
            ),
            "",
          ]
        : undefined,
      "## More case studies",
      "",
      others.map(
        (s) => `- [${s.title}](${canonical(`/work/${s.slug}`)}): ${s.line}`
      ),
      `- [Work he has put real time into](${canonical("/work")})`,
      ""
    ),
  }
}

/* -------------------------------------------------------------------------- */
/* /mentoring                                                                 */
/* -------------------------------------------------------------------------- */

export function mentoringDoc(): MarkdownDoc {
  const copy = getMentoring()
  return {
    title: copy.seo.title,
    description: copy.seo.description,
    path: "/mentoring",
    updated: LAST_UPDATED,
    body: lines(
      `# ${copy.title}`,
      "",
      byline(),
      "",
      richTextToMarkdown(copy.intro),
      "",
      copy.numbers.map(
        (f) =>
          `- **${f.value}** ${f.href ? `[${f.label}](${absolute(f.href)})` : f.label}`
      ),
      "",
      `## ${copy.fit.title}`,
      "",
      copy.fit.items.map((item) => `- ${item}`),
      "",
      `## ${copy.notFit.title}`,
      "",
      copy.notFit.items.map((item) => `- ${item}`),
      "",
      `## ${copy.how.title}`,
      "",
      copy.how.steps.map((s, i) => `${i + 1}. ${s.text}`),
      "",
      `## ${copy.said.title}`,
      "",
      copy.said.body,
      "",
      getTestimonialPile().flatMap((t) => [quote(t), ""]),
      "## Get in touch",
      "",
      copy.cta.line,
      "",
      linkLine(copy.cta.action),
      "",
      richTextToMarkdown(copy.cta.alt),
      ""
    ),
  }
}

/* -------------------------------------------------------------------------- */
/* /about                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The About postscript as plain text: the sentence and the champions, not
 * the button or its effect.
 */
function postscriptMarkdown(ps: ReturnType<typeof getAbout>["postscript"]) {
  if (!ps?.enabled) return undefined
  return [
    `${ps.lead} ${ps.before} ${ps.game.name} ${ps.after}`,
    "",
    `Favourite champions: ${ps.champions.map((c) => c.name).join(" and ")}.`,
    "",
  ]
}

export function aboutDoc(): MarkdownDoc {
  const about = getAbout()
  return {
    title: about.seo.title,
    description: about.seo.description,
    path: "/about",
    updated: LAST_UPDATED,
    body: lines(
      `# ${about.seo.title} ${site.name}`,
      "",
      `${about.title} ${byline()}`,
      "",
      // The story, with the early projects as a short list where the page
      // has their carousel (`early.after`), no heading of their own.
      about.paragraphs.flatMap((p, i) => [
        ...(i === about.early.after
          ? [...about.early.frames.map((f) => `- ${f.caption}: ${f.text}`), ""]
          : []),
        richTextToMarkdown(p),
        "",
      ]),
      `## ${about.cv.title}`,
      "",
      about.cv.rows.map(
        (row) =>
          `- **${getProduct(row.ref)?.name ?? row.ref}**, ${row.role} (${row.year}): ${row.text}`
      ),
      "",
      `[${about.cv.download.label}](${absolute(about.cv.download.href)})`,
      "",
      postscriptMarkdown(about.postscript),
      "## Contact",
      "",
      // The page's contact line is the site-wide footer's (15 Nov 2026).
      richTextToMarkdown(site.footer.contact),
      ""
    ),
  }
}

/* -------------------------------------------------------------------------- */
/* /cv                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The CV as the page has it (and the PDF made from it): the contact line,
 * the summary, then each section, a title line with its dates as a heading.
 */
export function cvDoc(): MarkdownDoc {
  const cv = getCv()
  const entry = (i: (typeof cv.projects.items)[number]) => [
    `### ${[i.name, i.role, mdLink(i.domain, i.href)].filter(Boolean).join(" · ")} · ${i.dates}`,
    "",
    i.text,
    "",
  ]
  return {
    title: cv.seo.title,
    description: cv.seo.description,
    path: "/cv",
    updated: LAST_UPDATED,
    body: lines(
      `# ${cv.seo.title}: ${cv.name}`,
      "",
      cv.headline.role,
      cv.headline.location,
      "",
      cv.contact.map((c) => mdLink(c.text, c.href)).join(" · "),
      "",
      cv.summary.flatMap((p) => [p, ""]),
      `PDF: ${mdLink(cv.download.label, cv.download.href)}`,
      "",
      `## ${cv.experience.title}`,
      "",
      cv.experience.jobs.flatMap((job) => [
        `### ${[job.company, job.role, job.dates].filter(Boolean).join(" · ")}`,
        "",
        ...(job.line ? [job.line, ""] : []),
        ...(job.bullets ? [...job.bullets.map((b) => `- ${b}`), ""] : []),
        ...(job.roles ?? []).flatMap((r) => [
          `#### ${r.title} · ${r.dates}`,
          "",
          ...r.bullets.map((b) => `- ${b}`),
          "",
        ]),
      ]),
      `## ${cv.projects.title}`,
      "",
      cv.projects.items.flatMap(entry),
      `## ${cv.mentoring.title}`,
      "",
      cv.mentoring.items.flatMap(entry),
      `## ${cv.skills.title}`,
      "",
      cv.skills.items.join(" · "),
      ""
    ),
  }
}

/* -------------------------------------------------------------------------- */
/* /press                                                                     */
/* -------------------------------------------------------------------------- */

function pressDoc(): MarkdownDoc {
  const press = getPress()
  const facts = press.facts.items.filter((f) => !isPlaceholder(f.value))
  // "SHORT BIO · ENGLISH" -> "Short bio · English"
  const cased = (label: string) =>
    label
      .toLowerCase()
      .split(" · ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" · ")
  return {
    title: press.seo.title,
    description: press.seo.description,
    path: "/press",
    updated: LAST_UPDATED,
    body: lines(
      `# ${press.title}: ${site.name}`,
      "",
      `## ${cased(press.shortBio.label)}`,
      "",
      press.shortBio.text,
      "",
      press.longBio
        ? [`## ${cased(press.longBio.label)}`, "", press.longBio.text, ""]
        : undefined,
      `## ${cased(press.oneLiners.label)}`,
      "",
      press.oneLiners.items.map((item) => `- ${item}`),
      "",
      `## ${cased(press.facts.label)}`,
      "",
      facts.map((f) => `- **${cased(f.label)}**: ${f.value}`),
      "",
      `## ${cased(press.headshot.label)}`,
      "",
      `![${press.headshot.image.alt}](${absolute(press.headshot.download.href)})`,
      "",
      press.headshot.variants.map((v) => `- ${absolute(v)}`),
      "",
      "## Contact",
      "",
      contactMarkdown(),
      ""
    ),
  }
}

/* -------------------------------------------------------------------------- */
/* Routing                                                                    */
/* -------------------------------------------------------------------------- */

/** Every twin, as `/md/<route>` segments (`index` is `/`): `lib/seo/twins.ts`. */
export function markdownRoutes(): string[] {
  return [...TWIN_ROUTES]
}

/** The twin for a `/md/<route>`, or `undefined` for anything else. */
export function markdownDoc(route: string): MarkdownDoc | undefined {
  if (!isTwinRoute(route)) return undefined
  if (route === "index") return homeDoc()
  if (route === "work") return workIndexDoc()
  if (route === "mentoring") return mentoringDoc()
  if (route === "about") return aboutDoc()
  if (route === "cv") return cvDoc()
  if (route === "press") return pressDoc()
  if (route.startsWith("work/")) return storyDoc(route.slice("work/".length))
  return undefined
}

/* -------------------------------------------------------------------------- */
/* Identity lines shared by llms.txt, the MCP server and JSON-LD              */
/* -------------------------------------------------------------------------- */

/**
 * Who he is, in two sentences, with no employer in it: the first sentence of
 * the press page's short bio (which already names where he lives) and the year
 * he built his first websites, from `content/site.ts`. (The press
 * page's `seo.description` describes the page, not him.)
 */
export function identity(): string {
  const first = getPress().shortBio.text.split(/(?<=\.) /)[0]
  return `${first} He has been building websites since ${site.buildingSince}.`
}

/** His own products, businesses and experiments, in registry order. */
export function ownProducts(): Product[] {
  return getProducts().filter((p) =>
    ["product", "business", "experiment"].includes(p.kind)
  )
}

/** "Running · 2025 to now": a product's status word and year label, as known. */
export function productStatusLine(slug: string): string | undefined {
  const p = getProduct(slug)
  if (!p) return undefined
  return [p.status, p.year].filter(Boolean).join(" · ") || undefined
}

/** "Serbian, English and Italian". */
function listJoin(items: string[]): string {
  return items.length < 2
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
}

/**
 * The registry line, or the work entry's line where the board has none,
 * without its first-person sentences ("I own the product."), which read
 * wrongly in third-person machine text.
 */
export function productDescription(p: Product): string | undefined {
  const text = p.description ?? getWorkBySlug(p.slug)?.line
  if (!text) return undefined
  const kept = `${text.replace(/\.$/, "")}.`
    .split(/(?<=\.)\s+/)
    .filter((sentence) => !/^(I|I'm|I’m|My)\b/.test(sentence))
    .join(" ")
  return kept || undefined
}

/**
 * One product as a list item. `story: false` leaves out the link to its case
 * study, for a list that already has a section of case studies (`/llms.txt`);
 * where it is kept it is a link, never a bare URL.
 */
function productLine(p: Product, { story = true }: { story?: boolean } = {}) {
  const href = p.url ?? (p.story ? canonical(`/work/${p.story}`) : undefined)
  const name = href ? `[${p.name}](${href})` : p.name
  const parts = [
    productDescription(p),
    p.status ? `Status: ${p.status}.` : undefined,
    story && p.story
      ? `[Story](${markdownUrl(`/work/${p.story}`)})`
      : undefined,
  ].filter(Boolean)
  return `- ${name}${parts.length ? `: ${parts.join(" ")}` : ""}`
}

/** The six prepared Ask answers, as plain Q and A. The bio answer is the bio. */
function askMarkdown(level = 3): string {
  const h = "#".repeat(level)
  return getAsk()
    .questions.flatMap((q) => [
      `${h} ${q.question}`,
      "",
      q.card.kind === "bio" ? getPress().shortBio.text : q.answer,
      "",
    ])
    .join("\n")
}

/* -------------------------------------------------------------------------- */
/* /llms.txt                                                                  */
/* -------------------------------------------------------------------------- */

export function llmsTxt(): string {
  const mentoring = getMentoring()
  const live = ownProducts().filter((p) => p.status !== "Retired")
  return lines(
    `# ${site.name}`,
    "",
    `> ${identity()}`,
    "",
    `${site.name} (also written ${site.name.normalize("NFD").replace(/\p{Diacritic}/gu, "")}) works on product and technology. He works in ${listJoin(site.languages)}. Everything below comes from ${site.url}; each page is also available as markdown at the same path with \`.md\` appended, or by sending \`Accept: text/markdown\`.`,
    "",
    "## Pages",
    "",
    `- [Home](${markdownUrl("/")}): ${getHome().seo.description}`,
    `- [All work](${markdownUrl("/work")}): ${getWorkPage().seo.description}`,
    `- [About](${markdownUrl("/about")}): ${getAbout().seo.description}`,
    `- [CV](${markdownUrl("/cv")}): his CV: experience, projects, mentoring and skills. Also [as a PDF](${absolute(getCv().download.href)})`,
    `- [Mentoring](${markdownUrl("/mentoring")}): ${mentoring.title}`,
    `- [Press](${markdownUrl("/press")}): Short bio, one-liners, facts and headshot, ready to copy.`,
    "",
    "## Products",
    "",
    live.map((p) => productLine(p, { story: false })),
    "",
    "## Case studies",
    "",
    getStories().map(
      (s) => `- [${s.title}](${markdownUrl(`/work/${s.slug}`)}): ${s.line}`
    ),
    "",
    "## Mentoring",
    "",
    `- [Mentoring](${markdownUrl("/mentoring")}): ${mentoring.seo.description}`,
    `- [MentorCruise profile](${site.links.mentorcruise})`,
    "",
    "## Contact",
    "",
    contactMarkdown(),
    "",
    "## Machine access",
    "",
    `- [MCP server](${MCP_URL}): read-only Model Context Protocol endpoint (Streamable HTTP, stateless, no auth). Tools: ${MCP_TOOL_NAMES.join(", ")}.`,
    `- [MCP server card](${SERVER_CARD_URL}): the MCP server's name, version, transport and tools, as JSON.`,
    `- [API catalog](${API_CATALOG_URL}): the same server listed per RFC 9727 (linkset JSON).`,
    `- [Sitemap](${site.url}/sitemap.xml)`,
    "",
    "## Optional",
    "",
    `- [Full text](${site.url}/llms-full.txt): every page inlined, the prepared answers to common questions, and the work he has put real time into, with its status.`,
    "",
    `Canonical pages are the URLs above without \`.md\` (the home page is ${site.url}). Last updated ${LAST_UPDATED}.`,
    ""
  )
}

/* -------------------------------------------------------------------------- */
/* /llms-full.txt                                                             */
/* -------------------------------------------------------------------------- */

export function llmsFullTxt(): string {
  const stories = getStories()
    .map((s) => storyDoc(s.slug))
    .filter((d): d is MarkdownDoc => Boolean(d))
  return lines(
    `# ${site.name}: full text`,
    "",
    `> ${identity()}`,
    "",
    `Every public page of ${site.url}, inlined as markdown. Last updated ${LAST_UPDATED}.`,
    "",
    "## Common questions",
    "",
    "The questions visitors ask most, with the prepared answers the site gives.",
    "",
    askMarkdown(3),
    "## Work he has put real time into, with status",
    "",
    ownProducts().map((p) => productLine(p)),
    "",
    builtListMarkdown(3),
    "## Contact",
    "",
    contactMarkdown(),
    "",
    `- [MCP server](${MCP_URL}): read-only`,
    "",
    "---",
    "",
    [
      homeDoc(),
      aboutDoc(),
      cvDoc(),
      workIndexDoc(),
      ...stories,
      mentoringDoc(),
      pressDoc(),
    ]
      .map(inlineDoc)
      .join("\n---\n\n"),
    ""
  )
}
