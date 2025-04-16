/**
 * Configurações de ambiente para a aplicação
 * Detecta automaticamente se estamos em desenvolvimento ou produção
 */

// URL base da aplicação
export const getBaseUrl = (): string => {
  if (process.env.VERCEL_URL) {
    // Em produção na Vercel
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (process.env.NEXTAUTH_URL) {
    // Usar URL configurada explicitamente
    return process.env.NEXTAUTH_URL;
  }
  
  // Fallback para localhost
  return 'http://localhost:3000';
};

// URL de autenticação para NextAuth
export const getAuthUrl = (): string => {
  return process.env.NEXTAUTH_URL || getBaseUrl();
};

// Segredo JWT
export const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'rpx-app-secret-key-muito-segura-2024';
};

// Tempo de expiração do token JWT
export const getJwtExpiresIn = (): string => {
  return process.env.JWT_EXPIRES_IN || '7d';
};

// Verificar se estamos em ambiente de produção
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

// Verificar se estamos em ambiente de desenvolvimento
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
}; 