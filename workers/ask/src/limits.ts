import { DurableObject } from "cloudflare:workers"

import {
  admit,
  forget,
  remember,
  sweep,
  SWEEP_EVERY_MS,
  type Admission,
  type AdmitRequest,
  type MemoAnswer,
} from "./limits-store"

/**
 * The one instance (`getByName("limits")`) that holds the strict limits:
 * the daily cap for everyone, the daily cap per visitor, and the short
 * repeat memo. `limits-store.ts` says what it stores; never a question, an
 * address or a person.
 */
export class AskLimits extends DurableObject<Env> {
  async admit(req: AdmitRequest): Promise<Admission> {
    return admit(this.ctx.storage, req)
  }

  async remember(memo: string, answer: MemoAnswer): Promise<void> {
    await remember(this.ctx.storage, memo, answer, Date.now())
  }

  async forget(memo: string): Promise<void> {
    await forget(this.ctx.storage, memo)
  }

  /** Sweeps past days and old memos; runs again while anything is left. */
  async alarm(): Promise<void> {
    const now = Date.now()
    if ((await sweep(this.ctx.storage, now)) > 0)
      await this.ctx.storage.setAlarm(now + SWEEP_EVERY_MS)
  }
}
