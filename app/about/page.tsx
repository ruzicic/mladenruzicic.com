import type { Metadata } from "next"

import { getAbout } from "@/lib/content"
import { pageMetadata } from "@/lib/seo/metadata"

import { AboutCV } from "../components/about/AboutCV"
import { AboutPostscript } from "../components/about/AboutPostscript"
import { AboutStory } from "../components/about/AboutStory"
import { JsonLd } from "../components/seo/JsonLd"
import { PageFrame } from "../components/site/PageFrame"

const { seo } = getAbout()

export const metadata: Metadata = pageMetadata({
  title: seo.title,
  description: seo.description,
  path: "/about",
  type: "profile",
})

/**
 * `/about`: the top block with "About" under the name (`page="about"`), the
 * portrait, "The longer story." and the story with the early projects'
 * carousel inside it (owner, 15 Nov 2026: layout B), the CV, the postscript,
 * and the site's one footer.
 */
export default function AboutPage() {
  return (
    <PageFrame page="about">
      <JsonLd page="about" />
      <AboutStory />
      <AboutCV />
      <AboutPostscript />
    </PageFrame>
  )
}
