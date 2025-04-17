'use client';

import { useState, useEffect } from 'react';
import { Calendar, Award, Clock, Users, ChevronRight, Filter, Search, Star, Shield, Hexagon, AlertCircle, Zap } from 'react-feather';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Clock as LucideClock,
  Hexagon as LucideHexagon,
  Shield as LucideShield,
  Users as LucideUsers,
  Award as LucideAward,
  Trophy as LucideTrophy
} from 'lucide-react';

// Dados simulados de torneios
interface Tournament {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  format: string;
  status: 'registrando' | 'em_andamento' | 'completo' | 'em_breve';
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  currentParticipants: number;
  image: string;
  featured?: boolean;
  color?: string;
}

// Obter data atual e adicionar dias
const currentDate = new Date();
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDateString = (date: Date) => {
  return date.toISOString().split('.')[0];
};

const mockTournaments: Tournament[] = [
  {
    id: 1,
    name: 'RPX Mensal - Edição Janeiro 2024',
    description: 'O maior torneio mensal da plataforma com premiação em dinheiro e itens exclusivos.',
    startDate: formatDateString(addDays(currentDate, 3)),
    endDate: formatDateString(addDays(currentDate, 3)),
    format: 'Squad',
    status: 'registrando',
    entryFee: 50,
    prizePool: 5000,
    maxParticipants: 64,
    currentParticipants: 32,
    image: '/images/tournaments/monthly.jpg',
    featured: true,
    color: 'purple'
  },
  {
    id: 2,
    name: 'Copa RPX - Edição Especial',
    description: 'Torneio premium com os melhores jogadores da plataforma e premiação exclusiva.',
    startDate: formatDateString(addDays(currentDate, 25)),
    endDate: formatDateString(addDays(currentDate, 25)),
    format: 'Duo',
    status: 'em_breve',
    entryFee: 100,
    prizePool: 10000,
    maxParticipants: 128,
    currentParticipants: 0,
    image: '/images/tournaments/monthly.jpg',
    color: 'blue'
  },
  {
    id: 3,
    name: 'Torneio Semanal',
    description: 'Competição semanal com inscrição acessível e prêmios para todos os níveis.',
    startDate: formatDateString(addDays(currentDate, 6)),
    endDate: formatDateString(addDays(currentDate, 6)),
    format: 'Solo',
    status: 'em_breve',
    entryFee: 20,
    prizePool: 1500,
    maxParticipants: 32,
    currentParticipants: 0,
    image: '/images/tournaments/weekly.jpg',
    color: 'green'
  },
  {
    id: 4,
    name: 'Liga Profissional RPX 2024',
    description: 'Torneio de elite para jogadores profissionais com premiação de alto nível.',
    startDate: formatDateString(addDays(currentDate, 45)),
    endDate: formatDateString(addDays(currentDate, 50)),
    format: 'Squad',
    status: 'em_breve',
    entryFee: 150,
    prizePool: 25000,
    maxParticipants: 50,
    currentParticipants: 0,
    image: '/images/tournaments/pro.jpg',
    color: 'red'
  },
  {
    id: 5,
    name: 'Torneio Relâmpago',
    description: 'Competição rápida e intensa com inscrição gratuita e prêmios instantâneos.',
    startDate: formatDateString(addDays(currentDate, 10)),
    endDate: formatDateString(addDays(currentDate, 10)),
    format: 'Solo',
    status: 'em_breve',
    entryFee: 0,
    prizePool: 500,
    maxParticipants: 32,
    currentParticipants: 0,
    image: '/images/tournaments/flash.jpg',
    color: 'yellow'
  }
];

export default function TournamentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar torneios da API
  useEffect(() => {
    async function fetchTournaments() {
      setLoading(true);
      try {
        // Construir parâmetros de consulta com base nos filtros
        const params = new URLSearchParams();
        
        if (formatFilter !== 'todos') {
          params.append('format', formatFilter);
        }
        
        if (statusFilter !== 'todos') {
          params.append('status', statusFilter);
        }
        
        const response = await fetch(`/api/tournaments?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Falha ao buscar torneios');
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
          // Verificar se temos dados reais da API
          if (data.data && data.data.tournaments && data.data.tournaments.length > 0) {
            setTournaments(data.data.tournaments);
            
            // Definir o torneio em destaque (primeiro torneio em destaque ou o primeiro da lista)
            const featured = data.data.tournaments.find((t: Tournament) => t.featured);
            setActiveTournament(featured || data.data.tournaments[0]);
          } else {
            // Fallback para dados simulados se não houver dados reais
            setTournaments(mockTournaments);
            const featured = mockTournaments.find(t => t.featured);
            setActiveTournament(featured || mockTournaments[0]);
          }
        } else {
          // Fallback para dados simulados em caso de erro
          console.error('Erro na resposta da API:', data.error);
          setTournaments(mockTournaments);
          const featured = mockTournaments.find(t => t.featured);
          setActiveTournament(featured || mockTournaments[0]);
        }
      } catch (err) {
        console.error('Erro ao buscar torneios:', err);
        setError('Não foi possível carregar os torneios');
        
        // Fallback para dados simulados em caso de erro
        setTournaments(mockTournaments);
        const featured = mockTournaments.find(t => t.featured);
        setActiveTournament(featured || mockTournaments[0]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTournaments();
  }, [formatFilter, statusFilter]);

  // Filtrar torneios com base na busca
  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Formatador de status para exibição
  const getStatusDisplay = (status: 'registrando' | 'em_andamento' | 'completo' | 'em_breve') => {
    switch (status) {
      case 'registrando':
        return { label: 'Inscrições Abertas', class: 'bg-green-900/40 text-green-400 border border-green-500/30' };
      case 'em_andamento':
        return { label: 'Em Andamento', class: 'bg-blue-900/40 text-blue-400 border border-blue-500/30' };
      case 'completo':
        return { label: 'Finalizado', class: 'bg-gray-900/40 text-gray-400 border border-gray-500/30' };
      case 'em_breve':
        return { label: 'Em Breve', class: 'bg-yellow-900/40 text-yellow-400 border border-yellow-500/30' };
      default:
        return { label: status, class: 'bg-gray-900/40 text-gray-400 border border-gray-500/30' };
    }
  };

  // Formatador de datas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Renderiza o ícone do formato do torneio
  const renderFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'solo':
        return <LucideShield size={18} className="mr-2" />;
      case 'duo':
        return <LucideUsers size={18} className="mr-2" />;
      case 'squad':
        return <LucideHexagon size={18} className="mr-2" />;
      default:
        return <LucideAward size={18} className="mr-2" />;
    }
  };

  const formatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'standard':
        return <LucideAward size={16} className="mr-1" />;
      case 'modern':
        return <Zap size={16} className="mr-1" />;
      case 'legacy':
        return <LucideShield size={16} className="mr-1" />;
      case 'vintage':
        return <Star size={16} className="mr-1" />;
      case 'commander':
        return <LucideHexagon size={16} className="mr-1" />;
      default:
        return <LucideAward size={16} className="mr-1" />;
    }
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      {/* Exibir mensagem de carregamento */}
      {loading && (
        <div className="flex justify-center items-center">
          <div className="w-8 h-8 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin"></div>
          <span className="ml-2 text-purple-500">Carregando torneios...</span>
        </div>
      )}
      
      {/* Exibir mensagem de erro */}
      {error && (
        <div className="max-w-7xl mx-auto mb-8 p-4 bg-red-900/40 border border-red-500/50 rounded-lg text-red-200">
          <p className="flex items-center">
            <AlertCircle size={18} className="mr-2" />
            {error}
          </p>
        </div>
      )}
      
      {/* Restante do código existente da interface */}
      {!loading && (
        <div className="max-w-7xl mx-auto">
          {/* Cabeçalho com título da página */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
                Torneios RPX
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Participe dos nossos torneios exclusivos e conquiste prêmios extraordinários
            </p>
          </div>
          
          {/* Torneio em destaque */}
          {activeTournament && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative mb-16 overflow-hidden rounded-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-blue-900/60 z-10"></div>
              <div className="absolute inset-0 bg-[url('/images/tournaments/bg-pattern.png')] opacity-10 z-0"></div>
              
              <div className="relative z-20 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center">
                <div className="md:w-1/2 text-center md:text-left">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-4">
                    <Star size={16} className="text-yellow-400 mr-2" />
                    <span className="text-sm font-semibold">Torneio em Destaque</span>
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">{activeTournament.name}</h2>
                  <p className="text-lg text-gray-300 mb-6">{activeTournament.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-400 mb-1">Formato</p>
                      <p className="font-semibold text-white flex items-center justify-center">
                        {renderFormatIcon(activeTournament.format)}
                        {activeTournament.format}
                      </p>
                    </div>
                    
                    <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-400 mb-1">Data</p>
                      <p className="font-semibold text-white">
                        {formatDate(activeTournament.startDate)}
                      </p>
                    </div>
                    
                    <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-400 mb-1">Inscrição</p>
                      <p className="font-semibold text-white">
                        {activeTournament.entryFee > 0 ? `R$ ${activeTournament.entryFee},00` : 'Grátis'}
                      </p>
                    </div>
                    
                    <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-400 mb-1">Premiação</p>
                      <p className="font-semibold text-purple-400">
                        R$ {activeTournament.prizePool.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link 
                      href={`/tournaments/${activeTournament.id}`}
                      className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center transition-colors"
                    >
                      <LucideAward size={18} className="mr-2" />
                      Inscrever-se
                    </Link>
                    
                    <Link 
                      href={`/tournaments/${activeTournament.id}/details`}
                      className="bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center transition-colors"
                    >
                      <ChevronRight size={18} className="mr-2" />
                      Ver detalhes
                    </Link>
                  </div>
                </div>
                
                <div className="md:w-1/2 relative">
                  <div className="absolute -inset-2 bg-purple-500 rounded-full opacity-20 animate-pulse"></div>
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-card-bg/50 flex items-center justify-center group">
                    <LucideAward size={120} className="text-purple-400/30 transition-all duration-500 group-hover:scale-110 group-hover:text-purple-400/50" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-purple-900/60 backdrop-blur-sm">
                      <LucideAward size={64} className="text-yellow-400 mb-4" />
                      <p className="text-2xl font-bold">Prêmio Total</p>
                      <p className="text-3xl font-bold text-yellow-400">R$ {activeTournament.prizePool.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-4 left-4 right-4 bg-gradient-to-r from-purple-900/80 via-purple-700/80 to-purple-900/80 backdrop-blur-sm rounded-lg px-4 py-3 border border-purple-500/30">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-300">Participantes</p>
                        <p className="font-bold">{activeTournament.currentParticipants}/{activeTournament.maxParticipants}</p>
                      </div>
                      <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" 
                          style={{ width: `${(activeTournament.currentParticipants / activeTournament.maxParticipants) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Filtros e Pesquisa */}
          <div className="mb-8">
            <div className="bg-card-bg border border-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    className="bg-background block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-lg leading-5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    placeholder="Buscar torneios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-auto">
                    <select
                      className="bg-background block w-full pl-3 pr-10 py-2 text-base border-gray-700 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg text-white"
                      value={formatFilter}
                      onChange={(e) => setFormatFilter(e.target.value)}
                    >
                      <option value="todos">Todos os formatos</option>
                      <option value="solo">Solo</option>
                      <option value="duo">Duo</option>
                      <option value="squad">Squad</option>
                    </select>
                  </div>
                  
                  <div className="w-full sm:w-auto">
                    <select
                      className="bg-background block w-full pl-3 pr-10 py-2 text-base border-gray-700 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-lg text-white"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="todos">Todos os status</option>
                      <option value="registrando">Inscrições Abertas</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="em_breve">Em Breve</option>
                      <option value="completo">Finalizado</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Lista de Torneios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <motion.div 
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: tournament.id * 0.1 }}
                className={`bg-card-bg border border-gray-800 rounded-xl overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 hover:border-${tournament.color || 'purple'}-500/30`}
              >
                <div className="h-48 bg-gradient-to-br from-gray-900 to-gray-800 relative flex items-center justify-center overflow-hidden">
                  <div className={`absolute inset-0 bg-${tournament.color || 'purple'}-900/20 mix-blend-overlay`}></div>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <LucideAward size={64} className={`text-${tournament.color || 'purple'}-400 opacity-30`} />
                  </div>
                  
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusDisplay(tournament.status).class}`}>
                      {getStatusDisplay(tournament.status).label}
                    </span>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-card-bg via-card-bg/90 to-transparent">
                    <h3 className="text-xl font-bold text-white">{tournament.name}</h3>
                    <div className="flex items-center mt-1">
                      <div className="flex items-center text-sm text-gray-400">
                        {renderFormatIcon(tournament.format)}
                        <span>{tournament.format}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{tournament.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm">
                      <Calendar size={16} className="text-gray-500 mr-2" />
                      <span className="text-gray-300">
                        {formatDate(tournament.startDate)}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Clock size={16} className="text-gray-500 mr-2" />
                      <span className="text-gray-300">
                        {new Date(tournament.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Users size={16} className="text-gray-500 mr-2" />
                      <span className="text-gray-300">
                        {tournament.currentParticipants}/{tournament.maxParticipants} participantes
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                    <div>
                      <p className="text-xs text-gray-500">Inscrição</p>
                      <p className="text-base font-bold text-white">
                        {tournament.entryFee > 0 ? `R$ ${tournament.entryFee},00` : 'Grátis'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Premiação</p>
                      <p className="text-base font-bold text-purple-400">R$ {tournament.prizePool.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="px-4 py-3 bg-card-hover border-t border-gray-800">
                  {tournament.status === 'em_breve' ? (
                    <div className="flex items-center justify-between text-gray-400">
                      <span className="text-sm font-medium flex items-center">
                        <AlertCircle size={16} className="mr-2" />
                        Em breve
                      </span>
                      <Zap size={18} />
                    </div>
                  ) : (
                    <Link href={`/tournaments/${tournament.id}`} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">
                        {tournament.status === 'registrando' ? 'Inscrever-se' : 
                         tournament.status === 'em_andamento' ? 'Ver detalhes' : 
                         'Ver resultados'}
                      </span>
                      <ChevronRight size={18} className="text-gray-400" />
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Caso não encontre torneios */}
          {filteredTournaments.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-card-bg border border-gray-800 rounded-xl"
            >
              <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-gray-800 mb-4">
                <LucideAward size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-white">Nenhum torneio encontrado</h3>
              <p className="text-gray-400 mt-2">Tente ajustar seus filtros ou aguarde novos torneios.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFormatFilter('todos');
                  setStatusFilter('todos');
                }}
                className="mt-4 inline-flex items-center px-4 py-2 border border-purple-500 text-sm font-medium rounded-lg text-purple-400 bg-transparent hover:bg-purple-500/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <Filter size={16} className="mr-2" />
                Limpar filtros
              </button>
            </motion.div>
          )}
          
          {/* Seção de Call to Action */}
          <div className="mt-16 text-center">
            <div className="inline-block mb-6 p-1 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500">
              <div className="bg-background p-3 rounded-full">
                <LucideAward size={32} className="text-yellow-400" />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Pronto para competir?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              Participe de torneios exclusivos e desafie os melhores jogadores. Mostre sua habilidade, conquiste prêmios e reconhecimento na plataforma RPX.
            </p>
            <Link 
              href="/tournaments/1"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              <LucideAward size={20} className="mr-2" />
              Participar do RPX Mensal
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 