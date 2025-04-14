"use client";

import React, { useState } from 'react';
import LobbyWithCharacters from '../../components/lobby/LobbyWithCharacters';
import CharacterSelector from '../../components/2d/CharacterSelector';
import '../../components/2d/Character2D.css';

// Definindo a interface para o tipo de personagem
interface Character {
  type: string;
  color: string;
}

// Definindo a interface para o jogador
interface Player {
  id: string;
  username: string;
  character: Character;
}

// Definindo a interface para o componente LobbyWithCharacters
interface LobbyWithCharactersProps {
  players: Player[];
  gameStatus: string;
  onStartGame: () => void;
  currentUserId: string;
}

export default function DemoLobbyPage() {
  // Estado para acompanhar jogadores no lobby
  const [players, setPlayers] = useState<Player[]>([
    { 
      id: 'user1', 
      username: 'Jogador 1', 
      character: { type: 'ninja', color: '#e74c3c' }
    },
    { 
      id: 'user2', 
      username: 'Jogador 2', 
      character: { type: 'mage', color: '#3498db' }
    },
    { 
      id: 'user3', 
      username: 'Jogador 3', 
      character: { type: 'archer', color: '#2ecc71' }
    }
  ]);
  
  // Estado para controlar status do jogo (waiting, starting, in_progress)
  const [gameStatus, setGameStatus] = useState<string>('waiting');
  
  // ID do usuário atual (para simulação)
  const currentUserId = 'user1';
  
  // Lidar com início do jogo
  const handleStartGame = () => {
    setGameStatus('starting');
    
    // Após 3 segundos, mudar para "em andamento"
    setTimeout(() => {
      setGameStatus('in_progress');
    }, 3000);
  };
  
  // Adicionar um jogador ao lobby
  const handleAddPlayer = (character: Character) => {
    const newPlayer = {
      id: `user${players.length + 1}`,
      username: `Jogador ${players.length + 1}`,
      character
    };
    
    setPlayers([...players, newPlayer]);
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground py-8">
      <div className="container px-4 mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Demonstração de Lobby</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <LobbyWithCharacters 
              players={players}
              gameStatus={gameStatus}
              onStartGame={handleStartGame}
              currentUserId={currentUserId}
            />
          </div>
          
          <div>
            <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
              <h2 className="text-xl font-semibold mb-4">Controles de Demo</h2>
              
              <div className="space-y-2 mb-4">
                <button 
                  className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                  onClick={() => setGameStatus('waiting')}
                >
                  Status: Aguardando
                </button>
                
                <button 
                  className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                  onClick={() => setGameStatus('starting')}
                >
                  Status: Iniciando
                </button>
                
                <button 
                  className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                  onClick={() => setGameStatus('in_progress')}
                >
                  Status: Em Andamento
                </button>
              </div>
              
              <div className="space-y-2">
                <button 
                  className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                  onClick={() => setPlayers([])}
                >
                  Remover Todos Jogadores
                </button>
                
                <button 
                  className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                  onClick={() => setPlayers(players.slice(0, -1))}
                  disabled={players.length === 0}
                >
                  Remover Último Jogador
                </button>
              </div>
            </div>
            
            {/* Seletor de personagem para adicionar novos jogadores */}
            {players.length < 6 && (
              <CharacterSelector
                onSelect={handleAddPlayer}
                initialCharacter={{ 
                  type: ['default', 'ninja', 'warrior', 'mage', 'archer'][Math.floor(Math.random() * 5)],
                  color: ['#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f1c40f'][Math.floor(Math.random() * 5)]
                }}
                className="bg-white rounded-lg shadow-lg"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 