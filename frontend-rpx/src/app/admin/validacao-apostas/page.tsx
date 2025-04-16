'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Check, X, ChevronDown, ChevronUp, Clock, Search, Calendar, Filter } from 'react-feather';
import { toast } from 'react-toastify';

// Interface para apostas a serem validadas
interface PendingBet {
  id: string;
  userId: string;
  matchId: string;
  amount: number;
  odd: number;
  potentialWin: number;
  type: string;
  selection: string | number | boolean;
  status: string;
  createdAt: string;
  match: {
    id: string;
    title: string;
    status: string;
    teams: any[];
  };
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export default function ValidacaoApostasPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [pendingBets, setPendingBets] = useState<PendingBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBet, setExpandedBet] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [matchOptions, setMatchOptions] = useState<{ id: string; title: string }[]>([]);

  // Verificar se é administrador
  const isAdmin = user?.role === 'admin';

  // Carregar apostas pendentes
  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      fetchPendingBets();
    }
  }, [authLoading, isAuthenticated, isAdmin, pagination.page, selectedMatchId]);

  // Extrair partidas únicas para filtro
  useEffect(() => {
    if (pendingBets.length > 0) {
      const uniqueMatches = Array.from(
        new Map(
          pendingBets
            .filter(bet => bet.match?.id)
            .map(bet => [bet.match.id, { id: bet.match.id, title: bet.match.title }])
        ).values()
      );
      setMatchOptions(uniqueMatches);
    }
  }, [pendingBets]);

  // Função para buscar apostas pendentes
  const fetchPendingBets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Construir parâmetros de consulta
      const queryParams = new URLSearchParams();
      queryParams.append('page', pagination.page.toString());
      queryParams.append('limit', pagination.limit.toString());
      if (selectedMatchId) {
        queryParams.append('matchId', selectedMatchId);
      }

      // Fazer requisição à API
      const response = await fetch(`/api/bets/verify?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error('Erro ao carregar apostas pendentes');
      }

      const data = await response.json();
      setPendingBets(data.bets);
      setPagination({
        ...pagination,
        total: data.pagination.total,
        pages: data.pagination.pages
      });
    } catch (err: any) {
      console.error('Erro ao carregar apostas pendentes:', err);
      setError(err.message || 'Erro ao carregar apostas pendentes');
      toast.error('Falha ao carregar apostas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Alternar expansão de detalhes da aposta
  const toggleExpand = (betId: string) => {
    if (expandedBet === betId) {
      setExpandedBet(null);
    } else {
      setExpandedBet(betId);
    }
  };

  // Validar apostas
  const validateBet = async (betId: string, outcome: 'won' | 'lost', notes: string = '') => {
    try {
      setIsValidating(true);

      // Fazer requisição à API
      const response = await fetch('/api/bets/verify', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          betId,
          outcome,
          notes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao validar aposta');
      }

      // Atualizar lista de apostas pendentes
      setPendingBets(prev => prev.filter(bet => bet.id !== betId));
      
      // Exibir mensagem de sucesso
      toast.success(`Aposta ${outcome === 'won' ? 'aprovada' : 'reprovada'} com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao validar aposta:', err);
      toast.error(err.message || 'Erro ao validar aposta');
    } finally {
      setIsValidating(false);
    }
  };

  // Navegar para a próxima página
  const nextPage = () => {
    if (pagination.page < pagination.pages) {
      setPagination({ ...pagination, page: pagination.page + 1 });
    }
  };

  // Navegar para a página anterior
  const prevPage = () => {
    if (pagination.page > 1) {
      setPagination({ ...pagination, page: pagination.page - 1 });
    }
  };

  // Filtrar apostas pelo ID da partida
  const handleFilterByMatch = (matchId: string | null) => {
    setSelectedMatchId(matchId);
    setPagination({ ...pagination, page: 1 });
  };

  // Filtrar apostas pela busca
  const filteredBets = searchQuery.trim() === '' 
    ? pendingBets
    : pendingBets.filter(bet => 
        bet.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(bet.id).includes(searchQuery) ||
        (bet.match?.title && bet.match.title.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  // Renderizar loading state
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8860FF]"></div>
        </div>
      </div>
    );
  }

  // Renderizar mensagem de acesso restrito
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-[#171335] rounded-xl p-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Acesso Restrito
          </h1>
          <p className="text-gray-300 mb-6">
            Esta área é restrita aos administradores do sistema.
          </p>
          <Link 
            href="/admin" 
            className="px-6 py-3 bg-[#8860FF] hover:bg-[#7D55EF] text-white rounded-md transition-colors"
          >
            Voltar ao Painel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          Validação de Apostas
        </h1>
        <p className="text-gray-400">
          Valide as apostas pendentes após a conclusão das partidas
        </p>
      </div>

      {/* Filtros e Busca */}
      <div className="mb-6 space-y-4">
        <div className="bg-[#171335] rounded-xl p-4 flex flex-col sm:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por usuário ou partida..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#1D1940] border border-[#3D2A85]/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8860FF]/50"
            />
          </div>
          
          {/* Filtro por partida */}
          <div className="sm:w-72">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={18} className="text-gray-400" />
              </div>
              <select
                value={selectedMatchId || ''}
                onChange={(e) => handleFilterByMatch(e.target.value || null)}
                className="w-full pl-10 pr-4 py-3 bg-[#1D1940] border border-[#3D2A85]/30 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#8860FF]/50"
              >
                <option value="">Todas as partidas</option>
                {matchOptions.map(match => (
                  <option key={match.id} value={match.id}>
                    {match.title}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown size={18} className="text-gray-400" />
              </div>
            </div>
          </div>
          
          {/* Botão para atualizar */}
          <button
            onClick={fetchPendingBets}
            disabled={isLoading}
            className="px-6 py-3 bg-[#232048] hover:bg-[#2c295c] text-white rounded-lg transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              'Atualizar'
            )}
          </button>
        </div>
      </div>

      {/* Estado de carregamento */}
      {isLoading && (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#8860FF]"></div>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && !isLoading && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-200">{error}</p>
          <button
            onClick={fetchPendingBets}
            className="mt-2 text-sm font-medium text-white bg-red-500/30 hover:bg-red-500/50 px-4 py-2 rounded-md transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Mensagem de nenhuma aposta pendente */}
      {!isLoading && !error && filteredBets.length === 0 && (
        <div className="bg-[#171335] rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-white mb-2">
            Nenhuma aposta pendente encontrada
          </h2>
          <p className="text-gray-400 mb-4">
            Não há apostas aguardando validação no momento.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedMatchId(null);
              fetchPendingBets();
            }}
            className="px-6 py-3 bg-[#8860FF] hover:bg-[#7D55EF] text-white rounded-md transition-colors inline-block"
          >
            Limpar Filtros
          </button>
        </div>
      )}

      {/* Lista de apostas pendentes */}
      {!isLoading && !error && filteredBets.length > 0 && (
        <div className="space-y-4">
          {filteredBets.map((bet) => (
            <div
              key={bet.id}
              className="bg-[#171335] rounded-xl overflow-hidden border border-[#3D2A85]/30"
            >
              {/* Cabeçalho da aposta */}
              <div className="p-4 bg-[#1D1940]">
                <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-white">
                      {bet.match?.title || `Partida #${bet.matchId.substring(0, 6)}`}
                    </h3>
                    <div className="text-sm text-gray-400 flex items-center mt-1">
                      <Clock size={14} className="mr-1" />
                      {new Date(bet.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="text-white font-bold">
                      {bet.amount.toFixed(2)} moedas
                    </div>
                    <div className="text-gray-400 text-sm">
                      Potencial: {bet.potentialWin.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-between items-center">
                  <div className="flex items-center">
                    <div className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-1 rounded text-xs flex items-center">
                      <Clock size={12} className="mr-1" />
                      Aguardando Validação
                    </div>
                    <span className="ml-2 text-sm text-gray-400">
                      Usuário: <span className="text-white">{bet.user.username}</span>
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => validateBet(bet.id, 'won')}
                      disabled={isValidating}
                      className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 rounded transition-colors flex items-center"
                    >
                      <Check size={14} className="mr-1" />
                      Aprovar
                    </button>
                    <button
                      onClick={() => validateBet(bet.id, 'lost')}
                      disabled={isValidating}
                      className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded transition-colors flex items-center"
                    >
                      <X size={14} className="mr-1" />
                      Reprovar
                    </button>
                  </div>
                </div>
              </div>

              {/* Botão para expandir detalhes */}
              <button
                onClick={() => toggleExpand(bet.id)}
                className="w-full p-3 flex justify-center items-center text-gray-400 hover:text-white hover:bg-[#232048] transition-colors"
              >
                {expandedBet === bet.id ? (
                  <>
                    <span className="mr-1">Ocultar Detalhes</span>
                    <ChevronUp size={18} />
                  </>
                ) : (
                  <>
                    <span className="mr-1">Ver Detalhes</span>
                    <ChevronDown size={18} />
                  </>
                )}
              </button>

              {/* Detalhes da aposta */}
              {expandedBet === bet.id && (
                <div className="p-4 border-t border-[#3D2A85]/30 bg-[#131030]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-gray-400 mb-2 text-sm font-medium">Detalhes da Aposta</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">ID:</span>
                          <span className="text-white">{bet.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tipo:</span>
                          <span className="text-white">{bet.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Seleção:</span>
                          <span className="text-white">{String(bet.selection)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Valor:</span>
                          <span className="text-white">{bet.amount.toFixed(2)} moedas</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Odd:</span>
                          <span className="text-white">{bet.odd.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Ganho Potencial:</span>
                          <span className="text-white">{bet.potentialWin.toFixed(2)} moedas</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-gray-400 mb-2 text-sm font-medium">Detalhes do Usuário e Partida</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Usuário:</span>
                          <span className="text-white">{bet.user.username}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Email:</span>
                          <span className="text-white">{bet.user.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">ID do Usuário:</span>
                          <span className="text-white">{bet.user.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status da Partida:</span>
                          <span className="text-white capitalize">{bet.match?.status || 'Desconhecido'}</span>
                        </div>
                        {bet.match?.teams && bet.match.teams.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Times:</span>
                            <span className="text-white">
                              {bet.match.teams.map(team => team.name || 'Time Desconhecido').join(' vs ')}
                            </span>
                          </div>
                        )}
                        <div className="mt-4">
                          <Link
                            href={`/matches/${bet.matchId}`}
                            className="text-[#8860FF] hover:text-[#7D55EF] text-sm transition-colors"
                            target="_blank"
                          >
                            Ver detalhes da partida
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Formulário para adicionar observações e validar */}
                  <div className="mt-6 p-4 bg-[#1D1940] rounded-lg">
                    <h4 className="text-white font-medium mb-3">Validar Aposta</h4>
                    
                    <div className="mb-4">
                      <label className="block text-gray-400 text-sm mb-2" htmlFor={`notes-${bet.id}`}>
                        Observações (opcional)
                      </label>
                      <textarea
                        id={`notes-${bet.id}`}
                        className="w-full bg-[#131030] border border-[#3D2A85]/30 rounded-lg p-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#8860FF]/50"
                        rows={2}
                        placeholder="Adicione observações sobre a validação..."
                      ></textarea>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 justify-end">
                      <button
                        onClick={() => {
                          const notesElement = document.getElementById(`notes-${bet.id}`) as HTMLTextAreaElement;
                          validateBet(bet.id, 'won', notesElement?.value || '');
                        }}
                        disabled={isValidating}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check size={16} className="mr-2" />
                        Aprovar Ganho
                      </button>
                      <button
                        onClick={() => {
                          const notesElement = document.getElementById(`notes-${bet.id}`) as HTMLTextAreaElement;
                          validateBet(bet.id, 'lost', notesElement?.value || '');
                        }}
                        disabled={isValidating}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X size={16} className="mr-2" />
                        Confirmar Perda
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {!isLoading && !error && pendingBets.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={prevPage}
            disabled={pagination.page <= 1}
            className={`px-4 py-2 rounded-md text-sm ${
              pagination.page <= 1
                ? 'bg-[#232048]/50 text-gray-500 cursor-not-allowed'
                : 'bg-[#232048] text-white hover:bg-[#2c295c]'
            }`}
          >
            Anterior
          </button>
          
          <div className="text-gray-400">
            Página {pagination.page} de {pagination.pages}
          </div>
          
          <button
            onClick={nextPage}
            disabled={pagination.page >= pagination.pages}
            className={`px-4 py-2 rounded-md text-sm ${
              pagination.page >= pagination.pages
                ? 'bg-[#232048]/50 text-gray-500 cursor-not-allowed'
                : 'bg-[#232048] text-white hover:bg-[#2c295c]'
            }`}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
} 