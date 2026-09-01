import type { Metadata } from "next"
import { MDXRemote } from "next-mdx-remote/rsc"

import { getPage } from "@/lib/content"
import { pageMetadata } from "@/lib/seo/metadata"

import { Eyebrow, PageTransition, Section } from "../components/primitives"

const page = getPage("about")

export const metadata: Metadata = pageMetadata({
  title: page.title,
  description: page.description,
  path: "/about",
})

/** SKELETON. Owned by the work-system agent. */
export default function AboutPage() {
  const { title, updated, body } = getPage("about")

  return (
    <PageTransition>
      <main id="main">
        <Section label={title}>
          <Eyebrow items={["Updated", updated]} />
          <h1 className="mt-4 font-display text-[clamp(34px,3.6vw,56px)] leading-none tracking-[-0.02em]">
            {title}
          </h1>
          <div className="prose prose-invert mt-10 max-w-[68ch]">
            <MDXRemote source={body} />
          </div>
        </Section>
      </main>
    </PageTransition>
  )
}
