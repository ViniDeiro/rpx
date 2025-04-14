/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Configuração de compatibilidade com App Router (src/app) e Pages Router (pages)
  experimental: {
    // Removendo a opção appDir que está depreciada no Next.js 14
  },
  // Ajuste para imagens
  images: {
    domains: ['localhost', 'rpx-platform.com', 'api.rpx-platform.com', 'images.unsplash.com', 'via.placeholder.com'],
    unoptimized: process.env.NODE_ENV !== 'production',
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3001/api',
  },
  // Adicionar análise de bundle se a variável ANALYZE estiver definida
  ...(process.env.ANALYZE === 'true' ? { webpack: (config) => {
    // Aqui você pode adicionar plugins para analisar o bundle
    return config;
  }} : {}),
  // Configuração para CORS
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*' // Proxy para o backend
      }
    ]
  }
}

module.exports = nextConfig; 