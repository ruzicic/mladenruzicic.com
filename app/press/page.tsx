import type { Metadata } from "next"

import { getPress } from "@/lib/content"
import { pageMetadata } from "@/lib/seo/metadata"

import {
  PressBios,
  PressFacts,
  PressHeadshot,
  PressIntro,
  PressOneLiners,
} from "../components/press/PressSections"
import { JsonLd } from "../components/seo/JsonLd"
import { PageFrame } from "../components/site/PageFrame"

const { seo } = getPress()

export const metadata: Metadata = pageMetadata({
  title: seo.title,
  description: seo.description,
  path: "/press",
  type: "website",
})

/**
 * `/press`: the press kit. No board exists; it is built in the About board's
 * language from `getPress()` only: the short bio (Copy), the longer bio
 * (rendered only when content sets `longBio`; it does not today), the
 * one-liners (Copy each), the headshot with its downloads, and the facts.
 * The site's one footer.
 */
export default function PressPage() {
  return (
    <PageFrame>
      <JsonLd page="press" />
      <PressIntro />
      <PressBios />
      <PressOneLiners />
      <PressHeadshot />
      <PressFacts />
    </PageFrame>
  )
}
