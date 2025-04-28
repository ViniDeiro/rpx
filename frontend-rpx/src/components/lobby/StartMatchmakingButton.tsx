'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Search } from 'react-feather';
import { v4 as uuidv4 } from 'uuid';

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
      
      // Simular uma pequena espera
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simulação bem sucedida
      console.log('🎮 Simulação: Busca por partida iniciada para lobby:', lobbyId);
      
      // Gerar um ID de espera simulado
      const waitingId = `waiting-${Date.now()}-${uuidv4().substring(0, 8)}`;
      console.log('✅ ID de espera simulado gerado:', waitingId);
      
      toast.success('Busca por partida iniciada! Aguarde enquanto procuramos adversários.');
      
      // Atualizar a interface
      router.refresh();
      
    } catch (error: any) {
      console.error('Erro simulado ao iniciar matchmaking:', error);
      toast.error('Falha ao iniciar busca por partida');
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