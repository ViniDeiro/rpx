'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  User, Lock, Shield, Activity, LogOut, Edit, ChevronRight, 
  Clock, Award, Star, Calendar, Gift, Settings, Zap,
  PieChart, TrendingUp, Users, MessageCircle
} from 'react-feather';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Medal } from '@/components/ui/icons';
import { RankTier, calculateRank, calculateRankProgress } from '@/utils/ranking';
import ProfileBanner from '@/components/profile/ProfileBanner';
import ProfileAvatar from '@/components/profile/ProfileAvatar';

interface ExtendedStats {
  matches?: number;
  wins?: number;
  losses?: number;
  rankPoints?: number;
  earnings?: number;
}

interface ExtendedUser {
  id: string;
  username?: string;
  email?: string;
  profile?: {
    name?: string;
    avatar?: string;
  };
  balance?: number;
  createdAt?: string;
  stats?: ExtendedStats;
}

interface Rank {
  tier: string;
  division?: string;
  name: string;
  points: number;
  image: string;
  nextRank?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [activeTab, setActiveTab] = useState<'resumo' | 'estatísticas' | 'conquistas' | 'amigos'>('resumo');

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setRedirecting(true);
      // Aguardar 1 segundo antes de redirecionar
      const timer = setTimeout(() => {
        router.push('/auth/login');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, router]);

  // Função para formatar a data
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0D0A2A] to-[#120821] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0D0A2A] to-[#120821] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <Lock size={48} className="text-primary/80 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-white">Acesso Restrito</h2>
          <p className="text-white/70 mb-4">Você precisa estar logado para acessar esta página. Redirecionando para o login...</p>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Calcular Rank do usuário (será obtido do back-end)
  const userRank = calculateRank(user?.stats?.rankPoints || 0);
  const rankProgress = calculateRankProgress(userRank);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0D0A2A] to-[#120821] pb-12">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/images/stars-bg.png')] bg-repeat opacity-30 animate-twinkle"></div>
        <div className="absolute -top-[400px] left-1/3 w-[800px] h-[1000px] bg-gradient-to-b from-[#A44BE1]/10 to-transparent rotate-15 animate-beam-move-slow"></div>
        <div className="absolute -top-[300px] right-1/3 w-[600px] h-[800px] bg-gradient-to-b from-[#5271FF]/10 to-transparent -rotate-15 animate-beam-move-delay"></div>
      </div>

      {/* Banner do perfil */}
      <div className="relative z-10">
        <ProfileBanner />
      </div>
      
      <div className="container mx-auto px-4 pt-2 -mt-28 relative z-10">
        {/* Header com Avatar e Informações Principais */}
        <div className="bg-card-bg/40 backdrop-blur-md rounded-xl border border-white/10 shadow-xl overflow-hidden mb-8">
          <div className="px-6 pt-16 pb-8 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-8 relative">
            {/* Avatar - Diminuindo ainda mais o tamanho do contêiner */}
            <div className="absolute top-0 md:top-auto md:relative md:top-auto transform -translate-y-1/2 md:transform-none z-20 md:mb-0 md:ml-4">
              <div className="scale-100 md:scale-100">
                <ProfileAvatar size="lg" rankTier={userRank.tier as RankTier} />
              </div>
            </div>
            
            {/* Informações do usuário - Ajustando para o novo layout */}
            <div className="flex-1 text-center md:text-left md:ml-16">
              <h1 className="text-3xl font-bold text-white mb-1">{user?.username || 'Jogador'}</h1>
              <div className="text-white/60 flex flex-col md:flex-row gap-1 md:gap-4 items-center md:items-start">
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  Membro desde {formatDate(user?.createdAt || '')}
                </span>
                <span className="flex items-center gap-1">
                  <Star size={16} />
                  {user?.stats?.matches || 0} partidas
                </span>
              </div>
            </div>
            
            {/* Estatísticas rápidas */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-6 py-3 text-center min-w-28">
                <div className="font-bold text-xl text-white">{formatCurrency(user?.balance || 0)}</div>
                <div className="text-xs text-white/60 uppercase tracking-wide">Saldo</div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-6 py-3 text-center min-w-28">
                <div className="font-bold text-xl text-white">{userRank.name}</div>
                <div className="text-xs text-white/60 uppercase tracking-wide">Ranking</div>
              </div>
            </div>
            
            {/* Botões de Ação */}
            <div className="flex gap-2">
              <Link href="/profile/edit" className="bg-white/10 hover:bg-white/20 transition-colors p-2.5 rounded-lg flex items-center justify-center">
                <Edit size={18} />
              </Link>
              <Link href="/profile/settings" className="bg-white/10 hover:bg-white/20 transition-colors p-2.5 rounded-lg flex items-center justify-center">
                <Settings size={18} />
              </Link>
            </div>
          </div>
          
          {/* Tabs para navegação */}
          <div className="flex border-t border-white/10">
            <button 
              onClick={() => setActiveTab('resumo')}
              className={`flex-1 py-4 px-2 text-center text-sm font-medium transition-colors ${
                activeTab === 'resumo' 
                  ? 'text-white border-b-2 border-primary' 
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Resumo
            </button>
            <button 
              onClick={() => setActiveTab('estatísticas')}
              className={`flex-1 py-4 px-2 text-center text-sm font-medium transition-colors ${
                activeTab === 'estatísticas' 
                  ? 'text-white border-b-2 border-primary' 
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Estatísticas
            </button>
            <button 
              onClick={() => setActiveTab('conquistas')}
              className={`flex-1 py-4 px-2 text-center text-sm font-medium transition-colors ${
                activeTab === 'conquistas' 
                  ? 'text-white border-b-2 border-primary' 
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Conquistas
            </button>
            <button 
              onClick={() => setActiveTab('amigos')}
              className={`flex-1 py-4 px-2 text-center text-sm font-medium transition-colors ${
                activeTab === 'amigos' 
                  ? 'text-white border-b-2 border-primary' 
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Amigos
            </button>
          </div>
        </div>
        
        {/* Conteúdo principal baseado na tab ativa */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Coluna da esquerda */}
          <div className="md:col-span-1 space-y-6">
            {/* Card do ranking */}
            <div className="bg-card-bg/40 backdrop-blur-md rounded-xl border border-white/10 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#2D0A57]/50 to-[#0D0A2A]/50 px-6 py-4 border-b border-white/5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Trophy size={16} className="text-yellow-500" />
                  Ranking
                </h2>
              </div>
              
              <div className="p-6">
                <div className="flex flex-col items-center">
                  {/* Emblema do Rank */}
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-r p-1 mb-4 ${
                    userRank.tier === 'bronze' ? 'from-amber-700 to-amber-500' :
                    userRank.tier === 'prata' ? 'from-gray-400 to-gray-300' :
                    userRank.tier === 'ouro' ? 'from-yellow-600 to-yellow-400' :
                    userRank.tier === 'platina' ? 'from-emerald-600 to-emerald-400' :
                    userRank.tier === 'diamante' ? 'from-blue-600 to-blue-400' :
                    userRank.tier === 'mestre' ? 'from-purple-600 to-purple-400' :
                    'from-fuchsia-600 to-fuchsia-400'
                  }`}>
                    <div className="w-full h-full rounded-full bg-card-bg flex items-center justify-center">
                      {userRank.tier && (
                        <Image 
                          src={userRank.image}
                          alt={userRank.name}
                          width={64}
                          height={64}
                          className="object-contain"
                        />
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-1">{userRank.name}</h3>
                  <p className="text-white/60 mb-4">{userRank.points} pontos</p>
                  
                  {/* Barra de progresso */}
                  <div className="w-full">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/60">Progresso</span>
                      <span className="font-medium text-white">{Math.round(rankProgress.progressPercentage)}%</span>
                    </div>
                    
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary-dark"
                        style={{ width: `${rankProgress.progressPercentage}%` }}
                      ></div>
                    </div>
                    
                    {userRank.nextRank && (
                      <p className="text-xs text-white/40 text-center">
                        Próximo rank: <span className="text-white">{userRank.nextRank}</span>
                      </p>
                    )}
                  </div>
                  
                  <Link href="/matches" className="mt-6 w-full bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 text-white py-2.5 px-4 rounded-lg text-sm font-medium text-center">
                    Jogar Partida Ranqueada
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Card de ações rápidas */}
            <div className="bg-card-bg/40 backdrop-blur-md rounded-xl border border-white/10 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#2D0A57]/50 to-[#0D0A2A]/50 px-6 py-4 border-b border-white/5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap size={16} className="text-primary" />
                  Ações Rápidas
                </h2>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/profile/wallet/deposit" className="bg-white/5 hover:bg-white/10 transition-all border border-white/5 rounded-lg p-4 flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <TrendingUp size={20} className="text-green-500" />
                    </div>
                    <span className="text-sm text-white">Depositar</span>
                  </Link>
                  
                  <Link href="/profile/wallet/withdraw" className="bg-white/5 hover:bg-white/10 transition-all border border-white/5 rounded-lg p-4 flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <TrendingUp size={20} className="text-blue-500 transform rotate-180" />
                    </div>
                    <span className="text-sm text-white">Sacar</span>
                  </Link>
                  
                  <Link href="/lobby" className="bg-white/5 hover:bg-white/10 transition-all border border-white/5 rounded-lg p-4 flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Activity size={20} className="text-purple-500" />
                    </div>
                    <span className="text-sm text-white">Jogar</span>
                  </Link>
                  
                  <Link href="/profile/wallet" className="bg-white/5 hover:bg-white/10 transition-all border border-white/5 rounded-lg p-4 flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <PieChart size={20} className="text-amber-500" />
                    </div>
                    <span className="text-sm text-white">Histórico</span>
                  </Link>
                </div>
                
                <button
                  onClick={() => {
                    logout();
                    router.push('/auth/login');
                  }}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-white/70 hover:text-white/90 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sair da conta</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Coluna central e direita */}
          <div className="md:col-span-2 space-y-6">
            {activeTab === 'resumo' && (
              <>
                {/* Card de resumo */}
                <div className="bg-card-bg/40 backdrop-blur-md rounded-xl border border-white/10 shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-[#2D0A57]/50 to-[#0D0A2A]/50 px-6 py-4 border-b border-white/5">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Activity size={16} className="text-primary" />
                      Resumo da Conta
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-white/60">Partidas</h3>
                          <Activity size={16} className="text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-white">{user?.stats?.matches || 0}</p>
                      </div>
                      
                      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-white/60">Vitórias</h3>
                          <Trophy size={16} className="text-yellow-500" />
                        </div>
                        <p className="text-2xl font-bold text-white">{user?.stats?.wins || 0}</p>
                      </div>
                      
                      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-white/60">Taxa de Vitória</h3>
                          <PieChart size={16} className="text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {user?.stats?.matches ? 
                            Math.round((user?.stats?.wins || 0) / user.stats.matches * 100) : 0}%
                        </p>
                      </div>
                      
                      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-white/60">Ganhos Totais</h3>
                          <Star size={16} className="text-amber-500" />
                        </div>
                        <p className="text-2xl font-bold text-white">{formatCurrency(user?.stats?.earnings || 0)}</p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-white mb-4">Histórico Recente</h3>
                      
                      {(user?.stats?.matches || 0) > 0 ? (
                        <div className="overflow-hidden rounded-lg border border-white/10">
                          <div className="relative overflow-x-auto">
                            <table className="w-full text-sm text-left">
                              <thead className="bg-white/5">
                                <tr>
                                  <th scope="col" className="px-4 py-3 text-white">Partida</th>
                                  <th scope="col" className="px-4 py-3 text-white">Data</th>
                                  <th scope="col" className="px-4 py-3 text-white">Resultado</th>
                                  <th scope="col" className="px-4 py-3 text-white text-right">Valor</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* Aqui o backend fornecerá os dados reais */}
                                <tr className="border-b border-white/5 hover:bg-white/5">
                                  <td className="px-4 py-4 text-white/80" colSpan={4}>
                                    Dados serão carregados do servidor...
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
                          <Activity size={32} className="mx-auto mb-3 text-white/40" />
                          <h4 className="text-lg font-medium text-white mb-1">Nenhuma partida jogada</h4>
                          <p className="text-white/60 mb-4">Comece a jogar agora para construir seu histórico!</p>
                          <Link href="/lobby" className="inline-block bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 text-white py-2 px-4 rounded-lg text-sm font-medium">
                            Jogar Agora
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Card de carteira */}
                <div className="bg-card-bg/40 backdrop-blur-md rounded-xl border border-white/10 shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-[#2D0A57]/50 to-[#0D0A2A]/50 px-6 py-4 border-b border-white/5">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Star size={16} className="text-amber-500" />
                        Carteira
                      </h2>
                      <Link href="/profile/wallet" className="text-sm text-primary hover:underline">
                        Ver tudo
                      </Link>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="bg-gradient-to-r from-indigo-900/50 to-blue-900/50 backdrop-blur-sm border border-white/10 rounded-lg p-5 mb-6">
                      <div className="mb-5">
                        <span className="text-sm text-white/60">Saldo disponível</span>
                        <div className="text-3xl font-bold text-white">{formatCurrency(user?.balance || 0)}</div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <Link
                          href="/profile/wallet/deposit"
                          className="bg-white/15 hover:bg-white/25 transition-colors text-sm font-medium rounded-lg py-2 px-4 flex-1 text-center text-white"
                        >
                          Depositar
                        </Link>
                        <Link
                          href="/profile/wallet/withdraw"
                          className="bg-white/15 hover:bg-white/25 transition-colors text-sm font-medium rounded-lg py-2 px-4 flex-1 text-center text-white"
                        >
                          Sacar
                        </Link>
                      </div>
                    </div>
                    
                    <h3 className="font-medium text-white mb-4">Transações recentes</h3>
                    
                    {/* Lista de transações */}
                    <div className="space-y-3">
                      {/* Aqui o backend fornecerá os dados reais */}
                      <div className="flex justify-center items-center p-4 text-white/60 text-sm border border-white/5 rounded-lg">
                        Dados de transações serão carregados do servidor...
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {activeTab === 'estatísticas' && (
              <div className="bg-card-bg/40 backdrop-blur-md rounded-xl border border-white/10 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-[#2D0A57]/50 to-[#0D0A2A]/50 px-6 py-4 border-b border-white/5">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <PieChart size={16} className="text-blue-500" />
                    Estatísticas Detalhadas
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
                    <PieChart size={32} className="mx-auto mb-3 text-white/40" />
                    <h4 className="text-lg font-medium text-white mb-1">Estatísticas em breve</h4>
                    <p className="text-white/60">Os dados estatísticos detalhados serão exibidos aqui.</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'conquistas' && (
              <div className="bg-card-bg/40 backdrop-blur-md rounded-xl border border-white/10 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-[#2D0A57]/50 to-[#0D0A2A]/50 px-6 py-4 border-b border-white/5">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Trophy size={16} className="text-yellow-500" />
                    Conquistas e Insígnias
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
                    <Trophy size={32} className="mx-auto mb-3 text-white/40" />
                    <h4 className="text-lg font-medium text-white mb-1">Conquistas em breve</h4>
                    <p className="text-white/60">Suas conquistas e insígnias serão exibidas aqui.</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'amigos' && (
              <div className="bg-card-bg/40 backdrop-blur-md rounded-xl border border-white/10 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-[#2D0A57]/50 to-[#0D0A2A]/50 px-6 py-4 border-b border-white/5">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users size={16} className="text-blue-500" />
                    Amigos
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="flex mb-4">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Buscar amigos..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <button className="ml-2 bg-primary hover:bg-primary-dark transition-colors rounded-lg px-4 py-2 text-white">
                      <Users size={16} />
                    </button>
                  </div>
                  
                  <div className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
                    <Users size={32} className="mx-auto mb-3 text-white/40" />
                    <h4 className="text-lg font-medium text-white mb-1">Lista de amigos em breve</h4>
                    <p className="text-white/60">Seus amigos serão exibidos aqui.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 