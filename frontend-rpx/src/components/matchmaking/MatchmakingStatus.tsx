import React, { useState, useEffect } from 'react';
import { User, Clock, Search, X } from 'react-feather';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

interface MatchmakingStatusProps {
  waitingId: string;
  userId: string;
  mode: string;
  onMatchFound: (match: any) => void;
  onCancel: () => void;
}

const MatchmakingStatus: React.FC<MatchmakingStatusProps> = ({
  waitingId,
  userId,
  mode,
  onMatchFound,
  onCancel,
}) => {
  const router = useRouter();
  const [status, setStatus] = useState<'searching' | 'found' | 'error'>('searching');
  const [waitingTime, setWaitingTime] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [dots, setDots] = useState('.');

  // Efeito para animação dos pontos
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '.' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Efeito para incrementar o tempo de espera
  useEffect(() => {
    const interval = setInterval(() => {
      setWaitingTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Efeito para simular encontrar uma partida após um tempo aleatório
  useEffect(() => {
    if (!waitingId || !userId) return;

    // Simular tempo aleatório entre 5 e 15 segundos para encontrar uma partida
    const matchFoundTimer = setTimeout(() => {
      // 90% de chance de encontrar uma partida
      const matchFound = Math.random() < 0.9;
      
      if (matchFound) {
        console.log('🎮 Simulação: Partida encontrada!');
        setStatus('found');
        
        // Gerar ID único para a partida simulada
        const matchId = `match-${Date.now()}-${uuidv4().substring(0, 8)}`;
        
        // Simular informações do jogador
        const playerInfo = {
          id: userId,
          name: 'Você',
          avatarUrl: '/images/avatars/default.png'
        };
        
        // Gerar um nome aleatório para o oponente
        const randomOpponentName = () => {
          const nomes = ['Gabriel', 'Lucas', 'Pedro', 'Rafael', 'Matheus', 'João', 'Bruno', 'Carlos', 'Felipe', 'Victor'];
          const sobrenomes = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Pereira', 'Ferreira', 'Rodrigues', 'Almeida', 'Gomes'];
          return `${nomes[Math.floor(Math.random() * nomes.length)]}${sobrenomes[Math.floor(Math.random() * sobrenomes.length)]}`;
        };
        
        // Gerar avatar aleatório para o oponente
        const randomAvatar = () => {
          const avatarId = Math.floor(Math.random() * 12) + 1;
          return `/images/avatars/avatar${avatarId}.png`;
        };
        
        // Simular informações do oponente
        const opponentInfo = {
          id: `opponent-${uuidv4().substring(0, 8)}`,
          name: randomOpponentName(),
          avatarUrl: randomAvatar()
        };
        
        // Criar times simulados
        const team1 = {
          id: 'team1',
          name: 'Time 1',
          players: [{
            id: userId,
            name: playerInfo.name,
            avatar: playerInfo.avatarUrl,
            isReady: true,
            isCaptain: true,
            team: 'team1'
          }]
        };
        
        const team2 = {
          id: 'team2',
          name: 'Time 2',
          players: [{
            id: opponentInfo.id,
            name: opponentInfo.name,
            avatar: opponentInfo.avatarUrl,
            isReady: true,
            isCaptain: true,
            team: 'team2'
          }]
        };
        
        // Criar a partida simulada
        const simulatedMatch = {
          id: matchId,
          title: `Partida ${mode.charAt(0).toUpperCase() + mode.slice(1)} #${Math.floor(10000 + Math.random() * 90000)}`,
          mode,
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
        
        console.log('✅ Partida simulada criada:', simulatedMatch);
        
        // Chamar o callback com a partida simulada
        onMatchFound(simulatedMatch);
        
      } else {
        // Simular erro (10% de chance)
        console.log('⚠️ Simulação: Erro ao encontrar partida');
        setStatus('error');
        setErrorMessage('Não foi possível encontrar uma partida adequada. Tente novamente mais tarde.');
      }
    }, 5000 + Math.random() * 10000); // Entre 5 e 15 segundos
    
    return () => {
      clearTimeout(matchFoundTimer);
    };
  }, [waitingId, userId, mode, onMatchFound]);

  // Função para cancelar a busca (simulada)
  const handleCancel = () => {
    console.log('🛑 Simulação: Busca por partida cancelada');
    onCancel();
  };

  // Formatar o tempo de espera
  const formatWaitingTime = () => {
    const minutes = Math.floor(waitingTime / 60);
    const seconds = waitingTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (status === 'error') {
    return (
      <div className="bg-red-100 text-red-800 p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-2">Erro ao buscar partida</h3>
        <p>{errorMessage || 'Ocorreu um erro ao procurar por uma partida.'}</p>
        <button
          onClick={() => router.push('/lobby')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg"
        >
          Voltar para o Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">Buscando partida {mode.toUpperCase()}</h3>
        <button
          onClick={handleCancel}
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700"
          aria-label="Cancelar busca"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-blue-900/30 flex items-center justify-center">
          {status === 'searching' ? (
            <Search size={32} className="text-blue-400 animate-pulse" />
          ) : (
            <Clock size={32} className="text-blue-400" />
          )}
        </div>
      </div>

      <div className="text-center mb-4">
        <p className="text-lg font-medium">
          {status === 'searching' && `Procurando jogadores${dots}`}
        </p>
        <p className="text-gray-400 mt-1">Tempo de espera: {formatWaitingTime()}</p>
      </div>

      <div className="flex justify-center space-x-4">
        <div className="flex items-center bg-gray-800 rounded-lg p-3">
          <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center mr-3">
            <User size={20} className="text-blue-400" />
          </div>
          <div>
            <p className="font-medium">Você</p>
            <p className="text-xs text-blue-400">Pronto</p>
          </div>
        </div>

        <div className="flex items-center bg-gray-800/50 rounded-lg p-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
            <User size={20} className="text-gray-600" />
          </div>
          <div>
            <p className="font-medium text-gray-400">Aguardando oponente</p>
            <p className="text-xs text-gray-500">...</p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Uma partida será criada quando encontrarmos um oponente adequado.</p>
        <p>Fique atento ao seu sininho de notificações!</p>
      </div>
    </div>
  );
};

export default MatchmakingStatus; 