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
      // Em produção, esta seria uma chamada real à API
      if (process.env.NODE_ENV === 'development') {
        // Simular resposta durante desenvolvimento
        return this.simulateSubmitResult(matchId, result);
      }

      // Código real para produção - usando FormData para upload de arquivo
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
      // Em produção, esta seria uma chamada real à API
      if (process.env.NODE_ENV === 'development') {
        // Simular resposta durante desenvolvimento
        return this.simulateDisputeResult(params);
      }

      // Código real para produção - usando FormData para upload de arquivo
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
      // Em produção, esta seria uma chamada real à API
      if (process.env.NODE_ENV === 'development') {
        // Simular resposta durante desenvolvimento
        return this.simulateGetVerificationStatus(matchId);
      }

      // Código real para produção
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
      // Em produção, esta seria uma chamada real à API
      if (process.env.NODE_ENV === 'development') {
        // Simular resposta durante desenvolvimento
        return this.simulateValidateScreenshot();
      }

      // Código real para produção - usando FormData para upload de arquivo
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
      // Em produção, esta seria uma chamada real à API
      if (process.env.NODE_ENV === 'development') {
        // Simular resposta durante desenvolvimento
        return this.simulateListPendingVerifications();
      }

      // Código real para produção
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

  // Métodos privados para simulação durante desenvolvimento

  private static simulateSubmitResult(matchId: string, result: {
    winner: 'team1' | 'team2' | 'draw';
    team1Score?: number;
    team2Score?: number;
    screenshot?: File;
    userId: string;
    comment?: string;
  }): VerificationRequest {
    return {
      id: `verif-${Date.now()}`,
      matchId,
      submittedBy: result.userId,
      submittedAt: new Date(),
      result: {
        winner: result.winner,
        team1Score: result.team1Score || 0,
        team2Score: result.team2Score || 0,
        screenshots: result.screenshot ? ['https://example.com/screenshot.jpg'] : [],
        disputeStatus: 'none'
      },
      screenshot: result.screenshot ? 'https://example.com/screenshot.jpg' : undefined,
      status: 'pending',
      comment: result.comment
    };
  }

  private static simulateDisputeResult(params: DisputeRequest): VerificationRequest {
    return {
      id: `dispute-${Date.now()}`,
      matchId: params.matchId,
      submittedBy: params.userId,
      submittedAt: new Date(),
      result: {
        winner: 'draw', // Estado temporário durante disputa
        screenshots: [],
        disputeStatus: 'pending'
      },
      status: 'disputed',
      comment: params.comment,
      disputeReason: params.reason
    };
  }

  private static simulateGetVerificationStatus(matchId: string): VerificationRequest {
    // Simular diferentes estados aleatoriamente
    const statuses: VerificationStatus[] = ['pending', 'approved', 'rejected', 'disputed'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const submittedAt = new Date(Date.now() - 3600000); // 1 hora atrás
    
    return {
      id: `verif-${matchId}`,
      matchId,
      submittedBy: 'user-123',
      submittedAt,
      result: {
        winner: Math.random() > 0.5 ? 'team1' : 'team2',
        team1Score: Math.floor(Math.random() * 10) + 1,
        team2Score: Math.floor(Math.random() * 10) + 1,
        screenshots: ['https://example.com/screenshot.jpg'],
        disputeStatus: status === 'disputed' ? 'pending' : 'none',
        verifiedBy: status !== 'pending' ? 'admin-user' : undefined,
        verifiedAt: status !== 'pending' ? new Date() : undefined
      },
      screenshot: 'https://example.com/screenshot.jpg',
      status,
      reviewedBy: status !== 'pending' ? 'admin-user' : undefined,
      reviewedAt: status !== 'pending' ? new Date() : undefined,
      comment: status === 'rejected' ? 'Screenshot não mostra claramente o resultado' : undefined,
      disputeReason: status === 'disputed' ? 'O resultado submetido não corresponde ao verdadeiro resultado da partida' : undefined
    };
  }

  private static simulateValidateScreenshot(): {
    isValid: boolean;
    confidence: number;
    game?: string;
    detectedResult?: {
      team1Score?: number;
      team2Score?: number;
      winner?: 'team1' | 'team2' | 'draw';
    };
  } {
    // Simular validação bem-sucedida na maioria das vezes
    const isValid = Math.random() > 0.2;
    
    if (isValid) {
      const team1Score = Math.floor(Math.random() * 10) + 1;
      const team2Score = Math.floor(Math.random() * 10) + 1;
      
      return {
        isValid: true,
        confidence: 0.85 + Math.random() * 0.15, // 85-100% confiança
        game: 'Free Fire',
        detectedResult: {
          team1Score,
          team2Score,
          winner: team1Score > team2Score ? 'team1' : team1Score < team2Score ? 'team2' : 'draw'
        }
      };
    } else {
      return {
        isValid: false,
        confidence: 0.3 + Math.random() * 0.4, // 30-70% confiança
        game: Math.random() > 0.5 ? 'Desconhecido' : 'Free Fire'
      };
    }
  }

  private static simulateListPendingVerifications(): VerificationRequest[] {
    const pendingVerifications: VerificationRequest[] = [];
    
    // Gerar entre 3 e 8 verificações pendentes
    const count = Math.floor(Math.random() * 5) + 3;
    
    for (let i = 0; i < count; i++) {
      const submittedAt = new Date(Date.now() - (i * 3600000)); // Espaçadas por 1 hora
      
      pendingVerifications.push({
        id: `verif-${Date.now()}-${i}`,
        matchId: `match-${1000 + i}`,
        submittedBy: `user-${100 + i}`,
        submittedAt,
        result: {
          winner: Math.random() > 0.5 ? 'team1' : 'team2',
          team1Score: Math.floor(Math.random() * 10) + 1,
          team2Score: Math.floor(Math.random() * 10) + 1,
          screenshots: ['https://example.com/screenshot.jpg'],
          disputeStatus: 'none'
        },
        screenshot: 'https://example.com/screenshot.jpg',
        status: 'pending'
      });
    }
    
    return pendingVerifications;
  }
}

export default VerificationService; 