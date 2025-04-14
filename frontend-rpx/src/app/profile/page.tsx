'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { User, Lock, Shield, Activity, LogOut, Edit, ChevronRight, Clock, Award, Star } from 'react-feather';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/formatters';
import ProfileBanner from '@/components/profile/ProfileBanner';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { Trophy, Medal } from '@/components/ui/icons';
import { 
  RankTier, 
  RANK_FRAMES, 
  calculateRank, 
  calculateRankProgress 
} from '@/utils/ranking';

// Definição de tipos para insígnias
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  date?: string;
  rarity: 'comum' | 'raro' | 'épico' | 'lendário';
}

// Dados mockados para rankings e insígnias
const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_win',
    name: 'Primeira Vitória',
    description: 'Ganhou sua primeira aposta',
    icon: '/images/badges/first-win.png',
    date: '2023-10-15',
    rarity: 'comum'
  },
  {
    id: 'hot_streak',
    name: 'Sequência Quente',
    description: 'Ganhou 5 apostas consecutivas',
    icon: '/images/badges/hot-streak.png',
    date: '2023-11-22',
    rarity: 'raro'
  },
  {
    id: 'high_roller',
    name: 'Alto Apostador',
    description: 'Apostou mais de R$1.000 em uma única aposta',
    icon: '/images/badges/high-roller.png',
    date: '2023-12-01',
    rarity: 'épico'
  },
  {
    id: 'tournament_1',
    name: 'Campeonato Regional 2023',
    description: 'Participou do Campeonato Regional 2023',
    icon: '/images/badges/tournament-regional.png',
    date: '2023-09-28',
    rarity: 'épico'
  },
  {
    id: 'national_champion',
    name: 'Campeão Nacional',
    description: 'Venceu o Campeonato Nacional 2023',
    icon: '/images/badges/national-champion.png',
    date: '2023-11-05',
    rarity: 'lendário'
  }
];

// Componente para exibir insígnias
const AchievementBadge = ({ achievement }: { achievement: Achievement }) => {
  const rarityColors = {
    comum: 'bg-gray-500',
    raro: 'bg-blue-500',
    épico: 'bg-purple-500',
    lendário: 'bg-yellow-500'
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${rarityColors[achievement.rarity]} bg-opacity-20 border-2 border-opacity-50 ${rarityColors[achievement.rarity].replace('bg-', 'border-')}`}>
        {/* Placeholder para ícone da insígnia */}
        {achievement.id === 'first_win' && <Award size={24} className="text-yellow-400" />}
        {achievement.id === 'hot_streak' && <Activity size={24} className="text-red-400" />}
        {achievement.id === 'high_roller' && <Star size={24} className="text-blue-400" />}
        {achievement.id === 'tournament_1' && <Trophy size={24} className="text-purple-400" />}
        {achievement.id === 'national_champion' && <Medal size={24} className="text-yellow-400" />}
      </div>
      <span className="text-xs mt-1 text-gray-300 font-medium">{achievement.name}</span>
    </div>
  );
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [userRankPoints, setUserRankPoints] = useState(0);
  const [userAchievements, setUserAchievements] = useState<Achievement[]>([]);

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setRedirecting(true);
      // Aguardar 2 segundos antes de redirecionar para mostrar a mensagem
      const timer = setTimeout(() => {
        router.push('/auth/login');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, router]);

  // Carregar rank e conquistas do usuário
  useEffect(() => {
    if (isAuthenticated && user) {
      // Aqui você faria uma chamada à API
      // Por enquanto estamos usando dados mockados
      
      // Simular pontos baseados no ID do usuário
      const basePoints = parseInt(user.id?.toString().slice(-4) || '0');
      const rankPoints = Math.min(Math.max(basePoints * 10, 0), 3500);
      setUserRankPoints(rankPoints);
      
      // Simular conquistas
      // Em produção, buscaria do backend
      setUserAchievements(MOCK_ACHIEVEMENTS.slice(0, 3));
    }
  }, [isAuthenticated, user]);

  // Calcular o rank com base nos pontos
  const userRank = calculateRank(userRankPoints);
  const rankProgress = calculateRankProgress(userRank);

  // Função para formatar a data
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não disponível';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <Lock size={48} className="text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-gray-400 mb-4">Você precisa estar logado para acessar esta página. Redirecionando para o login...</p>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Banner do perfil */}
      <ProfileBanner />
      
      <div className="container mx-auto px-4 pb-16 -mt-24 relative z-10">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Coluna da esquerda - Informações do perfil */}
          <div className="lg:w-1/3 space-y-6">
            {/* Card do perfil */}
            <div className="bg-card-bg rounded-xl border border-gray-800 shadow-xl overflow-hidden">
              <div className="pt-6 px-6 pb-4 text-center relative">
                <ProfileAvatar size="lg" rankTier={userRank.tier} />
                
                <div className="mt-4">
                  <h1 className="text-2xl font-bold">{user?.name || 'Usuário RPX'}</h1>
                  <p className="text-gray-400 text-sm">Membro desde {formatDate(user?.createdAt || '2023-01-01')}</p>
                </div>
                
                <div className="absolute top-4 right-4">
                  <button className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                    <Edit size={16} />
                  </button>
                </div>
              </div>
              
              <div className="border-t border-gray-800 px-6 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Nível</span>
                  <span className="font-bold">12</span>
                </div>
              </div>
              
              {/* Barra de XP */}
              <div className="px-6 pb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>725 XP</span>
                  <span>1200 XP</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-blue-500 w-[60%]"></div>
                </div>
              </div>
              
              <div className="border-t border-gray-800 py-4 px-6">
                <button
                  onClick={() => logout()}
                  className="flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  <LogOut size={16} className="mr-2" />
                  <span>Sair da conta</span>
                </button>
              </div>
            </div>
            
            {/* Card do ranking */}
            <div className="bg-card-bg rounded-xl border border-gray-800 shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Ranking</h2>
                  <Link href="/profile/ranking" className="text-primary text-sm hover:underline">Ver detalhes</Link>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-b ${userRank.color} p-1 mb-3`}>
                    <div className="bg-card-bg rounded-full w-full h-full flex items-center justify-center">
                      <img 
                        src={userRank.image} 
                        alt={userRank.name} 
                        className="w-16 h-16 object-contain" 
                      />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-1">{userRank.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{userRank.points} pontos</p>
                  
                  {/* Barra de progresso */}
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Progresso</span>
                      <span className="font-medium">{Math.round(rankProgress.progressPercentage)}%</span>
                    </div>
                    
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${userRank.color}`}
                        style={{ width: `${rankProgress.progressPercentage}%` }}
                      ></div>
                    </div>
                    
                    {userRank.tier !== 'challenger' && (
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>
                          {userRank.division ? `${userRank.tier.toUpperCase()} ${userRank.division}` : userRank.tier.toUpperCase()}
                        </span>
                        <span>
                          {userRank.division === 'I' 
                            ? `Próximo: ${Object.keys(RANK_FRAMES)[Object.keys(RANK_FRAMES).indexOf(userRank.tier) + 1]?.toUpperCase() || ''} IV` 
                            : `Próximo: ${userRank.tier.toUpperCase()} ${
                              userRank.division ? 
                                ['IV', 'III', 'II', 'I'][['IV', 'III', 'II', 'I'].indexOf(userRank.division) + 1] : 
                                ''
                              }`
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-center mt-6">
                  <Link 
                    href="/matches"
                    className="bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 text-white py-2 px-4 rounded-lg text-sm font-medium"
                  >
                    Jogar Partida Ranqueada
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Card da carteira */}
            <div className="bg-card-bg rounded-xl border border-gray-800 shadow-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Carteira</h2>
                
                <div className="p-4 bg-gradient-to-r from-indigo-900 to-blue-900 rounded-lg mb-5">
                  <div className="mb-4">
                    <span className="text-sm text-blue-200/80">Saldo disponível</span>
                    <div className="text-2xl font-bold">{formatCurrency(user?.balance || 0)}</div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      href="/profile/wallet/deposit"
                      className="bg-white/15 hover:bg-white/25 transition-colors text-sm font-medium rounded py-1 px-3 flex-1 text-center"
                    >
                      Depositar
                    </Link>
                    <Link
                      href="/profile/wallet/withdraw"
                      className="bg-white/15 hover:bg-white/25 transition-colors text-sm font-medium rounded py-1 px-3 flex-1 text-center"
                    >
                      Sacar
                    </Link>
                  </div>
                </div>
                
                <h3 className="font-medium text-gray-300 mb-2">Transações recentes</h3>
                
                {/* Lista de transações */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 rounded hover:bg-card-hover cursor-pointer">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mr-3">
                        <span className="text-green-500 text-sm">+</span>
                      </div>
                      <div>
                        <div className="font-medium">Depósito</div>
                        <div className="text-xs text-gray-500">Hoje, 14:32</div>
                      </div>
                    </div>
                    <div className="text-green-500 font-medium">
                      +R$ 100,00
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-2 rounded hover:bg-card-hover cursor-pointer">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                        <span className="text-purple-500 text-sm">A</span>
                      </div>
                      <div>
                        <div className="font-medium">Aposta</div>
                        <div className="text-xs text-gray-500">Ontem, 10:15</div>
                      </div>
                    </div>
                    <div className="text-red-500 font-medium">
                      -R$ 50,00
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-2 rounded hover:bg-card-hover cursor-pointer">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                        <span className="text-blue-500 text-sm">V</span>
                      </div>
                      <div>
                        <div className="font-medium">Vitória</div>
                        <div className="text-xs text-gray-500">Ontem, 18:22</div>
                      </div>
                    </div>
                    <div className="text-green-500 font-medium">
                      +R$ 125,00
                    </div>
                  </div>
                </div>
                
                <Link 
                  href="/profile/wallet"
                  className="flex items-center justify-center text-primary text-sm mt-4 hover:underline"
                >
                  Ver todas as transações
                  <ChevronRight size={16} className="ml-1" />
                </Link>
              </div>
            </div>
          </div>
          
          {/* Coluna da direita - Conteúdo principal do perfil */}
          <div className="lg:w-2/3 space-y-6">
            {/* Conquistas e Insígnias */}
            <div className="bg-card-bg rounded-xl border border-gray-800 shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Trophy size={20} className="text-purple-500" />
                    <span>Conquistas e Insígnias</span>
                  </h2>
                  <span className="text-gray-400 text-sm">{userAchievements.length}/{MOCK_ACHIEVEMENTS.length} conquistadas</span>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mb-6">
                  {userAchievements.map((achievement) => (
                    <AchievementBadge key={achievement.id} achievement={achievement} />
                  ))}
                  {Array(5 - userAchievements.length).fill(0).map((_, index) => (
                    <div key={`empty-${index}`} className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-800/50 border-2 border-gray-700/50">
                        <Lock size={24} className="text-gray-600" />
                      </div>
                      <span className="text-xs mt-1 text-gray-600">Bloqueado</span>
                    </div>
                  ))}
                </div>
                
                <Link 
                  href="/profile/achievements"
                  className="flex items-center justify-center text-primary text-sm hover:underline"
                >
                  Ver todas as conquistas
                  <ChevronRight size={16} className="ml-1" />
                </Link>
              </div>
            </div>
            
            {/* Histórico recente */}
            <div className="bg-card-bg rounded-xl border border-gray-800 shadow-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-6">Atividade recente</h2>
                
                <div className="overflow-hidden rounded-lg border border-gray-700">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-card-hover">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Atividade
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Data
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card-bg divide-y divide-gray-700">
                      <tr className="hover:bg-card-hover">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-purple-500/10 p-2 rounded-full">
                              <Trophy size={16} className="text-purple-500" />
                            </div>
                            <span>Ganhou insígnia: {userAchievements[0]?.name || 'Primeira Vitória'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-400 flex items-center gap-2">
                          <Clock size={14} />
                          {formatDate(userAchievements[0]?.date)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="bg-purple-500/10 text-purple-500 text-xs px-2 py-1 rounded-full">
                            Conquista
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-700/50 hover:bg-card-hover transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-500/10 p-2 rounded-full">
                              <Activity size={16} className="text-blue-500" />
                            </div>
                            <span>Login na plataforma</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-400 flex items-center gap-2">
                          <Clock size={14} />
                          {formatDate(new Date().toISOString())}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="bg-blue-500/10 text-blue-500 text-xs px-2 py-1 rounded-full">
                            Concluído
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 