import type { Metadata } from "next"

import { getWorkPage } from "@/lib/content"
import { pageMetadata } from "@/lib/seo/metadata"

import { Container } from "../components/primitives/Container"
import { JsonLd } from "../components/seo/JsonLd"
import { PageFrame } from "../components/site/PageFrame"
import { Ledger } from "../components/work/Ledger"

const page = getWorkPage()

export const metadata: Metadata = pageMetadata({
  title: page.seo.title,
  description: page.seo.description,
  path: "/work",
  type: "website",
})

/**
 * `/work`: every product and job in one list with what happened to it. No
 * board exists; it is built in the language of the sub-page boards
 * (`Landing-Mentoring.dc.html`: 64px under the top block, a Geist Serif
 * title at 46px / 38px, one plain intro line) followed by the landing's
 * `Ledger`, complete, with the nine stories marked. Each row's `id` is its
 * product slug, so `/work#<slug>` (where retired case-study URLs redirect)
 * lands on it and `:target` washes it quietly.
 */
export default function WorkPage() {
  return (
    <PageFrame>
      <JsonLd page="work" />
      <Container
        as="header"
        className="mt-12 flex flex-col gap-4 min-[721px]:mt-16 min-[721px]:gap-[18px]"
      >
        <h1
          id="work-title"
          className="m-0 mb-1.5 font-display text-[44px] leading-[1.04] tracking-[-0.01em] text-balance text-ink min-[721px]:mb-2 min-[721px]:text-[54px] min-[721px]:leading-[1.02]"
        >
          {page.title}
        </h1>
        <p className="m-0 text-pretty text-ink-soft">{page.intro}</p>
      </Container>
      <Ledger complete labelledBy="work-title" />
    </PageFrame>
  )
}
