'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Award } from 'react-feather';
import MatchDetails from '@/components/MatchDetails';

// Interface para uma partida
interface Match {
  id: string;
  name: string;
  format: string;
  entry: number;
  prize: number;
  status: string;
  startTime: string;
  players: number;
  maxPlayers: number;
  roomId?: string;
  roomPassword?: string;
  configuredRoom?: boolean;
}

// Função para simular dados de partida para qualquer ID
const simulateMatchData = (id: string): Match => {
  // Gerar dados simulados com base no ID
  const matchNumber = id.split('-').pop()?.substring(0, 5) || Math.floor(Math.random() * 90000 + 10000).toString();
  const formats = ['Solo', 'Dupla (2x2)', 'Squad (4x4)'];
  const format = formats[Math.floor(Math.random() * formats.length)];
  const entry = Math.floor(Math.random() * 10) + 1;
  const prize = entry * 2;
  const statusOptions = ['em_espera', 'em_andamento', 'em_breve', 'finalizada'];
  const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
  
  // Data aleatória nas últimas 24 horas
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - Math.floor(Math.random() * 24));
  
  const maxPlayers = format === 'Solo' ? 10 : (format === 'Dupla (2x2)' ? 20 : 40);
  const players = Math.floor(Math.random() * maxPlayers) + 1;
  
  return {
    id: id,
    name: `Partida #${matchNumber}`,
    format: format,
    entry: entry,
    prize: prize,
    status: status,
    startTime: startTime.toISOString(),
    players: players,
    maxPlayers: maxPlayers,
    roomId: `RPX${Math.floor(Math.random() * 90000) + 10000}`,
    roomPassword: `pass${Math.floor(Math.random() * 900) + 100}`,
    configuredRoom: Math.random() > 0.3
  };
};

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isParticipating, setIsParticipating] = useState(false);

  useEffect(() => {
    // Simular um carregamento
    const loadingTimer = setTimeout(() => {
      try {
        if (!params || !params.id) {
          router.push('/partidas');
          return;
        }
        
        const id = Array.isArray(params.id) ? params.id[0] : params.id;
        console.log(`🎮 Simulando dados para partida com ID: ${id}`);
        
        // Gerar dados simulados para esta partida
        const matchData = simulateMatchData(id);
        setMatch(matchData);
        
        // Simulação - o usuário tem 50% de chance de já estar participando
        setIsParticipating(Math.random() > 0.5);
        
        console.log('✅ Dados simulados gerados com sucesso:', matchData);
      } catch (error) {
        console.error('❌ Erro ao simular partida:', error);
      } finally {
        setIsLoading(false);
      }
    }, 800); // Simular tempo de carregamento de 800ms
    
    return () => {
      clearTimeout(loadingTimer);
    };
  }, [params, router]);

  const handleJoinMatch = () => {
    if (!match) return;
    
    // Simulação - resposta instantânea
    alert(`Você entrou na partida: ${match.name}`);
    setIsParticipating(true);
  };

  const handleLeaveMatch = () => {
    if (!match) return;
    
    // Simulação - resposta instantânea
    alert(`Você saiu da partida: ${match.name}`);
    setIsParticipating(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-800 border-r-transparent"></div>
          <p className="mt-4 text-lg text-gray-800">Carregando detalhes da partida...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-5xl mx-auto p-4 min-h-screen">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Partida não encontrada</h2>
          <p className="text-gray-600 mb-6">A partida que você está procurando não existe ou foi removida.</p>
          <Link 
            href="/partidas" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
          >
            <ArrowLeft size={16} className="mr-2" />
            Voltar para lista de partidas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="mb-6">
        <Link
          href="/partidas"
          className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800"
        >
          <ArrowLeft size={16} className="mr-1" />
          Voltar para lista de partidas
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal - Detalhes da partida */}
        <div className="lg:col-span-2">
          <MatchDetails match={match} />
          
          {/* Ações da partida */}
          <div className="mt-6">
            {match.status === 'em_espera' || match.status === 'em_breve' ? (
              isParticipating ? (
                <button
                  onClick={handleLeaveMatch}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow"
                >
                  Sair da Partida
                </button>
              ) : (
                <button
                  onClick={handleJoinMatch}
                  className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow"
                >
                  Participar da Partida • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(match.entry)}
                </button>
              )
            ) : match.status === 'em_andamento' ? (
              <div className="bg-blue-100 text-blue-800 p-4 rounded-lg border border-blue-200 text-center">
                Esta partida já está em andamento.
              </div>
            ) : (
              <div className="bg-gray-100 text-gray-800 p-4 rounded-lg border border-gray-200 text-center">
                Esta partida não está mais disponível para inscrições.
              </div>
            )}
          </div>
        </div>

        {/* Coluna lateral - Informações complementares */}
        <div className="lg:col-span-1">
          {/* Regras da partida */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Award size={18} className="mr-2" />
                Regras da Partida
              </h3>
            </div>
            <div className="px-4 py-5 sm:px-6 space-y-4 text-sm text-gray-700">
              <p>
                <strong>Formato:</strong> {match.format}
              </p>
              <p>
                <strong>Mapa:</strong> Bermuda
              </p>
              <p>
                <strong>Pontuação:</strong>
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>Eliminação: 1 ponto por kill</li>
                <li>1º Lugar: 12 pontos</li>
                <li>2º Lugar: 8 pontos</li>
                <li>3º Lugar: 6 pontos</li>
              </ul>
            </div>
          </div>

          {/* Participantes */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Users size={18} className="mr-2" />
                Participantes ({match.players}/{match.maxPlayers})
              </h3>
            </div>
            <div className="px-4 py-5 sm:px-6">
              <div className="space-y-2">
                {Array.from({ length: match.players }).map((_, index) => (
                  <div key={index} className="flex items-center p-2 bg-gray-50 rounded hover:bg-gray-100">
                    <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                    <span className="text-sm font-medium">
                      {index === 0 && isParticipating ? 'Você' : `Jogador ${index + 1}`}
                    </span>
                  </div>
                ))}
                
                {match.players < match.maxPlayers && (
                  <div className="text-center py-2 text-sm text-gray-500">
                    Aguardando mais jogadores...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informações e status da partida */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Informações da Sala</h3>
        
        {match.status === 'em_espera' || match.status === 'em_andamento' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded bg-white p-3">
                <p className="text-sm text-gray-500 mb-1">ID da Sala:</p>
                <p className="font-mono text-lg font-medium">{match.roomId}</p>
              </div>
              <div className="border border-gray-200 rounded bg-white p-3">
                <p className="text-sm text-gray-500 mb-1">Senha:</p>
                <p className="font-mono text-lg font-medium">{match.roomPassword}</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                Lembre-se de entrar na sala 5 minutos antes do início da partida.
                Verifique se suas configurações estão de acordo com as regras especificadas.
              </p>
            </div>
          </div>
        ) : match.status === 'em_breve' ? (
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              As informações da sala de jogo serão disponibilizadas 15 minutos antes do início da partida.
            </p>
          </div>
        ) : (
          <div className="bg-gray-100 border border-gray-200 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              Esta partida está finalizada. Confira os resultados na aba de classificação.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 