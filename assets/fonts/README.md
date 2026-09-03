# assets/fonts

TTFs for `next/og` only. Satori cannot read the subset WOFF2 faces in
`app/fonts/`, so the OG card loader (`lib/seo/og.tsx`) reads full TTFs from
here at build time. Nothing in this directory is served to the browser.

| File                        | Family                 | Version | Licence                                                      | Source                                                                                                                                                                       |
| --------------------------- | ---------------------- | ------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Gloock-Regular.ttf`        | Gloock Regular         | —       | SIL Open Font License 1.1                                    | [google/fonts](https://github.com/google/fonts/tree/main/ofl/gloock)                                                                                                         |
| `JetBrainsMono-Regular.ttf` | JetBrains Mono Regular | 2.304   | SIL Open Font License 1.1 (`OFL.txt` in the release archive) | [JetBrains/JetBrainsMono release v2.304](https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip), `fonts/ttf/JetBrainsMono-Regular.ttf` |

`JetBrainsMono-Regular.ttf` is the unmodified release file: 273,900 bytes,
SHA-256 `a0bf60ef0f83c5ed4d7a75d45838548b1f6873372dfac88f71804491898d138f`.

Gloock sets the headline on an OG card; JetBrains Mono sets the eyebrow, the
footer line and the metric label, so the card matches the site's type pairing
rather than rendering every line in the display face.
