import { useState, useEffect } from 'react';

/**
 * Hook para pré-carregar uma imagem
 * @param src URL da imagem para pré-carregar
 * @param fallbackSrc URL opcional de fallback se a principal falhar
 * @returns Um objeto com estado do carregamento e a URL final a ser usada
 */
export function useImagePreload(src?: string, fallbackSrc: string = '/images/avatar-placeholder.svg') {
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string>(fallbackSrc);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      setImageUrl(fallbackSrc);
      return;
    }

    // Reset states
    setIsLoading(true);
    setError(false);
    
    const img = new Image();
    
    img.onload = () => {
      console.log('Imagem pré-carregada com sucesso:', src);
      setImageUrl(src);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      console.error('Erro ao carregar imagem:', src);
      setImageUrl(fallbackSrc);
      setError(true);
      setIsLoading(false);
    };
    
    img.src = src;
    
    // Cleanup function
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, fallbackSrc]);

  return { isLoading, imageUrl, error };
}

/**
 * Função utilitária para pré-carregar uma imagem e retornar uma promessa
 * @param src URL da imagem para pré-carregar
 * @param timeout Tempo máximo de espera em ms
 * @returns Promise que resolve quando a imagem é carregada ou rejeita após timeout
 */
export function preloadImage(src: string, timeout: number = 5000): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!src) {
      resolve(false);
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      resolve(true);
    };
    
    img.onerror = () => {
      resolve(false);
    };
    
    img.src = src;
    
    // Timeout para não travar se a imagem não carregar
    setTimeout(() => resolve(false), timeout);
  });
} 