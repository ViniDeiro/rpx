'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, Clock, X, ChevronDown, ChevronUp, Award, AlertCircle } from 'react-feather';
import { toast } from 'react-toastify';

// Interface para apostas
interface Bet {
  id: string;
  matchId: string;
  amount: number;
  odd: number;
  potentialWin: number;
  type: string;
  selection: string | number | boolean;
  status: 'pending' | 'won' | 'lost' | 'canceled' | 'cashout';
  createdAt: string;
  settledAt?: string;
  match?: {
    id: string;
    title: string;
    status: string;
    teams: any[];
  };
}

export default function MinhasApostasPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    status: string | null;
    page: number;
    limit: number;
  }>({
    status: null,
    page: 1,
    limit: 10,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [expandedBet, setExpandedBet] = useState<string | null>(null);

  // Carregar apostas
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchBets();
    }
  }, [authLoading, isAuthenticated, filters]);

  // Função para buscar apostas
  const fetchBets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Construir parâmetros de consulta
      const queryParams = new URLSearchParams();
      queryParams.append('page', filters.page.toString());
      queryParams.append('limit', filters.limit.toString());
      if (filters.status) {
        queryParams.append('status', filters.status);
      }

      // Fazer requisição à API
      const response = await fetch(`/api/bets?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error('Erro ao carregar apostas');
      }

      const data = await response.json();
      setBets(data.bets);
      setTotalPages(data.pagination.pages);
    } catch (err: any) {
      console.error('Erro ao carregar apostas:', err);
      setError(err.message || 'Erro ao carregar apostas');
      toast.error('Falha ao carregar suas apostas. Tente novamente.');
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

  // Filtrar por status
  const handleFilterByStatus = (status: string | null) => {
    setFilters({ ...filters, status, page: 1 });
  };

  // Navegar para a próxima página
  const nextPage = () => {
    if (filters.page < totalPages) {
      setFilters({ ...filters, page: filters.page + 1 });
    }
  };

  // Navegar para a página anterior
  const prevPage = () => {
    if (filters.page > 1) {
      setFilters({ ...filters, page: filters.page - 1 });
    }
  };

  // Exibir o nome do status em português
  const getStatusName = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Aguardando Validação';
      case 'won':
        return 'Concluído - Ganhou';
      case 'lost':
        return 'Concluído - Perdeu';
      case 'canceled':
        return 'Cancelada';
      case 'cashout':
        return 'Cashout Realizado';
      default:
        return 'Desconhecido';
    }
  };

  // Definir cor do status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'won':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'lost':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'canceled':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'cashout':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // Renderizar ícone do status
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={18} className="mr-2 text-yellow-300" />;
      case 'won':
        return <Check size={18} className="mr-2 text-green-300" />;
      case 'lost':
        return <X size={18} className="mr-2 text-red-300" />;
      case 'canceled':
        return <AlertCircle size={18} className="mr-2 text-gray-300" />;
      case 'cashout':
        return <Award size={18} className="mr-2 text-blue-300" />;
      default:
        return null;
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch (err) {
      return 'Data inválida';
    }
  };

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

  // Renderizar mensagem de não autenticado
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-[#171335] rounded-xl p-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Acesso Restrito
          </h1>
          <p className="text-gray-300 mb-6">
            Você precisa estar logado para visualizar suas apostas.
          </p>
          <Link 
            href="/login" 
            className="px-6 py-3 bg-[#8860FF] hover:bg-[#7D55EF] text-white rounded-md transition-colors"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          Minhas Apostas
        </h1>
        <p className="text-gray-400">
          Acompanhe o status de todas as suas apostas
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => handleFilterByStatus(null)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filters.status === null
              ? 'bg-[#8860FF] text-white'
              : 'bg-[#232048] text-gray-300 hover:bg-[#2c295c]'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => handleFilterByStatus('pending')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filters.status === 'pending'
              ? 'bg-[#8860FF] text-white'
              : 'bg-[#232048] text-gray-300 hover:bg-[#2c295c]'
          }`}
        >
          Aguardando Validação
        </button>
        <button
          onClick={() => handleFilterByStatus('won')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filters.status === 'won'
              ? 'bg-[#8860FF] text-white'
              : 'bg-[#232048] text-gray-300 hover:bg-[#2c295c]'
          }`}
        >
          Ganhas
        </button>
        <button
          onClick={() => handleFilterByStatus('lost')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filters.status === 'lost'
              ? 'bg-[#8860FF] text-white'
              : 'bg-[#232048] text-gray-300 hover:bg-[#2c295c]'
          }`}
        >
          Perdidas
        </button>
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
            onClick={fetchBets}
            className="mt-2 text-sm font-medium text-white bg-red-500/30 hover:bg-red-500/50 px-4 py-2 rounded-md transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Mensagem de nenhuma aposta */}
      {!isLoading && !error && bets.length === 0 && (
        <div className="bg-[#171335] rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-white mb-2">
            Nenhuma aposta encontrada
          </h2>
          <p className="text-gray-400 mb-4">
            Você ainda não fez apostas ou não há apostas com os filtros selecionados.
          </p>
          <Link
            href="/apostas"
            className="px-6 py-3 bg-[#8860FF] hover:bg-[#7D55EF] text-white rounded-md transition-colors inline-block"
          >
            Fazer Apostas
          </Link>
        </div>
      )}

      {/* Lista de apostas */}
      {!isLoading && !error && bets.length > 0 && (
        <div className="space-y-4">
          {bets.map((bet) => (
            <div
              key={bet.id}
              className="bg-[#171335] rounded-xl overflow-hidden border border-[#3D2A85]/30"
            >
              {/* Cabeçalho da aposta */}
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#3D2A85]/30">
                <div className="flex-1">
                  <h3 className="font-bold text-white mb-1">
                    {bet.match?.title || `Partida #${bet.matchId.substring(0, 6)}`}
                  </h3>
                  <div className="flex items-center">
                    <div className={`text-xs px-2 py-1 rounded-md flex items-center ${getStatusColor(bet.status)}`}>
                      {renderStatusIcon(bet.status)}
                      {getStatusName(bet.status)}
                    </div>
                    <span className="text-gray-400 text-xs ml-2">
                      {formatDate(bet.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end mt-2 sm:mt-0">
                  <div className="text-white font-bold">
                    {bet.amount.toFixed(2)} moedas
                  </div>
                  <div className={`text-sm ${bet.status === 'won' ? 'text-green-400' : 'text-gray-400'}`}>
                    Ganho Potencial: {bet.potentialWin.toFixed(2)}
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
                          <span className="text-gray-400">Tipo:</span>
                          <span className="text-white">{bet.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Seleção:</span>
                          <span className="text-white">{String(bet.selection)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Odd:</span>
                          <span className="text-white">{bet.odd.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Data da Aposta:</span>
                          <span className="text-white">{new Date(bet.createdAt).toLocaleString('pt-BR')}</span>
                        </div>
                        {bet.settledAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Data de Conclusão:</span>
                            <span className="text-white">{new Date(bet.settledAt).toLocaleString('pt-BR')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {bet.match && (
                      <div>
                        <h4 className="text-gray-400 mb-2 text-sm font-medium">Detalhes da Partida</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Status:</span>
                            <span className="text-white capitalize">{bet.match.status}</span>
                          </div>
                          {bet.match.teams && bet.match.teams.length > 0 && (
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
                            >
                              Ver detalhes da partida
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Instruções para validação (se pendente) */}
                  {bet.status === 'pending' && (
                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <h4 className="text-yellow-300 font-medium mb-1 flex items-center">
                        <Clock size={16} className="mr-1" /> Aguardando validação
                      </h4>
                      <p className="text-gray-300 text-sm">
                        Esta aposta está aguardando validação por um administrador. Após o término da partida e envio
                        do comprovante (print), um administrador validará o resultado e processará o pagamento, se aplicável.
                      </p>
                    </div>
                  )}

                  {/* Resultados (se concluída) */}
                  {(bet.status === 'won' || bet.status === 'lost') && (
                    <div className={`mt-4 p-3 rounded-lg ${
                      bet.status === 'won' 
                        ? 'bg-green-500/10 border border-green-500/20' 
                        : 'bg-red-500/10 border border-red-500/20'
                    }`}>
                      <h4 className={`font-medium mb-1 flex items-center ${
                        bet.status === 'won' ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {bet.status === 'won' ? (
                          <>
                            <Award size={16} className="mr-1" /> Aposta Ganha!
                          </>
                        ) : (
                          <>
                            <X size={16} className="mr-1" /> Aposta Perdida
                          </>
                        )}
                      </h4>
                      <p className="text-gray-300 text-sm">
                        {bet.status === 'won' 
                          ? `Você ganhou ${bet.potentialWin.toFixed(2)} moedas com esta aposta!` 
                          : 'Infelizmente, esta aposta não foi bem-sucedida. Mais sorte na próxima!'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {!isLoading && !error && bets.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={prevPage}
            disabled={filters.page <= 1}
            className={`px-4 py-2 rounded-md text-sm ${
              filters.page <= 1
                ? 'bg-[#232048]/50 text-gray-500 cursor-not-allowed'
                : 'bg-[#232048] text-white hover:bg-[#2c295c]'
            }`}
          >
            Anterior
          </button>
          
          <div className="text-gray-400">
            Página {filters.page} de {totalPages}
          </div>
          
          <button
            onClick={nextPage}
            disabled={filters.page >= totalPages}
            className={`px-4 py-2 rounded-md text-sm ${
              filters.page >= totalPages
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