/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'exemplo-storage.com'],
  },
  // Desativar verificações de segurança apenas temporariamente para resolver o problema de rotas
  onDemandEntries: {
    // Período em ms em que o servidor armazenará páginas em cache
    maxInactiveAge: 25 * 1000,
    // Número de páginas que devem ser mantidas simultaneamente sem serem descartadas
    pagesBufferLength: 2
  },
  // Esta opção experimental pode ajudar com problemas de rotas, mas use com cuidado
  experimental: {
    // Apenas para a versão 13 ou superior do Next.js
    serverComponentsExternalPackages: [],
    // Adicione outras configurações experimentais, se necessário
  }
}

module.exports = nextConfig 