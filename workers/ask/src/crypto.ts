/**
 * Keyed hashes and signatures, all from one secret (`ASK_SIGNING_KEY`).
 * Two keys are derived from it with fixed labels, so the session signature
 * and the visitor hash can never be confused for one another:
 *
 *   session  signs and checks the short-lived session token (`session.ts`);
 *   visitor  turns an IP address into a counter key that cannot be reversed
 *            without the secret (a plain hash of an IPv4 address can be, by
 *            trying all four billion).
 *
 * Web Crypto only, so the same code runs in the Worker and in Node tests.
 */

export interface Keys {
  session: CryptoKey
  visitor: CryptoKey
}

const encoder = new TextEncoder()

async function hmacKey(raw: BufferSource): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

const derived = new Map<string, Promise<Keys>>()

/** The two derived keys for `secret`, computed once per isolate. */
export function deriveKeys(secret: string): Promise<Keys> {
  let keys = derived.get(secret)
  if (!keys) {
    keys = (async () => {
      const master = await hmacKey(encoder.encode(secret))
      const label = async (name: string) =>
        hmacKey(await crypto.subtle.sign("HMAC", master, encoder.encode(name)))
      return {
        session: await label("ask/session/v1"),
        visitor: await label("ask/visitor/v1"),
      }
    })()
    derived.clear()
    derived.set(secret, keys)
  }
  return keys
}

export function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let s = ""
  for (const b of view) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/** `null` for anything that is not unpadded base64url. */
export function fromBase64url(text: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) return null
  try {
    const s = atob(text.replace(/-/g, "+").replace(/_/g, "/"))
    const out = new Uint8Array(s.length)
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
    return out
  } catch {
    return null
  }
}

export async function sign(key: CryptoKey, data: string): Promise<string> {
  return base64url(await crypto.subtle.sign("HMAC", key, encoder.encode(data)))
}

/** Constant-time check of a signature made by `sign`. */
export async function verify(
  key: CryptoKey,
  data: string,
  signature: string
): Promise<boolean> {
  const bytes = fromBase64url(signature)
  if (!bytes || bytes.length !== 32) return false
  return crypto.subtle.verify("HMAC", key, bytes, encoder.encode(data))
}

/** A keyed, truncated hash as hex: a counter or limiter key, never reversible. */
export async function keyedHash(key: CryptoKey, data: string): Promise<string> {
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(data))
  return [...new Uint8Array(mac).slice(0, 16)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/** 16 random bytes, base64url. */
export function randomId(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(16)))
}
