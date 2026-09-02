import type { WorkEntry } from "@/lib/content/schema"
import { COMPANIES } from "@/content/companies"
import { SITE } from "@/content/site"

/**
 * JSON-LD builders. Values come from `content/`, so there is one source of truth
 * for the page copy, the markdown mirrors and the structured data.
 *
 * Everything here is a plain object: pass it through `jsonLdScript()` into a
 * `<script type="application/ld+json">`.
 */

const PERSON_ID = `${SITE.url}/#person`
const WEBSITE_ID = `${SITE.url}/#website`

/* -------------------------------------------------------------------------- */
/* Person / WebSite                                                           */
/* -------------------------------------------------------------------------- */

export function personJsonLd() {
  const current = COMPANIES.find((c) => c.to === "now")
  const past = COMPANIES.filter((c) => c.to !== "now" && c.id !== "freelance")

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": PERSON_ID,
    name: SITE.name,
    url: SITE.url,
    image: `${SITE.url}/mladen-ruzicic.png`,
    jobTitle: SITE.roles,
    description: SITE.tagline,
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.location.city,
      addressCountry: SITE.location.country,
    },
    worksFor: [
      ...(current ? [{ "@type": "Organization", name: current.name }] : []),
      {
        "@type": "Organization",
        name: "TenderLift",
        url: "https://tenderlift.ch",
      },
    ],
    alumniOf: past.map((c) => ({ "@type": "Organization", name: c.name })),
    sameAs: [SITE.links.linkedin, SITE.links.github, SITE.links.mentorcruise],
    knowsAbout: [
      "product management",
      "design systems",
      "React",
      "TypeScript",
      "AI-native product development",
      "public procurement",
      "mentoring",
    ],
  }
}

/** The site itself. Emitted once, from the root layout. */
export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    inLanguage: "en",
    publisher: { "@id": PERSON_ID },
  }
}

/* -------------------------------------------------------------------------- */
/* Pages                                                                      */
/* -------------------------------------------------------------------------- */

export interface PageJsonLdInput {
  name: string
  description: string
  /** Path with a leading slash. */
  path: string
  /** `YYYY-MM-DD`, when the content declares one. */
  dateModified?: string
}

/** Generic `WebPage`. Used by `/mentoring` and `/uses`. */
export function webPageJsonLd({
  name,
  description,
  path,
  dateModified,
}: PageJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: `${SITE.url}${path}`,
    inLanguage: "en",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": PERSON_ID },
    ...(dateModified ? { dateModified } : null),
  }
}

/** `/about` — a `ProfilePage` whose `mainEntity` is the Person. */
export function profilePageJsonLd({
  name,
  description,
  path,
  dateModified,
}: PageJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name,
    description,
    url: `${SITE.url}${path}`,
    inLanguage: "en",
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: { "@id": PERSON_ID },
    ...(dateModified ? { dateModified } : null),
  }
}

/* -------------------------------------------------------------------------- */
/* Work                                                                       */
/* -------------------------------------------------------------------------- */

export function creativeWorkJsonLd(entry: WorkEntry) {
  const company = entry.company
    ? COMPANIES.find((c) => c.id === entry.company)
    : undefined

  const from = entry.period.from
  // ISO 8601 spells an open-ended interval `2024/..`. An empty right-hand side
  // (`2024/`) is not a valid interval and schema.org consumers drop it.
  const to = entry.period.to === "now" ? ".." : entry.period.to

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${SITE.url}/work/${entry.slug}#work`,
    name: entry.title,
    abstract: entry.line,
    description: entry.detail,
    url: `${SITE.url}/work/${entry.slug}`,
    ...(entry.url ? { sameAs: [entry.url] } : null),
    creator: { "@id": PERSON_ID },
    author: { "@id": PERSON_ID },
    ...(company
      ? { sourceOrganization: { "@type": "Organization", name: company.name } }
      : null),
    temporalCoverage: `${from}/${to}`,
    genre: entry.kind,
    keywords: entry.tech.join(", "),
    isPartOf: { "@id": WEBSITE_ID },
  }
}

/** `/work` — the index, in the order the page renders it. */
export function itemListJsonLd(
  entries: WorkEntry[],
  { name = "Work", path = "/work" } = {}
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: `${SITE.url}${path}`,
    numberOfItems: entries.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: entries.map((entry, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: entry.title,
      description: entry.line,
      url: `${SITE.url}/work/${entry.slug}`,
    })),
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      // `/` would give a trailing slash the home `<link rel=canonical>` and the
      // sitemap `<loc>` do not have. Same document, same spelling everywhere.
      item: item.path === "/" ? SITE.url : `${SITE.url}${item.path}`,
    })),
  }
}

/* -------------------------------------------------------------------------- */
/* Serialisation                                                              */
/* -------------------------------------------------------------------------- */

/** Serialise for a `<script type="application/ld+json">` tag. */
export function jsonLdScript(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") }
}
