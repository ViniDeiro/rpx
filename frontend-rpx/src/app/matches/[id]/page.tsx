'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Info, Award, X } from 'react-feather';
import ImagePaths from '@/utils/image-paths';
import { SponsorBanner } from '@/components/ui/SponsorBanner';

interface Team {
  id: string;
  name: string;
  logo: string;
}

interface Match {
  id: string;
  team1: Team;
  team2: Team;
  date: string;
  tournament: string;
  status: 'upcoming' | 'live' | 'completed';
  odds?: {
    team1: number;
    draw: number;
    team2: number;
  };
  liveScore?: {
    team1: number;
    team2: number;
  };
  description?: string;
  venue?: string;
  entryFee?: number;
  prize?: number;
}

interface BetOption {
  id: string;
  name: string;
  odds: number;
  type: string;
}

export default function MatchDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params?.id as string;

  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [betOptions, setBetOptions] = useState<BetOption[]>([]);
  const [selectedBets, setSelectedBets] = useState<string[]>([]);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [potentialReturn, setPotentialReturn] = useState<number>(0);
  const [showBetSlip, setShowBetSlip] = useState(false);

  // Simulação de fetch da partida
  useEffect(() => {
    const fetchMatch = async () => {
      try {
        // Simular um delay de resposta da API
        await new Promise(resolve => setTimeout(resolve, 800));

        // Dados mockados para a simulação
        const mockMatch: Match = {
          id: matchId,
          team1: { id: 't1', name: 'Loud', logo: ImagePaths.teamPlaceholder },
          team2: { id: 't2', name: 'Fluxo', logo: ImagePaths.teamPlaceholder },
          date: '2023-06-15T18:00:00',
          tournament: 'LBFF 2023',
          status: 'upcoming',
          odds: { team1: 1.85, draw: 3.25, team2: 2.10 },
          description: 'Partida decisiva da fase de grupos do LBFF 2023, válida pelo Grupo A.',
          venue: 'Online',
          entryFee: 10,
          prize: 18.50
        };

        // Gerar opções de apostas
        const mockBetOptions: BetOption[] = [
          { id: '1', name: mockMatch.team1.name, odds: mockMatch.odds?.team1 || 0, type: 'winner' },
          { id: '2', name: 'Empate', odds: mockMatch.odds?.draw || 0, type: 'winner' },
          { id: '3', name: mockMatch.team2.name, odds: mockMatch.odds?.team2 || 0, type: 'winner' },
          { id: '4', name: 'Mais de 15 kills', odds: 1.92, type: 'kills' },
          { id: '5', name: 'Menos de 15 kills', odds: 1.88, type: 'kills' },
          { id: '6', name: `${mockMatch.team1.name} vence primeiro Booyah`, odds: 2.25, type: 'first_booyah' },
          { id: '7', name: `${mockMatch.team2.name} vence primeiro Booyah`, odds: 1.65, type: 'first_booyah' },
          { id: '8', name: 'Mais de 2.5 Booyahs na partida', odds: 1.55, type: 'total_booyahs' },
          { id: '9', name: 'Menos de 2.5 Booyahs na partida', odds: 2.35, type: 'total_booyahs' },
        ];

        setMatch(mockMatch);
        setBetOptions(mockBetOptions);
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao buscar detalhes da partida:', error);
        setIsLoading(false);
      }
    };

    if (matchId) {
      fetchMatch();
    }
  }, [matchId]);

  // Calcular retorno potencial
  useEffect(() => {
    if (selectedBets.length === 0) {
      setPotentialReturn(0);
      return;
    }

    const selectedOptions = betOptions.filter(option => selectedBets.includes(option.id));
    const totalOdds = selectedOptions.reduce((acc, option) => acc * option.odds, 1);
    setPotentialReturn(Number((betAmount * totalOdds).toFixed(2)));
  }, [selectedBets, betAmount, betOptions]);

  // Manipular seleção de apostas
  const handleBetSelection = (betId: string) => {
    setSelectedBets(prev => {
      // Se já está selecionado, remove
      if (prev.includes(betId)) {
        return prev.filter(id => id !== betId);
      }
      
      // Se não está selecionado, verifica conflitos de tipo
      const selectedOption = betOptions.find(option => option.id === betId);
      if (!selectedOption) return prev;
      
      // Remove qualquer outra aposta do mesmo tipo
      const filteredBets = prev.filter(id => {
        const option = betOptions.find(opt => opt.id === id);
        return option?.type !== selectedOption.type;
      });
      
      // Adiciona a nova aposta
      return [...filteredBets, betId];
    });
  };

  // Formatar data
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  // Formatar hora
  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Fazer a aposta
  const placeBet = () => {
    // Aqui você implementaria a lógica para enviar a aposta para o backend
    alert(`Aposta realizada com sucesso! Valor: ${formatCurrency(betAmount)}, Retorno potencial: ${formatCurrency(potentialReturn)}`);
    setSelectedBets([]);
    setBetAmount(10);
    setShowBetSlip(false);
  };

  // Grupos de apostas
  const betGroups = [
    { id: 'winner', name: 'Resultado da Partida' },
    { id: 'kills', name: 'Total de Kills' },
    { id: 'first_booyah', name: 'Primeiro Booyah' },
    { id: 'total_booyahs', name: 'Total de Booyahs' },
  ];

  if (isLoading) {
    return (
      <div className="container py-16">
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="container py-16">
        <div className="card text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Partida não encontrada</h2>
          <p className="text-muted mb-6">
            Não foi possível encontrar detalhes para esta partida.
          </p>
          <Link href="/matches" className="btn-primary">
            Voltar para partidas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-16">
      <div className="container">
        <div className="mb-8">
          <Link 
            href="/matches" 
            className="inline-flex items-center text-muted hover:text-foreground"
          >
            <ArrowLeft className="mr-2" size={16} />
            Voltar para partidas
          </Link>
        </div>

        {/* Cabeçalho da partida */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6">
            <div className="w-full md:w-1/2 space-y-6">
              <div className="text-sm text-muted flex items-center mb-1">
                <Award className="mr-1" size={16} />
                {match.tournament}
              </div>
              <div className="text-sm text-muted flex items-center mb-1">
                <Calendar className="mr-1" size={16} />
                {formatDate(match.date)}
              </div>
              <div className="text-sm text-muted flex items-center">
                <Clock className="mr-1" size={16} />
                {formatTime(match.date)}
              </div>
            </div>
            
            <div className="w-full md:w-1/2 space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-card-hover rounded-full flex items-center justify-center mb-3">
                  <div className="font-bold text-2xl">{match.team1.name.substring(0, 1)}</div>
                </div>
                <div className="font-bold text-xl">{match.team1.name}</div>
              </div>

              <div className="mx-4">
                <div className="text-2xl font-bold my-4">VS</div>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-card-hover rounded-full flex items-center justify-center mb-3">
                  <div className="font-bold text-2xl">{match.team2.name.substring(0, 1)}</div>
                </div>
                <div className="font-bold text-xl">{match.team2.name}</div>
              </div>
            </div>
          </div>

          {match.description && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-start">
                <Info className="mt-1 mr-2 text-muted" size={16} />
                <p className="text-muted">{match.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Seção de apostas */}
        {match.status === 'upcoming' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold mb-6">Apostas Disponíveis</h2>

              <div className="space-y-6">
                {betGroups.map(group => {
                  const groupOptions = betOptions.filter(option => option.type === group.id);
                  if (groupOptions.length === 0) return null;

                  return (
                    <div key={group.id} className="card">
                      <h3 className="text-lg font-semibold mb-4">{group.name}</h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {groupOptions.map(option => (
                          <button
                            key={option.id}
                            className={`relative border rounded-md p-3 transition-all ${
                              selectedBets.includes(option.id)
                                ? 'border-primary bg-primary/10'
                                : 'border-border bg-card-hover hover:bg-card-hover/80'
                            }`}
                            onClick={() => handleBetSelection(option.id)}
                          >
                            <div className="text-sm mb-1 pr-6">{option.name}</div>
                            <div className="font-bold text-primary">{option.odds.toFixed(2)}</div>
                            {selectedBets.includes(option.id) && (
                              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-white text-xs">
                                ✓
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cartão de apostas */}
            <div className="md:col-span-1">
              <div className="sticky top-24">
                <h2 className="text-2xl font-bold mb-6 md:hidden">Cartão de Apostas</h2>
                
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Sua Aposta</h3>
                  
                  {selectedBets.length === 0 ? (
                    <div className="text-center py-6 text-muted">
                      <p>Selecione uma ou mais opções de apostas para continuar.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 mb-6">
                        {selectedBets.map(betId => {
                          const bet = betOptions.find(option => option.id === betId);
                          if (!bet) return null;
                          
                          return (
                            <div 
                              key={bet.id} 
                              className="flex justify-between items-center bg-card-hover p-3 rounded-md"
                            >
                              <div>
                                <div className="text-sm">{bet.name}</div>
                                <div className="text-xs text-muted">
                                  {betGroups.find(g => g.id === bet.type)?.name}
                                </div>
                              </div>
                              <div className="flex items-center">
                                <div className="font-bold text-primary mr-3">{bet.odds.toFixed(2)}</div>
                                <button 
                                  className="text-muted hover:text-error"
                                  onClick={() => handleBetSelection(bet.id)}
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mb-4">
                        <label htmlFor="betAmount" className="block text-sm font-medium mb-1 text-muted">
                          Valor da aposta
                        </label>
                        <input
                          type="number"
                          id="betAmount"
                          min="5"
                          max="10000"
                          className="bg-card-hover border border-border rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary/50"
                          value={betAmount}
                          onChange={(e) => setBetAmount(Math.max(5, Number(e.target.value)))}
                        />
                      </div>

                      <div className="bg-card-hover p-3 rounded-md mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-muted">Valor da aposta:</div>
                          <div className="font-medium">{formatCurrency(betAmount)}</div>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-muted">Odds totais:</div>
                          <div className="font-medium">
                            {betOptions
                              .filter(option => selectedBets.includes(option.id))
                              .reduce((acc, option) => acc * option.odds, 1)
                              .toFixed(2)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-border">
                          <div className="text-sm font-medium">Retorno potencial:</div>
                          <div className="font-bold text-success">{formatCurrency(potentialReturn)}</div>
                        </div>
                      </div>

                      <button
                        className="btn-primary w-full py-2"
                        onClick={placeBet}
                      >
                        Fazer Aposta
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botão flutuante para apostas (mobile) */}
        {match.status === 'upcoming' && selectedBets.length > 0 && (
          <div className="md:hidden fixed bottom-4 right-4 left-4">
            <button
              className="btn-primary w-full py-3 flex items-center justify-between shadow-lg"
              onClick={() => setShowBetSlip(true)}
            >
              <span>Ver apostas ({selectedBets.length})</span>
              <span>{formatCurrency(potentialReturn)}</span>
            </button>
          </div>
        )}

        {/* Modal de apostas (mobile) */}
        {showBetSlip && (
          <div className="fixed inset-0 bg-background/90 z-50 flex flex-col md:hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-bold">Sua Aposta</h2>
              <button 
                className="p-2"
                onClick={() => setShowBetSlip(false)}
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3 mb-6">
                {selectedBets.map(betId => {
                  const bet = betOptions.find(option => option.id === betId);
                  if (!bet) return null;
                  
                  return (
                    <div 
                      key={bet.id} 
                      className="flex justify-between items-center bg-card-hover p-3 rounded-md"
                    >
                      <div>
                        <div className="text-sm">{bet.name}</div>
                        <div className="text-xs text-muted">
                          {betGroups.find(g => g.id === bet.type)?.name}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="font-bold text-primary mr-3">{bet.odds.toFixed(2)}</div>
                        <button 
                          className="text-muted hover:text-error"
                          onClick={() => handleBetSelection(bet.id)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mb-4">
                <label htmlFor="mobileBetAmount" className="block text-sm font-medium mb-1 text-muted">
                  Valor da aposta
                </label>
                <input
                  type="number"
                  id="mobileBetAmount"
                  min="5"
                  max="10000"
                  className="bg-card-hover border border-border rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(5, Number(e.target.value)))}
                />
              </div>

              <div className="bg-card-hover p-3 rounded-md mb-6">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-muted">Valor da aposta:</div>
                  <div className="font-medium">{formatCurrency(betAmount)}</div>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-muted">Odds totais:</div>
                  <div className="font-medium">
                    {betOptions
                      .filter(option => selectedBets.includes(option.id))
                      .reduce((acc, option) => acc * option.odds, 1)
                      .toFixed(2)}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <div className="text-sm font-medium">Retorno potencial:</div>
                  <div className="font-bold text-success">{formatCurrency(potentialReturn)}</div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-border">
              <button
                className="btn-primary w-full py-3"
                onClick={placeBet}
              >
                Fazer Aposta
              </button>
            </div>
          </div>
        )}

        {/* Odds e prêmios */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6">
            <div className="w-full md:w-1/2 space-y-6">
              <div className="bg-card-bg border border-gray-700 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-4">Odds e Prêmios</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-background p-3 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Valor de entrada</div>
                    <div className="text-xl font-bold text-green-500">{formatCurrency(match.entryFee || 0)}</div>
                  </div>
                  <div className="bg-background p-3 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Retorno potencial</div>
                    <div className="text-xl font-bold text-purple-500">{formatCurrency(match.prize || 0)}</div>
                  </div>
                </div>
                
                {/* Banner do patrocinador de odds */}
                <div className="mt-4">
                  <div className="text-sm text-gray-400 mb-2">Odds fornecidas por:</div>
                  <SponsorBanner variant="compact" className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 