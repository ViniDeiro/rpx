'use client';

import React, { useState, useEffect } from 'react';
import { User, Clock, CheckCircle, X, Shield, Users } from 'react-feather';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

// Tipos para o componente
interface Player {
  userId?: string;
  id?: string;
  name?: string;
  username?: string;
  avatar?: string;
  avatarUrl?: string;
  isReady?: boolean;
  isCaptain?: boolean;
  team?: string;
  rank?: string;
}

interface Team {
  id: string;
  name: string;
  players: Player[];
}

interface MatchLobbyModalProps {
  matchId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Função para gerar um jogador aleatório simulado
const getRandomPlayer = (teamId: string, isCaptain: boolean = false): Player => {
  const nomes = ['Gabriel', 'Lucas', 'Pedro', 'Rafael', 'Matheus', 'João', 'Bruno', 'Carlos', 'Felipe', 'Victor'];
  const sobrenomes = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Pereira', 'Ferreira', 'Rodrigues', 'Almeida', 'Gomes'];
  
  const nome = nomes[Math.floor(Math.random() * nomes.length)];
  const sobrenome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
  const username = `${nome}${sobrenome}`;
  
  // Gerar avatar aleatório
  const avatarId = Math.floor(Math.random() * 12) + 1;
  const avatar = `/images/avatars/avatar${avatarId}.png`;
  
  return {
    id: `player-${uuidv4().substring(0, 8)}`,
    name: username,
    username: username,
    avatar: avatar,
    isReady: true,
    isCaptain: isCaptain,
    team: teamId,
    rank: ['Bronze', 'Prata', 'Ouro', 'Platina', 'Diamante'][Math.floor(Math.random() * 5)]
  };
};

// Função para criar dados simulados de uma partida
const generateSimulatedMatch = (matchId: string) => {
  // Criar times
  const team1: Team = {
    id: 'team1',
    name: 'Time Alfa',
    players: [
      // Jogador principal (usuário)
      {
        id: 'user-current',
        name: 'Você',
        username: 'Você',
        avatar: '/images/avatars/default.png',
        isReady: true,
        isCaptain: true,
        team: 'team1'
      }
    ]
  };
  
  const team2: Team = {
    id: 'team2',
    name: 'Time Beta',
    players: [
      // Capitão do time adversário
      getRandomPlayer('team2', true)
    ]
  };
  
  // Gerar partida simulada
  return {
    id: matchId,
    title: `Partida #${Math.floor(10000 + Math.random() * 90000)}`,
    mode: ['ranked', 'casual', 'tournament'][Math.floor(Math.random() * 3)],
    type: '1v1',
    status: 'waiting_players',
    teamSize: 1,
    platform: 'pc',
    platformMode: 'mixed',
    gameplayMode: 'normal',
    entryFee: 10,
    prize: 18,
    odd: 1.8,
    teams: [team1, team2],
    createdAt: new Date(),
    updatedAt: new Date(),
    roomId: `RPX${Math.floor(10000 + Math.random() * 90000)}`,
    roomPassword: `pass${Math.floor(100 + Math.random() * 900)}`
  };
};

const MatchLobbyModal: React.FC<MatchLobbyModalProps> = ({ 
  matchId,
  isOpen, 
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<any>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState('2:00');
  const router = useRouter();

  // Simular o carregamento de dados da partida
  useEffect(() => {
    if (!isOpen || !matchId) return;
    
    // Simular tempo de carregamento
    const loadingTimer = setTimeout(() => {
      try {
        console.log(`🎮 Simulando dados para partida: ${matchId}`);
        
        // Gerar dados simulados da partida
        const simulatedMatch = generateSimulatedMatch(matchId);
        setMatch(simulatedMatch);
        setTeams(simulatedMatch.teams);
        setError(null);
        setLoading(false);
        
        console.log('✅ Dados simulados gerados com sucesso:', simulatedMatch);
      } catch (error) {
        console.error('❌ Erro ao gerar dados simulados:', error);
        setError('Erro ao carregar dados da partida simulada.');
        setLoading(false);
      }
    }, 1500); // Simular 1.5 segundos de carregamento
    
    return () => {
      clearTimeout(loadingTimer);
    };
  }, [isOpen, matchId]);

  // Iniciar partida
  const handleStartMatch = () => {
    console.log('🎮 Simulando início da partida:', matchId);
    
    // Mostrar mensagem de sucesso
    alert('Partida simulada iniciada com sucesso!');
    
    // Fechar o modal
    onClose();
  };

  // Contador regressivo
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        const [minutes, seconds] = prevTime.split(':').map(Number);
        let newSeconds = seconds - 1;
        let newMinutes = minutes;
        
        if (newSeconds < 0) {
          newMinutes--;
          newSeconds = 59;
        }
        
        if (newMinutes < 0) {
          clearInterval(timer);
          return '0:00';
        }
        
        return `${newMinutes}:${newSeconds.toString().padStart(2, '0')}`;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog">
      {/* Overlay com fundo escuro sólido */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-80" 
        onClick={onClose}
      />
      
      {/* Modal com fundo sólido */}
      <div className="relative bg-gray-900 w-full max-w-4xl rounded-lg shadow-xl border border-indigo-500 overflow-hidden">
        {/* Cabeçalho */}
        <div className="bg-indigo-900 px-6 py-4 flex justify-between items-center border-b border-indigo-700">
          <h2 className="text-2xl font-bold text-white">
            {loading ? 'Carregando...' : (match?.title || 'Partida Encontrada')}
          </h2>
          
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white"
            aria-label="Fechar"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Conteúdo */}
        <div className="p-6 bg-gray-800">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-10">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-white">Carregando detalhes da partida...</p>
            </div>
          ) : error ? (
            <div className="bg-red-900 text-white p-4 rounded mb-4">
              <p>{error}</p>
            </div>
          ) : (
            <div className="text-white">
              {/* Informações da partida */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-indigo-900/30 p-4 rounded-lg border border-indigo-700/50">
                  <h3 className="text-lg font-semibold mb-2">Detalhes da Partida</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Modo:</span>
                      <span className="capitalize">{match?.mode || 'Casual'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Tipo:</span>
                      <span>{match?.type || '1v1'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Plataforma:</span>
                      <span className="uppercase">{match?.platform || 'Todas'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Valor:</span>
                      <span>R$ {match?.entryFee?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Prêmio:</span>
                      <span>R$ {match?.prize?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-indigo-900/30 p-4 rounded-lg border border-indigo-700/50">
                  <h3 className="text-lg font-semibold mb-2">Lobby da Partida</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">ID da Sala:</span>
                      <span className="font-mono bg-gray-700 px-2 py-1 rounded">{match?.roomId || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Senha:</span>
                      <span className="font-mono bg-gray-700 px-2 py-1 rounded">{match?.roomPassword || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Status:</span>
                      <span className="flex items-center text-green-400">
                        <CheckCircle size={16} className="mr-1" />
                        Pronto
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Tempo:</span>
                      <span className="flex items-center text-yellow-400">
                        <Clock size={16} className="mr-1" />
                        {timeLeft}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Times */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map((team) => (
                  <div key={team.id} className="bg-indigo-900/30 p-4 rounded-lg border border-indigo-700/50">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Shield size={18} className="mr-2 text-blue-400" />
                      {team.name}
                    </h3>
                    
                    <div className="space-y-3">
                      {team.players.length > 0 ? (
                        team.players.map((player) => (
                          <div key={player.id} className="flex items-center p-2 bg-gray-800 rounded-lg">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3">
                              {player.avatar ? (
                                <Image
                                  src={player.avatar}
                                  alt={player.name || 'Jogador'}
                                  width={40}
                                  height={40}
                                  style={{ objectFit: 'cover' }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                  <User size={20} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium flex items-center">
                                {player.name || 'Jogador'}
                                {player.isCaptain && (
                                  <span className="ml-1 bg-yellow-600 text-yellow-100 text-xs px-1 py-0.5 rounded">
                                    Capitão
                                  </span>
                                )}
                              </div>
                              {player.rank && (
                                <div className="text-xs text-gray-400">{player.rank}</div>
                              )}
                            </div>
                            <div>
                              {player.isReady ? (
                                <span className="text-green-400">
                                  <CheckCircle size={16} />
                                </span>
                              ) : (
                                <span className="text-yellow-400">
                                  <Clock size={16} />
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-center p-4 bg-gray-800/50 rounded-lg border border-dashed border-gray-700">
                          <Users size={18} className="mr-2 text-gray-500" />
                          <span className="text-gray-500">Aguardando jogadores...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Botões */}
              <div className="mt-6 flex justify-between">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                >
                  Cancelar
                </button>
                
                <button
                  onClick={handleStartMatch}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded flex items-center transition-colors"
                >
                  <CheckCircle size={18} className="mr-2" />
                  Começar Partida
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchLobbyModal; 