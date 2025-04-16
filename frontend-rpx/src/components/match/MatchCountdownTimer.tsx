'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'react-feather';

interface MatchCountdownTimerProps {
  createdAt: string | null;
  duration?: number; // duração em minutos
  onTimeEnd?: () => void;
}

const MatchCountdownTimer: React.FC<MatchCountdownTimerProps> = ({
  createdAt,
  duration = 5,
  onTimeEnd
}) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  useEffect(() => {
    if (!createdAt) return;
    
    // Converter para timestamp
    const roomCreatedTime = new Date(createdAt).getTime();
    const endTime = roomCreatedTime + (duration * 60 * 1000); // Duração em ms
    
    // Inicializar o tempo restante
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = endTime - now;
      
      if (difference <= 0) {
        setTimeLeft(0);
        if (onTimeEnd) onTimeEnd();
        return null; // Parar o intervalo
      }
      
      setTimeLeft(Math.floor(difference / 1000)); // Tempo em segundos
      return true; // Continuar o intervalo
    };
    
    // Calcular inicialmente
    const shouldContinue = calculateTimeLeft();
    if (!shouldContinue) return;
    
    // Atualizar a cada segundo
    const timer = setInterval(() => {
      const shouldContinue = calculateTimeLeft();
      if (!shouldContinue) clearInterval(timer);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [createdAt, duration, onTimeEnd]);
  
  // Formatar o tempo restante
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Se não houver hora de criação ou o tempo acabou
  if (!createdAt || timeLeft === 0) {
    return null;
  }
  
  // Se estiver carregando
  if (timeLeft === null) {
    return (
      <div className="flex items-center justify-center py-2 px-4 bg-slate-800 rounded-lg">
        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
        <span className="text-sm">Carregando...</span>
      </div>
    );
  }
  
  // Definir classes baseadas no tempo restante
  const getTimerClasses = () => {
    if (timeLeft <= 30) {
      return 'bg-red-900/70 text-red-100'; // Vermelho nos últimos 30 segundos
    }
    if (timeLeft <= 60) {
      return 'bg-amber-900/70 text-amber-100'; // Amarelo no último minuto
    }
    return 'bg-blue-900/70 text-blue-100'; // Azul para o resto do tempo
  };
  
  return (
    <div className={`flex items-center justify-center py-2 px-4 rounded-lg font-medium ${getTimerClasses()}`}>
      <Clock size={18} className="mr-2" />
      <div>
        <span className="mr-2">Tempo para entrar na sala:</span>
        <span className="font-mono">{formatTime(timeLeft)}</span>
      </div>
    </div>
  );
};

export default MatchCountdownTimer; 