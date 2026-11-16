/**
 * How big the system prompt is, in tokens, and what one question costs.
 *
 *   pnpm --dir workers/ask measure
 *
 * Counts with the o200k tokenizer (`gpt-tokenizer`) as a stand-in: the
 * model's own tokenizer is not published as a JavaScript package, and
 * tokenizers of current large models land within about 10 to 20 percent of
 * each other on English prose. Treat the numbers as an estimate.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { countTokens } from "gpt-tokenizer"

import { buildKnowledge, userMessage } from "../src/prompt"

const here = dirname(fileURLToPath(import.meta.url))
const context = readFileSync(
  join(here, "../../../content/ask/context.md"),
  "utf8"
)
const rules = readFileSync(join(here, "../src/system-prompt.md"), "utf8")
const k = buildKnowledge(context, rules)

const system = countTokens(k.systemPrompt)
const rulesOnly = countTokens(rules)
const contextOnly = countTokens(context)
const question = countTokens(
  userMessage("Who is behind TenderLift, and is he open to freelance work?")
)
const output = 250 // a two-to-five sentence answer plus the final line, and some reasoning

// $ per million tokens, from the model's page (deepseek-v4.1-flash-1017).
const PRICE = { input: 0.3, cached: 0.006, output: 1.2 }
const cold = ((system + question) * PRICE.input + output * PRICE.output) / 1e6
const warm =
  (system * PRICE.cached + question * PRICE.input + output * PRICE.output) / 1e6

console.log(`rules:          ${rulesOnly} tokens (${rules.length} characters)`)
console.log(
  `context:        ${contextOnly} tokens (${context.length} characters)`
)
console.log(`system prompt:  ${system} tokens`)
console.log(`one question:   ~${question} tokens in, ~${output} out`)
console.log(
  `cost per question: $${cold.toFixed(5)} uncached, $${warm.toFixed(5)} with the prefix cached`
)
console.log(
  `per 1,000 questions: $${(cold * 1000).toFixed(2)} uncached, $${(warm * 1000).toFixed(2)} cached`
)
