// Both files are bundled as text (the `rules` in wrangler.jsonc; the Vitest
// config does the same for tests). The context is generated from the site's
// content by scripts/build-ask-context.ts; never edit it by hand.
import CONTEXT from "../../../content/ask/context.md"
import { buildKnowledge, type Knowledge } from "./prompt"
import RULES from "./system-prompt.md"

/** The rules and the public context, built once per isolate. */
export const KNOWLEDGE: Knowledge = buildKnowledge(CONTEXT, RULES)
