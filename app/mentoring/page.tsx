import type { Metadata } from "next"

import { getMentoring, getTestimonials } from "@/lib/content"
import { pageMetadata } from "@/lib/seo/metadata"

import {
  Button,
  Display,
  Eyebrow,
  PageTransition,
  Section,
  SectionHeader,
} from "../components/primitives"

const mentoring = getMentoring()

export const metadata: Metadata = pageMetadata({
  title: mentoring.seo.title,
  description: mentoring.seo.description,
  path: "/mentoring",
})

/** SKELETON. Owned by the work-system agent. */
export default function MentoringPage() {
  const copy = getMentoring()
  const testimonials = getTestimonials()

  return (
    <PageTransition>
      <main id="main">
        <Section label="Mentoring">
          <Display as="h1" size="hero">
            {copy.h1}
          </Display>
          <p className="mt-6 max-w-[52ch] text-[20px] leading-[1.45] text-dim">
            {copy.lede}
          </p>

          <div className="mt-12">
            <Eyebrow as="h2">Who it is for</Eyebrow>
            <ul className="mt-4 grid list-none gap-2 p-0 text-dim-2">
              {copy.whoFor.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="mt-12">
            <Eyebrow as="h2">How it works</Eyebrow>
            <ol className="mt-4 grid list-none gap-6 p-0">
              {copy.howItWorks.map((step, i) => (
                <li key={step.title} className="flex gap-6">
                  <span className="font-mono text-[12px] text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block text-[18px]">{step.title}</span>
                    <span className="mt-1 block text-dim-2">{step.body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-12">
            <Eyebrow as="h2">Topics</Eyebrow>
            <ul className="mt-4 flex list-none flex-wrap gap-2 p-0 text-dim-2">
              {copy.topics.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          </div>

          <div className="mt-12">
            <Eyebrow as="h2">What I expect</Eyebrow>
            <ul className="mt-4 grid list-none gap-2 p-0 text-dim-2">
              {copy.expectations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Button href={copy.cta.url} size="lg">
              {copy.cta.label}
            </Button>
            {copy.cta.note ? (
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                {copy.cta.note}
              </span>
            ) : null}
          </div>
        </Section>

        <Section label="Feedback" divider>
          <SectionHeader
            title="What mentees say"
            meta={`${testimonials.length} of many`}
          />
          <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-2">
            {testimonials.map((testimonial) => (
              <li
                key={testimonial.id}
                className="rounded-sm border border-line bg-surface p-5"
              >
                <blockquote className="m-0 text-[17px] leading-[1.5]">
                  {testimonial.quote}
                </blockquote>
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                  {testimonial.author} · {testimonial.source}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      </main>
    </PageTransition>
  )
}
