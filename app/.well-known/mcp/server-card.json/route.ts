import { SUPPORTED_PROTOCOL_VERSIONS } from "@modelcontextprotocol/server"

import { getSite } from "@/lib/content"
import { MCP_SERVER_INFO, MCP_TOOL_NAMES, MCP_URL } from "@/lib/mcp/info"

/**
 * `/.well-known/mcp/server-card.json`: where `/mcp` is and how to talk to it,
 * before connecting. Two shapes in one document, because the readers
 * disagree:
 *
 *   · The fields the agent-readiness checker reads
 *     (isitagentready.com, `mcpServerCard`): `serverInfo`, `url`,
 *     `transport`, `capabilities`.
 *   · The MCP Server Card extension (SEP-2127, schema `v1`): `$schema`,
 *     a reverse-DNS `name`, `version`, a description of at most 100
 *     characters, `title`, `websiteUrl` and `remotes`. Its schema allows
 *     other top-level fields, so the first set does not break it.
 *
 * `tools` lists the names `/mcp` registers (`MCP_TOOL_NAMES`); the server is
 * static and read-only, so the list cannot differ per caller. `tools/list`
 * stays the authority. Static: prerendered at build time.
 */
export function GET() {
  const site = getSite()
  const card = {
    $schema:
      "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
    name: `${site.domain.split(".").reverse().join(".")}/site`,
    version: MCP_SERVER_INFO.version,
    title: site.name,
    description: `Read-only facts about ${site.name}: profile, work, mentoring, contact.`,
    websiteUrl: site.url,
    remotes: [
      {
        type: "streamable-http",
        url: MCP_URL,
        supportedProtocolVersions: [...SUPPORTED_PROTOCOL_VERSIONS],
      },
    ],
    serverInfo: MCP_SERVER_INFO,
    url: MCP_URL,
    transport: { type: "streamable-http" },
    capabilities: { tools: true },
    tools: MCP_TOOL_NAMES.map((name) => ({ name })),
  }
  return new Response(`${JSON.stringify(card, null, 2)}\n`, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      // Discovery documents are read by browser-based clients too.
      "Access-Control-Allow-Origin": "*",
    },
  })
}
