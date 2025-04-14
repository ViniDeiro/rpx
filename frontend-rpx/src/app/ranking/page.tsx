'use client';

import { useState, useEffect } from 'react';
import { Search, TrendingUp, Target, Filter, Users, ChevronUp, ChevronDown, Star, Award, Activity, DollarSign } from 'react-feather';
import Link from 'next/link';
import Image from 'next/image';

interface Player {
  id: number;
  username: string;
  winRate: number;
  totalMatches: number;
  victories: number;
  earnings: number;
  rank: string;
  avatar?: string;
  streak?: number;
  lastMatches?: ('win' | 'loss' | 'draw')[];
  rankingChange?: number;
}

// Logo simplificado
const RpxLogo = () => {
  return (
    <div className="bg-purple-700 text-white font-bold text-xl px-3 py-1.5 rounded">
      RPX
    </div>
  );
};

// Componente Trophy personalizado para o ícone de troféu
const Trophy = ({ size = 24, className }: { size?: number, className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

// Componente Crown (coroa) para o primeiro lugar
const Crown = ({ size = 24, className }: { size?: number, className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path>
  </svg>
);

export default function RankingPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('winrate');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);
  const [timeFrame, setTimeFrame] = useState<'all' | 'month' | 'week'>('all');
  const [selectedGameType, setSelectedGameType] = useState<'all' | 'solo' | 'duo' | 'squad'>('all');

  // Dados de exemplo para jogadores
  const playersData: Player[] = [
    {
      id: 1,
      username: 'ProKiller99',
      winRate: 78,
      totalMatches: 456,
      victories: 356,
      earnings: 12500,
      rank: 'Mestre',
      streak: 8,
      lastMatches: ['win', 'win', 'win', 'win', 'loss', 'win', 'win', 'win'],
      rankingChange: 0
    },
    {
      id: 2,
      username: 'FireStorm',
      winRate: 72,
      totalMatches: 390,
      victories: 281,
      earnings: 8700,
      rank: 'Diamante',
      streak: 3,
      lastMatches: ['win', 'win', 'win', 'loss', 'loss', 'win', 'loss', 'win'],
      rankingChange: 2
    },
    {
      id: 3,
      username: 'SniperElite',
      winRate: 68,
      totalMatches: 520,
      victories: 354,
      earnings: 9800,
      rank: 'Mestre',
      streak: 0,
      lastMatches: ['loss', 'win', 'loss', 'win', 'win', 'win', 'loss', 'win'],
      rankingChange: -1
    },
    {
      id: 4,
      username: 'NinjaFF',
      winRate: 65,
      totalMatches: 380,
      victories: 247,
      earnings: 7200,
      rank: 'Diamante',
      streak: 2,
      lastMatches: ['win', 'win', 'loss', 'win', 'loss', 'loss', 'win', 'win'],
      rankingChange: 1
    },
    {
      id: 5,
      username: 'HeadshotKing',
      winRate: 62,
      totalMatches: 410,
      victories: 254,
      earnings: 6500,
      rank: 'Diamante',
      streak: 1,
      lastMatches: ['win', 'loss', 'loss', 'win', 'loss', 'win', 'win', 'loss'],
      rankingChange: -2
    },
    {
      id: 6,
      username: 'LegendaryShooter',
      winRate: 58,
      totalMatches: 480,
      victories: 278,
      earnings: 5900,
      rank: 'Ouro',
      streak: 0,
      lastMatches: ['loss', 'loss', 'win', 'win', 'loss', 'win', 'loss', 'win'],
      rankingChange: 0
    },
    {
      id: 7,
      username: 'GhostWarrior',
      winRate: 55,
      totalMatches: 320,
      victories: 176,
      earnings: 4700,
      rank: 'Prata',
      streak: 0,
      lastMatches: ['loss', 'win', 'loss', 'win', 'loss', 'win', 'loss', 'win'],
      rankingChange: 3
    },
    {
      id: 8,
      username: 'RapidFire',
      winRate: 52,
      totalMatches: 300,
      victories: 156,
      earnings: 3800,
      rank: 'Prata',
      streak: 1,
      lastMatches: ['win', 'loss', 'win', 'loss', 'win', 'loss', 'win', 'loss'],
      rankingChange: 0
    },
    {
      id: 9,
      username: 'ShadowHunter',
      winRate: 49,
      totalMatches: 280,
      victories: 137,
      earnings: 3200,
      rank: 'Bronze',
      streak: 0,
      lastMatches: ['loss', 'win', 'loss', 'win', 'loss', 'win', 'loss', 'loss'],
      rankingChange: -1
    },
    {
      id: 10,
      username: 'EagleEye',
      winRate: 45,
      totalMatches: 260,
      victories: 117,
      earnings: 2800,
      rank: 'Bronze',
      streak: 2,
      lastMatches: ['win', 'win', 'loss', 'loss', 'loss', 'win', 'loss', 'loss'],
      rankingChange: 5
    }
  ];

  useEffect(() => {
    // Simulando requisição à API
    const fetchPlayers = async () => {
      try {
        setIsLoading(true);
        // Em produção, descomentar a linha abaixo e remover a simulação
        // const response = await fetch('/api/rankings');
        // const data = await response.json();
        // setPlayers(data);
        
        // Simulando delay da API
        setTimeout(() => {
          setPlayers(playersData);
          sortPlayers(playersData, selectedCategory);
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Erro ao carregar ranking:', err);
        setError('Não foi possível carregar o ranking. Tente novamente mais tarde.');
        setIsLoading(false);
      }
    };

    fetchPlayers();
  }, [timeFrame, selectedGameType]);

  // Ordenar jogadores
  const sortPlayers = (data: Player[], category: string) => {
    let sorted;
    switch (category) {
      case 'winrate':
        sorted = [...data].sort((a, b) => b.winRate - a.winRate);
        break;
      case 'earnings':
        sorted = [...data].sort((a, b) => b.earnings - a.earnings);
        break;
      case 'victories':
        sorted = [...data].sort((a, b) => b.victories - a.victories);
        break;
      case 'matches':
        sorted = [...data].sort((a, b) => b.totalMatches - a.totalMatches);
        break;
      default:
        sorted = [...data].sort((a, b) => b.winRate - a.winRate);
    }
    setFilteredPlayers(sorted);
  };

  // Filtrar jogadores
  useEffect(() => {
    let filtered = [...players];

    if (searchQuery) {
      filtered = filtered.filter(player => 
        player.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    sortPlayers(filtered, selectedCategory);
  }, [players, searchQuery, selectedCategory]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const togglePlayerDetails = (playerId: number) => {
    if (expandedPlayer === playerId) {
      setExpandedPlayer(null);
    } else {
      setExpandedPlayer(playerId);
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Mestre': return 'text-purple-400';
      case 'Diamante': return 'text-blue-400';
      case 'Ouro': return 'text-yellow-400';
      case 'Prata': return 'text-slate-400';
      case 'Bronze': return 'text-amber-600';
      default: return 'text-slate-300';
    }
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return 'bg-green-500';
    if (winRate >= 60) return 'bg-green-400';
    if (winRate >= 50) return 'bg-blue-500';
    if (winRate >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPositionIcon = (position: number) => {
    if (position === 1) return <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center"><Trophy size={14} /></div>;
    if (position === 2) return <div className="w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center"><Trophy size={14} /></div>;
    if (position === 3) return <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center"><Trophy size={14} /></div>;
    return <div className="w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center text-xs font-bold">{position}</div>;
  };

  const getTimeFrameLabel = () => {
    switch (timeFrame) {
      case 'all': return 'Geral';
      case 'month': return 'Este mês';
      case 'week': return 'Esta semana';
      default: return 'Geral';
    }
  };

  const getGameTypeLabel = () => {
    switch (selectedGameType) {
      case 'all': return 'Todos os modos';
      case 'solo': return 'Solo';
      case 'duo': return 'Duplas';
      case 'squad': return 'Esquadrão';
      default: return 'Todos os modos';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center mb-4 md:mb-0">
            <RpxLogo />
            <h1 className="text-3xl font-bold ml-3">Ranking de Jogadores</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <select
                className="appearance-none bg-gray-800 border border-gray-700 rounded-lg py-2 pl-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value as 'all' | 'month' | 'week')}
              >
                <option value="all">Geral</option>
                <option value="month">Este mês</option>
                <option value="week">Esta semana</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
            
            <div className="relative">
              <select
                className="appearance-none bg-gray-800 border border-gray-700 rounded-lg py-2 pl-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={selectedGameType}
                onChange={(e) => setSelectedGameType(e.target.value as 'all' | 'solo' | 'duo' | 'squad')}
              >
                <option value="all">Todos os modos</option>
                <option value="solo">Solo</option>
                <option value="duo">Duplas</option>
                <option value="squad">Esquadrão</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>
        
        {/* Barra de busca e filtros */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar jogador por nome..."
                className="pl-10 pr-4 py-2 w-full bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedCategory('winrate')}
                className={`px-3 py-2 rounded-lg flex items-center ${
                  selectedCategory === 'winrate' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <TrendingUp size={16} className="mr-2" />
                <span>Taxa de Vitória</span>
              </button>
              
              <button
                onClick={() => setSelectedCategory('earnings')}
                className={`px-3 py-2 rounded-lg flex items-center ${
                  selectedCategory === 'earnings' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <DollarSign size={16} className="mr-2" />
                <span>Ganhos</span>
              </button>
              
              <button
                onClick={() => setSelectedCategory('victories')}
                className={`px-3 py-2 rounded-lg hidden sm:flex items-center ${
                  selectedCategory === 'victories' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <svg 
                  width={16} 
                  height={16} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="mr-2"
                >
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
                <span>Vitórias</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Título da seção */}
        <div className="flex items-center mb-4">
          <Award className="text-purple-500 mr-2" size={24} />
          <h2 className="text-xl font-bold">
            Top Jogadores - {getTimeFrameLabel()} - {getGameTypeLabel()}
          </h2>
        </div>
        
        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 text-red-300 hover:text-red-100 underline"
            >
              Tentar novamente
            </button>
          </div>
        )}
        
        {/* Loading spinner */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Pods para os 3 primeiros */}
            {filteredPlayers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Segundo lugar */}
                {filteredPlayers.length > 1 && (
                  <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 md:order-1">
                    <div className="bg-gradient-to-r from-gray-700 to-gray-600 p-3 text-center">
                      <div className="w-12 h-12 bg-slate-300 rounded-full text-gray-800 flex items-center justify-center mx-auto mb-2">
                        <Trophy size={24} />
                      </div>
                      <div className="text-lg font-bold">2º Lugar</div>
                    </div>
                    <div className="p-4 text-center">
                      <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-2 flex items-center justify-center overflow-hidden">
                        {filteredPlayers[1].avatar ? (
                          <img 
                            src={filteredPlayers[1].avatar} 
                            alt={filteredPlayers[1].username} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="text-2xl font-bold text-gray-400">
                            {filteredPlayers[1].username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="font-bold text-lg">{filteredPlayers[1].username}</div>
                      <div className={`text-sm ${getRankColor(filteredPlayers[1].rank)}`}>{filteredPlayers[1].rank}</div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-gray-700 p-2 rounded">
                          <div className="text-gray-400">Taxa de Vitória</div>
                          <div className="font-bold">{filteredPlayers[1].winRate}%</div>
                        </div>
                        <div className="bg-gray-700 p-2 rounded">
                          <div className="text-gray-400">Vitórias</div>
                          <div className="font-bold">{filteredPlayers[1].victories}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Primeiro lugar */}
                {filteredPlayers.length > 0 && (
                  <div className="bg-gray-800 rounded-lg overflow-hidden border border-yellow-500/30 shadow-lg shadow-yellow-500/10 md:order-2 transform md:scale-105">
                    <div className="bg-gradient-to-r from-yellow-600 to-amber-600 p-3 text-center">
                      <div className="w-14 h-14 bg-yellow-500 rounded-full text-yellow-900 flex items-center justify-center mx-auto mb-2">
                        <Trophy size={28} />
                      </div>
                      <div className="text-xl font-bold">1º Lugar</div>
                    </div>
                    <div className="p-4 text-center">
                      <div className="relative w-20 h-20 bg-gray-700 rounded-full mx-auto mb-2 flex items-center justify-center overflow-hidden">
                        {filteredPlayers[0].avatar ? (
                          <img 
                            src={filteredPlayers[0].avatar} 
                            alt={filteredPlayers[0].username} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="text-3xl font-bold text-gray-400">
                            {filteredPlayers[0].username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-yellow-900 rounded-full w-8 h-8 flex items-center justify-center">
                          <Crown size={16} />
                        </div>
                      </div>
                      <div className="font-bold text-xl">{filteredPlayers[0].username}</div>
                      <div className={`text-sm ${getRankColor(filteredPlayers[0].rank)}`}>{filteredPlayers[0].rank}</div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-gray-700 p-2 rounded">
                          <div className="text-gray-400">Taxa de Vitória</div>
                          <div className="font-bold">{filteredPlayers[0].winRate}%</div>
                        </div>
                        <div className="bg-gray-700 p-2 rounded">
                          <div className="text-gray-400">Vitórias</div>
                          <div className="font-bold">{filteredPlayers[0].victories}</div>
                        </div>
                        <div className="bg-gray-700 p-2 rounded col-span-2">
                          <div className="text-gray-400">Ganhos</div>
                          <div className="font-bold text-green-400">{formatCurrency(filteredPlayers[0].earnings)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Terceiro lugar */}
                {filteredPlayers.length > 2 && (
                  <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 md:order-3">
                    <div className="bg-gradient-to-r from-amber-700 to-amber-600 p-3 text-center">
                      <div className="w-12 h-12 bg-amber-600 rounded-full text-amber-900 flex items-center justify-center mx-auto mb-2">
                        <Trophy size={24} />
                      </div>
                      <div className="text-lg font-bold">3º Lugar</div>
                    </div>
                    <div className="p-4 text-center">
                      <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-2 flex items-center justify-center overflow-hidden">
                        {filteredPlayers[2].avatar ? (
                          <img 
                            src={filteredPlayers[2].avatar} 
                            alt={filteredPlayers[2].username} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="text-2xl font-bold text-gray-400">
                            {filteredPlayers[2].username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="font-bold text-lg">{filteredPlayers[2].username}</div>
                      <div className={`text-sm ${getRankColor(filteredPlayers[2].rank)}`}>{filteredPlayers[2].rank}</div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-gray-700 p-2 rounded">
                          <div className="text-gray-400">Taxa de Vitória</div>
                          <div className="font-bold">{filteredPlayers[2].winRate}%</div>
                        </div>
                        <div className="bg-gray-700 p-2 rounded">
                          <div className="text-gray-400">Vitórias</div>
                          <div className="font-bold">{filteredPlayers[2].victories}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Tabela de jogadores */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Pos.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Jogador
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Taxa de Vitória
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">
                        Vitórias
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                        Partidas
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Ganhos
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-center">
                        Detalhes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredPlayers.map((player, index) => (
                      <tr key={player.id} className={`${expandedPlayer === player.id ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getPositionIcon(index + 1)}
                            {player.rankingChange !== undefined && player.rankingChange !== 0 && (
                              <span className={`ml-2 flex items-center text-xs ${
                                player.rankingChange > 0 
                                  ? 'text-green-400' 
                                  : player.rankingChange < 0 
                                    ? 'text-red-400' 
                                    : 'text-gray-400'
                              }`}>
                                {player.rankingChange > 0 ? (
                                  <>
                                    <ChevronUp size={14} />
                                    {player.rankingChange}
                                  </>
                                ) : player.rankingChange < 0 ? (
                                  <>
                                    <ChevronDown size={14} />
                                    {Math.abs(player.rankingChange)}
                                  </>
                                ) : null}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center mr-3 overflow-hidden">
                              {player.avatar ? (
                                <img 
                                  src={player.avatar} 
                                  alt={player.username} 
                                  className="h-full w-full object-cover" 
                                />
                              ) : (
                                <div className="text-lg font-bold text-gray-400">
                                  {player.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{player.username}</div>
                              <div className={`text-sm ${getRankColor(player.rank)}`}>{player.rank}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full max-w-[120px] bg-gray-700 rounded-full h-2.5 mr-2">
                              <div 
                                className={`h-2.5 rounded-full ${getWinRateColor(player.winRate)}`} 
                                style={{ width: `${player.winRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{player.winRate}%</span>
                          </div>
                          {player.streak && player.streak > 0 && (
                            <div className="flex items-center mt-1 text-green-400 text-xs">
                              <Activity size={12} className="mr-1" />
                              <span>Sequência de {player.streak} vitórias</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="flex items-center">
                            <Trophy size={16} className="text-yellow-500 mr-2" />
                            <span>{player.victories}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                          {player.totalMatches}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-green-400 font-medium">{formatCurrency(player.earnings)}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => togglePlayerDetails(player.id)}
                            className="text-gray-400 hover:text-white"
                          >
                            {expandedPlayer === player.id ? (
                              <ChevronUp size={20} />
                            ) : (
                              <ChevronDown size={20} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredPlayers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                          Nenhum jogador encontrado com os filtros selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 