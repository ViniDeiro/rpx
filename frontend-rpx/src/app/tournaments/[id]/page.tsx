'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, Award, Clock, Users, ChevronRight, Shield, Hexagon, AlertCircle, ArrowLeft, Check, X, Trophy } from 'react-feather';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

// Componente para exibir o bracket do torneio
const TournamentBracket = ({ matches, status }: { matches: any, status: string }) => {
  const rounds = Object.keys(matches).sort((a, b) => parseInt(a) - parseInt(b));
  
  if (!rounds.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Trophy size={48} className="text-gray-400 mb-4" />
        <p className="text-gray-400 text-center">
          Bracket ainda não foi gerado para este torneio.
        </p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 py-6 min-w-[800px]">
        {rounds.map(round => (
          <div key={round} className="flex-1">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium">Rodada {round}</h3>
              <p className="text-sm text-gray-400">
                {round === rounds[rounds.length - 1] ? 'Final' : `${matches[round].length} partidas`}
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              {matches[round].map((match: any) => (
                <div 
                  key={match._id} 
                  className={`
                    p-4 rounded-lg border 
                    ${match.status === 'completed' ? 'border-green-500/30 bg-green-900/20' : 
                      match.status === 'in_progress' ? 'border-blue-500/30 bg-blue-900/20' : 
                      'border-gray-600 bg-gray-800/50'}
                  `}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">Match #{match.matchNumber}</span>
                    <span className={`
                      text-xs px-2 py-0.5 rounded-full
                      ${match.status === 'completed' ? 'bg-green-900/40 text-green-400' : 
                        match.status === 'in_progress' ? 'bg-blue-900/40 text-blue-400' : 
                        'bg-gray-900/40 text-gray-400'}
                    `}>
                      {match.status === 'completed' ? 'Finalizado' : 
                       match.status === 'in_progress' ? 'Em andamento' : 
                       'Agendado'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className={`
                      flex justify-between items-center p-2 rounded 
                      ${match.winnerId === match.participant1Id?._id ? 'bg-green-900/20 border border-green-500/20' : 'bg-gray-800'}
                    `}>
                      <div className="flex items-center">
                        {match.participant1Id ? (
                          <>
                            <div className="w-6 h-6 rounded-full bg-gray-700 mr-2 overflow-hidden">
                              {match.participant1Id.avatar && (
                                <Image 
                                  src={match.participant1Id.avatar} 
                                  alt={match.participant1Id.username} 
                                  width={24} 
                                  height={24} 
                                />
                              )}
                            </div>
                            <span>{match.participant1Id.username || 'Jogador 1'}</span>
                          </>
                        ) : (
                          <span className="text-gray-500">TBD</span>
                        )}
                      </div>
                      <div className="min-w-[30px] text-right">
                        {match.status === 'completed' && match.score1 !== undefined ? match.score1 : '-'}
                      </div>
                    </div>
                    
                    <div className={`
                      flex justify-between items-center p-2 rounded 
                      ${match.winnerId === match.participant2Id?._id ? 'bg-green-900/20 border border-green-500/20' : 'bg-gray-800'}
                    `}>
                      <div className="flex items-center">
                        {match.participant2Id ? (
                          <>
                            <div className="w-6 h-6 rounded-full bg-gray-700 mr-2 overflow-hidden">
                              {match.participant2Id.avatar && (
                                <Image 
                                  src={match.participant2Id.avatar} 
                                  alt={match.participant2Id.username} 
                                  width={24} 
                                  height={24} 
                                />
                              )}
                            </div>
                            <span>{match.participant2Id.username || 'Jogador 2'}</span>
                          </>
                        ) : (
                          <span className="text-gray-500">TBD</span>
                        )}
                      </div>
                      <div className="min-w-[30px] text-right">
                        {match.status === 'completed' && match.score2 !== undefined ? match.score2 : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Página de detalhes do torneio
export default function TournamentDetail() {
  const router = useRouter();
  const { id } = useParams();
  const { data: session } = useSession();
  
  const [tournament, setTournament] = useState<any>(null);
  const [matches, setMatches] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  
  // Buscar detalhes do torneio
  useEffect(() => {
    async function fetchTournamentDetails() {
      if (!id) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/tournaments/${id}`);
        
        if (!response.ok) {
          throw new Error('Falha ao buscar detalhes do torneio');
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
          setTournament(data.data.tournament);
          
          // Verificar se o usuário está registrado
          if (session?.user?.id && data.data.tournament.participants) {
            const userParticipant = data.data.tournament.participants.find(
              (p: any) => p.userId === session.user.id
            );
            setIsRegistered(!!userParticipant);
          }
        } else {
          setError(data.error || 'Erro ao carregar dados do torneio');
        }
      } catch (err) {
        console.error('Erro ao buscar detalhes do torneio:', err);
        setError('Não foi possível carregar os detalhes do torneio');
      } finally {
        setLoading(false);
      }
    }
    
    // Buscar partidas do torneio
    async function fetchTournamentMatches() {
      if (!id) return;
      
      try {
        const response = await fetch(`/api/tournaments/${id}/matches`);
        
        if (!response.ok) {
          throw new Error('Falha ao buscar partidas do torneio');
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
          setMatches(data.data.matches || {});
        }
      } catch (err) {
        console.error('Erro ao buscar partidas do torneio:', err);
      }
    }
    
    fetchTournamentDetails();
    fetchTournamentMatches();
  }, [id, session]);
  
  // Função para registrar-se no torneio
  const handleRegister = async () => {
    if (!session) {
      toast.error('Você precisa estar logado para se inscrever');
      return;
    }
    
    setRegistrationLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setIsRegistered(true);
        toast.success('Inscrição realizada com sucesso!');
      } else {
        toast.error(data.error || 'Erro ao se inscrever no torneio');
      }
    } catch (err) {
      console.error('Erro ao se inscrever:', err);
      toast.error('Falha ao processar sua inscrição');
    } finally {
      setRegistrationLoading(false);
    }
  };
  
  // Função para cancelar inscrição
  const handleCancelRegistration = async () => {
    if (!session) {
      return;
    }
    
    setRegistrationLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${id}/register`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setIsRegistered(false);
        toast.success('Inscrição cancelada com sucesso');
      } else {
        toast.error(data.error || 'Erro ao cancelar inscrição');
      }
    } catch (err) {
      console.error('Erro ao cancelar inscrição:', err);
      toast.error('Falha ao processar o cancelamento');
    } finally {
      setRegistrationLoading(false);
    }
  };
  
  // Renderizar estado de carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Carregando detalhes do torneio...</p>
        </div>
      </div>
    );
  }
  
  // Renderizar erro
  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/tournaments" className="flex items-center text-gray-400 hover:text-white mb-8">
            <ArrowLeft size={16} className="mr-2" />
            Voltar para Torneios
          </Link>
          
          <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-lg text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
            <h2 className="text-xl mb-2">Erro ao carregar torneio</h2>
            <p className="text-gray-400">{error || 'Torneio não encontrado'}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Converter datas para formato legível
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Determinar status do torneio
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'registration':
        return { label: 'Inscrições Abertas', class: 'bg-green-900/40 text-green-400 border border-green-500/30' };
      case 'in_progress':
        return { label: 'Em Andamento', class: 'bg-blue-900/40 text-blue-400 border border-blue-500/30' };
      case 'completed':
        return { label: 'Finalizado', class: 'bg-gray-900/40 text-gray-400 border border-gray-500/30' };
      case 'published':
        return { label: 'Em Breve', class: 'bg-yellow-900/40 text-yellow-400 border border-yellow-500/30' };
      default:
        return { label: status, class: 'bg-gray-900/40 text-gray-400 border border-gray-500/30' };
    }
  };
  
  // Renderizar ícone do formato
  const renderFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'solo':
        return <Shield size={18} className="mr-2" />;
      case 'duo':
        return <Users size={18} className="mr-2" />;
      case 'squad':
        return <Hexagon size={18} className="mr-2" />;
      default:
        return <Award size={18} className="mr-2" />;
    }
  };
  
  // Formatar prize pool
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };
  
  const statusInfo = getStatusDisplay(tournament.status);
  
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/tournaments" className="flex items-center text-gray-400 hover:text-white mb-6">
          <ArrowLeft size={16} className="mr-2" />
          Voltar para Torneios
        </Link>
        
        {/* Cabeçalho do torneio */}
        <div className="relative rounded-xl overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-blue-900/60 z-10"></div>
          {tournament.bannerImage ? (
            <Image 
              src={tournament.bannerImage} 
              alt={tournament.name} 
              width={1200} 
              height={300} 
              className="w-full h-60 object-cover"
            />
          ) : (
            <div className="w-full h-60 bg-gradient-to-r from-purple-900 to-blue-900"></div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
            <div className="flex justify-between items-end">
              <div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${statusInfo.class}`}>
                  {statusInfo.label}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold">{tournament.name}</h1>
              </div>
              
              <div className="hidden md:block">
                {tournament.status === 'registration' && !isRegistered && (
                  <button 
                    onClick={handleRegister}
                    disabled={registrationLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium flex items-center disabled:opacity-50"
                  >
                    {registrationLoading ? (
                      <span className="flex items-center">
                        <span className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></span>
                        Processando...
                      </span>
                    ) : (
                      <>
                        <Check size={18} className="mr-2" />
                        Inscrever-se
                      </>
                    )}
                  </button>
                )}
                
                {tournament.status === 'registration' && isRegistered && (
                  <button 
                    onClick={handleCancelRegistration}
                    disabled={registrationLoading}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium flex items-center disabled:opacity-50"
                  >
                    {registrationLoading ? (
                      <span className="flex items-center">
                        <span className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></span>
                        Processando...
                      </span>
                    ) : (
                      <>
                        <X size={18} className="mr-2" />
                        Cancelar Inscrição
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Informações e bracket */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna esquerda - Informações */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Informações</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Calendar size={18} className="text-gray-400 mt-1 mr-3" />
                  <div>
                    <h3 className="text-sm text-gray-400">Data do Torneio</h3>
                    <p>{formatDate(tournament.startDate)}</p>
                    {tournament.endDate !== tournament.startDate && (
                      <p className="text-sm text-gray-500">Até {formatDate(tournament.endDate)}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock size={18} className="text-gray-400 mt-1 mr-3" />
                  <div>
                    <h3 className="text-sm text-gray-400">Prazo de Inscrição</h3>
                    <p>{formatDate(tournament.registrationEndDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Award size={18} className="text-gray-400 mt-1 mr-3" />
                  <div>
                    <h3 className="text-sm text-gray-400">Premiação Total</h3>
                    <p className="text-xl font-bold text-yellow-400">{formatCurrency(tournament.prizePool)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Users size={18} className="text-gray-400 mt-1 mr-3" />
                  <div>
                    <h3 className="text-sm text-gray-400">Participantes</h3>
                    <p>{tournament.currentParticipants} / {tournament.maxParticipants}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex text-gray-400 mt-1 mr-3">
                    {renderFormatIcon(tournament.format)}
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-400">Formato</h3>
                    <p>{tournament.format}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Trophy size={18} className="text-gray-400 mt-1 mr-3" />
                  <div>
                    <h3 className="text-sm text-gray-400">Tipo de Eliminação</h3>
                    <p>
                      {tournament.bracketType === 'single_elimination' && 'Eliminação Simples'}
                      {tournament.bracketType === 'double_elimination' && 'Eliminação Dupla'}
                      {tournament.bracketType === 'round_robin' && 'Todos contra Todos'}
                      {tournament.bracketType === 'swiss' && 'Sistema Suíço'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Botão móvel */}
            <div className="lg:hidden mb-6">
              {tournament.status === 'registration' && !isRegistered && (
                <button 
                  onClick={handleRegister}
                  disabled={registrationLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center w-full disabled:opacity-50"
                >
                  {registrationLoading ? (
                    <span className="flex items-center">
                      <span className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></span>
                      Processando...
                    </span>
                  ) : (
                    <>
                      <Check size={18} className="mr-2" />
                      Inscrever-se
                    </>
                  )}
                </button>
              )}
              
              {tournament.status === 'registration' && isRegistered && (
                <button 
                  onClick={handleCancelRegistration}
                  disabled={registrationLoading}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center w-full disabled:opacity-50"
                >
                  {registrationLoading ? (
                    <span className="flex items-center">
                      <span className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></span>
                      Processando...
                    </span>
                  ) : (
                    <>
                      <X size={18} className="mr-2" />
                      Cancelar Inscrição
                    </>
                  )}
                </button>
              )}
            </div>
            
            {/* Premiação */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Premiação</h2>
              
              {tournament.prizes && tournament.prizes.length > 0 ? (
                <div className="space-y-4">
                  {tournament.prizes.map((prize: any, index: number) => (
                    <div key={index} className="flex items-center p-3 bg-gray-700/30 rounded-lg">
                      <div className={`
                        w-10 h-10 flex items-center justify-center rounded-full mr-3
                        ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-700' : 'bg-purple-600'}
                      `}>
                        {index + 1}º
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{prize.description}</p>
                        {prize.cashAmount > 0 && <p className="text-yellow-400">{formatCurrency(prize.cashAmount)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Informações sobre premiação serão divulgadas em breve.</p>
              )}
            </div>
          </div>
          
          {/* Coluna direita - Descrição e Bracket */}
          <div className="lg:col-span-2 space-y-8">
            {/* Descrição */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Sobre o Torneio</h2>
              <div className="prose prose-invert max-w-none">
                <p>{tournament.description}</p>
              </div>
            </div>
            
            {/* Regras */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Regras</h2>
              <div className="prose prose-invert max-w-none">
                <p>{tournament.gameRules}</p>
              </div>
            </div>
            
            {/* Bracket */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Bracket do Torneio</h2>
              <TournamentBracket matches={matches} status={tournament.status} />
            </div>
            
            {/* Participantes */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">
                Participantes ({tournament.participants.length}/{tournament.maxParticipants})
              </h2>
              
              {tournament.participants && tournament.participants.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {tournament.participants.map((participant: any) => (
                    <div key={participant._id} className="flex items-center p-3 bg-gray-700/30 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gray-600 mr-3 overflow-hidden">
                        {participant.userId?.avatar && (
                          <Image 
                            src={participant.userId.avatar}
                            alt={participant.userId.username || 'Participante'}
                            width={40}
                            height={40}
                          />
                        )}
                      </div>
                      <div className="truncate">
                        <p className="font-medium truncate">
                          {participant.userId?.username || 'Participante'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {participant.status === 'confirmed' ? 'Confirmado' : 
                           participant.status === 'pending' ? 'Pendente' : 
                           participant.status === 'eliminated' ? 'Eliminado' : 
                           participant.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Nenhum participante inscrito ainda.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 