import type { Metadata } from "next"
import { MDXRemote } from "next-mdx-remote/rsc"

import {
  aboutNarrative,
  getAboutLinks,
  getCompanies,
  getPage,
} from "@/lib/content"
import { jsonLdScript, profilePageJsonLd } from "@/lib/seo/jsonld"
import { pageMetadata } from "@/lib/seo/metadata"

import {
  Container,
  Display,
  Eyebrow,
  PageTransition,
  Section,
  SectionHeader,
} from "../components/primitives"
import { Prose } from "../components/work-system"
import { CompanyTimeline } from "./CompanyTimeline"

const page = getPage("about")

export const metadata: Metadata = pageMetadata({
  title: page.title,
  description: page.description,
  path: "/about",
  type: "profile",
})

export default function AboutPage() {
  const { title, description, updated, body, h1, eyebrow } = getPage("about")
  const companies = getCompanies()
  const links = getAboutLinks()

  return (
    <PageTransition>
      <div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(
            profilePageJsonLd({
              name: title,
              description,
              path: "/about",
              dateModified: updated,
            })
          )}
        />

        <Container className="py-[72px] md:py-[96px]">
          <header className="max-w-[54ch]">
            <Eyebrow items={eyebrow} />
            <Display as="h1" size="section" className="mt-6">
              {h1}
            </Display>
            <p className="mt-6 mb-0 text-[19px] leading-[1.5] text-dim">
              {description}
            </p>
          </header>

          <Prose className="mt-16">
            <MDXRemote source={aboutNarrative(body)} />
          </Prose>
        </Container>

        <Section label="Timeline" divider className="py-[72px] md:py-[96px]">
          <SectionHeader
            title="Timeline"
            meta={`${companies.length} chapters · newest first`}
          />
          <CompanyTimeline companies={companies} />
        </Section>

        <Section label="Links" divider className="py-[72px] md:py-[96px]">
          <SectionHeader title="Links" meta="Elsewhere" />
          {/* Hairline rows rather than a `gap-px` grid: five links do not fill
              six cells, and an empty cell in a gap-px grid shows as a stray
              lighter block. */}
          <ul className="m-0 grid list-none border-b border-line p-0 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((link) => (
              <li key={link.href} className="border-t border-line">
                <a
                  href={link.href}
                  {...(/^https?:/.test(link.href)
                    ? { target: "_blank", rel: "noreferrer noopener" }
                    : null)}
                  className="flex h-full items-baseline justify-between gap-4 p-6 transition-colors duration-fast hover:bg-surface"
                >
                  <span className="font-sans text-[17px] font-semibold text-fg">
                    {link.label}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                    {link.note} ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </PageTransition>
  )
}
