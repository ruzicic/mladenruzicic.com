import type { Metadata } from "next"

import { getWork } from "@/lib/content"
import { pageMetadata } from "@/lib/seo/metadata"

import {
  Chip,
  Eyebrow,
  PageTransition,
  Section,
  SectionHeader,
  SharedElement,
  TransitionLink,
  workArtTransitionName,
} from "../components/primitives"

export const metadata: Metadata = pageMetadata({
  title: "Work",
  description:
    "Case studies and products: companies I have worked for, things I have built, and experiments worth keeping.",
  path: "/work",
})

/** SKELETON. Owned by the work-system agent. */
export default function WorkIndexPage() {
  const work = getWork()
  const groups = [
    { id: "featured", label: "Featured", items: work.filter((w) => w.featured) },
    {
      id: "companies",
      label: "Companies",
      items: work.filter((w) => !w.featured && w.kind === "company"),
    },
    {
      id: "independent",
      label: "Independent",
      items: work.filter((w) => !w.featured && w.kind === "product"),
    },
    {
      id: "experiments",
      label: "Experiments",
      items: work.filter((w) => !w.featured && w.kind === "experiment"),
    },
  ]

  return (
    <PageTransition>
      <main id="main">
        <Section label="Work">
          <SectionHeader title="Work" meta={`${work.length} entries`} />
          {groups.map((group) =>
            group.items.length === 0 ? null : (
              <section key={group.id} className="mb-16">
                <Eyebrow as="h2" className="text-fg">
                  {group.label}
                </Eyebrow>
                <ul className="mt-6 grid list-none gap-8 p-0 md:grid-cols-2">
                  {group.items.map((entry) => (
                    <li key={entry.slug}>
                      <TransitionLink href={`/work/${entry.slug}`}>
                        <SharedElement name={workArtTransitionName(entry.slug)}>
                          <div
                            className="aspect-[16/10] w-full rounded-sm bg-surface"
                            style={{ outline: `1px solid ${entry.accent}33` }}
                          />
                        </SharedElement>
                        <Eyebrow
                          className="mt-4"
                          items={[
                            `${entry.period.from}–${entry.period.to}`,
                            entry.status,
                          ]}
                        />
                        <h3 className="mt-2 font-display text-[28px] leading-none">
                          {entry.title}
                        </h3>
                        <p className="mt-2 max-w-[46ch] text-dim-2">
                          {entry.line}
                        </p>
                      </TransitionLink>
                      <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
                        {entry.tech.slice(0, 4).map((tech) => (
                          <li key={tech}>
                            <Chip>{tech}</Chip>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </section>
            )
          )}
        </Section>
      </main>
    </PageTransition>
  )
}
