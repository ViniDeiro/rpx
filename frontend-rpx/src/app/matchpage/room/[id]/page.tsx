'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import MatchRoomCard from '@/components/match/MatchRoomCard';
import GameBoard from '@/components/game/GameBoard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api from '@/services/api';

interface PlayerInfo {
  _id: string;
  username: string;
  avatarUrl: string | null;
}

interface MatchProps {
  _id: string;
  title: string;
  gameType: string;
  maxPlayers: number;
  status: string;
  players: string[];
  playersInfo: PlayerInfo[];
  confirmedPlayers: string[];
  createdAt: string;
  playerConfirmed: boolean;
}

export default function MatchRoomPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<MatchProps | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  // Buscar informações da partida
  const fetchMatchData = useCallback(async () => {
    if (!session?.user || !id) return;
    
    const userId = session.user.id as string;
    
    try {
      setLoading(true);
      const response = await api.get(`/api/matches/${id}`);
      
      if (response.data.match) {
        // Verificar se o usuário está na partida
        const userInMatch = response.data.match.players.includes(userId);
        if (!userInMatch) {
          setError('Você não está autorizado a acessar esta sala');
          return;
        }
        
        // Adicionar propriedade para indicar se o jogador atual confirmou
        const playerConfirmed = response.data.match.confirmedPlayers.includes(userId);
        setMatch({
          ...response.data.match,
          playerConfirmed
        });
        
        // Verificar se o jogo começou (todos confirmaram)
        if (response.data.match.status === 'started' || 
            (response.data.match.confirmedPlayers.length === response.data.match.players.length)) {
          setGameStarted(true);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados da partida:', error);
      setError('Não foi possível carregar a sala da partida');
    } finally {
      setLoading(false);
    }
  }, [id, session?.user]);

  // Confirmar entrada na partida
  const handleConfirmEntry = async () => {
    if (!session?.user || !match) return;
    
    const userId = session.user.id as string;
    
    try {
      const response = await api.post(`/api/matches/${id}/confirm`);
      
      if (response.data.success) {
        toast.success('Entrada confirmada com sucesso!');
        // Atualizar o estado local com a confirmação
        setMatch(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            confirmedPlayers: [...prev.confirmedPlayers, userId],
            playerConfirmed: true
          };
        });
        
        // Verificar se todos confirmaram para iniciar o jogo
        fetchMatchData();
      } else {
        toast.error('Não foi possível confirmar sua entrada');
      }
    } catch (error) {
      console.error('Erro ao confirmar entrada:', error);
      toast.error('Ocorreu um erro ao confirmar sua entrada');
    }
  };

  // Carregar dados da partida quando a página for carregada
  useEffect(() => {
    if (session?.user) {
      fetchMatchData();
      
      // Atualizar dados a cada 5 segundos
      const interval = setInterval(fetchMatchData, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchMatchData, session?.user]);

  // Renderizar tela de carregamento
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <LoadingSpinner size={60} />
      </div>
    );
  }

  // Renderizar mensagem de erro
  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <a href="/lobby" className="text-primary hover:underline">
          Voltar para o Lobby
        </a>
      </div>
    );
  }

  // Renderizar sala de espera ou tabuleiro do jogo
  return (
    <div className="container mx-auto py-8 px-4">
      {gameStarted ? (
        <GameBoard matchId={id} />
      ) : (
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">Sala de Partida</h1>
          {match && (
            <MatchRoomCard
              match={match}
              onConfirmEntry={handleConfirmEntry}
            />
          )}
        </div>
      )}
    </div>
  );
} 