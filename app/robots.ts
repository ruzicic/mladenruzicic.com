import type { MetadataRoute } from "next"

import { getSite } from "@/lib/content"

/**
 * Everything public is crawlable, by search engines and by AI systems alike.
 * The site exists to make him findable (PLAN.md: "SEO+AEO to a big extent"),
 * so the policy is open on all three AI purposes, decided separately and all
 * allowed:
 *
 *   · Search discovery, so answer engines can cite the pages:
 *     OAI-SearchBot, Claude-SearchBot, PerplexityBot, meta-webindexer,
 *     DuckAssistBot, plus the classic engines that feed them (Googlebot,
 *     Bingbot, Applebot).
 *   · User-triggered fetches, when someone asks an assistant about him:
 *     ChatGPT-User, Claude-User, Perplexity-User, meta-externalfetcher,
 *     MistralAI-User.
 *   · Model training and grounding, so models know who he is without a
 *     search: GPTBot, ClaudeBot, Google-Extended, Applebot-Extended,
 *     meta-externalagent, CCBot, Amazonbot.
 *
 * The named groups say exactly what `*` says. They are explicit so the policy
 * is readable and so a later change to `*` cannot silently shut them out. A
 * crawler obeys only its most specific group, which is why each group repeats
 * the same `disallow`.
 *
 * `/mcp` is POST-only JSON-RPC; a GET answers 405, so crawling it is noise.
 *
 * `/dev/` holds the development-only specimen sheets (`/dev/diagrams`); in
 * production they answer the site's 404, and nothing there is for crawlers.
 *
 * Deliberately NO `Disallow` for the markdown twins: they answer with
 * `X-Robots-Tag: noindex`, and a crawler blocked by `Disallow` never fetches
 * the response, so it would never see the `noindex`.
 */
const AI_CRAWLERS = [
  // Search discovery
  "OAI-SearchBot",
  "Claude-SearchBot",
  "PerplexityBot",
  "meta-webindexer",
  "DuckAssistBot",
  // User-triggered retrieval
  "ChatGPT-User",
  "Claude-User",
  "Perplexity-User",
  "meta-externalfetcher",
  "MistralAI-User",
  // Training and grounding
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
  "meta-externalagent",
  "CCBot",
  "Amazonbot",
]

const SEARCH_CRAWLERS = ["Googlebot", "Bingbot", "Applebot"]

const DISALLOW = ["/mcp", "/dev/"]

export default function robots(): MetadataRoute.Robots {
  const site = getSite()
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: SEARCH_CRAWLERS, allow: "/", disallow: DISALLOW },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  }
}
