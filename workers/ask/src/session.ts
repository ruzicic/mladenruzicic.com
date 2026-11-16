import {
  base64url,
  fromBase64url,
  randomId,
  sign,
  verify,
  type Keys,
} from "./crypto"

/**
 * The Worker's own short-lived session, issued once a Turnstile token has
 * verified, so a visitor is checked once per visit and not for every
 * question.
 *
 *   token   = <payload> "." <signature>          (both base64url)
 *   payload = {"v":1,"sid":"<16 random bytes>","exp":<unix seconds>}
 *
 * The signature is an HMAC over the payload and the request's binding: the
 * exact `Origin`, the connecting IP address and the `User-Agent`. None of
 * those is written into the token or stored anywhere; a token is simply
 * worthless from another address, browser or site. Nothing is kept on the
 * server either: the token is checked by recomputing its signature.
 *
 * It travels in a request header, not a cookie: see README.md "Session".
 */

export interface Binding {
  origin: string
  ip: string
  userAgent: string
}

export interface Session {
  /** Random, per visit: keys the repeat memo, never a person. */
  sid: string
  /** Unix seconds. */
  exp: number
}

/** Longest token `readSession` looks at; anything longer is not ours. */
export const MAX_SESSION_TOKEN_CHARS = 256

const VERSION = 1

function signed(payload: string, b: Binding): string {
  return `ask-session.v${VERSION}\n${payload}\n${b.origin}\n${b.ip}\n${b.userAgent}`
}

export async function issueSession(
  keys: Keys,
  binding: Binding,
  nowMs: number,
  ttlSeconds: number
): Promise<{ token: string; session: Session }> {
  const session: Session = {
    sid: randomId(),
    exp: Math.floor(nowMs / 1000) + ttlSeconds,
  }
  const p = base64url(
    new TextEncoder().encode(JSON.stringify({ v: VERSION, ...session }))
  )
  return {
    token: `${p}.${await sign(keys.session, signed(p, binding))}`,
    session,
  }
}

/**
 * The session in `token`, or `null` when it is malformed, signed for
 * another binding, or expired. Never throws.
 */
export async function readSession(
  token: string | null,
  keys: Keys,
  binding: Binding,
  nowMs: number
): Promise<Session | null> {
  if (!token || token.length > MAX_SESSION_TOKEN_CHARS) return null
  const parts = token.split(".")
  if (parts.length !== 2) return null
  const [p, sig] = parts
  if (!(await verify(keys.session, signed(p, binding), sig))) return null
  const bytes = fromBase64url(p)
  if (!bytes) return null
  let value: unknown
  try {
    value = JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
  const { v, sid, exp } = (value ?? {}) as Record<string, unknown>
  if (v !== VERSION || typeof sid !== "string" || typeof exp !== "number")
    return null
  if (exp * 1000 <= nowMs) return null
  return { sid, exp }
}
