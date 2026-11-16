import localFont from "next/font/local"

/**
 * The Geist family, self-hosted through `next/font/local`
 * (docs/v4-build/PLAN.md §2, docs/v4-build/AUDIT.md "Fonts").
 *
 * The files in `app/fonts/` are cut from the `geist@1.9.2` package's WOFF2
 * faces with fontTools (SIL OFL 1.1, no Reserved Font Name, so modified
 * versions may keep the name; the licence travels with them as
 * `app/fonts/OFL.txt`). The package's full faces carry Cyrillic,
 * Greek and symbol sets this site never draws; together they were 184 KB.
 * These three are 95 KB:
 *
 * | File                               | From                          | Cut                                   |
 * | ---------------------------------- | ----------------------------- | ------------------------------------- |
 * | `geist-serif-regular-latin.woff2`  | `GeistSerif-Regular.woff2`    | Latin subset                          |
 * | `geist-sans-latin.woff2`           | `Geist-Variable.woff2`        | Latin subset, `wght` axis cut to 400–600 |
 * | `geist-mono-regular-latin.woff2`   | `GeistMono-Variable.woff2`    | static instance at `wght=400`, Latin subset |
 *
 * Kept code points: U+0000-024F (Basic Latin to Latin Extended-B, so
 * "Ružičić", "ćeš", "Đ"), U+02B0-036F (modifiers, combining marks),
 * U+2000-206F (punctuation: ’ “ ” … – ·), U+20A0-20CF, U+2100-214F,
 * U+2190-21FF (→ ↗), U+2200-23FF (× − ⌘), U+25A0-25FF, U+2700-27BF,
 * U+FB00-FB06, U+FEFF, U+FFFD. All OpenType layout features are kept
 * (`tnum` for the clock and the counters, the stylistic sets).
 *
 * Regenerate (fontTools from the uv cache, offline):
 *
 *   U="U+0000-024F,U+02B0-02FF,U+0300-036F,U+2000-206F,U+20A0-20CF,U+2100-214F,U+2190-21FF,U+2200-22FF,U+2300-23FF,U+25A0-25FF,U+2700-27BF,U+FB00-FB06,U+FEFF,U+FFFD"
 *   G=node_modules/geist/dist/fonts
 *   pyftsubset $G/geist-serif/GeistSerif-Regular.woff2 --unicodes="$U" --layout-features='*' --flavor=woff2 --output-file=app/fonts/geist-serif-regular-latin.woff2
 *   pyftsubset $G/geist-sans/Geist-Variable.woff2 --unicodes="$U" --layout-features='*' --flavor=woff2 --output-file=sans.woff2
 *   fonttools varLib.instancer sans.woff2 wght=400:600 -o app/fonts/geist-sans-latin.woff2
 *   fonttools varLib.instancer $G/geist-mono/GeistMono-Variable.woff2 wght=400 --static -o mono.ttf
 *   pyftsubset mono.ttf --unicodes="$U" --layout-features='*' --flavor=woff2 --output-file=app/fonts/geist-mono-regular-latin.woff2
 *
 * (`uvx --from fonttools --with brotli pyftsubset …` runs either tool.)
 * A new character outside these ranges falls back to the system face for
 * that glyph only; add its range here and regenerate.
 *
 * Weights in use (measured on every page at 1440 and 390 wide): Geist 400,
 * 500, 600; Geist Mono 400; Geist Serif 400. `font-synthesis: none` in
 * `app/globals.css` keeps the browser from faking a weight or italic the
 * files do not have: a 700 request draws at 600.
 *
 * - **Geist Serif**: display lines and quotes. The static "Regular" cut is
 *   the variable font's `ELSH = 0` instance, so the page never sets the
 *   `ELSH` axis.
 * - **Geist**: text and interface.
 * - **Geist Mono**: small labels. No metric fallback, as the package ships
 *   it: the monospace fallbacks are within 0.4% of its advance width
 *   (Menlo 99.7%, Courier New 100.0%, measured as below).
 *
 * All three keep next/font defaults `display: swap` and `preload: true`.
 *
 * METRIC FALLBACKS (2026-11-16): next/font's automatic fallback faces are
 * off (`adjustFontFallback: false`, no `fallback`) for Geist and Geist
 * Serif. Their `size-adjust` comes from `xAvgCharWidth` (Arial 106.28%,
 * Times New Roman 114.41%), which sets this site's text 3 to 4% wider than
 * Geist does, so on a slow phone the opening paragraphs wrapped to one more
 * line before the swap and lost it after (CLS 0.22 on /mentoring). And they
 * name only Arial and Times New Roman, which Android does not have: there
 * the text fell through to plain Roboto and Noto Serif, unadjusted.
 *
 * The fallback faces are now our own `@font-face` rules in
 * `app/globals.css`, one per platform font, listed right after the web font
 * in `--font-sans` and `--font-display`:
 *
 * | Family                       | `local()`                                  | Weight  | Mean    | Set     |
 * | ---------------------------- | ------------------------------------------ | ------- | ------- | ------- |
 * | `Geist Fallback Arial`       | Arial (Apple, Windows), Helvetica, Liberation Sans | 400 | 102.5%  | 103.1%  |
 * |                              |                                            | 500-600 | 104.86% | 104.86% |
 * | `Geist Fallback Roboto`      | Roboto (Android)                           | 400     | 103.01% | 103.01% |
 * |                              |                                            | 500-600 | 105.49% | 105.49% |
 * | `Geist Serif Fallback Times` | Times New Roman, Liberation Serif          | 400     | 113.02% | 111.7%  |
 * | `Geist Serif Fallback Noto`  | Noto Serif (Android)                       | 400     | 95.41%  | 94.5%   |
 *
 * "Mean" is measured, not taken from `xAvgCharWidth`: the summed advance
 * width of every visible text run on eight pages at 390 wide (the site's
 * real copy, uppercased where CSS uppercases it; 18,246 characters of Geist
 * 400, 2,438 of 500/600, 3,146 of Geist Serif) set in the web font, over
 * the same text set in the fallback, in Playwright Chromium and WebKit
 * (they agree to 0.03%). Helvetica measured the same as Arial; Liberation
 * Sans and Serif are metric-compatible with Arial and Times New Roman by
 * design. Roboto and Noto Serif were measured from Roboto 2.137 and Noto
 * Serif 2.015 files. A single paragraph runs 1.5% either side of the mean,
 * so "Set" is the value, swept around the mean, at which the fewest blocks
 * on eight pages at 360, 390, 412, 430 and 1350 wide change height between
 * the fallback and the web font, the first screen counting most. For Geist
 * Serif that is a narrow window: "Mentoring, for a strong fit." fills 98%
 * of the column at 1350 and wraps above 111.8% (Times New Roman), "Stuff
 * I've put real time into" wraps below 111.5%. The testimonials are left
 * out of that count: the cards sit in a pile of fixed height, so a card's
 * wrap moves nothing.
 *
 * A fallback face has no bold, and `font-synthesis: none` keeps it from
 * faking one, so 500 and 600 draw the regular cut at Geist Medium's widths.
 * `ascent-override` and `descent-override` are Geist's own metrics (1005
 * and 295 per 1000 in both families, no line gap) over the face's
 * `size-adjust`, so a line box is the same height in either font.
 *
 * Re-measure after a font change or a large copy change: the mean per
 * family and weight from `measureText` in both engines (web / fallback, in
 * percent), then check the wraps with the web fonts blocked, and the
 * throttled swap test in `tests/budgets.spec.ts`.
 *
 * NOTE ON VARIABLE NAMES: next/font emits private variables
 * (`--font-geist-serif-regular`, `--font-geist-sans`, `--font-geist-mono`).
 * `app/globals.css` maps them onto the public tokens `--font-display`,
 * `--font-sans`, `--font-mono` inside `@theme inline`. Do not give both sides
 * the same name: it would be self-referential.
 */
const display = localFont({
  src: "./fonts/geist-serif-regular-latin.woff2",
  variable: "--font-geist-serif-regular",
  weight: "400",
  // The fallback faces and the stack are in `app/globals.css`.
  adjustFontFallback: false,
})

const sans = localFont({
  src: "./fonts/geist-sans-latin.woff2",
  variable: "--font-geist-sans",
  weight: "400 600",
  // The fallback faces and the stack are in `app/globals.css`.
  adjustFontFallback: false,
})

const mono = localFont({
  src: "./fonts/geist-mono-regular-latin.woff2",
  variable: "--font-geist-mono",
  weight: "400",
  adjustFontFallback: false,
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Roboto Mono",
    "Menlo",
    "Monaco",
    "Liberation Mono",
    "DejaVu Sans Mono",
    "Courier New",
    "monospace",
  ],
})

/** Space-separated class list for `<html>`; exposes the three variables. */
export const fontVariables = [
  display.variable,
  sans.variable,
  mono.variable,
].join(" ")
