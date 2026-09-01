import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { MDXRemote } from "next-mdx-remote/rsc"

import { getWork, getWorkBySlug, getWorkSlugs } from "@/lib/content"
import {
  breadcrumbJsonLd,
  creativeWorkJsonLd,
  jsonLdScript,
} from "@/lib/seo/jsonld"
import { pageMetadata } from "@/lib/seo/metadata"

import {
  Chip,
  Eyebrow,
  PageTransition,
  Section,
  SharedElement,
  TransitionLink,
  workArtTransitionName,
} from "../../components/primitives"

type Params = { slug: string }

/**
 * Every slug is prerendered by `generateStaticParams`, but Cache Components
 * still builds a runtime fallback shell for unknown slugs — and Next's generated
 * `opengraph-image` metadata module awaits `params` there. That is a blocking
 * navigation by definition, so opt this segment out of instant validation.
 * (`dynamicParams` is not allowed alongside `cacheComponents`.)
 */
export const instant = false

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

/** SKELETON. Owned by the work-system agent (shader header, gallery, metrics). */
export default async function WorkDetailPage({
  params,
}: {
  params: Promise<Params>
}) {
  "use cache"
  const { slug } = await params
  const entry = getWorkBySlug(slug)
  if (!entry) notFound()

  const related = getWork()
    .filter((w) => w.slug !== entry.slug && w.company === entry.company)
    .slice(0, 3)

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
              { name: "Work", path: "/work" },
              { name: entry.title, path: `/work/${entry.slug}` },
            ])
          )}
        />

        <Section label={entry.title}>
          <SharedElement name={workArtTransitionName(entry.slug)}>
            <div
              className="aspect-[16/10] w-full rounded-sm bg-surface"
              style={{ outline: `1px solid ${entry.accent}33` }}
            />
          </SharedElement>

          <Eyebrow
            className="mt-8"
            items={[
              `${entry.period.from}–${entry.period.to}`,
              entry.status,
              entry.role,
              ...(entry.period.approx ? ["dates approximate"] : []),
            ]}
          />
          <h1 className="mt-4 font-display text-[clamp(34px,3.6vw,56px)] leading-none tracking-[-0.02em]">
            {entry.title}
          </h1>
          <p className="mt-4 max-w-[36ch] text-[22px] leading-[1.4]">
            {entry.line}
          </p>
          <p className="mt-3 max-w-[52ch] text-[17px] leading-[1.55] text-dim-2">
            {entry.detail}
          </p>

          <ul className="mt-5 flex list-none flex-wrap gap-2 p-0">
            {entry.tech.map((tech) => (
              <li key={tech}>
                <Chip>{tech}</Chip>
              </li>
            ))}
          </ul>

          {entry.metrics?.length ? (
            <ul className="mt-8 grid list-none gap-4 p-0 sm:grid-cols-3">
              {entry.metrics.map((metric) => (
                <li
                  key={metric.label}
                  className="rounded-sm border border-line p-4"
                >
                  <p className="m-0 font-display text-[32px] leading-none">
                    {metric.value}
                  </p>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                    {metric.label}
                    {metric.confidence === "needs-verification"
                      ? " · unverified"
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}

          {entry.confidentiality !== "public" ? (
            <p className="mt-8 rounded-sm border border-line-soft bg-surface-3 p-4 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
              Public information only. Internal metrics and screenshots are
              withheld.
            </p>
          ) : null}

          <div className="prose prose-invert mt-10 max-w-[68ch]">
            <MDXRemote source={entry.body} />
          </div>

          {entry.links?.length || entry.url ? (
            <ul className="mt-8 flex list-none flex-wrap gap-4 p-0 font-mono text-[12px] uppercase tracking-[0.08em] text-accent">
              {entry.url ? (
                <li>
                  <a href={entry.url} rel="noreferrer noopener" target="_blank">
                    {new URL(entry.url).host} ↗
                  </a>
                </li>
              ) : null}
              {entry.links?.map((link) => (
                <li key={link.url}>
                  <a href={link.url} rel="noreferrer noopener" target="_blank">
                    {link.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          {related.length ? (
            <div className="mt-16">
              <Eyebrow as="h2">Related</Eyebrow>
              <ul className="mt-4 flex list-none flex-wrap gap-4 p-0">
                {related.map((item) => (
                  <li key={item.slug}>
                    <TransitionLink href={`/work/${item.slug}`}>
                      {item.title}
                    </TransitionLink>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="mt-12">
            <TransitionLink
              href="/work"
              className="font-mono text-[12px] uppercase tracking-[0.08em] text-muted"
            >
              ← All work
            </TransitionLink>
          </p>
        </Section>
      </main>
    </PageTransition>
  )
}
