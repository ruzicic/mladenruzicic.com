import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

/**
 * axe smoke per docs/v3-redesign-plan.md §8 ("Playwright + axe smoke" on every
 * PR). `serious`/`critical` violations fail the run; everything below that is
 * reported as an annotation so it's visible without blocking a WIP page.
 *
 * `/404` is requested literally: there is no `app/404` route, so it resolves
 * to the same not-found boundary as any other unmatched path.
 */

const ROUTES = [
  "/",
  "/work",
  "/work/tenderlift",
  "/mentoring",
  "/about",
  "/uses",
  "/404",
] as const

const BLOCKING_IMPACTS = new Set(["serious", "critical"])

for (const route of ROUTES) {
  test(`axe: ${route} has no serious or critical violations`, async ({
    page,
  }) => {
    await page.goto(route)
    await page.waitForLoadState("networkidle").catch(() => {})

    const results = await new AxeBuilder({ page }).analyze()

    const blocking = results.violations.filter((v) =>
      BLOCKING_IMPACTS.has(v.impact ?? "")
    )
    const rest = results.violations.filter(
      (v) => !BLOCKING_IMPACTS.has(v.impact ?? "")
    )

    for (const violation of rest) {
      test.info().annotations.push({
        type: `a11y:${violation.impact ?? "unknown"}`,
        description: `${violation.id} — ${violation.help} (${violation.nodes.length} node(s)) ${violation.helpUrl}`,
      })
    }

    if (blocking.length > 0) {
      test.info().annotations.push({
        type: "a11y:blocking",
        description: blocking
          .map(
            (v) =>
              `${v.id} [${v.impact}] — ${v.help} (${v.nodes.length} node(s))`
          )
          .join("\n"),
      })
    }

    expect(
      blocking,
      `serious/critical axe violations on ${route}:\n${blocking
        .map((v) => `  ${v.id} [${v.impact}]: ${v.help}`)
        .join("\n")}`
    ).toEqual([])
  })
}
