'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Search } from 'react-feather';

interface StartMatchmakingButtonProps {
  lobbyId: string;
  isOwner: boolean;
  isMatchmaking: boolean;
}

const StartMatchmakingButton: React.FC<StartMatchmakingButtonProps> = ({
  lobbyId,
  isOwner,
  isMatchmaking
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStartMatchmaking = async () => {
    if (!isOwner) {
      toast.error('Apenas o capitão pode iniciar a busca por partida');
      return;
    }

    if (isMatchmaking) {
      toast.error('O lobby já está procurando uma partida');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/lobby/matchmaking', {
        lobbyId
      });

      if (response.data.status === 'success') {
        toast.success('Busca por partida iniciada! Aguarde enquanto procuramos adversários.');
        // Atualizar a interface ou redirecionar
        router.refresh();
      } else {
        toast.error(response.data.error || 'Erro ao iniciar busca por partida');
      }
    } catch (error: any) {
      console.error('Erro ao iniciar matchmaking:', error);
      toast.error(error.response?.data?.error || 'Falha ao iniciar busca por partida');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartMatchmaking}
      disabled={loading || isMatchmaking || !isOwner}
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-white ${
        isOwner
          ? isMatchmaking
            ? 'bg-amber-600 cursor-not-allowed'
            : loading
              ? 'bg-blue-700 cursor-wait'
              : 'bg-blue-600 hover:bg-blue-700'
          : 'bg-gray-600 cursor-not-allowed'
      }`}
    >
      {loading ? (
        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
      ) : (
        <Search size={20} />
      )}
      {isMatchmaking
        ? 'Procurando partida...'
        : loading
          ? 'Iniciando busca...'
          : 'Buscar partida'}
    </button>
  );
};

export default StartMatchmakingButton; 