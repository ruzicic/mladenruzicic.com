// const { withContentlayer } = require('next-contentlayer')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    mdxRs: true,
  },
  async redirects() {
    return [
      {
        source: '/cv',
        destination: '/cv.pdf',
        permanent: true,
      },
    ]
  },
}

const withMDX = require('@next/mdx')()

module.exports = withMDX(nextConfig) //withContentlayer(nextConfig)
