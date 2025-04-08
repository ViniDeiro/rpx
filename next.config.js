/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'exemplo-storage.com'],
  },
}

module.exports = nextConfig 