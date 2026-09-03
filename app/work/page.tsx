import type { Metadata } from "next"

import { getWork, getWorkPage } from "@/lib/content"
import {
  breadcrumbJsonLd,
  itemListJsonLd,
  jsonLdScript,
} from "@/lib/seo/jsonld"
import { pageMetadata } from "@/lib/seo/metadata"

import {
  Container,
  Display,
  Eyebrow,
  PageTransition,
} from "../components/primitives"
import {
  FILTER_IDS,
  groupOf,
  GROUPS,
  topicsFor,
  WorkCard,
  WorkExplorer,
  type ExplorerGroup,
  type FilterId,
} from "../components/work-system"

const copy = getWorkPage()

export const metadata: Metadata = pageMetadata({
  title: copy.seo.title,
  description: copy.seo.description,
  path: "/work",
  type: "website",
})

/**
 * The work index — docs/v3-redesign-plan.md §6.
 *
 * Grouped Featured → Company chapters → Independent products → Experiments and
 * archive, derived from `kind` / `status` / `featured` (see `groupOf`). The
 * cards are Server Components; only the filter row and the re-parenting live on
 * the client, inside `WorkExplorer`.
 */
export default function WorkIndexPage() {
  const work = getWork()

  const withTopics = work.map((entry) => ({
    entry,
    topics: topicsFor(entry),
  }))

  const counts = Object.fromEntries(
    FILTER_IDS.map((id) => [
      id,
      id === "all"
        ? work.length
        : withTopics.filter((item) => item.topics.includes(id)).length,
    ])
  ) as Record<FilterId, number>

  const groups: ExplorerGroup[] = GROUPS.map((group) => ({
    ...group,
    items: withTopics
      .filter(({ entry }) => groupOf(entry) === group.id)
      .map(({ entry, topics }) => ({
        slug: entry.slug,
        topics,
        card: <WorkCard entry={entry} />,
      })),
  })).filter((group) => group.items.length > 0)

  return (
    <PageTransition>
      <div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript([
            itemListJsonLd(work),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Work", path: "/work" },
            ]),
          ])}
        />

        <Container className="py-[72px] md:py-[96px]">
          <header className="max-w-[52ch]">
            <Eyebrow
              items={copy.eyebrow.map((item) =>
                item.replace("{count}", String(work.length))
              )}
            />
            <Display as="h1" size="section" className="mt-6">
              {copy.h1}
            </Display>
            <p className="mt-6 mb-0 text-[19px] leading-[1.5] text-dim">
              {copy.lede}
            </p>
          </header>

          <div className="mt-12">
            <WorkExplorer groups={groups} counts={counts} />
          </div>
        </Container>
      </div>
    </PageTransition>
  )
}
