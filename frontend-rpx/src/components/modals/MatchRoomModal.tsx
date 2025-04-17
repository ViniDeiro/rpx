'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, Clock, Users, AlertCircle, User, Shield, PlayCircle } from 'react-feather';
import { Match } from '@/types/match';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { formatCurrency } from '@/utils/formatters';
import { Trophy, Medal } from '@/components/ui/icons';

type Team = {
  id: string;
  name: string;
  players: {
    id: string;
    name: string;
    avatar?: string;
    isReady: boolean;
    isCaptain: boolean;
  }[];
};

interface MatchRoomModalProps {
  match: Match;
  isOpen: boolean;
  onClose: () => void;
  onSubmitResult: () => void;
  isOfficialRoom?: boolean;
  officialRoomData?: any;
}

const MatchRoomModal: React.FC<MatchRoomModalProps> = ({ 
  match, 
  isOpen, 
  onClose, 
  onSubmitResult,
  isOfficialRoom = false,
  officialRoomData = null
}) => {
  const { user } = useAuth();
  const [copiedRoomId, setCopiedRoomId] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [matchStatus, setMatchStatus] = useState<'waiting' | 'started' | 'finished'>('waiting');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isReady, setIsReady] = useState(false);
  
  const isCaptain = match?.teams?.[0]?.players?.some(player => player.id === user?.id && player.isCaptain);
  
  // Conectar às informações atualizadas da partida
  useEffect(() => {
    if (!isOpen || !match?.id) return;
  
    // Configurar o estado inicial do jogador
    setIsReady(match?.teams?.some(team => 
      team.players.some(player => player.id === user?.id && player.isReady)
    ) ?? false);
    
    // Extrair equipes do match
    if (match.teams) {
      setTeams(match.teams);
    }
    
    // Definir status inicial
    setMatchStatus(match.status === 'waiting_players' ? 'waiting' : 
                  match.status === 'in_progress' ? 'started' : 'finished');
    
    // Configurar polling para atualizações da partida
    const pollingInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/matchmaking/matches/${match.id}`);
        if (!response.ok) {
          throw new Error('Falha ao atualizar dados da partida');
      }
      
        const updatedMatch = await response.json();
        
        // Atualizar estado das equipes
        if (updatedMatch.teams) {
          setTeams(updatedMatch.teams);
        }
        
        // Atualizar status da partida
        if (updatedMatch.status !== match.status) {
          setMatchStatus(updatedMatch.status === 'waiting_players' ? 'waiting' : 
                        updatedMatch.status === 'in_progress' ? 'started' : 'finished');
    
          // Se a partida agora está em andamento e estávamos esperando, iniciar o temporizador
          if (updatedMatch.status === 'in_progress' && match.status === 'waiting_players') {
            setTimeElapsed(0);
          }
          
          // Se a partida agora está finalizada, mostrar o modal de resultado após um breve delay
          if (updatedMatch.status === 'completed') {
            setTimeout(() => {
              onSubmitResult();
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Erro ao atualizar informações da partida:', error);
      }
    }, 5000); // Verificar a cada 5 segundos
    
    return () => clearInterval(pollingInterval);
  }, [isOpen, match, onSubmitResult, user?.id]);
  
  // Atualizar cronômetro quando a partida está em andamento
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (matchStatus === 'started') {
      timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [matchStatus]);
  
  // Copiar para a área de transferência (ID ou senha)
  const copyToClipboard = (text: string, type: 'roomId' | 'password') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'roomId') {
        setCopiedRoomId(true);
        setTimeout(() => setCopiedRoomId(false), 2000);
      } else {
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2000);
      }
    });
  };
  
  // Marcar jogador como pronto/não pronto
  const handleReady = async () => {
    try {
      const newReadyStatus = !isReady;
      
      // Atualizar no servidor
      const response = await fetch(`/api/matchmaking/matches/${match.id}/ready`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          isReady: newReadyStatus
        })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar status');
    }
    
      // Atualizar localmente
      setIsReady(newReadyStatus);
      
      // Também atualizar no estado local das equipes
      setTeams(currentTeams => 
        currentTeams.map(team => ({
          ...team,
          players: team.players.map(player => 
            player.id === user?.id 
              ? { ...player, isReady: newReadyStatus } 
              : player
          )
        }))
      );
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };
  
  // Iniciar a partida (apenas para o capitão)
  const handleStartMatch = async () => {
    // Verificar se todos os jogadores estão prontos
    const allPlayersReady = teams.every(team => 
      team.players.every(player => player.isReady)
    );
    
    if (!allPlayersReady) {
      alert('Nem todos os jogadores estão prontos!');
      return;
    }
    
    try {
      const response = await fetch(`/api/matchmaking/matches/${match.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          captainId: user?.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao iniciar partida');
      }
      
      // Atualizar status localmente
      setMatchStatus('started');
      setTimeElapsed(0);
    } catch (error) {
      console.error('Erro ao iniciar partida:', error);
      alert('Erro ao iniciar partida. Tente novamente.');
    }
  };
  
  // Sair da partida
  const handleLeaveMatch = async () => {
    try {
      const response = await fetch(`/api/matchmaking/matches/${match.id}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao sair da partida');
      }
      
      // Fechar o modal
      onClose();
    } catch (error) {
      console.error('Erro ao sair da partida:', error);
      // Mesmo em caso de erro, fechar o modal
      onClose();
    }
  };

  // Formatar o tempo decorrido
  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-card-bg border border-gray-700 rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold">{match.title || 'Lobby de Partida'}</h2>
              {match.isOfficialRoom && (
                <div className="flex items-center mt-1 text-primary">
                  <span className="px-2 py-0.5 bg-primary/20 rounded-md text-xs font-medium flex items-center">
                    <Shield size={12} className="mr-1" />
                    Sala Oficial RPX
                  </span>
                </div>
              )}
              <p className="text-gray-400 mt-1 flex items-center gap-2">
                <Clock size={16} />
                <span>
                  {matchStatus === 'waiting' && 'Aguardando jogadores...'}
                  {matchStatus === 'started' && `Em andamento (${formatElapsedTime(timeElapsed)})`}
                  {matchStatus === 'finished' && 'Partida finalizada!'}
                </span>
              </p>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="p-3 bg-background border border-gray-700 rounded-lg mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-400 text-sm">ID do Lobby:</span>
                  <span className="font-mono font-bold">{match.roomId}</span>
                  <button
                    onClick={() => copyToClipboard(match.roomId || '', 'roomId')}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Copiar ID do lobby"
                  >
                    {copiedRoomId ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Senha:</span>
                  <span className="font-mono font-bold">{match.roomPassword}</span>
                  <button
                    onClick={() => copyToClipboard(match.roomPassword || '', 'password')}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Copiar senha"
                  >
                    {copiedPassword ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleLeaveMatch}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Fechar"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          
          {/* Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-background border border-gray-700 rounded-lg p-3 flex items-center">
              <div className="w-8 h-8 flex items-center justify-center mr-3">
                <Trophy size={24} className="text-yellow-500" />
              </div>
              <div>
                <div className="text-xs text-gray-400">Prêmio</div>
                <div className="font-bold">{formatCurrency(match.prize || 0)}</div>
              </div>
            </div>
            
            <div className="bg-background border border-gray-700 rounded-lg p-3 flex items-center">
              <div className="w-8 h-8 flex items-center justify-center mr-3">
                <DollarSign size={24} className="text-green-500" />
              </div>
              <div>
                <div className="text-xs text-gray-400">Valor de Entrada</div>
                <div className="font-bold">{formatCurrency(match.entryFee || 0)}</div>
              </div>
            </div>
            
            <div className="bg-background border border-gray-700 rounded-lg p-3 flex items-center">
              <div className="w-8 h-8 flex items-center justify-center mr-3">
                <Star size={24} className="text-yellow-500" />
              </div>
              <div>
                <div className="text-xs text-gray-400">Multiplicador</div>
                <div className="font-bold">{match.odd?.toFixed(2)}x</div>
              </div>
            </div>
          </div>
          
          {/* Equipes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Time 1 */}
            <div className="bg-background border border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-800 p-3 font-medium">
                {teams[0]?.name || 'Time 1'}
              </div>
              <div className="p-3 space-y-2">
                {teams[0]?.players.map((player, idx) => (
                  <div key={player.id || idx} className="flex items-center p-2 bg-card-hover/50 rounded-lg">
                    <div className="relative mr-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                        {player.avatar ? (
                          <Image 
                            src={player.avatar} 
                            alt={player.name}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        ) : (
                          <User size={20} className="text-gray-400" />
                        )}
                      </div>
                      {player.isCaptain && (
                        <div className="absolute -top-1 -right-1 text-yellow-500">
                          <Crown size={16} className="drop-shadow-md" />
            </div>
          )}
                </div>
                    <div className="flex-1">
                      <div className="font-medium">{player.name}</div>
                      <div className="text-xs text-gray-400 flex items-center">
                        {player.isReady ? (
                          <span className="text-green-400 flex items-center">
                            <CheckCircle size={12} className="mr-1" />
                            Pronto
                          </span>
                        ) : (
                          <span className="text-yellow-400 flex items-center">
                            <Clock size={12} className="mr-1" />
                            Aguardando
                          </span>
                        )}
                </div>
              </div>
            </div>
                ))}
          
                {Array.from({ length: (match.teamSize || 1) - (teams[0]?.players.length || 0) }).map((_, idx) => (
                  <div key={`empty-team1-${idx}`} className="flex items-center p-2 bg-card-hover/30 rounded-lg opacity-60">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center mr-3">
                      <User size={20} className="text-gray-600" />
                    </div>
              <div>
                      <div className="font-medium text-gray-500">Aguardando jogador...</div>
                    </div>
                </div>
                ))}
              </div>
            </div>
            
            {/* Time 2 */}
            <div className="bg-background border border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-800 p-3 font-medium">
                {teams[1]?.name || 'Time 2'}
              </div>
              <div className="p-3 space-y-2">
                {teams[1]?.players.map((player, idx) => (
                  <div key={player.id || idx} className="flex items-center p-2 bg-card-hover/50 rounded-lg">
                    <div className="relative mr-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                            {player.avatar ? (
                              <Image
                                src={player.avatar}
                            alt={player.name}
                                width={40}
                                height={40}
                            className="object-cover"
                              />
                            ) : (
                          <User size={20} className="text-gray-400" />
                            )}
                          </div>
                      {player.isCaptain && (
                        <div className="absolute -top-1 -right-1 text-yellow-500">
                          <Crown size={16} className="drop-shadow-md" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                          <div className="font-medium">{player.name}</div>
                      <div className="text-xs text-gray-400 flex items-center">
                        {player.isReady ? (
                          <span className="text-green-400 flex items-center">
                            <CheckCircle size={12} className="mr-1" />
                            Pronto
                          </span>
                        ) : (
                          <span className="text-yellow-400 flex items-center">
                            <Clock size={12} className="mr-1" />
                            Aguardando
                          </span>
                        )}
                      </div>
                      </div>
                    </div>
                  ))}
                
                {Array.from({ length: (match.teamSize || 1) - (teams[1]?.players.length || 0) }).map((_, idx) => (
                  <div key={`empty-team2-${idx}`} className="flex items-center p-2 bg-card-hover/30 rounded-lg opacity-60">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center mr-3">
                      <User size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-500">Aguardando jogador...</div>
                </div>
              </div>
            ))}
              </div>
            </div>
          </div>
          
          {/* Informações do jogo */}
          {match.gameDetails && (
            <div className="bg-background border border-gray-700 rounded-lg p-4 mb-6">
              <h3 className="font-medium mb-3">Detalhes do Jogo</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-400">Jogo</div>
                  <div className="font-medium">{match.gameDetails.gameName || 'Free Fire'}</div>
                  </div>
                <div>
                  <div className="text-xs text-gray-400">Modo</div>
                  <div className="font-medium">{match.gameDetails.gameMode || 'Battle Royale'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Mapa</div>
                  <div className="font-medium">{match.gameDetails.mapName || 'Bermuda'}</div>
                    </div>
                <div>
                  <div className="text-xs text-gray-400">Região</div>
                  <div className="font-medium">{match.gameDetails.serverRegion || 'Brasil'}</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Status e ações */}
          <div className={`p-4 rounded-lg mb-6 ${
            matchStatus === 'waiting' ? 'bg-yellow-900/20 border border-yellow-500/30' :
            matchStatus === 'started' ? 'bg-green-900/20 border border-green-500/30' :
            'bg-purple-900/20 border border-purple-500/30'
          }`}>
            <div className="flex items-start">
              <div className={`mr-3 mt-1 ${
                matchStatus === 'waiting' ? 'text-yellow-400' :
                matchStatus === 'started' ? 'text-green-400' :
                'text-purple-400'
              }`}>
                {matchStatus === 'waiting' ? <AlertCircle size={20} /> : 
                 matchStatus === 'started' ? <PlayCircle size={20} /> : 
                 <CheckCircle size={20} />}
              </div>
              <div>
                <h3 className={`font-medium ${
                  matchStatus === 'waiting' ? 'text-yellow-400' :
                  matchStatus === 'started' ? 'text-green-400' :
                  'text-purple-400'
                }`}>
                  {matchStatus === 'waiting' ? 'Aguardando jogadores' : 
                   matchStatus === 'started' ? 'Partida em andamento' : 
                   'Partida finalizada'}
                </h3>
                <p className="mt-1 text-sm text-gray-300">
                  {matchStatus === 'waiting' ? 'Entre no jogo com o ID e senha fornecidos e aguarde todos ficarem prontos.' : 
                   matchStatus === 'started' ? 'A partida já está em andamento. Boa sorte!' : 
                   'A partida foi concluída. Envie o resultado usando o botão abaixo.'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            {matchStatus === 'waiting' && (
              <>
                {/* Opções de pagamento para modos não-solo */}
                {match.gameType !== 'solo' && (
                  <div className="w-full mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium">Opção de Pagamento</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          // Aqui implementaríamos a lógica para atualizar a opção de pagamento
                          console.log('Capitão paga selecionado');
                        }}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
                      >
                        <Crown size={16} className="text-yellow-400" />
                        <span className="text-sm">Capitão paga</span>
                      </button>
                      <button
                        onClick={() => {
                          // Aqui implementaríamos a lógica para atualizar a opção de pagamento
                          console.log('Dividir custos selecionado');
                        }}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
                      >
                        <Users size={16} className="text-blue-400" />
                        <span className="text-sm">Dividir custos</span>
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleReady}
                  className={`btn flex-1 flex items-center justify-center ${
                    isReady ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'
                  }`}
                >
                  {isReady ? (
                    <>
                      <CheckCircle size={18} className="mr-2" />
                      Pronto
                    </>
                  ) : (
                    <>
                      <Clock size={18} className="mr-2" />
                      Marcar como Pronto
                    </>
                  )}
                </button>
                
                {isCaptain && (
                  <button
                    onClick={handleStartMatch}
                    disabled={!teams.every(team => team.players.every(player => player.isReady))}
                    className={`btn flex-1 flex items-center justify-center ${
                      teams.every(team => team.players.every(player => player.isReady))
                        ? 'bg-primary hover:bg-primary/80'
                        : 'bg-gray-700 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <PlayCircle size={18} className="mr-2" />
                    Iniciar Partida
                  </button>
                )}
              </>
            )}
            
            {matchStatus === 'started' && (
              <div className="flex items-center justify-center bg-green-900/20 border border-green-500/30 rounded-lg p-4 w-full">
                <PlayCircle size={20} className="text-green-400 mr-2" />
                <span>Partida em andamento - Jogue e retorne para enviar o resultado</span>
              </div>
            )}
            
            {matchStatus === 'finished' && (
              <button
                onClick={onSubmitResult}
                className="btn bg-primary hover:bg-primary/80 flex items-center justify-center"
              >
                <Medal size={18} className="mr-2" />
                Enviar Resultado
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componentes de ícones
const DollarSign = ({ size = 24, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

const Star = ({ size = 24, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

const Crown = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M2 17L12 7.5L22 17H2Z" fill="currentColor" />
    <path d="M20 20H4V18H20V20Z" fill="currentColor" />
    <path d="M12 5.5C13.1046 5.5 14 4.60457 14 3.5C14 2.39543 13.1046 1.5 12 1.5C10.8954 1.5 10 2.39543 10 3.5C10 4.60457 10.8954 5.5 12 5.5Z" fill="currentColor" />
  </svg>
);

export default MatchRoomModal; 