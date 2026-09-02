import type { Metadata } from "next"

import { getMentoring, getTestimonials } from "@/lib/content"
import { jsonLdScript, webPageJsonLd } from "@/lib/seo/jsonld"
import { pageMetadata } from "@/lib/seo/metadata"

import {
  Button,
  Chip,
  Container,
  Display,
  Eyebrow,
  PageTransition,
  Section,
  SectionHeader,
} from "../components/primitives"
import { GrainSurface } from "../components/shaders"
import { TestimonialGrid } from "./TestimonialGrid"

const mentoring = getMentoring()

export const metadata: Metadata = pageMetadata({
  title: mentoring.seo.title,
  description: mentoring.seo.description,
  path: "/mentoring",
})

/**
 * `/mentoring` — docs/v3-redesign-plan.md §6.
 *
 * `GrainSurface` is the one shader on this page (§5.2: one animated context per
 * screen) and it only covers the header. Structured data stays deliberately
 * modest: a `WebPage` that points at the `Person`, not a `Service` — I am not
 * publishing prices or an offer catalogue, and marking one up would be a claim
 * the page does not make.
 */
export default function MentoringPage() {
  const copy = getMentoring()
  const testimonials = getTestimonials()

  return (
    <PageTransition>
      <div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(
            webPageJsonLd({
              name: copy.seo.title,
              description: copy.seo.description,
              path: "/mentoring",
            })
          )}
        />

        <header className="relative isolate overflow-hidden border-b border-line-soft">
          <GrainSurface />
          <div aria-hidden className="scrim-header" />
          <Container className="relative z-[2] py-[80px] md:py-[112px]">
            <Eyebrow items={["Mentoring", "One to one", "Since 2021"]} />
            <Display as="h1" size="section" className="mt-6 max-w-[18ch]">
              {copy.h1}
            </Display>
            <p className="mt-7 mb-0 max-w-[54ch] text-[19px] leading-[1.5] text-dim">
              {copy.lede}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button href={copy.cta.url} size="lg">
                {copy.cta.label}
              </Button>
              {copy.cta.note ? (
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                  {copy.cta.note}
                </span>
              ) : null}
            </div>
          </Container>
        </header>

        <Section label="Who it is for" className="py-[72px] md:py-[96px]">
          <div className="grid gap-x-16 gap-y-14 lg:grid-cols-2">
            <section aria-labelledby="who-for">
              <Eyebrow as="h2" id="who-for" className="text-fg">
                Who it&rsquo;s for
              </Eyebrow>
              <ul className="mt-7 m-0 grid list-none gap-0 p-0">
                {copy.whoFor.map((item) => (
                  <li
                    key={item}
                    className="border-t border-line-soft py-4 text-[17px] leading-[1.5] text-dim last:border-b"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="expectations">
              <Eyebrow as="h2" id="expectations" className="text-fg">
                What I expect
              </Eyebrow>
              <ul className="mt-7 m-0 grid list-none gap-0 p-0">
                {copy.expectations.map((item) => (
                  <li
                    key={item}
                    className="border-t border-line-soft py-4 text-[17px] leading-[1.5] text-dim last:border-b"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </Section>

        <Section
          label="How it works"
          divider
          className="py-[72px] md:py-[96px]"
        >
          <SectionHeader
            title="How it works"
            meta={`${copy.howItWorks.length} steps, in order`}
          />
          {/* A real sequence — you cannot do step three before step one — so an
              ordered list with visible numbers is the honest markup. */}
          <ol className="m-0 grid list-none gap-px overflow-hidden rounded-sm border border-line bg-line p-0 md:grid-cols-3">
            {copy.howItWorks.map((step, index) => (
              <li key={step.title} className="bg-surface p-7">
                <span className="font-mono text-[11px] uppercase leading-none tracking-[0.1em] text-accent tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-5 mb-0 font-sans text-[19px] font-semibold leading-[1.25] text-fg">
                  {step.title}
                </h3>
                <p className="mt-3 mb-0 text-[16px] leading-[1.55] text-dim-2">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </Section>

        <Section label="Topics" divider className="py-[72px] md:py-[96px]">
          <SectionHeader
            title="Topics"
            meta="Bring your own; these are the usual ones"
          />
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {copy.topics.map((topic) => (
              <li key={topic}>
                <Chip className="px-[14px] py-[10px] text-[12px]">{topic}</Chip>
              </li>
            ))}
          </ul>
        </Section>

        <Section label="Feedback" divider className="py-[72px] md:py-[96px]">
          <SectionHeader
            title="What mentees say"
            meta={`${testimonials.length} public quotes`}
          />
          <TestimonialGrid testimonials={testimonials} />
        </Section>

        <Section label="Start" divider className="py-[72px] md:py-[96px]">
          <div className="flex flex-col items-start gap-7">
            <Display as="h2" size="sub" className="max-w-[20ch]">
              {"Bring something {specific} and we will start there."}
            </Display>
            <div className="flex flex-wrap items-center gap-4">
              <Button href={copy.cta.url} size="lg">
                {copy.cta.label}
              </Button>
              {copy.cta.note ? (
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                  {copy.cta.note}
                </span>
              ) : null}
            </div>
          </div>
        </Section>
      </div>
    </PageTransition>
  )
}
