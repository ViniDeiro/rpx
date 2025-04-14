import React, { useState, useEffect } from 'react';
import Character2D from './Character2D';
import './Character2D.css';

/**
 * Componente de personagem 2D com recursos específicos para o jogo
 * @param {Object} props - Propriedades do componente
 * @param {string} props.type - Tipo de personagem (ninja, warrior, mage, archer, default)
 * @param {string} props.color - Cor principal do personagem
 * @param {string} props.username - Nome do jogador
 * @param {number} props.health - Saúde do personagem (0-100)
 * @param {string} props.status - Status do personagem (active, injured, defeated)
 * @param {string} props.action - Ação atual (idle, attack, jump, etc.)
 * @param {number} props.position - Posição no tabuleiro (0-23)
 * @param {boolean} props.isCurrentPlayer - Se é o jogador atual
 * @param {Function} props.onActionComplete - Callback quando a ação termina
 */
export default function CharacterInGame({
  type = 'default',
  color = '#3498db',
  username = 'Jogador',
  health = 100,
  status = 'active',
  action = 'idle',
  position = 0,
  isCurrentPlayer = false,
  onActionComplete = () => {},
  className = '',
  style = {}
}) {
  // Estado para controlar a animação atual
  const [animation, setAnimation] = useState('idle');
  // Estado para controlar efeitos visuais
  const [effect, setEffect] = useState(null);
  
  // Processar a ação e atualizar a animação
  useEffect(() => {
    if (action === 'idle') {
      setAnimation('idle');
      return;
    }
    
    // Configurar animação com base na ação
    setAnimation(action);
    
    // Adicionar efeito visual baseado na ação
    if (action === 'attack') {
      setEffect('attack-effect');
    } else if (action === 'injured') {
      setEffect('injured-effect');
    } else if (action === 'heal') {
      setEffect('heal-effect');
    }
    
    // Limpar efeito após animação
    const timeout = setTimeout(() => {
      setEffect(null);
      setAnimation('idle');
      onActionComplete();
    }, action === 'attack' ? 800 : action === 'jump' ? 1000 : 500);
    
    return () => clearTimeout(timeout);
  }, [action, onActionComplete]);
  
  // Determinar classes baseadas no status
  const getStatusClasses = () => {
    switch (status) {
      case 'injured':
        return 'opacity-70';
      case 'defeated':
        return 'opacity-50 grayscale';
      default:
        return '';
    }
  };
  
  // Determinar classes para jogador atual
  const getCurrentPlayerClasses = () => {
    return isCurrentPlayer ? 'ring-4 ring-yellow-400 ring-opacity-70' : '';
  };
  
  return (
    <div 
      className={`character-in-game relative ${className} ${getStatusClasses()} ${getCurrentPlayerClasses()}`}
      style={{
        ...style,
        gridArea: `pos-${position}`
      }}
    >
      {/* Barra de vida */}
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-16 h-2 bg-gray-300 rounded-full overflow-hidden">
        <div 
          className={`h-full ${health > 50 ? 'bg-green-500' : health > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${health}%` }}
        />
      </div>
      
      {/* Nome do jogador */}
      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <span className="text-xs font-medium bg-white bg-opacity-80 px-2 py-1 rounded shadow">
          {username}
        </span>
      </div>
      
      {/* Personagem */}
      <div className="relative">
        <Character2D 
          type={type} 
          color={color} 
          animation={animation}
          size="medium"
        />
        
        {/* Indicador de turno atual */}
        {isCurrentPlayer && (
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-1">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse delay-100" />
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse delay-200" />
            </div>
          </div>
        )}
      </div>
      
      {/* Efeitos visuais */}
      {effect === 'attack-effect' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-red-500 bg-opacity-30 rounded-full animate-ping" />
        </div>
      )}
      
      {effect === 'injured-effect' && (
        <div className="absolute inset-0 border-4 border-red-500 animate-pulse rounded-full" />
      )}
      
      {effect === 'heal-effect' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-full bg-green-500 bg-opacity-30 animate-pulse rounded-full" />
        </div>
      )}
    </div>
  );
} 