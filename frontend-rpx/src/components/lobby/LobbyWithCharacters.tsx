import React, { useState, useEffect } from 'react';
import Character2D from '../2d/Character2D';
import ProfileAvatar from '../profile/ProfileAvatar';
import { Award } from 'react-feather';
import { RankTier } from '@/utils/ranking';

// Definição da interface para o jogador
interface Player {
  id: string;
  username: string;
  avatarUrl?: string;
  character?: {
    type: string;
    color: string;
  };
  rank?: string;
  rankTier?: RankTier;
  level?: number;
}

// Interface para props do componente
interface LobbyWithCharactersProps {
  players: Player[];
  gameStatus: string;
  onStartGame: () => void;
  currentUserId: string;
}

/**
 * Componente de lobby que exibe personagens 2D dos jogadores
 */
export default function LobbyWithCharacters({ 
  players = [], 
  gameStatus = 'waiting',
  onStartGame = () => {},
  currentUserId = ''
}: LobbyWithCharactersProps) {
  const [lobbyPlayers, setLobbyPlayers] = useState<Player[]>(players);

  // Atualiza jogadores quando a prop muda
  useEffect(() => {
    setLobbyPlayers(players);
  }, [players]);

  // Determina a animação baseada no status do jogo
  const getCharacterAnimation = (status: string): string => {
    switch (status) {
      case 'starting':
        return 'dance';
      case 'in_progress':
        return 'walk';
      default:
        return 'idle';
    }
  };

  // Verifica se o usuário atual é o administrador
  const isAdmin = lobbyPlayers.length > 0 && 
    lobbyPlayers[0].id === currentUserId;

  // Renderiza slots de jogadores
  const renderPlayerSlots = () => {
    // Criar 6 slots para jogadores
    const slots: Array<Player | null> = Array(6).fill(null);
    
    // Preencher slots com jogadores existentes
    lobbyPlayers.forEach((player, index) => {
      if (index < slots.length) {
        slots[index] = player;
      }
    });

    return slots.map((player, index) => (
      <div key={index} className="flex flex-col items-center">
        <div className="bg-gray-100 rounded-lg p-4 w-36 h-36 flex items-center justify-center">
          {player ? (
            <div className="text-center">
              <div className="relative mb-2">
                {/* Personagem 2D */}
                <Character2D 
                  type={player.character?.type || 'default'} 
                  color={player.character?.color || '#3498db'} 
                  animation={getCharacterAnimation(gameStatus)}
                  size="medium"
                />
                
                {/* Avatar com moldura de rank */}
                <div className="absolute bottom-0 right-0">
                  <ProfileAvatar 
                    size="sm" 
                    rankTier="platinum" 
                    avatarUrl={player.avatarUrl}
                    showRankFrame={true}
                  />
                </div>
              </div>
              
              <div className="mt-2 flex flex-col items-center justify-center gap-1">
                <p className="font-medium text-sm truncate max-w-[80%]">{player.username}</p>
                
                {player.rank && (
                  <div className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md flex items-center">
                    <Award size={10} className="mr-1" /> {player.rank}
                  </div>
                )}
                
                {player.level && (
                  <div className="text-xs text-gray-500">
                    Nível {player.level}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-center">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="mt-2">Aguardando...</p>
            </div>
          )}
        </div>
      </div>
    ));
  };

  return (
    <div className="bg-gradient-to-br from-primary/20 to-card rounded-lg shadow-lg p-6 border border-primary/30">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Lobby</h2>
      
      {/* Status do jogo */}
      <div className="mb-6">
        <div className={`text-center py-2 px-4 rounded-full font-medium ${
          gameStatus === 'waiting' ? 'bg-yellow-600/30 text-yellow-200' : 
          gameStatus === 'starting' ? 'bg-blue-600/30 text-blue-200' : 
          'bg-green-600/30 text-green-200'
        }`}>
          {gameStatus === 'waiting' ? 'Aguardando jogadores...' : 
           gameStatus === 'starting' ? 'Iniciando em breve!' : 
           'Jogo em andamento'}
        </div>
      </div>
      
      {/* Grid de jogadores */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {renderPlayerSlots()}
      </div>
      
      {/* Botão de iniciar (apenas para o admin) */}
      {isAdmin && gameStatus === 'waiting' && lobbyPlayers.length >= 2 && (
        <div className="flex justify-center">
          <button 
            onClick={onStartGame}
            className="bg-primary hover:bg-primary/80 text-white py-2 px-6 rounded-lg font-medium transition-colors"
          >
            Iniciar Jogo
          </button>
        </div>
      )}
      
      {/* Mensagem de aguardando mais jogadores */}
      {gameStatus === 'waiting' && lobbyPlayers.length < 2 && (
        <div className="text-center text-gray-400">
          Aguardando pelo menos 2 jogadores para iniciar...
        </div>
      )}
      
      {/* Código de convite */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-400 mb-1">Convide seus amigos usando o código:</p>
        <div className="bg-card-hover py-2 px-4 rounded inline-block font-mono font-medium border border-primary/30">
          RPX-{Math.random().toString(36).substring(2, 8).toUpperCase()}
        </div>
      </div>
    </div>
  );
} 