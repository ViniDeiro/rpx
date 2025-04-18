import React, { useState, useEffect } from 'react';
import { User, Clock, Search, X } from 'react-feather';
import { useRouter } from 'next/navigation';

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

  // Efeito para fazer polling do status do matchmaking
  useEffect(() => {
    if (!waitingId || !userId) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/matchmaking/status?waitingId=${waitingId}`);
        
        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = await response.json();
        
        if (data.matchFound) {
          // Partida encontrada
          setStatus('found');
          console.log('Partida encontrada:', data.match);
          onMatchFound(data.match);
        } else {
          // Ainda procurando
          setStatus('searching');
          console.log('Ainda buscando partida. Tempo de espera:', data.waitingTime || waitingTime);
        }
      } catch (error) {
        console.error('Erro ao verificar status do matchmaking:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Erro ao verificar status');
      }
    };

    // Verificar imediatamente
    checkStatus();

    // Configurar polling a cada 5 segundos
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [waitingId, userId, onMatchFound]);

  // Função para cancelar a busca
  const handleCancel = async () => {
    try {
      const response = await fetch(`/api/matchmaking/cancel?waitingId=${waitingId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        console.error('Erro ao cancelar matchmaking:', await response.text());
      }

      onCancel();
    } catch (error) {
      console.error('Erro ao cancelar matchmaking:', error);
      onCancel(); // Mesmo com erro, cancelar localmente
    }
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