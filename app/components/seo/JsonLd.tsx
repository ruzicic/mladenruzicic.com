import {
  aboutJsonLd,
  homeJsonLd,
  mentoringJsonLd,
  pressJsonLd,
  serializeJsonLd,
  storyJsonLd,
  workJsonLd,
} from "@/lib/seo/jsonld"

type JsonLdProps =
  | { page: "home" | "work" | "mentoring" | "about" | "press" }
  | { page: "story"; slug: string }

/**
 * The page's structured data: one `<script type="application/ld+json">`
 * holding one connected `@graph` (see `lib/seo/jsonld.ts`). Server component,
 * no client JavaScript. `serializeJsonLd` escapes `<`, so nothing in content
 * can close the script element.
 *
 * Usage, once per page: `<JsonLd page="home" />`, or
 * `<JsonLd page="story" slug={slug} />` on `/work/[slug]`.
 */
export function JsonLd(props: JsonLdProps) {
  const data =
    props.page === "story"
      ? storyJsonLd(props.slug)
      : {
          home: homeJsonLd,
          work: workJsonLd,
          mentoring: mentoringJsonLd,
          about: aboutJsonLd,
          press: pressJsonLd,
        }[props.page]()
  if (!data) return null
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
