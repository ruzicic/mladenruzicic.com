import localFont from "next/font/local"

/**
 * Self-hosted, subset faces (latin + latin-ext, so "Ružičić" renders).
 * See docs/v3-redesign-plan.md §5.5.
 *
 * NOTE ON CALL COUNT: the plan says "two `localFont()` calls"; the actual
 * acceptance criterion behind it is "three preloaded faces, no Google Fonts
 * request". `next/font/local` emits one CSS custom property per call, and we
 * need four distinct ones, so this is four calls with `preload: false` on the
 * mono face.
 *
 * NOTE ON WHAT `preload: true` ACTUALLY SHIPS (verified against `next build`
 * output on 16.3.4): it puts the three faces in `next-font-manifest.json`, and
 * Next turns those into `ReactDOM.preload(…, { as: "font" })` calls during the
 * RSC render. Under `cacheComponents` those land in the flight payload as
 * `:HL["…woff2","font",…]` hints and are applied by the client runtime after
 * the JS bundle executes — there is NO parser-discoverable
 * `<link rel="preload" as="font">` in the prerendered `<head>`. The faces are
 * still discovered early, because the `@font-face` rules live in the
 * render-blocking stylesheet; what is lost is the head start over that
 * stylesheet for the LCP (Gloock) face.
 *
 * A hand-written `ReactDOM.preload()` in the root layout is not possible here:
 * `localFont()` returns only `{ className, style, variable }`, and the hashed
 * `/_next/static/media/*.woff2` URL exists nowhere but the emitted CSS and that
 * manifest. So `preload` stays `true` (it is what keeps the mono face out of
 * the hint set) and the claim above is stated as what it is. Re-check when this
 * moves: `grep -c 'as="font"' .next/server/app/index.html`.
 *
 * `adjustFontFallback` makes Next generate metric overrides against the named
 * system face so the `display: swap` reflow is close to shift-free.
 *
 * NOTE ON VARIABLE NAMES: next/font emits raw, private variables
 * (`--font-gloock`, …). `app/globals.css` maps them onto the public token names
 * `--font-display`, `--font-serif-italic`, `--font-sans`, `--font-mono` inside
 * `@theme inline`. Using the same name on both sides would be self-referential.
 * Always consume the public names (or the `font-display` / `font-sans` /
 * `font-mono` / `font-serif-italic` Tailwind utilities).
 */

/** Gloock — display serif. H1s and big numerals. LCP element on `/`. */
export const display = localFont({
  src: "./fonts/gloock.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-gloock",
  display: "swap",
  preload: true,
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "Times New Roman", "serif"],
})

/** Instrument Serif Italic — the accent word inside display headings. */
export const serifItalic = localFont({
  src: "./fonts/instrument-serif-italic.woff2",
  weight: "400",
  style: "italic",
  variable: "--font-instrument-serif-italic",
  display: "swap",
  preload: true,
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "Times New Roman", "serif"],
})

/** Instrument Sans — body copy. Variable `wght` 400–700, `wdth` pinned to 100. */
export const sans = localFont({
  src: "./fonts/instrument-sans.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-instrument-sans",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
  fallback: ["system-ui", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
})

/** JetBrains Mono — eyebrows, metadata, chips. Never above the fold alone. */
export const mono = localFont({
  src: "./fonts/jetbrains-mono.woff2",
  weight: "100 800",
  style: "normal",
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
})

/** Space-separated class list for `<html>`; exposes all four CSS variables. */
export const fontVariables = [
  display.variable,
  serifItalic.variable,
  sans.variable,
  mono.variable,
].join(" ")
