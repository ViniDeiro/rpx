import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina várias classes CSS com suporte a Tailwind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata uma data para exibição localizada
 */
export function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formata um valor de moeda
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Atrasa a execução de uma função por um determinado tempo
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Obtém as iniciais de um nome
 */
export function getInitials(name: string) {
  if (!name) return '';
  
  const nameParts = name.split(' ').filter(Boolean);
  
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }
  
  return (
    nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
  ).toUpperCase();
}

/**
 * Trunca um texto para um tamanho máximo
 */
export function truncateText(text: string, maxLength: number) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
} 