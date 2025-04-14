import React from 'react';

/**
 * Componente para renderizar personagens 2D usando SVG
 * @param {Object} props - Propriedades do componente
 * @param {string} props.type - Tipo de personagem (ninja, warrior, mage, archer, default)
 * @param {string} props.color - Cor principal do personagem
 * @param {string} props.size - Tamanho do personagem (small, medium, large)
 * @param {string} props.animation - Animação atual (idle, walk, attack)
 * @returns {JSX.Element} Componente React
 */
export default function Character2D({ 
  type = 'default', 
  color = '#3498db',
  size = 'medium', 
  animation = 'idle',
  className = '',
  style = {} 
}) {
  // Definir dimensões com base no tamanho
  const dimensions = {
    small: { width: 120, height: 120 },
    medium: { width: 180, height: 180 },
    large: { width: 240, height: 240 }
  };
  
  const { width, height } = dimensions[size] || dimensions.medium;
  
  // Classes de animação CSS
  const animationClass = `character-animation-${animation}`;
  
  // Renderizar o SVG apropriado com base no tipo
  const renderCharacter = () => {
    switch (type) {
      case 'ninja':
        return renderNinja(color);
      case 'warrior':
        return renderWarrior(color);
      case 'mage':
        return renderMage(color);
      case 'archer':
        return renderArcher(color);
      case 'default':
      default:
        return renderDefault(color);
    }
  };
  
  return (
    <div 
      className={`character-container ${animationClass} ${className}`}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        ...style 
      }}
    >
      <svg 
        viewBox="0 0 100 100" 
        xmlns="http://www.w3.org/2000/svg"
        width="100%" 
        height="100%"
      >
        {renderCharacter()}
      </svg>
    </div>
  );
}

// Funções para renderizar cada tipo de personagem em SVG

function renderNinja(color) {
  return (
    <>
      {/* Corpo */}
      <rect x="40" y="45" width="20" height="30" fill={color} />
      
      {/* Cabeça */}
      <circle cx="50" cy="35" r="15" fill="#8e8e8e" />
      
      {/* Máscara */}
      <rect x="35" y="30" width="30" height="10" fill="#333" />
      
      {/* Olhos */}
      <circle cx="42" cy="35" r="3" fill="white" />
      <circle cx="58" cy="35" r="3" fill="white" />
      <circle cx="42" cy="35" r="1" fill="#333" />
      <circle cx="58" cy="35" r="1" fill="#333" />
      
      {/* Faixa da cabeça */}
      <rect x="35" y="25" width="30" height="5" fill="red" />
      
      {/* Braços */}
      <rect x="30" y="45" width="10" height="20" fill={color} />
      <rect x="60" y="45" width="10" height="20" fill={color} />
      
      {/* Pernas */}
      <rect x="40" y="75" width="8" height="15" fill="#333" />
      <rect x="52" y="75" width="8" height="15" fill="#333" />
    </>
  );
}

function renderWarrior(color) {
  return (
    <>
      {/* Corpo/Armadura */}
      <rect x="40" y="45" width="20" height="30" fill={color} />
      <path d="M40 45 L60 45 L65 50 L65 70 L60 75 L40 75 L35 70 L35 50 Z" fill={color} />
      
      {/* Cabeça */}
      <circle cx="50" cy="35" r="12" fill="#ffd699" />
      
      {/* Capacete */}
      <path d="M35 35 L38 30 L62 30 L65 35 L62 40 L38 40 Z" fill="#a0a0a0" />
      <rect x="45" y="25" width="10" height="5" fill="#c00" />
      
      {/* Olhos */}
      <circle cx="44" cy="35" r="2" fill="#333" />
      <circle cx="56" cy="35" r="2" fill="#333" />
      
      {/* Braços */}
      <rect x="30" y="45" width="10" height="25" fill="#a0a0a0" />
      <rect x="60" y="45" width="10" height="25" fill="#a0a0a0" />
      
      {/* Pernas */}
      <rect x="40" y="75" width="8" height="15" fill="#444" />
      <rect x="52" y="75" width="8" height="15" fill="#444" />
      
      {/* Espada */}
      <rect x="70" y="40" width="5" height="30" fill="#a0a0a0" />
      <rect x="67.5" y="35" width="10" height="5" fill="#a0a0a0" />
    </>
  );
}

function renderMage(color) {
  return (
    <>
      {/* Corpo/Robe */}
      <path d="M40 45 L60 45 L65 90 L35 90 Z" fill={color} />
      
      {/* Cabeça */}
      <circle cx="50" cy="35" r="12" fill="#ffd699" />
      
      {/* Chapéu */}
      <path d="M30 45 L50 20 L70 45 Z" fill={color} />
      <circle cx="50" cy="20" r="3" fill="#fff" />
      
      {/* Olhos */}
      <circle cx="45" cy="35" r="2" fill="#333" />
      <circle cx="55" cy="35" r="2" fill="#333" />
      
      {/* Barba */}
      <path d="M42 42 L50 48 L58 42 L58 55 L42 55 Z" fill="#ddd" />
      
      {/* Braços */}
      <rect x="35" y="50" width="5" height="20" fill={color} />
      <rect x="60" y="50" width="5" height="20" fill={color} />
      
      {/* Cajado */}
      <rect x="70" y="30" width="3" height="40" fill="#8B4513" />
      <circle cx="71.5" cy="25" r="5" fill="#7D3C98" />
    </>
  );
}

function renderArcher(color) {
  return (
    <>
      {/* Corpo */}
      <rect x="40" y="45" width="20" height="30" fill={color} />
      
      {/* Cabeça */}
      <circle cx="50" cy="35" r="12" fill="#ffd699" />
      
      {/* Capuz */}
      <path d="M38 25 L62 25 L65 40 L35 40 Z" fill={color} />
      
      {/* Olhos */}
      <circle cx="45" cy="35" r="2" fill="#333" />
      <circle cx="55" cy="35" r="2" fill="#333" />
      
      {/* Braços */}
      <rect x="30" y="45" width="10" height="20" fill="#ffd699" />
      <rect x="60" y="45" width="10" height="20" fill="#ffd699" />
      
      {/* Pernas */}
      <rect x="40" y="75" width="8" height="15" fill="#5D4037" />
      <rect x="52" y="75" width="8" height="15" fill="#5D4037" />
      
      {/* Arco */}
      <path d="M70 30 Q80 50 70 70" fill="none" stroke="#8B4513" strokeWidth="2" />
      <line x1="70" y1="50" x2="60" y2="50" stroke="#8B4513" strokeWidth="1" />
    </>
  );
}

function renderDefault(color) {
  return (
    <>
      {/* Corpo */}
      <rect x="40" y="45" width="20" height="30" fill={color} />
      
      {/* Cabeça */}
      <circle cx="50" cy="35" r="15" fill="#ffd699" />
      
      {/* Olhos */}
      <circle cx="44" cy="32" r="3" fill="white" />
      <circle cx="56" cy="32" r="3" fill="white" />
      <circle cx="44" cy="32" r="1.5" fill="#333" />
      <circle cx="56" cy="32" r="1.5" fill="#333" />
      
      {/* Boca */}
      <path d="M45 40 Q50 45 55 40" fill="none" stroke="#333" strokeWidth="1.5" />
      
      {/* Cabelo */}
      <path d="M35 30 L40 25 L60 25 L65 30" fill="none" stroke="#8B4513" strokeWidth="4" />
      
      {/* Braços */}
      <rect x="30" y="45" width="10" height="20" fill="#ffd699" />
      <rect x="60" y="45" width="10" height="20" fill="#ffd699" />
      
      {/* Pernas */}
      <rect x="40" y="75" width="8" height="15" fill="#3498db" />
      <rect x="52" y="75" width="8" height="15" fill="#3498db" />
    </>
  );
} 