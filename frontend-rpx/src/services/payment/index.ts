/**
 * Serviço de Pagamento - RPX Platform
 * Este serviço integra APIs de pagamento externas com a plataforma RPX
 */

import { v4 as uuidv4 } from 'uuid';

// Tipos de dados para transações
export interface PaymentTransaction {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  type: 'deposit' | 'withdrawal';
  paymentMethod: string;
  gatewayResponse?: any;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
}

// Tipos de dados para parâmetros de criação de transações
export interface CreateTransactionParams {
  userId: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  paymentMethod: string;
  description?: string;
  callbackUrl?: string;
  returnUrl?: string;
}

// Tipos de dados para resposta de pagamento
export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  redirectUrl?: string;
  pixCode?: string;
  pixQrCodeUrl?: string;
  expiresAt?: Date;
  error?: string;
}

// Tipos de dados para métodos de pagamento
export interface PaymentMethod {
  id: string;
  name: string;
  gateway: string;
  apiKey: string;
  apiSecret?: string;
  sandboxMode: boolean;
  isActive: boolean;
}

/**
 * Classe de API de Pagamento
 * Gerencia todas as operações de pagamento na plataforma
 */
export class PaymentAPI {
  // URL da API de pagamento (configurável via variáveis de ambiente)
  private static API_URL = process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'https://api.rpx-platform.com/payments';
  
  /**
   * Cria uma nova transação de depósito
   */
  static async createTransaction(params: CreateTransactionParams): Promise<PaymentResponse> {
    try {
      // Código para produção - comunicação com backend
      const response = await fetch('/api/payments/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao processar pagamento');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Erro ao criar transação:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar pagamento'
      };
    }
  }

  /**
   * Verifica o status de uma transação
   */
  static async checkTransactionStatus(transactionId: string): Promise<PaymentTransaction> {
    try {
      // Código para produção
      const response = await fetch(`/api/payments/transaction/${transactionId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao verificar status do pagamento');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao verificar status da transação:', error);
      throw error;
    }
  }

  /**
   * Busca um método de pagamento ativo pelo tipo
   */
  private static async getActivePaymentMethod(methodType: string): Promise<PaymentMethod | null> {
    try {
      // Buscar da API
      const response = await fetch('/api/admin/payment-methods');
      
      if (!response.ok) {
        throw new Error('Falha ao buscar métodos de pagamento');
      }
      
      const methods: PaymentMethod[] = await response.json();
      
      // Encontrar método ativo pelo tipo
      return methods.find(m => m.gateway === methodType && m.isActive) || null;
    } catch (error) {
      console.error('Erro ao buscar método de pagamento:', error);
      return null;
    }
  }
}

export default PaymentAPI; 