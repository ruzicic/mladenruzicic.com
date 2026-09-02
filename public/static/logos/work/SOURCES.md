# Project marks — sources and provenance

The SVGs in this directory are the per-project marks for the twenty entries in
`content/work/`. They are the sibling set to the employer marks in
`../mono/SOURCES.md`, and they are held to the same rules.

Consumers:

- `app/components/work-system/WorkMark.tsx` — the accent-tinted square next to
  a case-study `h1`, a `/work` card title, a homepage work-row title and the
  related / prev-next tiles;
- `app/components/primitives/Chip.tsx` — the `brand` chip's 18 px leading
  square, when a caller passes `logo`.

Both paint the file as a **CSS `mask-image`**, not as an `<img>`: only the
alpha channel is read and the ink is chosen by `inkOn(accent)`, so a mark stays
legible on TenderLift yellow and on ZF blue alike. The literal `fill="#fff"`
in each file is still what makes the marks work in the hero's and the
timeline's isolated-image-document loaders, so it stays.

House rules applied to all seventeen:

- geometry only — `<path>`, `<polygon>`, `<circle>`, `<rect>`; no `<text>`, no
  `<image>`, no embedded raster, no `<style>`, no editor metadata, no strokes
  (the two that had strokes were redrawn as fills);
- a single `fill="#fff"` on one wrapping `<g>`;
- a **square** `viewBox` with the mark centred. The viewBox is not the source
  file's — `scratchpad .../build.py` renders each mark, measures its ink bbox,
  and recomputes a square box with a per-mark padding, so padding is optical
  rather than inherited;
- every file is well under 20 KB (largest is 2.0 KB, `wolkabout.svg`).

**Nominative use.** Marks belonging to third parties (ZF, Shopify, HEGIAS,
WolkAbout, Trello, Internxt) are registered trademarks of their owners and are
reproduced here solely to identify work Mladen did, on a personal CV site —
nominative fair use. No mark is used as a logo for this site, no affiliation,
sponsorship or endorsement is implied, and no mark is altered beyond being
flattened to a single colour and re-cropped. Any owner who would prefer their
mark removed can have it removed: delete the file and the `logo` field in that
entry's frontmatter, and the `mark` text fallback takes over automatically.
The remaining marks belong to Mladen's own products.

Retrieval date for everything below: **2026-09-02**.

---

## Reused verbatim from `../mono/`

Byte-identical copies, so the work surfaces and the timeline never drift:

| file | copied from | why |
|---|---|---|
| `zf-scalar.svg` | `../mono/zf-scalar.svg` | the `zf-scalar` entry is ZF |
| `evo-touch.svg` | `../mono/zf-scalar.svg` | EVO Touch is `confidentiality: limited` ZF work; the ZF ring stands in for product art that cannot be published |
| `shopify.svg` | `../mono/shopify.svg` | the Shopify bag glyph, per decision 8 in `CLAUDE.md` |
| `hegias.svg` | `../mono/hegias.svg` | |
| `wolkabout.svg` | `../mono/wolkabout.svg` | |

See `../mono/SOURCES.md` for those five sources.

---

## Live products

### tenderlift.svg

- **Source:** `https://tenderlift.ch/favicon.svg` (HTTP 200) — the site's own
  mark: a black "t" with the red step above it.
- **Changed:** dropped the white rounded-rect tile, replaced `#000` / `#DA291C`
  with a single white group, recomputed a square `viewBox` (10 % padding).
  Three `<path>`s, 414 B. Geometry is byte-for-byte the official artwork.

### studenti-rs.svg

- **Source:** the mark already in this repo at
  `../studenti.svg` (from the previous version of this site). Verified against
  the live studenti.rs, whose
  `.../studently-theme/static/favicon-196x196.png` (HTTP 200) is the same
  diamond-with-an-S.
- **Changed:** dropped the 128 px white tile, replaced the `#008060` fill with
  white, kept the `fill-rule="evenodd"` that cuts the S out of the diamond,
  recomputed a square `viewBox` (2 % padding — it is the lightest outline in
  the set, so it gets the least). One `<path>`, 413 B.

### fontalternatives.svg

- **Source:** `https://fontalternatives.com/favicon.svg` (HTTP 200) — the two
  orange brackets. Corroborated by the site's `apple-touch-icon.png`.
- **Changed:** dropped the `<style>` block with its `prefers-color-scheme`
  override, replaced `#E55D28` with white, recomputed a square `viewBox`
  (12 % padding — solid brackets are heavy). Two `<path>`s, 243 B.

### fontswap.svg

- **Source:** the Chrome Web Store listing icon for FontSwap,
  `https://lh3.googleusercontent.com/zGpSFuI9uol_…=s512`, the `og:image` of
  `https://chromewebstore.google.com/detail/fontswap/mhkkpbhepfoejcjomclfmopgdabbfmkm`.
  Google serves it at 128 px regardless of the requested size; no vector exists.
- **Changed:** the white "F" was isolated from the orange tile by luminance,
  upscaled 8× and traced with potrace (`scratchpad .../trace.py`), giving one
  `<path>` of 732 characters that follows the glyph's own contour rather than
  a redrawn approximation. The orange tile is dropped — the rest of the set is
  marks, not app tiles. Square `viewBox`, 14 % padding, 861 B.
- **This is the only traced mark.** If a vector of the FontSwap icon turns up,
  replace this file with it.

### amada.svg

- **Source:** `https://www.stayamada.com/assets/icons/favicon.svg` (HTTP 200) —
  a low sun over the Wadden Sea horizon. Corroborated by the site's
  `apple-touch-icon.png`.
- **Changed:** dropped the cream background rect; the two `<line>`s (stroked,
  one at 50 % opacity) were redrawn as filled rounded `<rect>`s of the same
  length, weight and position so the whole mark is one opaque fill; the sun arc
  is the official path verbatim. Square `viewBox`, 4 % padding. 264 B.

### avataurus.svg

- **Source:** `https://avataurus.com/og-image.svg` (HTTP 200), the first avatar
  tile: two round eyes (`r="4.8"` at `28.8,35.43` and `51.2,35.43`) and the
  smile `M33.6 52 Q40 48.8 46.4 52`.
- **Changed:** the gradient tile is dropped; the two eyes are the official
  circles verbatim; the smile, which the source draws as a 1.92-wide stroked
  quadratic with round caps, is flattened to a filled outline of the same
  curve and weight so the mark carries no strokes. Square `viewBox`, 4 %
  padding. Two `<circle>`s and one `<path>`, 688 B.
- **Not the favicon.** `avataurus.com`'s favicon draws a letter in the mouth
  slot with `<text>`, which the house rules forbid and which would not
  rasterise without a webfont. The og-image tile is the same generated-face
  vocabulary without that problem.

### montepop.svg

- **Source:** `https://montepop.com/montepop-logo.svg` (HTTP 200) — the
  official logo lockup. The face paths inside it (the two eyes and the smile,
  indices 51, 54 and 59 of 69) are lifted verbatim.
- **Changed:** the "Montepop" wordmark is 3.4 : 1 and unusable in a square, and
  the red blob behind the face reduces to a lozenge at 18 px, so the mark is
  the character's face alone. The two cheek blushes were dropped as well —
  five scattered shapes read as noise at 18 px, three read as a face. Fills
  `#5B0E0B` / `#F9F3EA` → white; square `viewBox`, 4 % padding. 1.4 KB.
- The favicon (`montepop.com/favicon.ico`, 48 px maximum) is the whole lockup
  and is unusable at any size this site renders.

### nunium.svg

- **Source:** `https://nunium.com/logo.svg` (HTTP 200) — the official 500²
  "n" mark, two paths.
- **Changed:** `fill="black"` → white, square `viewBox` (16 % padding — it is a
  heavy slab letterform). 351 B. Geometry is byte-for-byte the official
  artwork.
- nunium.com resolves again as of 2026-09-02 and still lists Mladen on its team
  page, so this is the live mark, not an archived one.

### mladenruzicic-com.svg

- **Source:** the mark already in this repo at `../mladenruzicic-com.svg`
  (from the previous version of this site). Corroborated by the live
  `https://mladenruzicic.com/icon`, which draws the same arrow.
- **Changed:** dropped the 128 px white tile and its empty clip path, replaced
  the black fill with white, recomputed a square `viewBox` (14 % padding).
  One `<path>`, 866 B.

---

## Extensions

### trello-boosted-boards.svg

- **Source:** the Trello board mark already in this repo at `../trello.svg`
  (from the previous version of this site). The extension's own listing icons
  are the same artwork: `https://addons.mozilla.org/user-media/addon_icons/704/704201-128.png`
  (from the AMO API for `trello-boosted-boards`, HTTP 200) is a 64 px raster of
  it, and the Chrome listing is on the retired `chrome.google.com/webstore`
  domain.
- **Changed:** the source draws a `#0079BF` square with two white cards on top.
  Inverted into one `fill-rule="evenodd"` path — a white square with the two
  cards knocked out — so it reads on the dark ground and is not a solid block.
  Square `viewBox`, 18 % padding (it is the heaviest silhouette in the set).
  796 B.
- Trello is Atlassian's mark; the extension is a third-party add-on and has
  never had a mark of its own.

### fontswap.svg

See "Live products" above — it is the FontSwap Chrome listing icon.

---

## Archived / third-party products

### internxt.svg

- **Source:** `https://internxt.com/favicon.ico` (HTTP 200, a 216 px PNG inside
  the ICO) — the Internxt "X". `internxt.com` publishes no SVG of it, and
  `../internxt.svg` in this repo is the *wordmark*, unusable in a square.
- **Changed:** the X is a straight 12-corner polygon, so rather than trace the
  bitmap its corners were measured off the favicon's alpha mask (outer half-
  width 53, arm width 27, half-height 59, notches at ±20.17 and ±13.5 — the
  measured values, symmetrised) and redrawn as one `<polygon>`. It overlays the
  official bitmap. Square `viewBox`, 14 % padding. 225 B.

### panciona.svg

- **Source:** the mark already in this repo at `../panciona.svg` (from the
  previous version of this site). Corroborated by the Web Archive snapshot
  `https://web.archive.org/web/20220505111038/https://panciona.com/`, whose
  header carries the same chevron mark.
- **Changed:** dropped the 128 px white tile, replaced the black fills with
  white, recomputed a square `viewBox` (6 % padding). Three `<path>`s, 964 B.
- **Do not use the live panciona.com.** It does not resolve, and the Archive's
  only later capture (16 Apr 2025) is an unrelated gambling-affiliate site on
  the resold domain.

---

## Entries with no mark

Three entries ship the text `mark` fallback in their frontmatter instead of a
file here, because no published mark exists to source:

| entry | `mark` | why |
|---|---|---|
| `boxium` | `BX` | boxium.com no longer serves the product, and the Web Archive has **no** capture of it after 2020 — every capture on that domain predates the 2024 product and belongs to an earlier owner. |
| `flexmatch` | `FM` | flexmatch.com is a third party's domain behind Cloudflare; both 200-status captures (Oct 2024, Apr 2025) are the "One moment, please…" challenge page. |
| `hi-fam` | `HF` | no URL for the project exists in `content/`, in git history, or in the dossier. `hifam.app` was captured twice in 2024 showing only a "Coming Soon" placeholder, and `hifam.com` is an unrelated business running since 2009. |

If the owner can supply artwork — or a repository — for any of the three, drop
a mark in here and add the `logo` field; nothing else changes.

---

## Optical sizing

`WorkMark` and the chip square both fit a mark with `mask-size: contain`, so a
mark's apparent size is set entirely by the padding baked into its `viewBox`.
The paddings below were tuned by rendering the whole set at 18 / 28 / 52 px on
the site's dark ground and levelling them by eye
(`scratchpad .../sheet.js` writes the contact sheet).

| mark | padding | why |
|---|---|---|
| studenti-rs | 0.02 | thinnest outline in the set |
| amada | 0.04 | a thin rule and a small arc |
| avataurus | 0.04 | three small features, mostly empty square |
| montepop | 0.04 | three small features |
| panciona | 0.06 | open chevron outline |
| tenderlift | 0.10 | mid-weight letterform |
| fontalternatives | 0.12 | solid brackets |
| fontswap | 0.14 | solid letterform |
| internxt | 0.14 | solid, full-bleed diagonal |
| mladenruzicic-com | 0.14 | solid arrow |
| nunium | 0.16 | heavy slab letterform |
| trello-boosted-boards | 0.18 | a filled square — the heaviest silhouette |

The five marks copied from `../mono/` keep the paddings tuned there, so the
same file renders identically in the hero, the timeline and the work system.

---

## Rebuilding

The generator is a scratch script, not part of the build: it renders each
candidate through `sharp`, measures the ink, and writes the square `viewBox`.
Nothing in `next build` reads it, and the committed SVGs are the artefact. If a
source mark changes, the honest move is to re-derive the file from the new
source and update the entry above.
