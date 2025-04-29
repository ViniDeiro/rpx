'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import MatchRoomCard from '@/components/match/MatchRoomCard';
import axios from 'axios';

export default function MatchPage({ params }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [error, setError] = useState('');

  // Função para buscar os dados da partida
  const fetchMatchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/matches/${params.id}`);
      setMatch(response.data);
      setError('');
      
      // Se todos os jogadores já confirmaram e o status é ready, redirecionar para a página do jogo
      if (response.data.status === 'started') {
        router.push(`/game/${params.id}`);
        return;
      }
    } catch (err) {
      console.error('Erro ao buscar dados da partida:', err);
      setError(err.response?.data?.message || 'Não foi possível carregar os dados da partida');
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Não foi possível carregar os dados da partida',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para confirmar entrada na partida
  const handleConfirmEntry = async () => {
    try {
      setLoading(true);
      await axios.post(`/api/matches/${params.id}/confirm`);
      toast({
        title: 'Entrada confirmada',
        description: 'Sua participação na partida foi confirmada!',
        variant: 'default',
      });
      await fetchMatchData();
    } catch (err) {
      console.error('Erro ao confirmar entrada:', err);
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Não foi possível confirmar sua entrada',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Polling para atualizar os dados da partida periodicamente
  useEffect(() => {
    fetchMatchData();
    
    const interval = setInterval(() => {
      fetchMatchData();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [params.id]);

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Erro ao carregar partida</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-primary rounded-lg hover:bg-primary-dark transition-colors"
          >
            Voltar para o Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Sala de Espera</h1>
        
        {loading && !match ? (
          <div className="flex justify-center items-center h-60">
            <LoadingSpinner size={40} />
          </div>
        ) : (
          <MatchRoomCard 
            match={match} 
            onConfirmEntry={handleConfirmEntry} 
          />
        )}
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Voltar para o Dashboard
          </button>
        </div>
      </div>
    </div>
  );
} 