import {
  getCompanies,
  getMentoring,
  getPage,
  getSite,
  getTestimonials,
  getWork,
  getWorkBySlug,
} from "./index"

/**
 * Markdown renderers shared by `/md/*`, `/llms.txt` and `/llms-full.txt`, so the
 * mirrors always carry the same claims as the HTML.
 */

export const MD_CONTENT_TYPE = "text/markdown; charset=utf-8"

function h1(text: string) {
  return `# ${text}\n`
}

function meta(pairs: [string, string | undefined][]) {
  return pairs
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `- **${key}**: ${value}`)
    .join("\n")
}

function period(from: string, to: string) {
  return to === "now" ? `${from} – now` : `${from} – ${to}`
}

/** `/md/work/<slug>` */
export function workMarkdown(slug: string): string | undefined {
  const entry = getWorkBySlug(slug)
  if (!entry) return undefined
  const site = getSite()

  const head = [
    h1(entry.title),
    entry.line,
    "",
    meta([
      ["Period", period(entry.period.from, String(entry.period.to))],
      ["Role", entry.role],
      ["Kind", entry.kind],
      ["Status", entry.status],
      ["Tech", entry.tech.join(", ")],
      ["URL", entry.url],
      ["Confidentiality", entry.confidentiality],
    ]),
    "",
    entry.detail,
  ]

  if (entry.metrics?.length) {
    head.push(
      "",
      "## Metrics",
      "",
      ...entry.metrics.map(
        (m) =>
          `- ${m.value} — ${m.label}${m.confidence === "needs-verification" ? " (unverified)" : ""}`
      )
    )
  }

  if (entry.links?.length) {
    head.push(
      "",
      "## Links",
      "",
      ...entry.links.map((l) => `- [${l.label}](${l.url})`)
    )
  }

  head.push("", entry.body, "", `---\n\nSource: ${site.url}/work/${entry.slug}`)
  return head.join("\n")
}

/** `/md/work` */
export function workIndexMarkdown(): string {
  const site = getSite()
  const lines = [h1("Work"), "", "All case studies, products and experiments.", ""]
  for (const entry of getWork()) {
    lines.push(
      `## ${entry.title}`,
      "",
      `${entry.line}`,
      "",
      meta([
        ["Period", period(entry.period.from, String(entry.period.to))],
        ["Role", entry.role],
        ["Status", entry.status],
        ["Case study", `${site.url}/work/${entry.slug}`],
        ["URL", entry.url],
      ]),
      ""
    )
  }
  return lines.join("\n")
}

/** `/md/about` */
export function aboutMarkdown(): string {
  const page = getPage("about")
  const lines = [h1(page.title), "", page.description, "", page.body, ""]
  lines.push("## Timeline", "")
  for (const company of getCompanies()) {
    lines.push(
      `### ${company.name} — ${company.yearsLabel}${company.approx ? " (approximate)" : ""}`,
      "",
      `${company.role}${company.prev ? ` (previously: ${company.prev})` : ""}`,
      "",
      company.summary,
      ""
    )
  }
  return lines.join("\n")
}

/** `/md/uses` */
export function usesMarkdown(): string {
  const page = getPage("uses")
  return [h1(page.title), "", page.description, "", page.body, ""].join("\n")
}

/** `/md/mentoring` */
export function mentoringMarkdown(): string {
  const copy = getMentoring()
  const lines = [
    h1(copy.h1.replace(/[{}]/g, "")),
    "",
    copy.lede,
    "",
    "## Who it is for",
    "",
    ...copy.whoFor.map((item) => `- ${item}`),
    "",
    "## How it works",
    "",
    ...copy.howItWorks.map((step) => `- **${step.title}**: ${step.body}`),
    "",
    "## Topics",
    "",
    ...copy.topics.map((topic) => `- ${topic}`),
    "",
    "## What I expect",
    "",
    ...copy.expectations.map((item) => `- ${item}`),
    "",
    `[${copy.cta.label}](${copy.cta.url})`,
    "",
    "## Feedback",
    "",
    ...getTestimonials().map((t) => `> ${t.quote}\n> — ${t.author} (${t.source})\n`),
  ]
  return lines.join("\n")
}

/** `/llms.txt` — the index. */
export function llmsTxt(): string {
  const site = getSite()
  const lines = [
    h1(site.name),
    "",
    `> ${site.description}`,
    "",
    `${site.roles.join(" · ")} · ${site.location.city}, ${site.location.country}`,
    "",
    "## Pages",
    "",
    `- [Home](${site.url}/): ${site.tagline}`,
    `- [Work](${site.url}/work): every case study, product and experiment`,
    `- [Mentoring](${site.url}/mentoring): one-to-one mentoring for engineers`,
    `- [About](${site.url}/about): professional background`,
    `- [Uses](${site.url}/uses): tools and hardware`,
    "",
    "## Work",
    "",
    ...getWork().map(
      (entry) => `- [${entry.title}](${site.url}/work/${entry.slug}): ${entry.line}`
    ),
    "",
    "## Links",
    "",
    `- [GitHub](${site.links.github})`,
    `- [LinkedIn](${site.links.linkedin})`,
    `- [MentorCruise](${site.links.mentorcruise})`,
    "",
    "## Optional",
    "",
    `- [Full text](${site.url}/llms-full.txt): every page as markdown`,
    "",
    "Any page is available as markdown by appending `.md` to its path, or by",
    "sending `Accept: text/markdown`.",
    "",
  ]
  return lines.join("\n")
}

/** `/llms-full.txt` — everything, inlined. */
export function llmsFullTxt(): string {
  const site = getSite()
  const parts = [
    h1(site.name),
    "",
    `> ${site.description}`,
    "",
    aboutMarkdown(),
    "",
    mentoringMarkdown(),
    "",
    usesMarkdown(),
    "",
  ]
  for (const entry of getWork()) {
    parts.push(workMarkdown(entry.slug) ?? "", "")
  }
  return parts.join("\n")
}
