import React, { useState } from 'react';
import Character2D from './Character2D';
import './Character2D.css';

/**
 * Componente de seleção de personagem com opções de personalização
 * @param {Object} props - Propriedades do componente
 * @param {Function} props.onSelect - Função chamada quando um personagem é selecionado
 * @param {Object} props.initialCharacter - Configurações iniciais do personagem (opcional)
 * @param {string} props.className - Classes CSS adicionais
 * @returns {JSX.Element} Componente React
 */
export default function CharacterSelector({ 
  onSelect = () => {}, 
  initialCharacter = { type: 'default', color: '#3498db' },
  className = ''
}) {
  const [selectedType, setSelectedType] = useState(initialCharacter.type);
  const [selectedColor, setSelectedColor] = useState(initialCharacter.color);
  
  // Tipos de personagens disponíveis
  const characterTypes = [
    { id: 'default', name: 'Padrão' },
    { id: 'ninja', name: 'Ninja' },
    { id: 'warrior', name: 'Guerreiro' },
    { id: 'mage', name: 'Mago' },
    { id: 'archer', name: 'Arqueiro' }
  ];
  
  // Paleta de cores
  const colorPalette = [
    '#3498db', // Azul
    '#e74c3c', // Vermelho
    '#2ecc71', // Verde
    '#9b59b6', // Roxo
    '#f1c40f', // Amarelo
    '#1abc9c', // Turquesa
    '#fd79a8', // Rosa
    '#6c5ce7', // Índigo
    '#00cec9', // Ciano
    '#d35400', // Laranja
    '#2d3436', // Cinza escuro
  ];
  
  // Atualiza e notifica a seleção
  const updateSelection = (type, color) => {
    const newType = type || selectedType;
    const newColor = color || selectedColor;
    
    if (newType !== selectedType) {
      setSelectedType(newType);
    }
    
    if (newColor !== selectedColor) {
      setSelectedColor(newColor);
    }
    
    onSelect({ type: newType, color: newColor });
  };
  
  // Seleciona o tipo de personagem
  const handleTypeSelect = (type) => {
    updateSelection(type, selectedColor);
  };
  
  // Seleciona a cor
  const handleColorSelect = (color) => {
    updateSelection(selectedType, color);
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold text-center">Escolha seu Personagem</h3>
      </div>
      
      <div className="p-6">
        {/* Visualização do personagem selecionado */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Character2D 
              type={selectedType} 
              color={selectedColor} 
              animation="idle"
              size="large"
            />
          </div>
        </div>
        
        {/* Seleção de tipo de personagem */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Classe</label>
          <div className="grid grid-cols-3 gap-2">
            {characterTypes.map(char => (
              <button
                key={char.id}
                className={`p-2 text-sm rounded transition-colors ${
                  selectedType === char.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => handleTypeSelect(char.id)}
              >
                {char.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Seleção de cor */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Cor</label>
          <div className="flex flex-wrap gap-2">
            {colorPalette.map(color => (
              <button
                key={color}
                className={`w-8 h-8 rounded-full transition-transform ${
                  selectedColor === color 
                    ? 'transform scale-110 border-2 border-gray-800' 
                    : 'border border-gray-200 hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
                aria-label={`Selecionar cor ${color}`}
              />
            ))}
          </div>
        </div>
        
        {/* Botão de confirmação */}
        <button
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          onClick={() => onSelect({ type: selectedType, color: selectedColor })}
        >
          Confirmar Seleção
        </button>
      </div>
    </div>
  );
} 