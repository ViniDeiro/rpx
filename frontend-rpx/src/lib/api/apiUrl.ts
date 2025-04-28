/**
 * Utilitário para manipular URLs de API de forma segura
 */

/**
 * Gera uma URL absoluta para endpoints de API
 * @param path Caminho relativo da API (ex: /api/matchmaking/status)
 * @param params Parâmetros opcionais para a URL
 * @returns URL completa
 */
export function getApiUrl(path: string, params?: Record<string, string>): string {
  // Determinar a base URL dependendo do ambiente
  let baseUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // Em ambiente de desenvolvimento (cliente), usar o host atual
  if (typeof window !== 'undefined') {
    baseUrl = window.location.origin;
  } 
  // No servidor, usar URLs de ambiente ou localhost por padrão
  else if (!baseUrl) {
    baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
  }
  
  // Construir a URL
  try {
    const url = new URL(path, baseUrl);
    
    // Adicionar parâmetros à URL se fornecidos
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });
    }
    
    return url.toString();
  } catch (error) {
    console.error(`Erro ao construir URL para ${path}:`, error);
    
    // Fallback para uma construção manual
    const urlPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${urlPath}`;
  }
}

/**
 * Constrói os headers padrão para requisições à API
 * @param additionalHeaders Headers adicionais
 * @returns Headers para a requisição
 */
export function getApiHeaders(additionalHeaders?: Record<string, string>): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
  
  return headers;
}

/**
 * Realiza uma chamada à API com tratamento de erros
 * @param path Caminho da API
 * @param options Opções do fetch
 * @param params Parâmetros da URL
 * @returns Resultado da API
 */
export async function callApi<T>(
  path: string, 
  options?: RequestInit, 
  params?: Record<string, string>
): Promise<T> {
  const url = getApiUrl(path, params);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: getApiHeaders(options?.headers as Record<string, string>)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error(`Erro na chamada para ${url}:`, error);
    throw error;
  }
} 