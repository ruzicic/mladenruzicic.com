import { getHome } from "@/lib/content"

import { DentGate } from "./components/landing/dent/DentGate"
import { Headline } from "./components/landing/Headline"
import { HowIWork } from "./components/landing/HowIWork"
import { MentoringBlock } from "./components/landing/MentoringBlock"
import { Story } from "./components/landing/Story"
import { Strip } from "./components/landing/Strip"
import { JsonLd } from "./components/seo/JsonLd"
import { PageFrame } from "./components/site/PageFrame"
import { Ledger } from "./components/work/Ledger"

/**
 * The landing page, in the order of `Landing.dc.html`: top block (rendered by
 * `PageFrame`), the cycling headline, the story (four paragraphs),
 * the "Recent work" strip, the list of everything built, "How I work", the
 * mentoring block, and the dark footer (also `PageFrame`).
 *
 * Each section component owns its `<section>`, `id` and heading; this file
 * only fixes the order. `DentGate` (the pressed paper, `HOME.dent`) renders
 * nothing; it loads the effect later, only where it can run.
 */
export default function HomePage() {
  const { dent } = getHome()
  return (
    <PageFrame home>
      <JsonLd page="home" />
      <Headline />
      <Story />
      <Strip />
      <Ledger />
      <HowIWork />
      <MentoringBlock />
      {dent ? <DentGate /> : null}
    </PageFrame>
  )
}
