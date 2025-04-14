'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Award } from 'react-feather';
import MatchDetails from '@/components/MatchDetails';

// Interface para uma partida
interface Match {
  id: number;
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

// Dados simulados - seriam substituídos por chamadas à API real
const getMatchData = (id: string): Match => {
  // Simulação de dados - em um cenário real, isso seria buscado de uma API
  const matches: Record<string, Match> = {
    '1': {
      id: 1,
      name: 'Partida 1',
      format: 'Squad (4x4)',
      entry: 3.00,
      prize: 6.00,
      status: 'em_espera',
      startTime: '2023-05-15T19:30:00',
      players: 12,
      maxPlayers: 16,
      roomId: 'RPX62336',
      roomPassword: 'pass505',
      configuredRoom: true
    },
    '2': {
      id: 2,
      name: 'Partida 2',
      format: 'Dupla (2x2)',
      entry: 5.00,
      prize: 20.00,
      status: 'em_breve',
      startTime: '2023-05-15T20:30:00',
      players: 6,
      maxPlayers: 10,
      configuredRoom: false
    },
    '3': {
      id: 3,
      name: 'Partida 3',
      format: 'Solo',
      entry: 2.50,
      prize: 10.00,
      status: 'em_andamento',
      startTime: '2023-05-15T18:00:00',
      players: 8,
      maxPlayers: 8,
      roomId: 'RPX75432',
      roomPassword: 'pass123',
      configuredRoom: true
    },
    '4': {
      id: 4,
      name: 'Partida 4',
      format: 'Squad (4x4)',
      entry: 3.00,
      prize: 6.00,
      status: 'em_espera',
      startTime: '2023-05-15T21:30:00',
      players: 8,
      maxPlayers: 16,
      roomId: 'RPX62336',
      roomPassword: 'pass505',
      configuredRoom: true
    }
  };

  return matches[id] || {
    id: parseInt(id),
    name: `Partida não encontrada`,
    format: '-',
    entry: 0,
    prize: 0,
    status: 'cancelada',
    startTime: new Date().toISOString(),
    players: 0,
    maxPlayers: 0,
    configuredRoom: false
  };
};

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isParticipating, setIsParticipating] = useState(false);

  useEffect(() => {
    // Simulando carregamento de dados da API
    const loadMatch = () => {
      setIsLoading(true);
      try {
        if (!params || !params.id) {
          router.push('/partidas');
          return;
        }
        
        const id = Array.isArray(params.id) ? params.id[0] : params.id;
        const matchData = getMatchData(id);
        setMatch(matchData);
        
        // Simulação - verificar se o usuário está participando
        // Em um app real, isso viria de um estado global ou API
        setIsParticipating(Math.random() > 0.5);
      } catch (error) {
        console.error('Erro ao carregar partida:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMatch();
  }, [params, router]);

  const handleJoinMatch = () => {
    if (!match) return;
    
    // Simulação - em um app real, isso seria uma API call
    alert(`Você entrou na partida: ${match.name}`);
    setIsParticipating(true);
  };

  const handleLeaveMatch = () => {
    if (!match) return;
    
    // Simulação - em um app real, isso seria uma API call
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
              <p>
                <strong>Itens proibidos:</strong> Nenhum
              </p>
            </div>
          </div>

          {/* Jogadores inscritos */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Users size={18} className="mr-2" />
                Jogadores Inscritos
              </h3>
            </div>
            <div className="px-4 py-5 sm:px-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-500">
                  {match.players} de {match.maxPlayers} jogadores
                </span>
                <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  {Math.round((match.players / match.maxPlayers) * 100)}% cheio
                </span>
              </div>
              
              {/* Barra de progresso */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full" 
                  style={{ width: `${(match.players / match.maxPlayers) * 100}%` }}
                ></div>
              </div>
              
              {/* Lista de jogadores (simulada) */}
              {match.players > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {Array.from({ length: Math.min(5, match.players) }).map((_, i) => (
                    <li key={i} className="py-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 mr-3">
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">Jogador {i+1}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {i === 0 ? "Líder" : "Membro"}
                      </span>
                    </li>
                  ))}
                  
                  {match.players > 5 && (
                    <li className="py-3 text-center text-sm text-gray-500">
                      + {match.players - 5} outros jogadores
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-center text-sm text-gray-500 py-4">
                  Nenhum jogador inscrito ainda.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 