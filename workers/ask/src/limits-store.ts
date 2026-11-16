/**
 * The strict limits, kept apart from the Durable Object class (`limits.ts`)
 * so they can be tested without the Workers runtime. One object instance
 * holds them all, so every Cloudflare location sees the same numbers, and
 * its input gates keep each call atomic: a read and the write after it are
 * never interleaved with another request.
 *
 * What is stored, and nothing else:
 *
 *   day:<YYYY-MM-DD>                  questions answered that day, for everyone
 *   visitor:<YYYY-MM-DD>:<hash>       questions from one visitor that day; the
 *                                     hash is keyed by a secret and the date,
 *                                     so it is not an address and does not
 *                                     link one day to the next
 *   memo:<hash>                       one session's answer to one question, for
 *                                     a few minutes; the hash is keyed by the
 *                                     session and the question, so neither is
 *                                     stored
 *
 * Past days and old memos are deleted by the object's alarm.
 */

export interface LimitsStorage {
  get<T>(key: string): Promise<T | undefined>
  put<T>(key: string, value: T): Promise<void>
  delete(keys: string[]): Promise<number>
  list<T>(options: { prefix: string }): Promise<Map<string, T>>
  getAlarm(): Promise<number | null>
  setAlarm(scheduledTime: number): Promise<void>
}

/** A finished answer, as the stream sent it. */
export interface MemoAnswer {
  text: string
  outcome: "answer" | "unknown" | "out_of_scope"
  sources: { href: string; label: string }[]
}

interface MemoEntry {
  /** Unix ms when the question was first admitted. */
  at: number
  /** `null` while the first answer is still being written. */
  answer: MemoAnswer | null
}

export interface AdmitRequest {
  day: string
  visitor: string
  memo: string
  visitorCap: number
  globalCap: number
  now: number
}

export type Admission =
  /** Counted: ask the model. */
  | { kind: "ok" }
  /** The same question from the same session, answered a moment ago. */
  | { kind: "memo"; answer: MemoAnswer }
  /** The same question from the same session, still being answered. */
  | { kind: "pending" }
  | { kind: "daily_limit" }
  | { kind: "budget_reached" }

/** A repeat within this window is answered from the memo. */
export const MEMO_TTL_MS = 10 * 60_000
/** A memo still pending after this long is treated as abandoned. */
export const PENDING_TTL_MS = 90_000
/** How often the alarm sweeps while anything is stored. */
export const SWEEP_EVERY_MS = 15 * 60_000

/** `YYYY-MM-DD` in UTC. */
export function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Seconds until the next UTC midnight, at least one. */
export function secondsToNextUtcDay(now: Date): number {
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  )
  return Math.max(1, Math.ceil((next - now.getTime()) / 1000))
}

/**
 * Checks, in order: the memo, this visitor's day, everyone's day. Counts the
 * question against both days only when it passes both; a refused question
 * is not counted. An admitted question leaves a pending memo, so a second
 * copy sent while the first is answered is told to wait.
 */
export async function admit(
  storage: LimitsStorage,
  req: AdmitRequest
): Promise<Admission> {
  const memoKey = `memo:${req.memo}`
  const memo = await storage.get<MemoEntry>(memoKey)
  if (memo) {
    if (memo.answer && req.now - memo.at < MEMO_TTL_MS)
      return { kind: "memo", answer: memo.answer }
    if (!memo.answer && req.now - memo.at < PENDING_TTL_MS)
      return { kind: "pending" }
  }

  const visitorKey = `visitor:${req.day}:${req.visitor}`
  const dayKey = `day:${req.day}`
  const mine = (await storage.get<number>(visitorKey)) ?? 0
  if (mine >= req.visitorCap) return { kind: "daily_limit" }
  const all = (await storage.get<number>(dayKey)) ?? 0
  if (all >= req.globalCap) return { kind: "budget_reached" }

  await storage.put(visitorKey, mine + 1)
  await storage.put(dayKey, all + 1)
  await storage.put<MemoEntry>(memoKey, { at: req.now, answer: null })
  await ensureAlarm(storage, req.now)
  return { kind: "ok" }
}

/** Keeps a finished answer for repeats. */
export async function remember(
  storage: LimitsStorage,
  memo: string,
  answer: MemoAnswer,
  now: number
): Promise<void> {
  await storage.put<MemoEntry>(`memo:${memo}`, { at: now, answer })
  await ensureAlarm(storage, now)
}

/** Drops a pending memo after a failed answer, so asking again works. */
export async function forget(
  storage: LimitsStorage,
  memo: string
): Promise<void> {
  await storage.delete([`memo:${memo}`])
}

/**
 * Deletes counters of past days and expired memos. Returns how many keys
 * are left, so the alarm knows whether to run again.
 */
export async function sweep(
  storage: LimitsStorage,
  now: number
): Promise<number> {
  const today = utcDay(new Date(now))
  const stale: string[] = []
  let left = 0
  for (const prefix of ["day:", "visitor:"]) {
    for (const key of (await storage.list<number>({ prefix })).keys()) {
      if (key.startsWith(`${prefix}${today}`)) left++
      else stale.push(key)
    }
  }
  for (const [key, entry] of await storage.list<MemoEntry>({
    prefix: "memo:",
  })) {
    const ttl = entry.answer ? MEMO_TTL_MS : PENDING_TTL_MS
    if (now - entry.at >= ttl) stale.push(key)
    else left++
  }
  // The storage API deletes at most 128 keys per call.
  for (let i = 0; i < stale.length; i += 128)
    await storage.delete(stale.slice(i, i + 128))
  return left
}

async function ensureAlarm(storage: LimitsStorage, now: number) {
  if ((await storage.getAlarm()) === null)
    await storage.setAlarm(now + SWEEP_EVERY_MS)
}
