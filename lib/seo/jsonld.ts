import type { WorkEntry } from "@/lib/content/schema"
import { COMPANIES } from "@/content/companies"
import { SITE } from "@/content/site"

/**
 * JSON-LD builders. Values come from `content/`, so there is one source of truth
 * for the page copy, the markdown mirrors and the structured data.
 */

export function personJsonLd() {
  const current = COMPANIES.find((c) => c.to === "now")
  const past = COMPANIES.filter((c) => c.to !== "now" && c.id !== "freelance")

  return {
    "@context": "https://schema.org",
    "@type": "Person",
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

export function creativeWorkJsonLd(entry: WorkEntry) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: entry.title,
    abstract: entry.line,
    description: entry.detail,
    url: `${SITE.url}/work/${entry.slug}`,
    ...(entry.url ? { sameAs: [entry.url] } : null),
    creator: { "@type": "Person", name: SITE.name, url: SITE.url },
    keywords: entry.tech.join(", "),
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
      item: `${SITE.url}${item.path}`,
    })),
  }
}

/** Serialise for a `<script type="application/ld+json">` tag. */
export function jsonLdScript(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") }
}
