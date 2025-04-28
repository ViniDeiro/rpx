'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MatchLobbyModal from '../match/MatchLobbyModal';
import { v4 as uuidv4 } from 'uuid';

interface MatchmakingListenerProps {
  userId: string;
  isActive?: boolean;
}

export default function MatchmakingListener({ userId, isActive = false }: MatchmakingListenerProps) {
  const [matchFound, setMatchFound] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const router = useRouter();

  // Simular o encontro de partidas aleatoriamente
  useEffect(() => {
    if (!userId || !isActive) return;

    console.log('🎮 Sistema de matchmaking simulado iniciado');

    // Chance aleatória de encontrar uma partida a cada 7-15 segundos
    const randomInterval = Math.floor(Math.random() * (15000 - 7000)) + 7000;
    
    const timer = setTimeout(() => {
      // 70% de chance de encontrar uma partida
      const foundMatch = Math.random() < 0.7;
      
      if (foundMatch) {
        console.log('🎉 Partida simulada encontrada!');
        
        const simulatedMatchId = `match-${Date.now()}-${uuidv4().substring(0, 8)}`;
        setMatchId(simulatedMatchId);
        setMatchFound(true);
      }
    }, randomInterval);
    
    return () => {
      clearTimeout(timer);
    };
  }, [userId, isActive]);

  const handleCloseModal = () => {
    setMatchFound(false);
    setMatchId(null);
    
    if (!isActive) return;
    
    // Após fechar o modal, simular outra partida em 10-20 segundos
    setTimeout(() => {
      if (Math.random() < 0.7) {
        console.log('🎮 Simulando nova partida após fechamento do modal');
        const simulatedMatchId = `match-${Date.now()}-${uuidv4().substring(0, 8)}`;
        setMatchId(simulatedMatchId);
        setMatchFound(true);
      }
    }, Math.floor(Math.random() * (20000 - 10000)) + 10000);
  };

  return (
    <>
      {matchFound && matchId && (
        <MatchLobbyModal
          matchId={matchId}
          isOpen={matchFound}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
} 