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
 *   `ELSH` axis. Times New Roman metric fallback.
 * - **Geist**: text and interface. Arial metric fallback (next/font's
 *   default `adjustFontFallback` for local fonts).
 * - **Geist Mono**: small labels. No metric fallback, as the package ships
 *   it: a monospace fallback is already close in advance width.
 *
 * All three keep next/font defaults `display: swap` and `preload: true`.
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
  fallback: ["Times New Roman", "Times", "serif"],
  adjustFontFallback: "Times New Roman",
})

const sans = localFont({
  src: "./fonts/geist-sans-latin.woff2",
  variable: "--font-geist-sans",
  weight: "400 600",
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
