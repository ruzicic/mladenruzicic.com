# assets/fonts

TTFs for `next/og` only. Satori reads TTF/OTF/WOFF but not WOFF2, so the OG
card loader (`lib/seo/og.tsx`) reads these at build time. Nothing in this
directory is served to the browser; the site itself uses Latin subsets of the
`geist` package's WOFF2 faces, in `app/fonts/`, through `next/font/local`
(`app/fonts.ts`).

The fonts are under the SIL Open Font License 1.1, which travels with them:
`OFL.txt` here and in `app/fonts/` is the `geist` package's own `LICENSE.txt`,
copied unchanged.

| File                     | Family            | Licence                   | Source                                                                                         |
| ------------------------ | ----------------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| `GeistSerif-Regular.ttf` | Geist Serif (400) | SIL Open Font License 1.1 | `geist@1.9.2`, `dist/fonts/geist-serif/GeistSerif-Regular.woff2`, converted to TTF (see below) |
| `Geist-Regular.ttf`      | Geist (400)       | SIL Open Font License 1.1 | `geist@1.9.2`, `dist/fonts/geist-sans/Geist-Regular.ttf`, unmodified                           |
| `GeistMono-Regular.ttf`  | Geist Mono (400)  | SIL Open Font License 1.1 | `geist@1.9.2`, `dist/fonts/geist-mono/GeistMono-Regular.ttf`, unmodified                       |

The `geist` package ships Geist Serif only as WOFF2. `GeistSerif-Regular.ttf`
was decoded from `GeistSerif-Regular.woff2` (SHA-256
`98979c19f111bc48d731702d40b8707845b667def7f722ee1b49346a75151dad`) with macOS
CoreText: every table the font carries (GDEF GPOS GSUB OS/2 cmap cvt fpgm gasp
glyf head hhea hmtx loca maxp meta name post prep) was read back and written
into a plain sfnt with fresh checksums. WOFF2 is lossless, so the outlines and
metrics are the originals. It is the static "Regular" shape (the variable
font's `ELSH = 0` instance), the only serif shape the site uses. Result:
167,052 bytes, SHA-256
`d063bdc255050beaae3393816edd70dfa20fa9535c488e5036e6e757bd3a1132`.

When the `geist` package is upgraded, re-copy the two sans/mono files and
re-convert the serif the same way.

Gloock and JetBrains Mono (the v3 pairing) were removed with the v3 cards.
