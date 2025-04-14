import React, { useState } from 'react';
import Character2D from './Character2D';
import './Character2D.css';

const characterTypes = ['default', 'ninja', 'warrior', 'mage', 'archer'];
const animations = ['idle', 'walk', 'run', 'attack', 'jump', 'dance'];
const colors = [
  '#3498db', // Azul
  '#e74c3c', // Vermelho
  '#2ecc71', // Verde
  '#9b59b6', // Roxo
  '#f1c40f', // Amarelo
  '#1abc9c', // Turquesa
];

export default function CharacterDemo() {
  const [selectedType, setSelectedType] = useState('default');
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [selectedAnimation, setSelectedAnimation] = useState('idle');
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Demonstração de Personagens 2D</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-100 p-6 rounded-lg flex flex-col items-center justify-center">
          <Character2D 
            type={selectedType} 
            color={selectedColor} 
            animation={selectedAnimation}
            size="large"
          />
          <p className="mt-4 text-lg font-semibold">
            {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} - {selectedAnimation}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Personalização</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Tipo de Personagem</label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {characterTypes.map(type => (
                <button
                  key={type}
                  className={`p-2 rounded ${selectedType === type ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                  onClick={() => setSelectedType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Cor</label>
            <div className="flex flex-wrap gap-2">
              {colors.map(color => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded-full border-2 ${selectedColor === color ? 'border-black' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  aria-label={`Cor ${color}`}
                />
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Animação</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {animations.map(animation => (
                <button
                  key={animation}
                  className={`p-2 rounded ${selectedAnimation === animation ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                  onClick={() => setSelectedAnimation(animation)}
                >
                  {animation.charAt(0).toUpperCase() + animation.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Galeria de Personagens</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {characterTypes.map(type => (
            <div 
              key={type}
              className="bg-gray-100 p-4 rounded-lg flex flex-col items-center cursor-pointer hover:bg-gray-200"
              onClick={() => {
                setSelectedType(type);
                setSelectedAnimation('idle');
              }}
            >
              <Character2D 
                type={type} 
                color={colors[characterTypes.indexOf(type) % colors.length]} 
                animation="idle"
                size="medium"
              />
              <p className="mt-2 font-medium">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Como Usar</h2>
        <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto text-sm">
{`import Character2D from '@/components/2d/Character2D';

// No seu componente React
<Character2D 
  type="${selectedType}" 
  color="${selectedColor}"
  animation="${selectedAnimation}"
  size="medium"
/>`}
        </pre>
      </div>
    </div>
  );
} 