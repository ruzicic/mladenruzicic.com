import { getSite } from "@/lib/content"
import { API_CATALOG_URL, MCP_URL, SERVER_CARD_URL } from "@/lib/mcp/info"

/**
 * `/.well-known/api-catalog` (RFC 9727): the one API the site has, `/mcp`,
 * described by its server card and documented by `/llms.txt`. A linkset
 * (RFC 9264) with the RFC 9727 profile.
 *
 * RFC 9727 section 2 asks a HEAD request here to carry a `Link` header with
 * `rel="api-catalog"`; Next answers HEAD from this GET with the same headers.
 * Static: prerendered at build time.
 */
export function GET() {
  const site = getSite()
  const linkset = {
    linkset: [
      {
        anchor: MCP_URL,
        "service-desc": [{ href: SERVER_CARD_URL, type: "application/json" }],
        "service-doc": [{ href: `${site.url}/llms.txt`, type: "text/plain" }],
      },
    ],
  }
  return new Response(`${JSON.stringify(linkset, null, 2)}\n`, {
    headers: {
      "Content-Type":
        'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
      Link: `<${API_CATALOG_URL}>; rel="api-catalog"`,
    },
  })
}
