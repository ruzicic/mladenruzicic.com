import {
  aboutNarrative,
  getAboutLinks,
  getCompanies,
  getHome,
  getMentoring,
  getPage,
  getSite,
  getTestimonials,
  getWork,
  getWorkBySlug,
  getWorkPage,
} from "./index"
import type { WorkEntry } from "./schema"

/**
 * Markdown renderers shared by `/md/*`, `/llms.txt` and `/llms-full.txt`, so the
 * mirrors always carry exactly the claims the HTML does — no more, no less.
 *
 * Rules enforced here (docs/v3-content-contract.md, fable pack §06):
 *   · `confidence: 'private'` metrics NEVER appear, in any mirror.
 *   · `confidence: 'needs-verification'` metrics are tagged `(unverified)`.
 *   · `limited` / `high` entries carry the confidentiality note, so a model
 *     quoting the page knows the description is bounded.
 *   · Every document opens with a frontmatter header: title, description,
 *     canonical URL, last-updated.
 */

export const MD_CONTENT_TYPE = "text/markdown; charset=utf-8"
export const TXT_CONTENT_TYPE = "text/plain; charset=utf-8"

/**
 * The date the mirrors and the sitemap report, for anything the content model
 * does not stamp itself (case studies have no per-entry `updated`).
 *
 * Derived from the newest `updated` in `content/`, NOT from the clock. Two
 * reasons: Cache Components rejects a bare `new Date()` during a prerender, and
 * a wall-clock value would rewrite every `<lastmod>` on every deploy, which
 * tells crawlers a page changed when only the build did. An edit to
 * `content/pages/*.mdx` moves this; a rebuild does not.
 */
export const LAST_UPDATED = [getPage("about").updated, getPage("uses").updated]
  .sort()
  .at(-1) as string

const site = getSite()

/* -------------------------------------------------------------------------- */
/* Primitives                                                                 */
/* -------------------------------------------------------------------------- */

function yamlString(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
}

interface HeaderInput {
  title: string
  description: string
  /** Path with a leading slash. */
  path: string
  updated?: string
}

/** The frontmatter header every `/md/*` document opens with. */
function header({ title, description, path, updated }: HeaderInput): string {
  return [
    "---",
    `title: ${yamlString(title)}`,
    `description: ${yamlString(description)}`,
    // No trailing slash on the home URL: that is what Next resolves
    // `alternates.canonical` to, and the sitemap `<loc>` and the breadcrumb
    // agree with it. One document, one spelling.
    `canonical: ${yamlString(path === "/" ? site.url : `${site.url}${path}`)}`,
    `updated: ${yamlString(updated ?? LAST_UPDATED)}`,
    `source: ${yamlString(site.name)}`,
    "---",
    "",
    `# ${title}`,
    "",
  ].join("\n")
}

/**
 * Resolve the two display-only markups in a copy string: `{braces}` mark the
 * italic accent word, `[[token]]` marks an inline chip. Both are rendering
 * instructions, not content, so the mirrors carry the words the chip shows —
 * the company or case-study name, the same label `app/components/hero` renders
 * — and an unknown token degrades to its own text rather than throwing.
 */
function plain(value: string) {
  return value
    .replace(/\[\[([a-z0-9-]+)\]\]/g, (_, token: string) => {
      const company = getCompanies().find((c) => c.id === token)
      if (company) return company.name
      return getWorkBySlug(token)?.title ?? token
    })
    .replace(/[{}]/g, "")
}

function meta(pairs: [string, string | undefined][]) {
  return pairs
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `- **${key}**: ${value}`)
    .join("\n")
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

function periodPart(value: string) {
  if (value === "now") return "now"
  const [year, month] = value.split("-")
  return month ? `${MONTHS[Number(month) - 1] ?? month} ${year}` : year
}

function period(p: WorkEntry["period"]) {
  const from = periodPart(p.from)
  const to = periodPart(String(p.to))
  const range = from === to ? from : `${from} – ${to}`
  return p.approx ? `${range} (approximate)` : range
}

const CONFIDENTIALITY_NOTE: Record<string, string> = {
  limited:
    "Public surfaces only. Employed work: role, domain and the shape of the contribution are described; private metrics, internal screenshots and system details are omitted.",
  high: "Public surfaces only. Sensitive work: the description is deliberately generic. No screenshots, no system details, no non-public company claims.",
}

/** Public metrics, with unverified numbers tagged. `private` is dropped. */
function metricLines(entry: WorkEntry): string[] {
  const metrics = (entry.metrics ?? []).filter(
    (m) => m.confidence !== "private"
  )
  if (metrics.length === 0) return []
  return [
    "## Metrics",
    "",
    ...metrics.map(
      (m) =>
        `- ${m.value} — ${m.label}${m.confidence === "needs-verification" ? " (unverified)" : ""}`
    ),
    "",
  ]
}

/* -------------------------------------------------------------------------- */
/* /md/work/<slug>                                                            */
/* -------------------------------------------------------------------------- */

export function workMarkdown(slug: string): string | undefined {
  const entry = getWorkBySlug(slug)
  if (!entry) return undefined

  const company = entry.company
    ? getCompanies().find((c) => c.id === entry.company)
    : undefined

  const lines = [
    header({
      title: entry.title,
      description: entry.seo.description,
      path: `/work/${entry.slug}`,
      updated: entry.updated,
    }),
    `> ${entry.line}`,
    "",
    meta([
      ["Kind", entry.kind],
      ["Status", entry.status],
      ["Period", period(entry.period)],
      ["Role", entry.role],
      ["Company", company?.name],
      ["Location", entry.location],
      ["Tech", entry.tech.join(", ")],
      ["URL", entry.url],
      ["Confidentiality", entry.confidentiality],
    ]),
    "",
    entry.detail,
    "",
  ]

  if (entry.confidentiality !== "public") {
    lines.push(`_${CONFIDENTIALITY_NOTE[entry.confidentiality]}_`, "")
  }

  lines.push(...metricLines(entry))

  if (entry.links?.length) {
    lines.push(
      "## Links",
      "",
      ...entry.links.map((l) => `- [${l.label}](${l.url})`),
      ""
    )
  }

  lines.push(
    entry.body,
    "",
    "---",
    "",
    `Source: ${site.url}/work/${entry.slug}`,
    ""
  )
  return lines.join("\n")
}

/* -------------------------------------------------------------------------- */
/* /md/index — the home page                                                  */
/* -------------------------------------------------------------------------- */

/**
 * `/` as markdown, reached at `/index.md` or with `Accept: text/markdown` on
 * `/`. Built from the same `content/pages/home.ts` the page renders, minus the
 * two display-only markups: `{braces}` mark the italic accent word and
 * `[[slug]]` marks an inline chip, neither of which means anything in text.
 */
export function homeMarkdown(): string {
  const home = getHome()
  const featured = getWork().filter((entry) => entry.featured)

  return [
    header({
      title: `${site.name} — ${site.roles[0]}`,
      description: site.description,
      path: "/",
    }),
    `> ${plain(home.hero.h1)}`,
    "",
    plain(home.hero.lede),
    "",
    meta([
      ["Roles", site.roles.join(", ")],
      ["Based in", `${site.location.city}, ${site.location.country}`],
      ["Years shipping", `${site.yearsShipping}`],
      ["Case studies", `${getWork().length}`],
    ]),
    "",
    "## Selected work",
    "",
    ...featured.map(
      (entry) =>
        `- [${entry.title}](${site.url}/work/${entry.slug}) — ${entry.line}`
    ),
    "",
    `Everything: ${site.url}/work`,
    "",
    "## Work history",
    "",
    home.history.rangeLabel,
    "",
    ...getCompanies().map(
      (company) =>
        `- **${company.name}** (${company.yearsLabel}${company.approx ? ", approximate" : ""}) — ${company.role}`
    ),
    "",
    `Detail: ${site.url}/about`,
    "",
    "## Mentoring",
    "",
    plain(home.mentoring.h2),
    "",
    home.mentoring.lede,
    "",
    `Detail: ${site.url}/mentoring`,
    "",
    "## Links",
    "",
    `- [LinkedIn](${site.links.linkedin})`,
    `- [GitHub](${site.links.github})`,
    `- [MentorCruise](${site.links.mentorcruise})`,
    `- [Book a call](${site.links.calendar})`,
    "",
  ].join("\n")
}

/* -------------------------------------------------------------------------- */
/* /md/work                                                                   */
/* -------------------------------------------------------------------------- */

export function workIndexMarkdown(): string {
  const work = getWork()
  const copy = getWorkPage()
  const lines = [
    header({
      title: copy.seo.title,
      description: copy.mirror.description,
      path: "/work",
    }),
    copy.mirror.intro.replace("{count}", String(work.length)),
    "",
  ]

  for (const entry of work) {
    lines.push(
      `## ${entry.title}`,
      "",
      entry.line,
      "",
      meta([
        ["Kind", entry.kind],
        ["Status", entry.status],
        ["Period", period(entry.period)],
        ["Role", entry.role],
        ["Case study", `${site.url}/work/${entry.slug}`],
        ["URL", entry.url],
      ]),
      ""
    )
  }
  return lines.join("\n")
}

/* -------------------------------------------------------------------------- */
/* /md/about                                                                  */
/* -------------------------------------------------------------------------- */

export function aboutMarkdown(): string {
  const page = getPage("about")
  const lines = [
    header({
      title: page.title,
      description: page.description,
      path: "/about",
      updated: page.updated,
    }),
    page.description,
    "",
    // The same cut `/about` makes: the MDX `## Links` list is replaced by the
    // designed block below, so the mirror never publishes a claim the page
    // withholds.
    aboutNarrative(page.body),
    "",
    "## Links",
    "",
    ...getAboutLinks().map(
      (link) =>
        `- [${link.label}](${/^https?:/.test(link.href) ? link.href : `${site.url}${link.href}`}) — ${link.note}`
    ),
    "",
    "## Timeline",
    "",
  ]

  for (const company of getCompanies()) {
    lines.push(
      `### ${company.name} — ${company.yearsLabel}${company.approx ? " (approximate)" : ""}`,
      "",
      meta([
        ["Role", company.role],
        ["Previously", company.prev],
        [
          "Case study",
          company.workSlug ? `${site.url}/work/${company.workSlug}` : undefined,
        ],
      ]),
      "",
      company.summary,
      ""
    )
    if (company.fact) lines.push(`Worth knowing: ${company.fact}`, "")
  }

  return lines.join("\n")
}

/* -------------------------------------------------------------------------- */
/* /md/uses                                                                   */
/* -------------------------------------------------------------------------- */

export function usesMarkdown(): string {
  const page = getPage("uses")
  return [
    header({
      title: page.title,
      description: page.description,
      path: "/uses",
      updated: page.updated,
    }),
    page.description,
    "",
    page.body,
    "",
  ].join("\n")
}

/* -------------------------------------------------------------------------- */
/* /md/mentoring                                                              */
/* -------------------------------------------------------------------------- */

export function mentoringMarkdown(): string {
  const copy = getMentoring()
  const lines = [
    header({
      title: copy.seo.title,
      description: copy.seo.description,
      path: "/mentoring",
    }),
    `> ${copy.h1.replace(/[{}]/g, "")}`,
    "",
    copy.lede,
    "",
    "## Who it is for",
    "",
    ...copy.whoFor.map((item) => `- ${item}`),
    "",
    "## How it works",
    "",
    ...copy.howItWorks.map(
      (step, i) => `${i + 1}. **${step.title}** — ${step.body}`
    ),
    "",
    "## Topics",
    "",
    ...copy.topics.map((topic) => `- ${topic}`),
    "",
    "## What I expect",
    "",
    ...copy.expectations.map((item) => `- ${item}`),
    "",
    "## Start",
    "",
    `[${copy.cta.label}](${copy.cta.url})${copy.cta.note ? ` — ${copy.cta.note}` : ""}`,
    "",
    "## Feedback",
    "",
  ]

  for (const t of getTestimonials()) {
    lines.push(`> ${t.quote}`, ">", `> — ${t.author}, via ${t.source}`, "")
  }

  return lines.join("\n")
}

/* -------------------------------------------------------------------------- */
/* /llms.txt                                                                  */
/* -------------------------------------------------------------------------- */

/** The index: who, the primary pages, selected work, contact. */
export function llmsTxt(): string {
  const featured = getWork().filter((entry) => entry.featured)
  const companies = getWork().filter((entry) => entry.kind === "company")

  return [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    `${site.roles.join(" · ")} · ${site.location.city}, ${site.location.country} · ${site.yearsShipping} years shipping`,
    "",
    "## Pages",
    "",
    `- [Home](${site.url}): ${site.tagline}`,
    `- [Work](${site.url}/work): every case study, product and experiment`,
    `- [Mentoring](${site.url}/mentoring): one-to-one mentoring for engineers`,
    `- [About](${site.url}/about): professional background and timeline`,
    `- [Uses](${site.url}/uses): hardware, software and tools`,
    "",
    "## Selected work",
    "",
    ...featured.map(
      (entry) =>
        `- [${entry.title}](${site.url}/work/${entry.slug}): ${entry.line}`
    ),
    "",
    "## Company chapters",
    "",
    ...companies.map(
      (entry) =>
        `- [${entry.title}](${site.url}/work/${entry.slug}): ${entry.line}`
    ),
    "",
    "## Contact",
    "",
    `- [LinkedIn](${site.links.linkedin})`,
    `- [GitHub](${site.links.github})`,
    `- [MentorCruise](${site.links.mentorcruise})`,
    `- [Book a call](${site.links.calendar})`,
    "",
    "## Optional",
    "",
    `- [Full text](${site.url}/llms-full.txt): every public page inlined as markdown`,
    `- [Sitemap](${site.url}/sitemap.xml)`,
    "",
    "Any page is available as markdown by appending `.md` to its path, or by",
    "sending `Accept: text/markdown`. The home page has no path segment of its",
    `own, so its mirror is ${site.url}/index.md.`,
    "",
    `Last updated: ${LAST_UPDATED}`,
    "",
  ].join("\n")
}

/* -------------------------------------------------------------------------- */
/* /llms-full.txt                                                             */
/* -------------------------------------------------------------------------- */

/** Everything, inlined, in the order a reader should meet it. */
export function llmsFullTxt(): string {
  const work = getWork()
  const current = work.filter((entry) => entry.status === "current")
  const active = work.filter((entry) => entry.status === "active")
  const companies = work.filter((entry) => entry.kind === "company")
  const products = work.filter((entry) => entry.kind === "product")
  const experiments = work.filter((entry) => entry.kind === "experiment")
  const mentoring = getMentoring()
  const about = getPage("about")

  const parts: string[] = [
    `# ${site.name} — full text`,
    "",
    `> ${site.description}`,
    "",
    "## Positioning",
    "",
    site.tagline,
    "",
    `${site.roles.join(" · ")}. Based in ${site.location.city}, ${site.location.country}.`,
    `${site.yearsShipping} years shipping software. Case studies: ${work.length}.`,
    "",
    "## Summary",
    "",
    about.description,
    "",
    "## Current focus",
    "",
    ...[...current, ...active].map(
      (entry) =>
        `- **${entry.title}** (${entry.role}, ${period(entry.period)}): ${entry.line}`
    ),
    "",
    "## Company chapters",
    "",
  ]

  for (const company of getCompanies()) {
    parts.push(
      `### ${company.name} — ${company.yearsLabel}${company.approx ? " (approximate)" : ""}`,
      "",
      meta([
        ["Role", company.role],
        ["Previously", company.prev],
        [
          "Case study",
          company.workSlug ? `${site.url}/work/${company.workSlug}` : undefined,
        ],
      ]),
      "",
      company.summary,
      ""
    )
  }

  parts.push("## Case studies", "")
  for (const entry of [...companies, ...products, ...experiments]) {
    parts.push(workMarkdown(entry.slug) ?? "", "")
  }

  parts.push(
    "## Mentoring",
    "",
    mentoring.lede,
    "",
    ...mentoring.howItWorks.map(
      (step, i) => `${i + 1}. **${step.title}** — ${step.body}`
    ),
    "",
    `Topics: ${mentoring.topics.join(", ")}.`,
    "",
    `[${mentoring.cta.label}](${mentoring.cta.url})`,
    "",
    "## Contact",
    "",
    `- LinkedIn: ${site.links.linkedin}`,
    `- GitHub: ${site.links.github}`,
    `- MentorCruise: ${site.links.mentorcruise}`,
    `- Calendar: ${site.links.calendar}`,
    "",
    "## Canonical links",
    "",
    `- ${site.url}/`,
    `- ${site.url}/work`,
    ...work.map((entry) => `- ${site.url}/work/${entry.slug}`),
    `- ${site.url}/mentoring`,
    `- ${site.url}/about`,
    `- ${site.url}/uses`,
    "",
    `Last updated: ${LAST_UPDATED}`,
    ""
  )

  return parts.join("\n")
}
