import type { Metadata } from "next"

import { getMentoring } from "@/lib/content"
import { pageMetadata } from "@/lib/seo/metadata"

import "../styles/mentoring.css"
import "../styles/brand-link.css"

import { MenteesSaid } from "../components/mentoring/MenteesSaid"
import { MentoringCta } from "../components/mentoring/MentoringCta"
import {
  MentoringFit,
  MentoringSteps,
} from "../components/mentoring/MentoringFit"
import { MentoringIntro } from "../components/mentoring/MentoringIntro"
import { JsonLd } from "../components/seo/JsonLd"
import { PageFrame } from "../components/site/PageFrame"

const { seo } = getMentoring()

export const metadata: Metadata = pageMetadata({
  title: seo.title,
  description: seo.description,
  path: "/mentoring",
  type: "website",
})

/**
 * `/mentoring`, in the order of `Landing-Mentoring.dc.html` (desktop) and
 * `Landing-Mentoring-Mobile.dc.html` (phone): top block with "Mentoring" under
 * the name, the heading and proof line, what mentees said (the pile, above
 * the rules), who it is for, how it works, then the closing block with the
 * booking button ("Think it's a fit?"), and the site's one footer.
 */
export default function MentoringPage() {
  return (
    <PageFrame page="mentoring">
      <JsonLd page="mentoring" />
      <MentoringIntro />
      <MenteesSaid />
      <MentoringFit />
      <MentoringSteps />
      <MentoringCta />
    </PageFrame>
  )
}
