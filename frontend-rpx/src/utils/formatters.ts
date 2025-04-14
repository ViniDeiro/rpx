/**
 * Utilitário de formatação de valores para a aplicação
 */

/**
 * Formata um valor numérico para o formato de moeda brasileira (BRL)
 * @param value Valor a ser formatado
 * @returns String formatada (ex: R$1.234,56)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata uma data para o formato brasileiro
 * @param date Data a ser formatada
 * @returns String formatada (ex: 01/01/2023)
 */
export function formatDate(date: Date | string): string {
  if (!date) return '--';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('pt-BR');
}

/**
 * Formata uma data e hora para o formato brasileiro
 * @param date Data a ser formatada
 * @returns String formatada (ex: 01/01/2023 14:30)
 */
export function formatDateTime(date: Date | string): string {
  if (!date) return '--';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('pt-BR') + ' ' + 
         dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
} 