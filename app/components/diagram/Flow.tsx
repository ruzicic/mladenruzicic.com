import type { CSSProperties } from "react"

import type { DiagramOf, FlowStep } from "@/lib/content/schema-diagrams"

import { FLOW_LAYOUTS, type FlowLayout } from "./flow-layouts"
import { boxVars, cssX, route, type Place } from "./geometry"
import { Head, Lead, Sr, walk } from "./parts"

/**
 * A swimlane flowchart (DIAGRAMS.md, third amendment): lanes, plain boxes,
 * diamonds, arrows, dashed exits. In markup it is an ordered list of steps;
 * each step says who does it and where it goes next, so the drawn lines are
 * decorative. Positions come from `flow-layouts.ts`, one set per size, as
 * custom properties the container query picks between.
 */
export function Flow({ d }: { d: DiagramOf<"flow"> }) {
  const layouts = FLOW_LAYOUTS[d.id]
  if (!layouts) throw new Error(`No flow layout for diagram ${d.id}`)
  const { wide, narrow } = layouts
  const style = {
    "--fc-h": `${wide.height}px`,
    "--fc-nh": `${narrow.height}px`,
    "--fc-l1": `${wide.lanes[0]}%`,
    "--fc-l2": `${wide.lanes[1]}%`,
    "--fc-nl1": `${narrow.lanes[0]}%`,
    "--fc-nl2": `${narrow.lanes[1]}%`,
  } as CSSProperties
  const lanes = [d.lanes.person, d.lanes.system, d.lanes.me] as const

  return (
    <div className="dg-body fc-w">
      <Head d={d} />
      <Lead d={d} />
      <div className="fc" style={style}>
        <p className="fc-lanes" aria-hidden="true">
          {lanes.map((label, i) => (
            <span
              key={label}
              className="dg-l fc-lane"
              style={
                {
                  "--l": cssX(wide.laneLabels[i]),
                  "--nl": cssX(narrow.laneLabels[i]),
                } as CSSProperties
              }
            >
              {label}
            </span>
          ))}
        </p>
        <div className="fc-g">
          <ol className="fc-ol">
            {d.steps.map((step) => (
              <Step
                key={step.id}
                step={step}
                d={d}
                wide={wide}
                narrow={narrow}
              />
            ))}
          </ol>
          <div className="fc-art" aria-hidden="true">
            {d.exits.map((exit) => (
              <span
                key={exit.id}
                className="fc-x fc-p"
                style={placeVars(
                  wide.exits[exit.id],
                  narrow.exits[exit.id],
                  exit.id
                )}
              >
                {exit.label}
              </span>
            ))}
            <Lines layout={wide} only="w" />
            <Lines layout={narrow} only="n" />
            <Labels layout={wide} d={d} only="w" />
            <Labels layout={narrow} d={d} only="n" />
          </div>
        </div>
      </div>
      {d.key.length > 0 && (
        <p className="fc-key" aria-hidden="true">
          {d.key.map((k) => (
            <span key={k.label} className="fc-ki">
              <span className="fc-kb" data-actor={k.actor}>
                {k.actor !== "person" && <span className="fc-cell" />}
              </span>
              <span className="dg-l">{k.label}</span>
            </span>
          ))}
        </p>
      )}
    </div>
  )
}

function placeVars(w: Place | undefined, n: Place | undefined, id: string) {
  if (!w || !n) throw new Error(`Flow layout is missing a place for ${id}`)
  return { ...boxVars(w, ""), ...boxVars(n, "n") } as CSSProperties
}

function who(step: FlowStep, d: DiagramOf<"flow">): string {
  const lane =
    step.actor === "person"
      ? d.lanes.person
      : step.actor === "me"
        ? d.lanes.me
        : d.lanes.system
  if (step.kind === "end") return "The end: "
  const how =
    step.actor === "model"
      ? ", a model"
      : step.actor === "auto"
        ? ", automatically"
        : ""
  return `${lane}${how}${step.kind === "decision" ? ", asks" : ""}: `
}

function Step({
  step,
  d,
  wide,
  narrow,
}: {
  step: FlowStep
  d: DiagramOf<"flow">
  wide: FlowLayout
  narrow: FlowLayout
}) {
  const w = wide.nodes[step.id]
  const n = narrow.nodes[step.id]
  const style = placeVars(w, n, step.id)
  const reason = wide.reasons[step.id]
  const outcome =
    step.branches
      ?.map((b) => `If ${b.label.toLowerCase()}, ${b.says}.`)
      .join(" ") ?? step.next

  const pulse = step.kind === "end" ? "h" : "n"
  const lits = (
    <>
      {w.k !== undefined && (
        <span
          className="fc-lit"
          data-only="w"
          aria-hidden="true"
          style={walk(pulse, w.k)}
        />
      )}
      {n.k !== undefined && (
        <span
          className="fc-lit"
          data-only="n"
          aria-hidden="true"
          style={walk(pulse, n.k)}
        />
      )}
    </>
  )

  return (
    <li className="fc-li">
      {step.kind === "decision" ? (
        <span
          className="fc-n fc-dia fc-p"
          data-actor={step.actor}
          style={style}
        >
          <svg
            className="fc-dsv"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polygon className="fc-dpo" points="50,0 100,50 50,100 0,50" />
            {w.k !== undefined && (
              <polygon
                className="fc-dlit"
                points="50,0 100,50 50,100 0,50"
                data-only="w"
                style={walk("n", w.k)}
              />
            )}
            {n.k !== undefined && (
              <polygon
                className="fc-dlit"
                points="50,0 100,50 50,100 0,50"
                data-only="n"
                style={walk("n", n.k)}
              />
            )}
          </svg>
          <span className="fc-q">
            {step.actor !== "person" && (
              <span className="fc-cell" aria-hidden="true" />
            )}
            <Sr>{who(step, d)}</Sr>
            {step.title}
          </span>
        </span>
      ) : (
        <span
          className={step.kind === "end" ? "fc-n fc-e fc-p" : "fc-n fc-b fc-p"}
          data-actor={step.actor}
          style={style}
        >
          {lits}
          {step.kind === "box" && step.actor !== "person" && (
            <span className="fc-cell" aria-hidden="true" />
          )}
          <span className="fc-tt">
            <Sr>{who(step, d)}</Sr>
            {step.title}
          </span>
        </span>
      )}
      {step.reason && (
        <span
          className="dg-n fc-r"
          data-v={reason?.v ?? "c"}
          data-align={reason?.align ?? "start"}
          style={
            reason
              ? ({
                  "--l": cssX(reason.x),
                  "--w": cssX(reason.w),
                  "--t": `${reason.y}px`,
                } as CSSProperties)
              : undefined
          }
          data-placed={reason ? "w" : undefined}
        >
          {step.reason}
        </span>
      )}
      {outcome && <Sr>{outcome}</Sr>}
    </li>
  )
}

function Lines({ layout, only }: { layout: FlowLayout; only: "w" | "n" }) {
  return (
    <>
      {layout.edges.map((edge, i) => {
        const { segments, head } = route(edge, layout.refW)
        return (
          <span
            key={i}
            className="fc-edge"
            data-only={only}
            data-dashed={edge.dashed ? "" : undefined}
          >
            {segments.map((s, j) => (
              <span
                key={j}
                className="fc-s"
                data-dir={s.dir}
                style={{
                  left: s.left,
                  top: s.top,
                  width: s.width,
                  height: s.height,
                }}
              >
                {s.k !== undefined && (
                  <span
                    className="fc-sf"
                    style={walk(
                      s.dir === "r" || s.dir === "l" ? "x" : "y",
                      s.k
                    )}
                  />
                )}
              </span>
            ))}
            {head && (
              <span
                className="fc-hd"
                data-dir={head.dir}
                style={{ left: head.left, top: head.top }}
              >
                {head.k !== undefined && (
                  <span className="fc-hf" style={walk("h", head.k)} />
                )}
              </span>
            )}
          </span>
        )
      })}
    </>
  )
}

function Labels({
  layout,
  d,
  only,
}: {
  layout: FlowLayout
  d: DiagramOf<"flow">
  only: "w" | "n"
}) {
  return (
    <>
      {layout.labels.map((label) => {
        const step = d.steps.find((s) => s.id === label.of[0])
        const text = step?.branches?.[label.of[1]]?.label
        if (!text)
          throw new Error(`Flow ${d.id}: no branch ${label.of.join("#")}`)
        return (
          <span
            key={label.of.join("-")}
            className="dg-l fc-bl"
            data-only={only}
            data-align={label.align ?? "center"}
            style={{ left: cssX(label.x), top: label.y }}
          >
            {text}
          </span>
        )
      })}
    </>
  )
}
