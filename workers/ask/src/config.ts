/**
 * Every setting the Worker reads: `vars` in `wrangler.jsonc` (or `.dev.vars`
 * locally) and two secrets (`wrangler secret put`, never in the repo).
 * Numbers are clamped to safe ranges, so a typo cannot lift a guard rail.
 */

import { DEFAULT_RETENTION_DAYS, MAX_RETENTION_DAYS } from "./questions-log"

export const VAR_KEYS = [
  "ASK_MODEL",
  "ASK_REASONING",
  "ASK_MAX_TOKENS",
  "ASK_TEMPERATURE",
  "ASK_TIMEOUT_MS",
  "ASK_FIRST_TOKEN_MS",
  "ASK_DAILY_CAP",
  "ASK_VISITOR_DAILY_CAP",
  "ASK_SESSION_MINUTES",
  "ASK_ALLOWED_ORIGINS",
  "ASK_ALLOW_LOCALHOST",
  "ASK_TURNSTILE_HOSTNAMES",
  "ASK_GATEWAY_ID",
  "ASK_GATEWAY_CACHE_TTL",
  "ASK_LOG_RETENTION_DAYS",
] as const

export const SECRET_KEYS = ["TURNSTILE_SECRET_KEY", "ASK_SIGNING_KEY"] as const

export type AskVars = Partial<
  Record<(typeof VAR_KEYS)[number] | (typeof SECRET_KEYS)[number], string>
>

export interface AskConfig {
  model: string
  /** `""` sends no `reasoning_effort` (for models without the parameter). */
  reasoning: string
  maxTokens: number
  temperature: number
  timeoutMs: number
  firstTokenMs: number
  /** Questions answered per UTC day, for everyone. `0` switches Ask off. */
  dailyCap: number
  /** Questions per visitor (hashed address) per UTC day. */
  visitorDailyCap: number
  sessionSeconds: number
  allowedOrigins: string[]
  allowLocalhost: boolean
  /** Hostnames a production Turnstile token must have been solved on. */
  turnstileHostnames: string[]
  gatewayId: string
  gatewayCacheTtl: number
  /**
   * Days a logged question is kept (`questions-log.ts`). `0` switches the
   * question log off; the daily purge then still deletes at the default.
   */
  logRetentionDays: number
  /** Empty when the secret is not set: Ask then answers `unavailable`. */
  turnstileSecret: string
  /** Empty when the secret is not set (or too short to be safe). */
  signingKey: string
}

export const DEFAULT_MODEL = "@cf/deepseek-ai/deepseek-v4.1-flash-1017"

/** A signing key shorter than this is treated as missing. */
export const MIN_SIGNING_KEY_CHARS = 32

function int(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number
) {
  const n = Number.parseInt(value ?? "", 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function num(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number
) {
  const n = Number.parseFloat(value ?? "")
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function list(value: string | undefined, clean: (s: string) => string) {
  return (value ?? "")
    .split(",")
    .map((s) => clean(s.trim()))
    .filter(Boolean)
}

export function readConfig(vars: AskVars): AskConfig {
  const signingKey = vars.ASK_SIGNING_KEY?.trim() ?? ""
  return {
    model: vars.ASK_MODEL?.trim() || DEFAULT_MODEL,
    reasoning: (vars.ASK_REASONING ?? "low").trim(),
    maxTokens: int(vars.ASK_MAX_TOKENS, 1000, 64, 2000),
    temperature: num(vars.ASK_TEMPERATURE, 0.3, 0, 1),
    timeoutMs: int(vars.ASK_TIMEOUT_MS, 25_000, 1_000, 60_000),
    firstTokenMs: int(vars.ASK_FIRST_TOKEN_MS, 15_000, 500, 60_000),
    dailyCap: int(vars.ASK_DAILY_CAP, 300, 0, 100_000),
    visitorDailyCap: int(vars.ASK_VISITOR_DAILY_CAP, 20, 1, 1_000),
    sessionSeconds: int(vars.ASK_SESSION_MINUTES, 30, 5, 120) * 60,
    allowedOrigins: list(vars.ASK_ALLOWED_ORIGINS, (o) =>
      o.replace(/\/+$/, "")
    ),
    allowLocalhost: vars.ASK_ALLOW_LOCALHOST === "true",
    turnstileHostnames: list(vars.ASK_TURNSTILE_HOSTNAMES, (h) =>
      h.toLowerCase()
    ),
    gatewayId: vars.ASK_GATEWAY_ID?.trim() ?? "",
    gatewayCacheTtl: int(vars.ASK_GATEWAY_CACHE_TTL, 86_400, 60, 2_592_000),
    logRetentionDays: int(
      vars.ASK_LOG_RETENTION_DAYS,
      DEFAULT_RETENTION_DAYS,
      0,
      MAX_RETENTION_DAYS
    ),
    turnstileSecret: vars.TURNSTILE_SECRET_KEY?.trim() ?? "",
    signingKey: signingKey.length >= MIN_SIGNING_KEY_CHARS ? signingKey : "",
  }
}
