import { readFileSync } from "node:fs"
import { join } from "node:path"

import {
  getAbout,
  getBuiltList,
  getCv,
  getHome,
  getMentoring,
  getPress,
  getProduct,
  getSite,
  getStories,
  getTestimonialPile,
  getWorkPage,
} from "@/lib/content"
import { dropPlaceholderSentences, sentences } from "@/lib/content/placeholder"
import type { RichText, WorkEntry } from "@/lib/content/schema"
import { identity, isPlaceholder, period } from "@/lib/seo/markdown"
import { DIAGRAMS } from "@/content/diagrams"
import { updatedInWords } from "@/content/site"

/**
 * The knowledge the Ask assistant answers from (`workers/ask`), generated
 * from `content/**` so it never drifts from the site. SERVER/BUILD ONLY: it
 * reads the filesystem through the content loaders.
 *
 * Rules the generator enforces (the Worker's system prompt relies on them):
 *
 *   · Only what the site already says. Every fact ends with `(source: <path>)`,
 *     the page it came from, in exactly that form.
 *   · A sentence that holds a visible bracket placeholder ("[YEAR]",
 *     "[WHY IT STOPPED: HIS WORDS]") is dropped, never fed to the model, and
 *     reported in `dropped`.
 *   · Metrics marked `private` or `needs-verification` are left out.
 *   · ONA by Alma appears only as its list row, exactly as written: the one
 *     deliberate exception to the no-family rule, and nothing more.
 *   · No employer in the identity lines; nothing from `docs/`.
 *   · The site map at the end is the only list of links the Worker accepts
 *     as sources (`- <href> | <label> | <what it is>`, parsed by the Worker).
 *
 * `content/ask/notes.md` (his hand-written public notes) is appended under
 * its own heading, with HTML comments removed and the same placeholder rule.
 */

export interface DroppedItem {
  /** Where the text was, as a site path or a content file. */
  where: string
  text: string
}

export interface SiteMapEntry {
  href: string
  label: string
  what: string
}

export interface AskContext {
  markdown: string
  dropped: DroppedItem[]
  siteMap: SiteMapEntry[]
  /** Warnings about the notes file (words that should never be there). */
  warnings: string[]
}

/** The one row that may carry family wording, by product slug. */
const FAMILY_EXCEPTION_REF = "ona"

const NOTES_PATH = join("content", "ask", "notes.md")

/* -------------------------------------------------------------------------- */
/* Text helpers                                                               */
/* -------------------------------------------------------------------------- */

/** Rich text as plain words; links keep their text only. */
function plain(text: RichText): string {
  return text.map((s) => s.text).join("")
}

/** Markdown links as their text, inline code and emphasis unwrapped. */
function unmark(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
}

/** The press kit's facts that say what he is doing now, one fact each. */
const NOW_LABELS = ["DAY JOB", "OWN PRODUCT"]

class Collector {
  readonly dropped: DroppedItem[] = []

  /**
   * The text with every sentence that holds a placeholder removed. Returns
   * `""` when nothing is left.
   */
  clean(text: string, where: string): string {
    const { kept, dropped } = dropPlaceholderSentences(unmark(text))
    for (const text of dropped) this.dropped.push({ where, text })
    return kept
  }

  /** One fact line, with its source; `undefined` when nothing survives. */
  fact(text: string | undefined, source: string): string | undefined {
    if (!text) return undefined
    const kept = this.clean(text, source)
    return kept ? `- ${kept} (source: ${source})` : undefined
  }
}

type Part = string | false | undefined | null | Part[]

function lines(...parts: Part[]): string {
  const out: string[] = []
  const walk = (p: Part) => {
    if (Array.isArray(p)) p.forEach(walk)
    else if (typeof p === "string") out.push(p)
  }
  parts.forEach(walk)
  return out.join("\n")
}

/** Same words, ignoring case and final punctuation. */
const sameText = (a: string, b: string) =>
  a.replace(/[.\s]+$/, "").toLowerCase() ===
  b.replace(/[.\s]+$/, "").toLowerCase()

const sentenceCase = (label: string) =>
  label.charAt(0) + label.slice(1).toLowerCase()

/* -------------------------------------------------------------------------- */
/* Stories                                                                    */
/* -------------------------------------------------------------------------- */

/** A story body as `#### Section` blocks, placeholder sentences dropped. */
function storyBody(entry: WorkEntry, c: Collector): string[] {
  const source = `/work/${entry.slug}`
  const out: string[] = []
  const sections = entry.body.split(/\n(?=## )/)
  for (const section of sections) {
    const [first, ...rest] = section.split("\n")
    const heading = first.startsWith("## ") ? first.slice(3).trim() : null
    const blocks = (heading ? rest : [first, ...rest])
      .join("\n")
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean)
    const kept: string[] = []
    for (const block of blocks) {
      const items = block.split("\n").filter((l) => l.trim())
      if (items.every((l) => /^\s*-\s/.test(l))) {
        for (const item of items) {
          const text = c.clean(item.replace(/^\s*-\s+/, ""), source)
          if (text) kept.push(`- ${text} (source: ${source})`)
        }
      } else {
        const text = c.clean(items.join(" "), source)
        if (text) kept.push(`${text} (source: ${source})`)
      }
    }
    if (kept.length === 0) continue
    if (heading) out.push(`#### ${heading}`, "")
    out.push(kept.join("\n\n"), "")
  }
  return out
}

/** A story's roles (`panel.timeline`), oldest first, as its page shows them. */
function storyRoles(entry: WorkEntry, c: Collector): string[] {
  const roles = entry.panel?.timeline
  if (!roles?.length) return []
  const source = `/work/${entry.slug}`
  return [
    "#### Roles, oldest first",
    "",
    ...roles.flatMap((r) =>
      [
        c.fact(
          `${r.dates}: ${r.title}${r.current ? " (his current role)" : ""}.`,
          source
        ),
        ...r.blocks.map((b) => c.fact(`${b.label}: ${b.text}`, source)),
        "",
      ].filter((l): l is string => l !== undefined)
    ),
  ]
}

function storyBlock(
  entry: WorkEntry,
  c: Collector,
  printed: Set<string> = new Set()
): string[] {
  const source = `/work/${entry.slug}`
  const when = period(entry)
  const metrics = (entry.metrics ?? []).filter((m) => {
    if (m.confidence === "verified") return true
    c.dropped.push({
      where: source,
      text: `metric "${m.value} ${m.label}" (${m.confidence})`,
    })
    return false
  })
  return [
    `Case study page: ${source} (source: ${source})`,
    "",
    c.fact(`Role: ${entry.role}.`, source),
    when ? c.fact(`When: ${when}.`, source) : undefined,
    c.fact(`In one line: ${entry.line}`, source),
    c.fact(entry.detail, source),
    entry.confidentiality !== "public"
      ? c.fact(
          "This was employed work. The site describes the role and the shape of the contribution only; private metrics, internal screenshots and system details are left out on purpose.",
          source
        )
      : undefined,
    ...metrics.map((m) =>
      c.fact(`Public number: ${m.value} ${m.label}.`, source)
    ),
    ...(entry.links ?? [])
      .filter(
        (l) => !printed.has(l.url.replace(/\/$/, "")) && !printed.has(l.url)
      )
      .map((l) => `- Link: ${l.label}, ${l.url} (source: ${source})`),
    ...storyEstimates(entry, c, source),
    "",
    ...storyRoles(entry, c),
    ...storyBody(entry, c),
  ].filter((l): l is string => l !== undefined)
}

/**
 * The figures a story's diagram shows as his own estimate (studenti.rs
 * search, decided 15 Nov 2026), always carried as an estimate, never as a
 * measured statistic.
 */
function storyEstimates(
  entry: WorkEntry,
  c: Collector,
  source: string
): (string | undefined)[] {
  return (entry.column ?? []).flatMap((item) => {
    if (item.kind !== "diagram") return []
    const d = DIAGRAMS.get(item.id)
    if (!d || d.form !== "search" || !d.figures) return []
    const f = d.figures
    return [
      c.fact(
        `${d.title}: by his estimate, ${f.before.figure} ${f.before.note.replace(/\.$/, "")} before the rebuild; ${f.now.figure} ${f.now.note}`,
        source
      ),
    ]
  })
}

/* -------------------------------------------------------------------------- */
/* The document                                                               */
/* -------------------------------------------------------------------------- */

export function buildAskContext(root = process.cwd()): AskContext {
  const c = new Collector()
  const site = getSite()
  const home = getHome()
  const about = getAbout()
  const mentoring = getMentoring()
  const press = getPress()
  const list = getBuiltList()
  const stories = new Map(getStories().map((s) => [s.slug, s]))
  const siteMap: SiteMapEntry[] = []
  const addLink = (href: string, label: string, what: string) => {
    if (siteMap.some((e) => e.href === href)) return
    siteMap.push({
      href,
      label: label.replace(/\|/g, "/"),
      what: what.replace(/\|/g, "/"),
    })
  }

  // Popovers on the landing paragraphs and recent-work cards, by product.
  const popovers = new Map<string, { body: string; meta?: string }>()
  for (const p of home.paragraphs)
    for (const s of p)
      if (s.kind === "product" && s.popover)
        popovers.set(s.ref, { body: s.popover.body, meta: s.popover.meta })
  type WorkCard = Extract<
    (typeof home.recentWork.cards)[number],
    { kind: "work" }
  >
  const cards = new Map<string, WorkCard>(
    home.recentWork.cards.flatMap((card) =>
      card.kind === "work" ? [[card.ref, card] as const] : []
    )
  )
  const cvRows = new Map<string, (typeof about.cv.rows)[number]>(
    about.cv.rows.map((r) => [r.ref, r])
  )

  /* Who he is ------------------------------------------------------------- */

  // The facts list is the press kit's since 15 Nov 2026 (About dropped it).
  const factsBy = new Map(press.facts.items.map((f) => [f.label, f.value]))
  const who = lines(
    "## Who he is and where",
    "",
    c.fact(identity(), "/press"),
    c.fact(`The line under his name: "${site.line}"`, "/"),
    press.facts.items
      .filter((f) => !NOW_LABELS.includes(f.label) && !isPlaceholder(f.value))
      .map((f) => c.fact(`${sentenceCase(f.label)}: ${f.value}.`, "/press")),
    "",
    "His own words on the About page:",
    "",
    about.paragraphs.map((p) => c.fact(plain(p), "/about")),
    ""
  )

  /* Now ------------------------------------------------------------------- */

  const now = lines(
    "## What he is doing now",
    "",
    // Two facts, never one sentence: the day job and the own product.
    NOW_LABELS.map((label) =>
      factsBy.get(label)
        ? c.fact(`${sentenceCase(label)}: ${factsBy.get(label)}.`, "/press")
        : undefined
    ),
    c.fact(home.headline.srText, "/"),
    c.fact(home.headline.onSrText, "/"),
    c.fact(home.stance, "/"),
    home.paragraphs.map((p) => c.fact(plain(p), "/")),
    c.fact(plain(mentoring.intro), "/mentoring"),
    ""
  )

  /* Products and jobs ------------------------------------------------------ */

  const entries: string[] = ["## Products, jobs and projects", ""]
  entries.push(
    c.fact(
      "The work page lists the projects and jobs he put a significant amount of time into, with what happened to each; there is more he has not listed.",
      "/work"
    )!,
    ""
  )
  for (const group of list.groups) {
    entries.push(`### ${sentenceCase(group.label)}`, "")
    for (const row of group.rows) {
      const product = getProduct(row.ref)
      const anchor = `/work#${row.ref}`
      addLink(
        anchor,
        `${row.name} in the list`,
        "Its row in the list of work he has put real time into."
      )
      entries.push(`#### ${row.name}`, "")

      if (row.ref === FAMILY_EXCEPTION_REF) {
        // Exactly the list row, nothing more (see the file comment).
        entries.push(
          c.fact(`In the list: "${row.what}"`, anchor)!,
          product?.url ? `- Website: ${product.url} (source: ${anchor})` : "",
          ""
        )
        if (product?.url)
          addLink(product.url, product.name ?? row.name, "Website")
        continue
      }

      const status = product?.status
      const years = row.year ?? product?.year
      entries.push(
        ...[
          c.fact(
            [
              status ? `Status: ${status}.` : undefined,
              years ? `Years: ${years}.` : undefined,
              product?.kind === "employer"
                ? "A job."
                : product?.kind === "client"
                  ? "Freelance work for a client."
                  : "His own.",
            ]
              .filter(Boolean)
              .join(" "),
            anchor
          ),
          c.fact(`In the list: "${row.what}"`, anchor),
          product?.description && !sameText(product.description, row.what)
            ? c.fact(
                `What it is: ${product.description}.`.replace(/\.\.$/, "."),
                "/"
              )
            : undefined,
        ].filter((l): l is string => Boolean(l))
      )

      // The products told inside this row (EVO Touch at ZF, Shop Minis at Shopify).
      const inner = [
        row.ref,
        ...(row.ref === "zf-scalar" ? ["evo-touch"] : []),
        ...(row.ref === "shopify" ? ["shop-minis"] : []),
      ]
      for (const ref of inner) {
        const name = getProduct(ref)?.name ?? ref
        const pop = popovers.get(ref)
        if (pop)
          entries.push(
            c.fact(
              `On the home page, about ${name}: "${pop.body}"${pop.meta ? ` (${pop.meta})` : ""}`,
              "/"
            )!
          )
        const card = cards.get(ref)
        if (card) {
          entries.push(
            c.fact(
              `In "Recent work", ${card.title}: ${card.caption}${card.pill ? ` (${card.pill.toLowerCase()})` : ""}`,
              "/#recent-work"
            )!
          )
          if (card.sheet)
            entries.push(
              c.fact(
                `${card.sheet.body} Facts: ${card.sheet.facts.join("; ")}.`,
                "/#recent-work"
              )!
            )
        }
        if (ref !== row.ref && getProduct(ref)?.description)
          entries.push(c.fact(`${name}: ${getProduct(ref)!.description}`, "/")!)
      }
      const cv = cvRows.get(row.ref)
      if (cv)
        entries.push(
          c.fact(`On his CV (${cv.year}): ${cv.role}. ${cv.text}`, "/about")!
        )

      const urls = [product?.url].filter((u): u is string => Boolean(u))
      for (const url of urls) {
        const name = product?.name ?? row.name
        entries.push(`- Website (${name}): ${url} (source: ${anchor})`)
        addLink(
          url,
          new URL(url).hostname.replace(/^www\./, ""),
          `${name}'s own website`
        )
      }

      const story = product?.story ? stories.get(product.story) : undefined
      if (story) {
        addLink(`/work/${story.slug}`, `${story.title} case study`, story.line)
        for (const l of story.links ?? [])
          addLink(l.url, l.label, `Linked from the ${story.title} case study`)
        entries.push("", ...storyBlock(story, c, new Set(urls)))
      }
      entries.push("")
    }
  }

  // Client sites shown only in "Recent work" (no list row of their own).
  const listed = new Set(list.groups.flatMap((g) => g.rows.map((r) => r.ref)))
  const clients = home.recentWork.cards.filter(
    (card) =>
      card.kind === "work" &&
      !listed.has(card.ref) &&
      getProduct(card.ref)?.kind === "client"
  )
  if (clients.length) {
    entries.push("### Client websites", "")
    for (const card of clients) {
      if (card.kind !== "work") continue
      const product = getProduct(card.ref)
      entries.push(
        `#### ${card.title}`,
        "",
        c.fact(
          `${card.caption}.${product?.status || card.pill ? ` Status: ${product?.status ?? sentenceCase(card.pill!)}.` : ""}`.replace(
            /\.\./g,
            "."
          ),
          "/#recent-work"
        )!,
        product?.url ? `- Website: ${product.url} (source: /#recent-work)` : "",
        ""
      )
      if (product?.url)
        addLink(
          product.url,
          new URL(product.url).hostname,
          `${card.title}'s website`
        )
    }
  }

  /* Early sites ------------------------------------------------------------ */

  const early = lines(
    "## The early sites",
    "",
    // The early line itself is in his own words above (the About story);
    // the projects are a carousel right after it on the page.
    c.fact(`Building since: ${factsBy.get("BUILDING SINCE") ?? ""}.`, "/press"),
    about.early.frames.map((f) =>
      c.fact(
        `${f.label}. Caption: ${f.caption ?? ""}${f.text ? `. ${f.text}` : ""}`.replace(
          /Caption: $/,
          ""
        ),
        "/about"
      )
    ),
    ""
  )

  /* The CV ----------------------------------------------------------------- */

  // His CV document, word for word (`/cv`, and the PDF made from it).
  const cv = getCv()
  const cvEntry = (i: (typeof cv.projects.items)[number]) =>
    c.fact(
      `${[i.name, i.role, i.dates, i.domain].filter(Boolean).join(" · ")}: ${i.text}`,
      "/cv"
    )
  const cvPart = lines(
    "## His CV",
    "",
    c.fact(
      `His CV is a page of the site, /cv, with a PDF of it at ${site.links.cv}.`,
      "/cv"
    ),
    c.fact(
      `The lines under his name on the CV: "${cv.headline.role}", then "${cv.headline.location}".`,
      "/cv"
    ),
    cv.summary.map((p) => c.fact(p, "/cv")),
    "",
    `### ${cv.experience.title}`,
    "",
    cv.experience.jobs.flatMap((job) => [
      c.fact(
        `${[job.company, job.role].filter(Boolean).join(", ")}, ${job.dates}.${job.line ? ` ${job.line}` : ""}`,
        "/cv"
      ),
      ...(job.bullets ?? []).map((b) =>
        c.fact(`At ${job.company}: ${b}`, "/cv")
      ),
      ...(job.roles ?? []).flatMap((r) => [
        c.fact(`At ${job.company}, ${r.title}, ${r.dates}.`, "/cv"),
        ...r.bullets.map((b) =>
          c.fact(`At ${job.company}, as ${r.title}: ${b}`, "/cv")
        ),
      ]),
    ]),
    "",
    `### ${cv.projects.title}`,
    "",
    cv.projects.items.map(cvEntry),
    "",
    `### ${cv.mentoring.title}`,
    "",
    cv.mentoring.items.map(cvEntry),
    "",
    `### ${cv.skills.title}`,
    "",
    c.fact(cv.skills.items.join(" · "), "/cv"),
    ""
  )

  /* Mentoring -------------------------------------------------------------- */

  const mentoringPart = lines(
    "## Mentoring",
    "",
    c.fact(plain(mentoring.intro), "/mentoring"),
    c.fact(home.mentoring.body, "/#mentoring"),
    c.fact(
      `Public figures from his MentorCruise profile: ${mentoring.numbers.map((f) => `${f.label} ${f.value}`).join("; ")}.`,
      "/mentoring"
    ),
    "",
    `### ${mentoring.fit.title}`,
    "",
    mentoring.fit.items.map((i) => c.fact(i, "/mentoring")),
    "",
    `### ${mentoring.notFit.title}`,
    "",
    mentoring.notFit.items.map((i) => c.fact(i, "/mentoring")),
    "",
    `### ${mentoring.how.title}`,
    "",
    mentoring.how.steps.map((s) => c.fact(`${s.n}. ${s.text}`, "/mentoring")),
    "",
    "### How to start",
    "",
    c.fact(
      `${mentoring.cta.line} ${mentoring.cta.action.label} (${mentoring.cta.action.href}).`,
      "/mentoring"
    ),
    c.fact(
      `${plain(mentoring.cta.alt)} (${mentoring.cta.alt
        .filter((s) => s.kind === "link")
        .map((s) =>
          s.kind === "link"
            ? `${s.text}: ${s.href.replace(/^mailto:/, "")}`
            : ""
        )
        .join("; ")})`,
      "/mentoring"
    ),
    "",
    `### ${mentoring.said.title}`,
    "",
    c.fact(mentoring.said.body, "/mentoring"),
    getTestimonialPile().map(
      (t) =>
        `- "${t.quote.replace(/\s*\n\s*/g, " ")}" (${t.author}${t.source === "direct" ? "" : `, via ${t.source === "mentorcruise" ? "MentorCruise" : "LinkedIn"}`}${t.duration ? `, mentee for ${t.duration}` : ""}${t.year ? `, ${t.year}` : ""}) (source: /mentoring)`
    ),
    ""
  )

  /* Working with him, reaching him ----------------------------------------- */

  const fewTimes = home.paragraphs
    .flatMap((p) => sentences(plain(p)))
    .filter((s) => /few times a year/i.test(s))
  const work = lines(
    "## How to work with him and how to reach him",
    "",
    c.fact(site.footer.ask, "/#contact"),
    c.fact(plain(site.footer.contact), "/#contact"),
    fewTimes.map((s) => c.fact(s, "/")),
    "",
    `### ${home.howIWork.title} (the home page)`,
    "",
    home.howIWork.steps.map((s) =>
      c.fact(`${s.title}: ${s.body}`, "/#how-i-work")
    ),
    "",
    "### Contact",
    "",
    `- Book a 15-minute discovery call: ${site.links.booking}. The fastest way in. (source: /#contact)`,
    `- Email: ${site.links.email}. The second way to reach him. (source: /#contact)`,
    `- LinkedIn: ${site.links.linkedin} (source: /#contact)`,
    `- X: ${site.links.x} (source: /#contact)`,
    `- GitHub: ${site.links.github} (source: /#contact)`,
    `- MentorCruise: ${site.links.mentorcruise} (source: /mentoring)`,
    `- CV: /cv, and as a PDF: ${site.links.cv} (source: /cv)`,
    "",
    "### Press",
    "",
    c.fact(`Short bio, ready to paste: "${press.shortBio.text}"`, "/press"),
    press.oneLiners.items.map((i) => c.fact(`One-liner: "${i}"`, "/press")),
    c.fact(
      `The press kit has the short bio, one-liners, the facts and a headshot to download. ${sentenceCase(press.menu.foot)}.`,
      "/press"
    ),
    press.longBio ? c.fact(press.longBio.text, "/press") : undefined,
    ""
  )

  /* The postscript --------------------------------------------------------- */

  // The About page's postscript, as plain text (the button and its effect
  // are not part of what Ask knows).
  const ps = about.postscript?.enabled ? about.postscript : undefined
  const postscript = ps
    ? lines(
        "## A postscript on the About page",
        "",
        c.fact(`${ps.lead} ${ps.before} ${ps.game.name} ${ps.after}`, "/about"),
        c.fact(
          `His favourite ${ps.game.name} champions: ${ps.champions.map((x) => x.name).join(" and ")}.`,
          "/about"
        ),
        ""
      )
    : ""

  /* Notes ------------------------------------------------------------------ */

  const warnings: string[] = []
  const rawNotes = readFileSync(join(root, NOTES_PATH), "utf8")
  const notes = rawNotes.replace(/<!--[\s\S]*?-->/g, "")
  // The notes state the site's date in words; it must be `SITE.updated`, or
  // the model would give a date the site no longer shows. A hard failure, so
  // `context:check` catches it too.
  const stated = notes.match(/last updated on (\d{1,2} [A-Z][a-z]+ \d{4})/)
  if (stated && stated[1] !== updatedInWords(site.updated))
    throw new Error(
      `${NOTES_PATH} says the site was last updated on ${stated[1]}, but content/site.ts \`updated\` is ${site.updated} (${updatedInWords(site.updated)}). Change one of them.`
    )
  if (
    /\b(wife|husband|daughter|son|kids?|children|girlfriend|boyfriend|salary|revenue|income|address|phone)\b/i.test(
      notes
    )
  )
    warnings.push(
      `${NOTES_PATH} mentions a word that should not be there (family, money or address). Read content/ask/README.md.`
    )
  const notesOut: string[] = []
  for (const line of notes.split("\n")) {
    if (/^# /.test(line)) continue // the file's own title
    if (/^\s*-\s/.test(line)) {
      const text = c.clean(line.replace(/^\s*-\s+/, ""), NOTES_PATH)
      if (text) {
        if (!/\(source: [^)]+\)\s*$/.test(text))
          warnings.push(
            `${NOTES_PATH}: "${text}" has no (source: /path) at the end.`
          )
        notesOut.push(`- ${text}`)
      }
    } else if (/^#{2,}\s/.test(line)) {
      notesOut.push(line.replace(/^##\s/, "### "))
    } else if (line.trim()) {
      const text = c.clean(line, NOTES_PATH)
      if (text) notesOut.push(text)
    } else notesOut.push("")
  }
  // Drop headings left with nothing under them.
  const notesPart = lines(
    "## Notes from Mladen",
    "",
    c.fact("Public notes he keeps for this assistant.", "/about"),
    "",
    notesOut
      .join("\n")
      .replace(/^### .*\n+(?=### |(?![\s\S]))/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
    ""
  )

  /* Site map --------------------------------------------------------------- */

  const workPage = getWorkPage()
  const pages: SiteMapEntry[] = [
    { href: "/", label: "Home", what: home.seo.description },
    {
      href: "/#recent-work",
      label: "Recent work",
      what: "The strip of recent work on the home page.",
    },
    {
      href: "/#everything",
      label: "The list of work he has put real time into",
      what: list.title,
    },
    {
      href: "/#how-i-work",
      label: "How he works",
      what: "The four steps on the home page.",
    },
    {
      href: "/#mentoring",
      label: "Mentoring on the home page",
      what: home.mentoring.body,
    },
    { href: "/#contact", label: "Contact", what: site.footer.ask },
    { href: "/work", label: "All work", what: workPage.intro },
    { href: "/about", label: "About", what: about.seo.description },
    { href: "/mentoring", label: "Mentoring", what: mentoring.title },
    {
      href: "/press",
      label: "Press kit",
      what: "Short bio, one-liners, facts and a headshot, ready to copy.",
    },
    {
      href: "/cv",
      label: "CV",
      what: "His CV: experience, projects, mentoring and skills.",
    },
    { href: site.links.cv, label: "CV (PDF)", what: cv.download.label },
    {
      href: site.links.booking,
      label: "Book a 15-minute call",
      what: "A 15-minute discovery call with him.",
    },
    {
      href: `mailto:${site.links.email}`,
      label: `Email ${site.name.split(" ")[0]}`,
      what: site.links.email,
    },
    {
      href: site.links.linkedin,
      label: "LinkedIn",
      what: "His LinkedIn profile.",
    },
    { href: site.links.x, label: "X", what: "His X profile." },
    { href: site.links.github, label: "GitHub", what: "His GitHub profile." },
    {
      href: site.links.mentorcruise,
      label: "MentorCruise profile",
      what: "His mentor profile on MentorCruise.",
    },
  ]
  const allLinks = [
    ...pages,
    ...siteMap.filter((e) => !pages.some((p) => p.href === e.href)),
  ]
  const mapPart = lines(
    "## Site map",
    "",
    "The only links an answer may point to, one per line: `- <href> | <label> | <what it is>`.",
    "",
    allLinks.map(
      (e) => `- ${e.href} | ${e.label} | ${c.clean(e.what, e.href) || e.label}`
    ),
    ""
  )

  const markdown = lines(
    `# What the site says about ${site.name}`,
    "",
    `Generated from the site's content on ${site.updated} by scripts/build-ask-context.ts. Do not edit by hand: change content/** or content/ask/notes.md and run the script again.`,
    "",
    `How to read this: quoted site copy is written by ${site.name.split(" ")[0]} in the first person, so "I", "my" and "we" there are him. Every fact ends with (source: <path>), the page of ${site.url} it comes from.`,
    "",
    who,
    now,
    entries.join("\n"),
    early,
    cvPart,
    mentoringPart,
    work,
    postscript,
    notesPart,
    mapPart
  )
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd()
    .concat("\n")

  return { markdown, dropped: c.dropped, siteMap: allLinks, warnings }
}
