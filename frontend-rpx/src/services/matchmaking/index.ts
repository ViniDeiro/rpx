/**
 * Serviço de Matchmaking - RPX Platform
 * Responsável por encontrar e gerenciar partidas entre jogadores
 */

import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from '@/lib/mongodb/connect';

// Tipos para matchmaking
export type MatchStatus = 'waiting' | 'in_progress' | 'completed' | 'canceled';
export type MatchType = 'solo' | 'duo' | 'squad' | 'tournament';
export type Platform = 'emulator' | 'mobile' | 'mixed' | 'tactical';
export type PlatformMode = 'emulator' | 'mobile' | 'mixed';
export type GameplayMode = 'normal' | 'tactical' | 'infinite_ice';

export interface MatchPlayer {
  id: string;
  name: string;
  avatar?: string;
  isReady: boolean;
  isCaptain: boolean;
  team: 'team1' | 'team2';
}

export interface MatchTeam {
  id: string;
  name: string;
  players: MatchPlayer[];
  score?: number;
}

export interface MatchResult {
  winner: 'team1' | 'team2' | 'draw';
  team1Score?: number;
  team2Score?: number;
  screenshots: string[];
  verifiedBy?: string;
  verifiedAt?: Date;
  disputeStatus?: 'none' | 'pending' | 'resolved';
}

export interface Match {
  id: string;
  title?: string;
  mode: string;
  type: MatchType;
  status: MatchStatus;
  teamSize: number;
  platform: Platform;
  platformMode?: PlatformMode;
  gameplayMode?: GameplayMode;
  entryFee: number;
  prize: number;
  teams: MatchTeam[];
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: MatchResult;
  roomId?: string;
  roomPassword?: string;
  paymentOption: 'captain' | 'split';
  createdBy: string;
}

export interface MatchFilters {
  mode?: string;
  type?: MatchType;
  platform?: Platform;
  platformMode?: PlatformMode;
  gameplayMode?: GameplayMode;
  status?: MatchStatus;
  minEntryFee?: number;
  maxEntryFee?: number;
  teamSize?: number;
}

// Interface para criação de partida
export interface CreateMatchParams {
  mode: string;
  type: MatchType;
  teamSize: number;
  platform: Platform;
  platformMode?: PlatformMode;
  gameplayMode?: GameplayMode;
  entryFee: number;
  paymentOption: 'captain' | 'split';
  createdBy: string;
}

/**
 * Classe do serviço de matchmaking
 */
export class MatchmakingService {
  // URL da API de matchmaking
  private static API_URL = process.env.NEXT_PUBLIC_MATCHMAKING_API_URL || '/api/matchmaking';
  private static API_KEY = process.env.MATCHMAKING_API_KEY;

  /**
   * Cria uma nova partida
   */
  static async createMatch(params: CreateMatchParams): Promise<Match> {
    try {
      const response = await fetch(`${this.API_URL}/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao criar partida');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao criar partida:', error);
      throw error;
    }
  }

  /**
   * Encontra uma partida para o jogador baseado em critérios
   * Este é o método principal de matchmaking
   */
  static async findMatch(userId: string, criteria: {
    mode: string;
    type: MatchType;
    platform: Platform;
    teamSize: number;
  }): Promise<Match> {
    try {
      const response = await fetch(`${this.API_URL}/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...criteria
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao encontrar partida');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao encontrar partida:', error);
      throw error;
    }
  }

  /**
   * Entra em uma partida existente
   */
  static async joinMatch(matchId: string, userId: string): Promise<Match> {
    try {
      const response = await fetch(`${this.API_URL}/matches/${matchId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao entrar na partida');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao entrar na partida:', error);
      throw error;
    }
  }

  /**
   * Sai de uma partida
   */
  static async leaveMatch(matchId: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_URL}/matches/${matchId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao sair da partida');
      }

      return true;
    } catch (error) {
      console.error('Erro ao sair da partida:', error);
      throw error;
    }
  }

  /**
   * Inicia uma partida
   */
  static async startMatch(matchId: string, captainId: string): Promise<Match> {
    try {
      const response = await fetch(`${this.API_URL}/matches/${matchId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ captainId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao iniciar a partida');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao iniciar a partida:', error);
      throw error;
    }
  }

  /**
   * Envia resultado de uma partida
   */
  static async submitMatchResult(matchId: string, result: {
    winner: 'team1' | 'team2' | 'draw';
    team1Score?: number;
    team2Score?: number;
    screenshot?: File;
    userId: string;
    comment?: string;
  }): Promise<Match> {
    try {
      // Se tiver screenshot, usar FormData para enviar o arquivo
      if (result.screenshot) {
        const formData = new FormData();
        formData.append('winner', result.winner);
        if (result.team1Score !== undefined) formData.append('team1Score', result.team1Score.toString());
        if (result.team2Score !== undefined) formData.append('team2Score', result.team2Score.toString());
        formData.append('userId', result.userId);
        if (result.comment) formData.append('comment', result.comment);
        formData.append('screenshot', result.screenshot);

        const response = await fetch(`${this.API_URL}/matches/${matchId}/result`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Falha ao enviar resultado');
        }

        return await response.json();
      } else {
        const response = await fetch(`${this.API_URL}/matches/${matchId}/result`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(result)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Falha ao enviar resultado');
        }

        return await response.json();
      }
    } catch (error) {
      console.error('Erro ao enviar resultado da partida:', error);
      throw error;
    }
  }

  /**
   * Recupera uma partida específica
   */
  static async getMatch(matchId: string): Promise<Match> {
    try {
      const response = await fetch(`${this.API_URL}/matches/${matchId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao recuperar partida');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao recuperar partida:', error);
      throw error;
    }
  }

  /**
   * Lista partidas com filtros
   */
  static async listMatches(filters?: MatchFilters): Promise<Match[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const response = await fetch(`${this.API_URL}/matches?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao listar partidas');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao listar partidas:', error);
      throw error;
    }
  }

  /**
   * Lista partidas de um usuário
   */
  static async getUserMatches(userId: string): Promise<Match[]> {
    try {
      const response = await fetch(`${this.API_URL}/users/${userId}/matches`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao listar partidas do usuário');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao listar partidas do usuário:', error);
      throw error;
    }
  }
}

export default MatchmakingService; 