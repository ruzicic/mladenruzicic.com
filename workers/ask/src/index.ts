import { readConfig } from "./config"
import { handleRequest } from "./handler"
import { KNOWLEDGE } from "./knowledge"
import { AskLimits } from "./limits"
import { loadNotes } from "./notes"
import { d1QuestionLog, purgeQuestions } from "./questions-log"
import { verifyTurnstile } from "./turnstile"

export { AskLimits }

/**
 * The question log's database. Typed as optional on purpose: a deploy made
 * before the database exists (or `wrangler dev` without it) has no binding,
 * and Ask then runs exactly as it did without a log.
 */
function questionsDb(env: Env): D1Database | undefined {
  return (env as Partial<Pick<Env, "ASK_QUESTIONS">>).ASK_QUESTIONS
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const config = readConfig(env)
    const limits = env.ASK_LIMITS.getByName("limits")
    const db = questionsDb(env)
    return handleRequest(request, {
      config,
      knowledge: KNOWLEDGE,
      run: (model, inputs, options) => env.AI.run(model, inputs, options),
      limiter: env.ASK_RATE_LIMIT,
      limits: {
        admit: (req) => limits.admit(req),
        remember: (memo, answer) => limits.remember(memo, answer),
        forget: (memo) => limits.forget(memo),
      },
      verifyTurnstile: (token, remoteIp) =>
        verifyTurnstile(token, {
          secret: config.turnstileSecret,
          remoteIp,
          hostnames: config.turnstileHostnames,
          allowTestSecret: config.allowLocalhost,
        }),
      loadNotes: () => loadNotes(env.ASK_NOTES, Date.now()),
      questions: db ? d1QuestionLog(db) : undefined,
      waitUntil: (promise) => ctx.waitUntil(promise),
    })
  },

  /** The daily Cron Trigger: deletes logged questions past the retention. */
  async scheduled(controller, env, ctx): Promise<void> {
    const { logRetentionDays } = readConfig(env)
    ctx.waitUntil(
      purgeQuestions(
        questionsDb(env),
        logRetentionDays,
        new Date(controller.scheduledTime)
      ).catch(() =>
        console.error(
          JSON.stringify({ message: "ask: question log purge failed" })
        )
      )
    )
  },
} satisfies ExportedHandler<Env>
