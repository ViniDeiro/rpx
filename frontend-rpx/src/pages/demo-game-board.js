import React, { useState } from 'react';
import Head from 'next/head';
import CharacterInGame from '../components/2d/CharacterInGame';

const DEMO_PLAYERS = [
  {
    id: 'p1',
    username: 'Ninja',
    character: { type: 'ninja', color: '#e74c3c' },
    health: 100,
    position: 0
  },
  {
    id: 'p2',
    username: 'Mago',
    character: { type: 'mage', color: '#3498db' },
    health: 75,
    position: 4
  },
  {
    id: 'p3',
    username: 'Arqueiro',
    character: { type: 'archer', color: '#2ecc71' },
    health: 50,
    position: 8
  },
  {
    id: 'p4',
    username: 'Guerreiro',
    character: { type: 'warrior', color: '#f1c40f' },
    health: 25,
    position: 12
  }
];

const ACTIONS = [
  { id: 'idle', label: 'Idle' },
  { id: 'attack', label: 'Atacar' },
  { id: 'jump', label: 'Pular' },
  { id: 'walk', label: 'Andar' },
  { id: 'run', label: 'Correr' },
  { id: 'dance', label: 'Dançar' }
];

export default function DemoGameBoard() {
  // Estado dos jogadores
  const [players, setPlayers] = useState(DEMO_PLAYERS);
  // Jogador atual
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  // Estado de ação atual
  const [currentAction, setCurrentAction] = useState('idle');
  // Estado de ação em andamento
  const [actionInProgress, setActionInProgress] = useState(false);
  
  // Pegar o jogador atual
  const currentPlayer = players[currentPlayerIndex];
  
  // Aplicar uma ação ao jogador atual
  const applyAction = (actionId) => {
    if (actionInProgress) return;
    
    setActionInProgress(true);
    setCurrentAction(actionId);
    
    // Efeitos específicos para cada ação
    if (actionId === 'attack') {
      // Simular dano a um jogador aleatório
      setTimeout(() => {
        const targetIndex = (currentPlayerIndex + 1) % players.length;
        
        setPlayers(players.map((player, idx) => {
          if (idx === targetIndex) {
            return {
              ...player,
              health: Math.max(0, player.health - 25)
            };
          }
          return player;
        }));
      }, 500);
    }
  };
  
  // Lidar com o término da ação
  const handleActionComplete = () => {
    setActionInProgress(false);
    setCurrentAction('idle');
    
    // Próximo jogador
    if (currentAction !== 'idle') {
      setTimeout(() => {
        setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
      }, 500);
    }
  };
  
  // Mover um jogador
  const movePlayer = (playerId, newPosition) => {
    setPlayers(players.map(player => {
      if (player.id === playerId) {
        return {
          ...player,
          position: newPosition
        };
      }
      return player;
    }));
  };
  
  // Curar um jogador
  const healPlayer = (playerId, amount) => {
    setPlayers(players.map(player => {
      if (player.id === playerId) {
        return {
          ...player,
          health: Math.min(100, player.health + amount)
        };
      }
      return player;
    }));
  };
  
  return (
    <>
      <Head>
        <title>Demo Tabuleiro RPX</title>
        <meta name="description" content="Demonstração de tabuleiro de jogo com personagens 2D" />
      </Head>
      
      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Tabuleiro do Jogo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            {/* Tabuleiro do jogo */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              {/* Grid do tabuleiro - 6x4 */}
              <div className="grid grid-cols-6 grid-rows-4 gap-4 bg-gray-100 p-4 rounded-lg min-h-[500px]"
                style={{
                  display: 'grid',
                  gridTemplateAreas: `
                    'pos-0 pos-1 pos-2 pos-3 pos-4 pos-5'
                    'pos-17 pos-18 pos-19 pos-20 pos-21 pos-6'
                    'pos-16 pos-27 pos-28 pos-29 pos-22 pos-7'
                    'pos-15 pos-14 pos-13 pos-12 pos-9 pos-8'
                  `
                }}
              >
                {/* Células do tabuleiro */}
                {Array.from({ length: 24 }).map((_, idx) => {
                  const player = players.find(p => p.position === idx);
                  
                  return (
                    <div 
                      key={idx}
                      className={`relative flex items-center justify-center border ${
                        idx % 2 === 0 ? 'bg-blue-50' : 'bg-green-50'
                      } rounded-md cursor-pointer hover:bg-yellow-50 transition-colors`}
                      style={{ gridArea: `pos-${idx}` }}
                      onClick={() => {
                        // Mover o jogador atual para esta célula em um clique
                        if (currentPlayer && !actionInProgress) {
                          movePlayer(currentPlayer.id, idx);
                          applyAction('walk');
                        }
                      }}
                    >
                      <span className="absolute top-1 left-1 text-xs text-gray-500">{idx}</span>
                      
                      {!player && (
                        <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300" />
                      )}
                    </div>
                  );
                })}
                
                {/* Personagens no tabuleiro */}
                {players.map(player => (
                  <CharacterInGame
                    key={player.id}
                    type={player.character.type}
                    color={player.character.color}
                    username={player.username}
                    health={player.health}
                    status={player.health > 0 ? (player.health > 30 ? 'active' : 'injured') : 'defeated'}
                    action={player.id === currentPlayer.id ? currentAction : 'idle'}
                    position={player.position}
                    isCurrentPlayer={player.id === currentPlayer.id}
                    onActionComplete={player.id === currentPlayer.id ? handleActionComplete : undefined}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Painel de controle do jogo */}
          <div className="space-y-6">
            {/* Status do jogador atual */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Jogador Atual</h2>
              <div className="flex items-center space-x-4">
                <CharacterInGame
                  type={currentPlayer.character.type}
                  color={currentPlayer.character.color}
                  size="small"
                  animation="idle"
                  style={{ position: 'static', transform: 'none' }}
                />
                <div>
                  <p className="font-medium">{currentPlayer.username}</p>
                  <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                    <div 
                      className={`h-full rounded-full ${
                        currentPlayer.health > 50 ? 'bg-green-500' : 
                        currentPlayer.health > 20 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${currentPlayer.health}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ações do jogador */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-3">Ações</h2>
              <div className="grid grid-cols-2 gap-2">
                {ACTIONS.map(action => (
                  <button
                    key={action.id}
                    className={`p-2 rounded ${
                      currentAction === action.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    } ${actionInProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => applyAction(action.id)}
                    disabled={actionInProgress}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Controles de demo */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-3">Controles</h2>
              
              <div className="space-y-2">
                <button 
                  className="w-full p-2 bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50"
                  onClick={() => {
                    healPlayer(currentPlayer.id, 25);
                    applyAction('heal');
                  }}
                  disabled={actionInProgress || currentPlayer.health >= 100}
                >
                  Curar (+25)
                </button>
                
                <button 
                  className="w-full p-2 bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50"
                  onClick={() => {
                    setPlayers(players.map(player => {
                      if (player.id === currentPlayer.id) {
                        return {
                          ...player,
                          health: Math.max(0, player.health - 25)
                        };
                      }
                      return player;
                    }));
                    applyAction('injured');
                  }}
                  disabled={actionInProgress || currentPlayer.health <= 0}
                >
                  Sofrer Dano (-25)
                </button>
                
                <button 
                  className="w-full p-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50"
                  onClick={() => setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length)}
                  disabled={actionInProgress}
                >
                  Próximo Jogador
                </button>
                
                <button 
                  className="w-full p-2 bg-gray-500 hover:bg-gray-600 text-white rounded disabled:opacity-50"
                  onClick={() => {
                    setPlayers(DEMO_PLAYERS);
                    setCurrentPlayerIndex(0);
                    setCurrentAction('idle');
                    setActionInProgress(false);
                  }}
                  disabled={actionInProgress}
                >
                  Reiniciar Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 