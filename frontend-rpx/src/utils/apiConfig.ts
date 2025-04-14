/**
 * Configurações para chamadas de API ao backend
 */

/**
 * Retorna a URL base do backend com base no ambiente
 */
export const getBackendUrl = (): string => {
  // Em ambiente de produção, pode apontar para um domínio externo
  // Em desenvolvimento, normalmente aponta para localhost na porta do servidor
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Usar URL do backend conforme configurada no env, ou fallback para localhost
  return process.env.NEXT_PUBLIC_API_URL || 
    (isDevelopment ? 'http://localhost:3001' : 'https://api.rpx-platform.com');
};

/**
 * Retorna a URL completa para um endpoint específico
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getBackendUrl();
  // Garantir que o endpoint comece com / e normalizar a URL
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${normalizedEndpoint}`;
};

/**
 * Headers padrão para requisições à API
 */
export const getDefaultHeaders = (authToken?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  return headers;
}; 