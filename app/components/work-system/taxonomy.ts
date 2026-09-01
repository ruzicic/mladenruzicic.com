import type { WorkEntry, WorkStatus } from "@/lib/content/schema"

/**
 * The `/work` taxonomy: the filter set, the topic derivation and the small
 * label helpers shared by the index, the case study and the markdown mirrors.
 *
 * No `'use client'` here on purpose — `WorkFilters` (a client island) imports
 * `FILTERS` and `filterLabel`, and the server pages import the rest. Keep this
 * module free of `node:fs` so the client bundle stays clean.
 */

export const FILTER_IDS = [
  "all",
  "company",
  "product",
  "experiment",
  "ai",
  "platform",
  "mobile",
  "design-systems",
  "founder",
] as const

export type FilterId = (typeof FILTER_IDS)[number]

export const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "company", label: "Company" },
  { id: "product", label: "Product" },
  { id: "experiment", label: "Experiment" },
  { id: "ai", label: "AI" },
  { id: "platform", label: "Platform" },
  { id: "mobile", label: "Mobile" },
  { id: "design-systems", label: "Design systems" },
  { id: "founder", label: "Founder" },
]

export function isFilterId(
  value: string | null | undefined
): value is FilterId {
  return (
    typeof value === "string" &&
    (FILTER_IDS as readonly string[]).includes(value)
  )
}

export function filterLabel(id: FilterId): string {
  return FILTERS.find((f) => f.id === id)?.label ?? "All"
}

/**
 * Topic filters are derived, not authored, so a new case study picks them up
 * without a second place to edit. Matched against the fields a reader can see
 * (tech, role, line, detail) — never against private notes.
 */
const TOPIC_PATTERNS: Record<
  Exclude<FilterId, "all" | "company" | "product" | "experiment">,
  RegExp
> = {
  ai: /\b(ai|llm|agent|agentic|model|prompt|machine learning|classif|summari[sz])/i,
  platform:
    /\b(platform|sdk|infrastructur|monorepo|nx\b|api\b|pipeline|micro-?service|multi-?tenant|cloudflare|aws\b)/i,
  mobile: /\b(react native|expo\b|ios\b|android|mobile|app store|tablet)/i,
  "design-systems":
    /\b(design system|component librar|tokens?\b|velocity|ui platform|storybook|figma)/i,
  founder: /\b(founder|owner|solo builder|bootstrap)/i,
}

/** Every filter id an entry belongs to, `all` excluded. */
export function topicsFor(entry: WorkEntry): FilterId[] {
  const haystack = [
    entry.title,
    entry.role,
    entry.line,
    entry.detail,
    ...entry.tech,
  ].join(" · ")

  const topics: FilterId[] = [entry.kind]
  for (const [id, pattern] of Object.entries(TOPIC_PATTERNS)) {
    if (pattern.test(haystack)) topics.push(id as FilterId)
  }
  return topics
}

export function matchesFilter(topics: FilterId[], filter: FilterId): boolean {
  return filter === "all" || topics.includes(filter)
}

/* -------------------------------------------------------------------------- */
/* Labels                                                                     */
/* -------------------------------------------------------------------------- */

const STATUS_LABELS: Record<WorkStatus, string> = {
  current: "Current",
  active: "Active",
  maintained: "Maintained",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
}

export function statusLabel(status: WorkStatus): string {
  return STATUS_LABELS[status]
}

/** `current` and `active` read as live; everything else is history. */
export function statusIsLive(status: WorkStatus): boolean {
  return status === "current" || status === "active"
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

/** `2023-10` → `Oct 2023`; `2023` → `2023`; `now` → `now`. */
export function formatPeriodPart(value: string): string {
  if (value === "now") return "now"
  const [year, month] = value.split("-")
  if (!month) return year
  return `${MONTHS[Number(month) - 1] ?? month} ${year}`
}

/** `Oct 2023 – now`. */
export function formatPeriod(period: WorkEntry["period"]): string {
  const from = formatPeriodPart(period.from)
  const to = formatPeriodPart(String(period.to))
  return from === to ? from : `${from} – ${to}`
}

/** The compact year range used on cards: `2023–now`. */
export function formatYears(period: WorkEntry["period"]): string {
  const from = period.from.slice(0, 4)
  const to = period.to === "now" ? "now" : String(period.to).slice(0, 4)
  return from === to ? from : `${from}–${to}`
}

/** Host without `www.`, for link labels. */
export function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "")
  } catch {
    return url
  }
}

/* -------------------------------------------------------------------------- */
/* Grouping                                                                   */
/* -------------------------------------------------------------------------- */

export type GroupId = "featured" | "companies" | "products" | "archive"

export interface GroupSpec {
  id: GroupId
  label: string
  blurb: string
}

export const GROUPS: GroupSpec[] = [
  {
    id: "featured",
    label: "Featured",
    blurb: "The five I would show first.",
  },
  {
    id: "companies",
    label: "Company chapters",
    blurb: "Where I was employed, and what I owned there.",
  },
  {
    id: "products",
    label: "Independent products",
    blurb: "Built and operated on my own time.",
  },
  {
    id: "archive",
    label: "Experiments and archive",
    blurb: "Smaller things, paused things, and things that had their moment.",
  },
]

/**
 * Featured → company chapters → independent products → experiments and archive.
 * `status` decides the last split: anything paused or archived falls to the
 * archive regardless of `kind`.
 */
export function groupOf(entry: WorkEntry): GroupId {
  if (entry.featured) return "featured"
  if (entry.kind === "experiment") return "archive"
  if (entry.status === "archived" || entry.status === "paused") return "archive"
  if (entry.kind === "company") return "companies"
  return "products"
}
