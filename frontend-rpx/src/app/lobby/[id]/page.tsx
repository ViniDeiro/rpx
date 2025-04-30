'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { getLobbyDetails } from '@/lib/api/lobby';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Users, Clock, Star, ChevronLeft } from 'react-feather';
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { RankTier } from "@/utils/ranking";

// Log inicial para debug
console.log('🚀 Carregando página de lobby...');

interface LobbyMember {
  _id: string;
  username: string;
  avatarUrl?: string | null;
  isReady?: boolean;
  isOwner?: boolean;
  rank: { tier: string };
}

interface LobbyDetails {
  _id: string;
  name?: string;
  owner: string;
  members: string[];
  lobbyType: 'solo' | 'duo' | 'squad' | 'reconstructed' | 'emergency';
  maxPlayers: number;
  status: string;
  gameMode?: string;
  createdAt: string;
  readyMembers?: string[];
  membersInfo?: LobbyMember[];
}

export default function LobbyPage() {
  const params = useParams();
  const lobbyId = params?.id as string;
  const router = useRouter();
  const { data: session } = useSession();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lobby, setLobby] = useState<LobbyDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [membersInfo, setMembersInfo] = useState<LobbyMember[]>([]);

  // Função para buscar detalhes do lobby
  const fetchLobbyDetails = useCallback(async () => {
    if (!lobbyId) return;
    
    try {
      setLoading(true);
      console.log(`Tentando buscar detalhes do lobby: ${lobbyId}`);
      
      try {
        // Método 1: Tentar API normal
        const response = await fetch(`/api/lobby/${lobbyId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });
        
        console.log(`Resposta da API de lobby (status ${response.status}):`, response.ok);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Dados recebidos:', data);
          
          if (data.status === 'success' && data.lobby) {
            console.log('Detalhes do lobby:', data.lobby);
            setLobby(data.lobby);
            
            // Se tiver informações dos membros, atualizar estado
            if (data.lobby.membersInfo) {
              setMembersInfo(data.lobby.membersInfo);
            }
            
            // Verificar se o usuário atual está pronto
            if (data.lobby.readyMembers && user?.id) {
              setIsReady(data.lobby.readyMembers.includes(user.id));
            }
            return; // Sair da função se tiver sucesso
          }
        }
        
        // Se chegou aqui, API normal falhou
        console.log('Tentando método alternativo de recuperação do lobby');
        
        // Método 2: Tentar API de reparo
        const repairResponse = await fetch('/api/lobby', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ lobbyId }),
        });
        
        console.log('Tentando reparar lobby:', lobbyId);
        
        if (repairResponse.ok) {
          const repairData = await repairResponse.json();
          console.log('Resposta da API de reparo:', repairData);
          
          try {
            console.log('Tentando buscar lobby após reparo bem-sucedido');
            const secondResponse = await fetch(`/api/lobby/${lobbyId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              cache: 'no-store',
            });
            
            if (secondResponse.ok) {
              const secondData = await secondResponse.json();
              if (secondData.status === 'success' && secondData.lobby) {
                console.log('Lobby recuperado após reparo:', secondData.lobby);
                setLobby(secondData.lobby);
                
                if (secondData.lobby.membersInfo) {
                  setMembersInfo(secondData.lobby.membersInfo);
                }
                
                if (secondData.lobby.readyMembers && user?.id) {
                  setIsReady(secondData.lobby.readyMembers.includes(user.id));
                }
                return;
              }
            }
            
            // Se chegou aqui, a segunda tentativa falhou
            console.log('Segunda tentativa falhou, ativando modo de compatibilidade');
            throw new Error('Forçando modo de compatibilidade');
          } catch (secondError) {
            console.log('Erro na segunda tentativa, ativando modo de compatibilidade:', secondError);
          }
        }
        
        // Nesse ponto, tanto a API normal quanto a de reparo falharam ou não resolveram
        // Vamos ativar o modo de compatibilidade
        console.log('ATIVANDO MODO DE COMPATIBILIDADE');
        
        // Método 3: Criar um objeto de lobby mínimo localmente
        console.log('Criando objeto de lobby mínimo para permitir interface');
        const minimalLobby = {
          _id: lobbyId,
          owner: user?.id || 'unknown',
          members: user?.id ? [user.id] : [],
          lobbyType: 'reconstructed',
          maxPlayers: 4,
          status: 'active',
          createdAt: new Date().toISOString(),
          readyMembers: []
        } as LobbyDetails;
        
        setLobby(minimalLobby);
        
        if (user) {
          const userMember = {
            _id: user.id,
            username: user.username || user.name || 'Usuário',
            avatarUrl: user.username ? null : null,
            isReady: false,
            isOwner: true,
            rank: { tier: 'unranked' }
          };
          setMembersInfo([userMember]);
        }
        
        toast.warning('Modo de compatibilidade ativado: recursos limitados disponíveis', {
          autoClose: 5000
        });
        
      } catch (error) {
        console.error('Erro ao buscar detalhes do lobby:', error);
        
        // Plano de contingência final
        console.log('Aplicando plano de contingência final');
        const emergencyLobby = {
          _id: lobbyId,
          owner: user?.id || 'unknown',
          members: user?.id ? [user.id] : [],
          lobbyType: 'emergency',
          maxPlayers: 4,
          status: 'emergency_mode',
          createdAt: new Date().toISOString(),
          readyMembers: []
        } as LobbyDetails;
        
        setLobby(emergencyLobby);
        
        if (user) {
          const userMember = {
            _id: user.id,
            username: user.username || user.name || 'Usuário',
            avatarUrl: user.username ? null : null,
            isReady: false,
            isOwner: true,
            rank: { tier: 'unranked' }
          };
          setMembersInfo([userMember]);
        }
        
        setError('Entrando em modo de emergência: algumas funcionalidades podem não estar disponíveis');
      }
    } finally {
      setLoading(false);
    }
  }, [lobbyId, user]);

  // Buscar detalhes do lobby quando a página carregar
  useEffect(() => {
    fetchLobbyDetails();
    
    // Configurar polling para atualizar informações do lobby
    const interval = setInterval(fetchLobbyDetails, 5000);
    return () => clearInterval(interval);
  }, [fetchLobbyDetails]);

  // Função para marcar jogador como pronto
  const handleToggleReady = async () => {
    try {
      const response = await fetch(`/api/lobby/${lobbyId}/ready`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isReady: !isReady
        }),
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setIsReady(!isReady);
        toast.success(isReady ? 'Você não está mais pronto' : 'Você está pronto para jogar!');
      } else {
        toast.error('Não foi possível alterar seu status');
      }
    } catch (error) {
      console.error('Erro ao alterar status de pronto:', error);
      toast.error('Erro ao comunicar com o servidor');
    }
  };

  // Função para sair do lobby
  const handleLeaveLobby = async () => {
    try {
      const response = await fetch(`/api/lobby/${lobbyId}/leave`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        toast.success('Você saiu do lobby');
        router.push('/lobby');
      } else {
        toast.error('Não foi possível sair do lobby');
      }
    } catch (error) {
      console.error('Erro ao sair do lobby:', error);
      toast.error('Erro ao comunicar com o servidor');
    }
  };

  // Função para iniciar o jogo
  const handleStartGame = async () => {
    try {
      const response = await fetch(`/api/lobby/${lobbyId}/start`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        toast.success('O jogo está começando!');
        if (data.matchId) {
          router.push(`/matchpage/room/${data.matchId}`);
        }
      } else {
        toast.error(data.error || 'Não foi possível iniciar o jogo');
      }
    } catch (error) {
      console.error('Erro ao iniciar o jogo:', error);
      toast.error('Erro ao comunicar com o servidor');
    }
  };

  // Tela de carregamento
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <LoadingSpinner size={60} />
      </div>
    );
  }

  // Mensagem de erro
  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <Button variant="default" onClick={() => router.push('/lobby')}>
          <ChevronLeft size={18} className="mr-2" />
          Voltar para o Lobby
        </Button>
      </div>
    );
  }

  // Mensagem caso o lobby não exista
  if (!lobby) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <div className="text-red-500 text-xl mb-4">Lobby não encontrado</div>
        <Button variant="default" onClick={() => router.push('/lobby')}>
          <ChevronLeft size={18} className="mr-2" />
          Voltar para o Lobby
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === lobby.owner;
  const readyMembersCount = lobby.readyMembers?.length || 0;
  const allMembersReady = readyMembersCount === lobby.members.length;
  const canStartGame = isOwner && allMembersReady && lobby.members.length > 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={() => router.push('/lobby')}>
          <ChevronLeft size={18} className="mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-center">
          {lobby.name || `Lobby ${lobbyId.substring(0, 8)}`}
        </h1>
        <div className="w-10"></div>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 bg-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Users size={20} />
            <span>
              {lobby.members.length} / {lobby.maxPlayers} jogadores
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield size={20} />
            <span className="capitalize">{lobby.lobbyType}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock size={20} />
            <span>
              {new Date(lobby.createdAt).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Jogadores</h2>
          
          {/* Cabos de áudio - conexões entre jogadores */}
          <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              {/* Linhas de conexão */}
              <path 
                d="M200,200 C300,150 400,450 500,400" 
                stroke="rgba(138, 85, 255, 0.3)" 
                strokeWidth="2" 
                fill="none"
              />
            </svg>
          </div>
          
          {/* Lista de jogadores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Mapeamento dos jogadores */}
            {lobby.members.map(memberId => {
              const member = membersInfo.find(m => m._id === memberId) || { 
                _id: memberId,
                username: 'Jogador', 
                avatarUrl: null,
                isReady: false,
                rank: { tier: 'unranked' as RankTier }
              };
              
              const isReady = lobby.readyMembers?.includes(memberId);
              
              return (
                <div 
                  key={memberId} 
                  className={`relative bg-card-hover p-4 rounded-lg border-2 ${
                    isReady ? 'border-green-500/50' : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <ProfileAvatar
                        size="sm"
                        rankTier={member.rank?.tier as RankTier}
                        avatarUrl={member.avatarUrl || '/images/avatar-placeholder.svg'}
                        showRankFrame={true}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-medium">{member.username}</span>
                        {member._id === user?.id && !isOwner && (
                          <Button 
                            variant={isReady ? "outline" : "default"}
                            size="sm"
                            onClick={handleToggleReady}
                          >
                            {isReady ? 'Não Pronto' : 'Pronto'}
                          </Button>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {member.isReady ? 'Pronto' : 'Aguardando...'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handleLeaveLobby}>
              Sair do Lobby
            </Button>
            
            {isOwner && (
              <Button 
                variant="default" 
                onClick={handleStartGame}
                disabled={!canStartGame}
              >
                {canStartGame ? 'Iniciar Partida' : `Aguardando jogadores (${readyMembersCount}/${lobby.members.length})`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 