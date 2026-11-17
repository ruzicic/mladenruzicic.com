import type { Metadata } from "next"

import { getCv } from "@/lib/content"
import { pageMetadata } from "@/lib/seo/metadata"

import { CvClose, CvDownload, CvPage } from "../components/cv/CvPage"
import { JsonLd } from "../components/seo/JsonLd"
import { PageFrame } from "../components/site/PageFrame"

const { seo } = getCv()

export const metadata: Metadata = pageMetadata({
  title: seo.title,
  description: seo.description,
  path: "/cv",
  type: "profile",
})

/**
 * `/cv` (owner, 17 Nov 2026): his CV as a page, in the site's frame, and
 * nothing else ("download replaces 'ask' · my header becomes just 'x' ·
 * everything below this is actually my cv"): the top row holds a close
 * control and "Download PDF", there is no Ask and no site footer. The PDF at `/cv.pdf` is this page printed
 * (`scripts/cv-pdf.ts`, the print rules in `app/styles/cv.css`), generated
 * and committed: `pnpm cv:pdf`.
 */
export default function CvRoute() {
  return (
    <PageFrame
      measure="sheet"
      start={<CvClose />}
      end={<CvDownload />}
      footer={false}
    >
      <JsonLd page="cv" />
      <CvPage />
    </PageFrame>
  )
}
