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
 * The same three answers are said once more as Content Signals
 * (contentsignals.org, draft-romm-aipref-contentsignals): `CONTENT_SIGNAL`
 * goes into every group of `robots.txt` and onto every markdown response as a
 * `Content-Signal` header.
 *
 * The named groups say exactly what `*` says. They are explicit so the policy
 * is readable and so a later change to `*` cannot silently shut them out. A
 * crawler obeys only its most specific group, which is why each group repeats
 * the same `Content-Signal` and `Disallow`.
 *
 * `/mcp` is POST-only JSON-RPC; a GET answers 405, so crawling it is noise.
 * Its discovery files (`/.well-known/mcp/server-card.json`,
 * `/.well-known/api-catalog`) are not under it and stay allowed.
 *
 * `/dev/` holds the development-only specimen sheets (`/dev/diagrams`); in
 * production they answer the site's 404, and nothing there is for crawlers.
 *
 * Deliberately NO `Disallow` for the markdown twins: they answer with
 * `X-Robots-Tag: noindex`, and a crawler blocked by `Disallow` never fetches
 * the response, so it would never see the `noindex`. The same goes for
 * `/llms.txt` and `/llms-full.txt`.
 */

/**
 * The site's AI-use preferences: search, answers grounded in the pages
 * (`ai-input`) and training, all yes. The value of the `Content-Signal` line
 * in `robots.txt` and of the `Content-Signal` response header.
 */
export const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=yes"

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

const GROUPS = [["*"], SEARCH_CRAWLERS, AI_CRAWLERS]

/**
 * The whole `robots.txt`. The same lines, in the same order, that Next's
 * `MetadataRoute.Robots` printed before (which has no field for
 * `Content-Signal`), plus that line in each group, right under its
 * `User-Agent` lines as Cloudflare's managed `robots.txt` places it.
 */
export function robotsTxt(siteUrl: string): string {
  const groups = GROUPS.map((agents) =>
    [
      ...agents.map((agent) => `User-Agent: ${agent}`),
      `Content-Signal: ${CONTENT_SIGNAL}`,
      "Allow: /",
      ...DISALLOW.map((path) => `Disallow: ${path}`),
    ].join("\n")
  )
  return `${groups.join("\n\n")}\n\nSitemap: ${siteUrl}/sitemap.xml\n`
}
