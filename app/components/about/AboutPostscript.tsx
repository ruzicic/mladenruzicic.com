import { getAbout } from "@/lib/content"

import { Postscript } from "./Postscript"

/**
 * The postscript at the end of `/about` (`postscript` in
 * `content/pages/about.ts`): nothing when it is switched off, the sentence
 * alone when only the effect is.
 */
export function AboutPostscript() {
  const ps = getAbout().postscript
  if (!ps?.enabled) return null
  return (
    <Postscript
      lead={ps.lead}
      before={ps.before}
      game={ps.game}
      champions={ps.champions}
      after={ps.after}
      effect={
        ps.effect
          ? {
              cta: ps.cta,
              sign: ps.sign,
              status: ps.status,
              sound: ps.sound,
              cursor: ps.cursor,
            }
          : undefined
      }
    />
  )
}
