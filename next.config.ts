import type { NextConfig } from "next"
import { wgslTurbopackRule } from "@vgpu/wgsl/next"

import { askLiveConfig, TURNSTILE_ORIGIN } from "./lib/ask/site-config"
import { newsletterTurnstile } from "./lib/newsletter/turnstile"

/**
 * Site config (2027 build, docs/v4-build/PLAN.md).
 *
 * - `cacheComponents` enables Partial Prerendering + `<Activity>` route retention.
 * - `partialPrefetching` streams partial prefetches for `<Link>`.
 * - `reactCompiler` runs babel-plugin-react-compiler over app code.
 * - `/:path*.md` is NOT a rewrite here: `proxy.ts` maps it to `app/md/[...path]`
 *   for the known twins only and answers anything else with a `no-store` 404.
 */
/**
 * Work entries that keep a row in the list but no longer have a page of their
 * own (PLAN.md §1: six stories, plus Panciona, HEGIAS and WolkAbout). Each
 * 308s to its row on `/work`.
 */
const RETIRED_WORK_PAGES = [
  "amada",
  "avataurus",
  "boxium",
  "evo-touch",
  "flexmatch",
  "fontswap",
  "hi-fam",
  "internxt",
  "mladenruzicic-com",
  "montepop",
  "nunium",
  "trello-boosted-boards",
]

/**
 * Content-Security-Policy (docs/v4-build/AUDIT.md). Every page is static
 * (Cache Components prerenders them), so a per-request nonce is not an
 * option: Next's inline flight scripts need `'unsafe-inline'` in
 * `script-src`. The policy still pins every other source to this origin
 * plus the one third party the site uses, Fathom (`cdn.usefathom.com` serves
 * the script and receives the beacon). With the live Ask configured, the
 * Worker's origin joins `connect-src`, and Turnstile's origin joins
 * `script-src` and `frame-src` (developers.cloudflare.com/turnstile/reference/content-security-policy/),
 * as it also does when only the newsletter's check is on (the site key and
 * `TURNSTILE_SECRET_KEY`). Speed Insights is same-origin
 * (`/_vercel/speed-insights/*`). Preview deployments also allow the Vercel
 * toolbar's origins; production does not.
 */
const PREVIEW = process.env.VERCEL_ENV === "preview"
// `next dev` evaluates modules with eval (React Refresh, source maps).
const DEV_EVAL = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""
const FATHOM = "https://cdn.usefathom.com"
const TOOLBAR = PREVIEW ? " https://vercel.live" : ""
// The Ask Worker (workers/ask) and Turnstile, only when the site is built
// with both of their variables (lib/ask/site-config.ts). The newsletter's
// Turnstile check needs the same origin, only when both of its variables
// are set (lib/newsletter/turnstile.ts).
const ASK = askLiveConfig()
const ASK_ORIGIN = ASK ? ` ${new URL(ASK.endpoint).origin}` : ""
const CHALLENGE = Boolean(ASK || newsletterTurnstile())
const TURNSTILE = CHALLENGE ? ` ${TURNSTILE_ORIGIN}` : ""
const FRAMES =
  [PREVIEW ? "https://vercel.live" : "", CHALLENGE ? TURNSTILE_ORIGIN : ""]
    .filter(Boolean)
    .join(" ") || "'none'"
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${DEV_EVAL} ${FATHOM}${TURNSTILE}${TOOLBAR}`,
  `style-src 'self' 'unsafe-inline'${TOOLBAR}`,
  `img-src 'self' data: blob: ${FATHOM}${PREVIEW ? " https://vercel.live https://vercel.com" : ""}`,
  `font-src 'self'${PREVIEW ? " https://vercel.live https://assets.vercel.com" : ""}`,
  `connect-src 'self' ${FATHOM}${ASK_ORIGIN}${PREVIEW ? " https://vercel.live wss://ws-us3.pusher.com" : ""}`,
  "media-src 'self'",
  `frame-src ${FRAMES}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ")

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // No `X-Powered-By: Next.js` on every response.
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async redirects() {
    return [
      { source: "/cv", destination: "/cv.pdf", permanent: true },
      { source: "/mentorship", destination: "/mentoring", permanent: true },
      // The old `/uses` page; its contents live on `/about`.
      { source: "/uses", destination: "/about", permanent: true },
      // The previous site's favicon and share-card URLs (its page head still
      // sits in shared links and crawler caches). Same image, new route.
      { source: "/icon", destination: "/icon.svg", permanent: true },
      {
        source: "/opengraph-image.png",
        destination: "/opengraph-image",
        permanent: true,
      },
      {
        source: "/static/images/opengraph-image.png",
        destination: "/opengraph-image",
        permanent: true,
      },
      ...RETIRED_WORK_PAGES.map((slug) => ({
        source: `/work/${slug}`,
        // These six have no row on the list, so no `/work#<slug>` anchor:
        // EVO Touch is told in the ZF SCALAR story, the rest land on `/work`.
        // Villa Amada has had a row since 16 Nov 2026.
        destination:
          slug === "evo-touch"
            ? "/work/zf-scalar"
            : /^(avataurus|boxium|fontswap|mladenruzicic-com|montepop|trello-boosted-boards)$/.test(
                  slug
                )
              ? "/work"
              : `/work#${slug}`,
        permanent: true,
      })),
    ]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Every outbound link already carries `rel="noopener"`; this keeps
          // a window this site opens from reaching back into it either way.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          // Deliberately no `X-XSS-Protection`. The header is deprecated, no
          // current browser implements it, and the auditor it used to switch
          // on was itself an XSS vector in the browsers that did — OWASP and
          // MDN both say omit it (or send `0`). Do not add it back.
          // `strict-` also drops the referrer on an https -> http hop.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
          },
        ],
      },
      {
        // `public/static/**` file names carry no content hash, and the
        // placeholder screenshots and marks there will be replaced in place.
        // `immutable` for a year would pin the old files in every browser
        // (and, through next/image's upstream TTL, in the optimizer cache).
        // A day fresh, a week stale-while-revalidate.
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ]
  },
}

/**
 * The homepage dent's shaders (`app/components/landing/dent/*.wgsl`) are
 * prepared at build time by vgpu's loader, so the browser gets prepared
 * data and never the WGSL parser. The rule hashes the installed compiler,
 * so a restored `.next/cache` rebuilds the shaders after an upgrade.
 */
export default {
  ...nextConfig,
  turbopack: {
    ...nextConfig.turbopack,
    rules: {
      ...nextConfig.turbopack?.rules,
      "*.wgsl": wgslTurbopackRule({ minify: true }),
    },
  },
} satisfies NextConfig
