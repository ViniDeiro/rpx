import React, { useState } from 'react';
import { User, Users, Shield, Award } from 'react-feather';
import CharacterViewer from '../3d/CharacterViewer';

// Tipo de jogador no lobby
export const PLAYER_TYPES = {
  CAPTAIN: 'captain',
  TEAMMATE: 'teammate',
  OPPONENT: 'opponent',
  SPECTATOR: 'spectator',
};

export default function CharacterDisplay({
  player,
  playerType = PLAYER_TYPES.TEAMMATE,
  showDetails = true,
  size = 'medium',
  onClick = null,
  showReady = false,
  interactive = true,
  animation = 'idle',
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Tamanhos pré-definidos
  const sizes = {
    small: { height: 120, width: '100%', iconSize: 14 },
    medium: { height: 180, width: '100%', iconSize: 16 },
    large: { height: 250, width: '100%', iconSize: 18 },
  };
  
  const currentSize = sizes[size] || sizes.medium;
  
  // Cores baseadas no tipo de jogador
  const typeColors = {
    [PLAYER_TYPES.CAPTAIN]: 'from-amber-500/20 to-amber-700/10 border-amber-500/30',
    [PLAYER_TYPES.TEAMMATE]: 'from-blue-500/20 to-blue-700/10 border-blue-500/30',
    [PLAYER_TYPES.OPPONENT]: 'from-red-500/20 to-red-700/10 border-red-500/30',
    [PLAYER_TYPES.SPECTATOR]: 'from-gray-500/20 to-gray-700/10 border-gray-500/30',
  };
  
  // Cor baseada no tipo do jogador
  const typeColor = typeColors[playerType] || typeColors[PLAYER_TYPES.TEAMMATE];
  
  // Animar quando hover
  const handleMouseEnter = () => {
    if (interactive) {
      setIsHovered(true);
    }
  };
  
  const handleMouseLeave = () => {
    if (interactive) {
      setIsHovered(false);
    }
  };
  
  // Animação baseada no estado
  const currentAnimation = isHovered ? 'wave' : (player?.isReady && showReady ? 'dance' : animation);
  
  return (
    <div 
      className={`relative rounded-lg overflow-hidden border ${typeColor} bg-gradient-to-b ${
        interactive ? 'cursor-pointer hover:shadow-lg transition-all' : ''
      }`}
      onClick={interactive && onClick ? () => onClick(player) : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Badge de tipo de jogador */}
      <div className="absolute top-2 left-2 z-10">
        {playerType === PLAYER_TYPES.CAPTAIN && (
          <div className="bg-amber-500 text-white p-1 rounded-full" title="Capitão">
            <Shield size={currentSize.iconSize} />
          </div>
        )}
        {playerType === PLAYER_TYPES.OPPONENT && (
          <div className="bg-red-500 text-white p-1 rounded-full" title="Adversário">
            <Users size={currentSize.iconSize} />
          </div>
        )}
        {player?.rank && (
          <div className="bg-purple-500 text-white mt-1 p-1 rounded-full" title={`Rank ${player.rank}`}>
            <Award size={currentSize.iconSize} />
          </div>
        )}
      </div>
      
      {/* Badge de status pronto */}
      {showReady && (
        <div className={`absolute top-2 right-2 z-10 p-1 rounded-full ${
          player?.isReady ? 'bg-green-500' : 'bg-gray-500'
        }`}>
          <div className="w-2 h-2 rounded-full bg-white"></div>
        </div>
      )}
      
      {/* Visualizador 3D */}
      <div style={{ height: currentSize.height, width: currentSize.width }}>
        <CharacterViewer 
          skinId={player?.skin || 'default'} 
          animation={currentAnimation}
          controls={false}
          autoRotate={false}
          showInfo={false}
          positionY={-1.6}
        />
      </div>
      
      {/* Detalhes do jogador */}
      {showDetails && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-card rounded-full flex items-center justify-center">
              <User size={12} />
            </div>
            <div className="overflow-hidden">
              <div className="font-medium text-sm truncate">
                {player?.username || 'Jogador'}
              </div>
              {player?.level && (
                <div className="text-xs text-muted">
                  Nível {player.level}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 