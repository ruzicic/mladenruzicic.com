import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { MDXRemote } from "next-mdx-remote/rsc"

import { getWorkBySlug, getWorkSlugs } from "@/lib/content"
import {
  breadcrumbJsonLd,
  creativeWorkJsonLd,
  jsonLdScript,
} from "@/lib/seo/jsonld"
import { pageMetadata } from "@/lib/seo/metadata"

import { Container, Eyebrow, PageTransition } from "../../components/primitives"
import {
  CaseStudyHeader,
  ConfidentialityNotice,
  MediaGallery,
  MetricStrip,
  PrevNextWork,
  Prose,
  RelatedWork,
} from "../../components/work-system"

import "../../styles/pages.css"

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return getWorkSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const entry = getWorkBySlug(slug)
  if (!entry) return {}
  return pageMetadata({
    title: entry.seo.title ?? entry.title,
    description: entry.seo.description,
    path: `/work/${entry.slug}`,
  })
}

/**
 * One case study — docs/v3-redesign-plan.md §5.2, §5.3, §6.
 *
 * Statically generated for every slug so `<Link>` can prefetch it, which is the
 * precondition for the shared-element morph: the art tile and the title carry
 * `work-art-<slug>` / `work-title-<slug>` on `/`, on `/work` and here.
 */
export default async function WorkDetailPage({
  params,
}: {
  params: Promise<Params>
}) {
  "use cache"
  const { slug } = await params
  const entry = getWorkBySlug(slug)
  if (!entry) notFound()

  const publicMetrics = (entry.metrics ?? []).filter(
    (metric) => metric.confidence !== "private"
  )

  return (
    <PageTransition>
      <main id="main">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(creativeWorkJsonLd(entry))}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Work", path: "/work" },
              { name: entry.title, path: `/work/${entry.slug}` },
            ])
          )}
        />

        <CaseStudyHeader entry={entry} />

        <Container className="py-[72px] md:py-[96px]">
          <div className="grid gap-16">
            {publicMetrics.length > 0 ? (
              <MetricStrip metrics={publicMetrics} />
            ) : null}

            <ConfidentialityNotice confidentiality={entry.confidentiality} />

            <Prose>
              <MDXRemote source={entry.body} />
            </Prose>

            {entry.media?.length ? (
              <section aria-labelledby="case-media">
                <Eyebrow as="h2" id="case-media" className="text-fg">
                  Media
                </Eyebrow>
                <MediaGallery
                  media={entry.media}
                  title={entry.title}
                  className="mt-8"
                />
              </section>
            ) : null}
          </div>
        </Container>

        <Container className="pb-[72px] md:pb-[96px]">
          <div className="grid gap-16">
            <RelatedWork entry={entry} />
            <PrevNextWork entry={entry} />
          </div>
        </Container>
      </main>
    </PageTransition>
  )
}
