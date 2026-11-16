import { getMentoring } from "@/lib/content"
import { Icon } from "@/app/components/primitives/Icon"

/**
 * "We may be a good fit if…" and "We're probably not a good fit if…" (the
 * section labelled "Who it is for"): two lists without rules, each item led
 * by a small washed square, a plus for a fit and a minus for not a fit. The
 * marks are decorative; the headings carry the meaning.
 */
export function MentoringFit() {
  const { fit, notFit } = getMentoring()

  return (
    <section aria-label="Who it is for" className="ment-col ment-fit">
      {[fit, notFit].map((group, g) => {
        const tone = g === 0 ? "fit" : "nofit"
        return (
          <div key={group.title} className="ment-group">
            <h2 className="ment-h2">{group.title}</h2>
            <ul className="ment-marks" data-tone={tone}>
              {group.items.map((item) => (
                <li key={item}>
                  <FitMark tone={tone} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </section>
  )
}

/** The 20px washed square: a plus (fit) or a minus (not a fit). */
function FitMark({ tone }: { tone: "fit" | "nofit" }) {
  return (
    <span aria-hidden="true" className="ment-mark">
      <Icon name={tone === "fit" ? "plus" : "minus"} size={12} />
    </span>
  )
}

/** "How it works": three numbered steps under hairlines. */
export function MentoringSteps() {
  const { how } = getMentoring()

  return (
    <section aria-labelledby="ment-how" className="ment-col ment-how">
      <h2 id="ment-how" className="ment-h2">
        {how.title}
      </h2>
      <ol className="ment-rules ment-steps">
        {how.steps.map((step) => (
          <li key={step.n}>
            <span aria-hidden="true" className="ment-step-n">
              {step.n}
            </span>
            <span>{step.text}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
