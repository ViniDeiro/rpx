/**
 * Serviço de Verificação - RPX Platform
 * Responsável por verificar os resultados das partidas
 */

import { Match, MatchResult } from '@/services/matchmaking';

// Tipos para verificação
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'disputed';

export interface VerificationRequest {
  id: string;
  matchId: string;
  submittedBy: string;
  submittedAt: Date;
  result: MatchResult;
  screenshot?: string;
  status: VerificationStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  comment?: string;
  disputeReason?: string;
}

export interface DisputeRequest {
  matchId: string;
  userId: string;
  reason: string;
  evidence?: File;
  comment?: string;
}

/**
 * Classe do serviço de verificação
 */
export class VerificationService {
  // URL da API de verificação (configurável via variáveis de ambiente)
  private static API_URL = process.env.NEXT_PUBLIC_VERIFICATION_API_URL || 'https://api.rpx-platform.com/verification';
  private static API_KEY = process.env.VERIFICATION_API_KEY;

  /**
   * Submete um resultado para verificação
   */
  static async submitResult(matchId: string, result: {
    winner: 'team1' | 'team2' | 'draw';
    team1Score?: number;
    team2Score?: number;
    screenshot?: File;
    userId: string;
    comment?: string;
  }): Promise<VerificationRequest> {
    try {
      // Código para produção - usando FormData para upload de arquivo
      const formData = new FormData();
      formData.append('matchId', matchId);
      formData.append('winner', result.winner);
      if (result.team1Score !== undefined) formData.append('team1Score', result.team1Score.toString());
      if (result.team2Score !== undefined) formData.append('team2Score', result.team2Score.toString());
      formData.append('userId', result.userId);
      if (result.comment) formData.append('comment', result.comment);
      if (result.screenshot) formData.append('screenshot', result.screenshot);

      const response = await fetch(`${this.API_URL}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao enviar resultado para verificação');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao enviar resultado para verificação:', error);
      throw error;
    }
  }

  /**
   * Registra uma disputa sobre o resultado de uma partida
   */
  static async disputeResult(params: DisputeRequest): Promise<VerificationRequest> {
    try {
      // Código para produção - usando FormData para upload de arquivo
      const formData = new FormData();
      formData.append('matchId', params.matchId);
      formData.append('userId', params.userId);
      formData.append('reason', params.reason);
      if (params.comment) formData.append('comment', params.comment);
      if (params.evidence) formData.append('evidence', params.evidence);

      const response = await fetch(`${this.API_URL}/dispute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao registrar disputa');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao registrar disputa:', error);
      throw error;
    }
  }

  /**
   * Obtém o status de verificação de uma partida
   */
  static async getVerificationStatus(matchId: string): Promise<VerificationRequest> {
    try {
      // Código para produção
      const response = await fetch(`${this.API_URL}/status/${matchId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao obter status de verificação');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao obter status de verificação:', error);
      throw error;
    }
  }

  /**
   * Verifica uma imagem para detectar se é uma captura de tela válida do jogo
   * Usa análise de imagem para validar o conteúdo
   */
  static async validateScreenshot(screenshot: File): Promise<{
    isValid: boolean;
    confidence: number;
    game?: string;
    detectedResult?: {
      team1Score?: number;
      team2Score?: number;
      winner?: 'team1' | 'team2' | 'draw';
    };
  }> {
    try {
      // Código para produção - usando FormData para upload de arquivo
      const formData = new FormData();
      formData.append('screenshot', screenshot);

      const response = await fetch(`${this.API_URL}/validate-screenshot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao validar screenshot');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao validar screenshot:', error);
      throw error;
    }
  }

  /**
   * Lista todas as verificações pendentes (para administradores)
   */
  static async listPendingVerifications(): Promise<VerificationRequest[]> {
    try {
      // Código para produção
      const response = await fetch(`${this.API_URL}/pending`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao listar verificações pendentes');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao listar verificações pendentes:', error);
      throw error;
    }
  }
}

export default VerificationService; 