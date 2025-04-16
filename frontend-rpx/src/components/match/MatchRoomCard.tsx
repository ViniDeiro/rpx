'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { User, Clock, CheckCircle, X } from 'react-feather';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface PlayerInfo {
  _id: string;
  username: string;
  avatarUrl: string | null;
}

interface MatchProps {
  _id: string;
  title: string;
  gameType: string;
  maxPlayers: number;
  status: string;
  players: string[];
  playersInfo: PlayerInfo[];
  confirmedPlayers: string[];
  createdAt: string;
  playerConfirmed: boolean;
}

interface MatchRoomCardProps {
  match: MatchProps;
  onConfirmEntry: () => void;
}

export default function MatchRoomCard({ match, onConfirmEntry }: MatchRoomCardProps) {
  const [timeLeft, setTimeLeft] = useState('2:00');
  const [expired, setExpired] = useState(false);
  const [confirmed, setConfirmed] = useState(match.playerConfirmed);
  const [copied, setCopied] = useState<string | null>(null);
  
  useEffect(() => {
    // Atualizar timer a cada segundo
    const interval = setInterval(() => {
      const remaining = getTimeRemaining();
      setTimeLeft(remaining);
      
      // Verificar se o tempo expirou
      if (remaining === '0:00') {
        setExpired(true);
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [match.createdAt]);
  
  // Atualizar estado quando a propriedade externa mudar
  useEffect(() => {
    setConfirmed(match.playerConfirmed);
  }, [match.playerConfirmed]);

  if (!match) {
    return (
      <div className="bg-card rounded-lg p-6 shadow-lg">
        <div className="flex justify-center items-center h-40">
          <LoadingSpinner size={40} />
        </div>
      </div>
    );
  }

  const allConfirmed = match.confirmedPlayers.length === match.players.length;
  const waitingConfirmation = !confirmed && !allConfirmed && !expired;
  
  // Calcular tempo restante para início da partida (2 minutos de espera)
  function getTimeRemaining() {
    if (!match.createdAt) return '2:00';
    
    const createdTime = new Date(match.createdAt).getTime();
    const currentTime = new Date().getTime();
    const elapsedSeconds = Math.floor((currentTime - createdTime) / 1000);
    const remainingSeconds = Math.max(0, 120 - elapsedSeconds);
    
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // Copiar ID da sala
  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(match._id).then(() => {
      setCopied('roomId');
      setTimeout(() => setCopied(null), 2000);
    });
  };
  
  // Confirmar entrada na sala
  const handleConfirm = () => {
    if (expired) {
      toast.error('O tempo expirou. A partida será cancelada.');
      return;
    }
    
    setConfirmed(true);
    onConfirmEntry();
  };

  return (
    <div className="bg-card rounded-lg p-6 shadow-lg">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">{match.title || 'Partida RPX'}</h2>
        <div className="flex items-center text-sm text-yellow-400">
          <Clock size={16} className="mr-1" />
          <span>{timeLeft}</span>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-1">
          Tipo de jogo: <span className="text-white">{match.gameType || 'Padrão'}</span>
        </div>
        <div className="text-sm text-gray-400 mb-1">
          Status: <span className={`${match.status === 'waiting' ? 'text-yellow-400' : 'text-green-400'}`}>
            {match.status === 'waiting' ? 'Aguardando jogadores' : 'Pronto para iniciar'}
          </span>
        </div>
        <div 
          className="text-sm text-blue-400 cursor-pointer hover:underline mt-1 flex items-center"
          onClick={handleCopyRoomId}
        >
          ID da sala: 
          <span className="ml-1 font-mono bg-card-active rounded px-1 text-xs">{match._id.substring(0, 8)}...</span>
          {copied === 'roomId' && <span className="ml-2 text-green-400 text-xs">Copiado!</span>}
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-md font-semibold mb-2">Jogadores ({match.playersInfo.length}/{match.maxPlayers})</h3>
        <div className="space-y-2">
          {match.playersInfo.map((player) => (
            <div key={player._id} className="flex items-center justify-between bg-card-active rounded-md p-2">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 mr-2">
                  {player.avatarUrl ? (
                    <Image
                      src={player.avatarUrl}
                      alt={player.username}
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={16} />
                    </div>
                  )}
                </div>
                <span>{player.username}</span>
              </div>
              <div>
                {match.confirmedPlayers.includes(player._id) ? (
                  <CheckCircle size={18} className="text-green-400" />
                ) : (
                  <X size={18} className="text-gray-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4">
        {waitingConfirmation ? (
          <button
            onClick={handleConfirm}
            className="w-full py-3 bg-primary rounded-md font-medium hover:bg-primary-dark transition-colors"
          >
            Confirmar Entrada
          </button>
        ) : confirmed ? (
          <div className="text-center text-green-400 py-2">
            <CheckCircle className="inline-block mr-2" size={18} />
            Entrada confirmada! Aguardando outros jogadores...
          </div>
        ) : (
          <div className="text-center text-yellow-400 py-2">
            Tempo esgotado para confirmação
          </div>
        )}
      </div>
    </div>
  );
} 