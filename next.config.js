/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/pitch-deck',
        destination: 'https://docs.google.com/presentation/d/e/2PACX-1vSpzAy_XZyKrco4k47P5eaDnYqB36VF0L2T2WbGLLTCl9nXVNb8H7ZovXgSVpdoXHCzBQurgPWbRp54/pub?start=true&loop=false&delayms=60000',
        permanent: false,
      },
    ]
  },
}
