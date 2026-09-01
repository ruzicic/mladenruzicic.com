import type { Metadata } from "next"
import { MDXRemote } from "next-mdx-remote/rsc"

import { getPage } from "@/lib/content"
import { jsonLdScript, webPageJsonLd } from "@/lib/seo/jsonld"
import { pageMetadata } from "@/lib/seo/metadata"

import {
  Container,
  Display,
  Eyebrow,
  PageTransition,
} from "../components/primitives"
import { Prose } from "../components/work-system"

import "../styles/pages.css"

const page = getPage("uses")

export const metadata: Metadata = pageMetadata({
  title: page.title,
  description: page.description,
  path: "/uses",
})

export default function UsesPage() {
  const { title, description, updated, body } = getPage("uses")

  return (
    <PageTransition>
      <main id="main">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(
            webPageJsonLd({
              name: title,
              description,
              path: "/uses",
              dateModified: updated,
            })
          )}
        />

        <Container className="py-[72px] md:py-[96px]">
          <header className="max-w-[52ch]">
            <Eyebrow items={["Uses", "Hardware and software"]} />
            <Display as="h1" size="section" className="mt-6">
              {title}
            </Display>
            <p className="mt-6 mb-0 text-[19px] leading-[1.5] text-dim">
              {description}
            </p>
            <p className="mt-5 mb-0 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
              Last updated{" "}
              <time dateTime={updated} className="tabular-nums">
                {updated}
              </time>
            </p>
          </header>

          <Prose className="mt-16">
            <MDXRemote source={body} />
          </Prose>
        </Container>
      </main>
    </PageTransition>
  )
}
