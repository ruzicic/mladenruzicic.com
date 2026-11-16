import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getStories, getStory } from "@/lib/content"
import { pageMetadata } from "@/lib/seo/metadata"

import { JsonLd } from "../../components/seo/JsonLd"
import { PageFrame } from "../../components/site/PageFrame"
import { StoryBar } from "../../components/story/StoryBar"
import { StoryPage } from "../../components/story/StoryPage"

type Params = { slug: string }

/**
 * Every slug is prerendered, but Cache Components still builds a fallback
 * shell for unknown slugs, and the generated `opengraph-image` metadata module
 * awaits `params` there. Opt the segment out of instant validation
 * (`dynamicParams` is not allowed alongside `cacheComponents`).
 */
export const instant = false

/** The nine stories (`STORY_SLUGS`). Every other work slug is a 308 to `/work#<slug>` in `next.config.ts`. */
export function generateStaticParams(): Params[] {
  return getStories().map((story) => ({ slug: story.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const story = getStory(slug)
  if (!story) return {}
  return pageMetadata({
    title: story.seo.title ?? story.title,
    description: story.seo.description,
    path: `/work/${story.slug}`,
  })
}

/**
 * `/work/<slug>`: one of the nine case studies, the cover and then the
 * two-column page (the pinned panel and the column of squares). A Server
 * Component, fully prerendered; the client code is the shared shell, the
 * bar's scroll watch, the panel's progress line and, on a story that has a
 * clip, `StoryVideo`. No site header: the story's own bar takes its place
 * (`StoryBar`, owner, 16 Nov 2026).
 */
export default async function CaseStudyPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const story = getStory(slug)
  if (!story) notFound()

  return (
    <PageFrame bar={<StoryBar story={story} />}>
      <JsonLd page="story" slug={story.slug} />
      <StoryPage story={story} />
    </PageFrame>
  )
}
