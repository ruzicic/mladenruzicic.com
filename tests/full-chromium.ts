import type { Browser, BrowserType, LaunchOptions } from "@playwright/test"

/**
 * The full Chromium build (`channel: "chromium"`, headless), not the
 * headless shell Playwright gives the other tests. For a test whose result
 * depends on exact text metrics, and for `scripts/cv-pdf.ts`.
 *
 * On Linux the shell gets no desktop font settings: every web font and
 * `local()` face is hinted at a whole-pixel size with whole-pixel advances,
 * while installed fonts named by family, and every font in full Chromium,
 * are set at their fractional size with fractional advances, as in the
 * browsers people use. So in the shell 16px screen text and 11pt (14.67px)
 * print text round differently and wrap differently: on CI the CV's print
 * rendering broke six paragraphs a word earlier than its screen page did
 * (17 Nov 2026), and the throttled font swap in `tests/budgets.spec.ts`
 * rewrapped (body copy in the Liberation Sans fallback at 20px measured
 * 104.7% of Geist's width in the shell, 100.7% in full Chromium). macOS
 * draws the same in both builds.
 *
 * `pnpm exec playwright install chromium` installs both builds.
 */
export function launchFullChromium(
  chromium: BrowserType,
  options: LaunchOptions = {}
): Promise<Browser> {
  return chromium.launch({ ...options, channel: "chromium" })
}
