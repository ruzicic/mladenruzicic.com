import { getSite } from "@/lib/content"
import { robotsTxt } from "@/lib/seo/robots"

/**
 * `/robots.txt`, written out by hand because `MetadataRoute.Robots` has no
 * field for `Content-Signal`. The policy and its reasons are in
 * `lib/seo/robots.ts`. Static: prerendered at build time.
 */
export function GET() {
  return new Response(robotsTxt(getSite().url), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
