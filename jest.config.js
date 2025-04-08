/**
 * Configuração do Jest para testes
 */

module.exports = {
  // Diretório onde os testes estão
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
  
  // Diretórios a ignorar
  testPathIgnorePatterns: ['/node_modules/', '/build/', '/dist/'],
  
  // Ambiente de teste
  testEnvironment: 'node',
  
  // Timeout para testes (10 segundos)
  testTimeout: 10000,
  
  // Setup para todos os testes
  setupFilesAfterEnv: ['./src/tests/setup.js'],
  
  // Coletar cobertura de código
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',
    '!src/docs/**',
    '!**/*.config.js',
    '!**/node_modules/**'
  ],
  
  // Diretório para arquivos de cobertura
  coverageDirectory: 'coverage',
  
  // Limites para cobertura de código (mínimo)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Mostrar mensagens de diagnóstico durante os testes
  verbose: true
}; 