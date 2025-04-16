import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api from '@/services/api';

interface GameBoardProps {
  matchId: string;
}

export default function GameBoard({ matchId }: GameBoardProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState(null);

  useEffect(() => {
    // Carregar dados do jogo quando o componente for montado
    const fetchGameData = async () => {
      if (!session?.user?.id) return;
      
      try {
        setLoading(true);
        const response = await api.get(`/api/games/${matchId}`);
        
        if (response.data.game) {
          setGameData(response.data.game);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do jogo:', error);
        toast.error('Não foi possível carregar o jogo');
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
    
    // Configurar atualização periódica dos dados do jogo
    const interval = setInterval(fetchGameData, 5000);
    return () => clearInterval(interval);
  }, [matchId, session?.user?.id]);

  if (loading) {
    return (
      <div className="min-h-[600px] flex justify-center items-center">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Partida RPX</h1>
      <div className="min-h-[600px] flex justify-center items-center">
        <p className="text-center text-gray-400">
          O jogo está sendo implementado. Em breve esta funcionalidade estará disponível!
        </p>
      </div>
    </div>
  );
} 