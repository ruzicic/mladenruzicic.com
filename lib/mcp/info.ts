import { SITE } from "@/content/site"

/**
 * What `/mcp` is, for every place that describes it without running it: the
 * server itself (`app/mcp/route.ts`), its server card
 * (`/.well-known/mcp/server-card.json`), the API catalog
 * (`/.well-known/api-catalog`), the `Link` header on `/` (`proxy.ts`) and
 * `/llms.txt`. It imports only `content/site.ts`, so the proxy can read it.
 */

export const MCP_PATH = "/mcp"
export const MCP_URL = `${SITE.url}${MCP_PATH}`

/** `serverInfo` in the `initialize` answer and in the server card. */
export const MCP_SERVER_INFO = {
  name: SITE.domain,
  version: SITE.updated,
} as const

/**
 * The tools `/mcp` registers, in registration order. `app/mcp/route.ts`
 * registers each under one of these names (typed against this list), and
 * `tests/machine.spec.ts` holds `tools/list` to it, so the server card and
 * `/llms.txt` never name a tool the server does not have.
 */
export const MCP_TOOL_NAMES = [
  "get_profile",
  "list_work",
  "get_work",
  "get_mentoring",
  "get_contact",
  "ask",
] as const

export type McpToolName = (typeof MCP_TOOL_NAMES)[number]

/** The discovery documents (RFC 9727; the MCP server card). */
export const SERVER_CARD_PATH = "/.well-known/mcp/server-card.json"
export const API_CATALOG_PATH = "/.well-known/api-catalog"
export const SERVER_CARD_URL = `${SITE.url}${SERVER_CARD_PATH}`
export const API_CATALOG_URL = `${SITE.url}${API_CATALOG_PATH}`

/**
 * The `Link` header values that point an agent from `/` at the catalog and
 * the server card (RFC 8288; RFC 9727 section 3 for `api-catalog`).
 */
export const DISCOVERY_LINKS = [
  `<${API_CATALOG_URL}>; rel="api-catalog"; type="application/linkset+json"`,
  `<${SERVER_CARD_URL}>; rel="service-desc"; type="application/json"`,
] as const
