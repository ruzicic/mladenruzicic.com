import type { NextConfig } from "next"

/**
 * v3 config — see docs/v3-redesign-plan.md §4.
 *
 * - `cacheComponents` enables Partial Prerendering + `<Activity>` route retention.
 * - `partialPrefetching` streams partial prefetches for `<Link>`.
 * - `reactCompiler` runs babel-plugin-react-compiler over app code.
 * - `/:path*.md` rewrites to the markdown-mirror route handler in `app/md/[...path]`.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
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
    ]
  },
  async rewrites() {
    return [{ source: "/:path*.md", destination: "/md/:path*" }]
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
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ]
  },
}

export default nextConfig
