'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  User, Lock, Shield, Activity, LogOut, Edit, ChevronRight, 
  Clock, Award, Star, Calendar, Gift, Settings, Zap,
  PieChart, TrendingUp, Users, MessageCircle, Cpu, Bookmark, X, Check
} from 'react-feather';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Medal } from '@/components/ui/icons';
import { RankTier, calculateRank, calculateRankProgress } from '@/utils/ranking';
import ProfileBanner from '@/components/profile/ProfileBanner';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import FileUploadAvatar from '@/components/profile/FileUploadAvatar';
import FriendRequests from '@/components/profile/FriendRequests';
import { BANNERS } from '@/data/customization';

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
  friends?: Friend[];
  friendRequests?: FriendRequest[];
  avatarUrl?: string;
  isAdmin?: boolean;
  isBanned?: boolean;
  rank?: Rank;
  coins?: number;
}

interface ExtendedRank {
  tier: string;
  division?: string;
  name: string;
  points: number;
  image: string;
  nextRank?: string;
}

interface Rank {
  name: string;
  icon: string;
  color: string;
  minMatches: number;
  maxMatches: number;
  nextRank?: string;
}

// Renomear User para ProfileUser para evitar conflito
interface ProfileUser {
  id: string;
  username: string;
  email: string;
  avatar: string;
  avatarUrl?: string;
  banner: string;
  createdAt: string;
  isAdmin: boolean;
  isBanned: boolean;
  rank: Rank;
  coins: number;
  matchesPlayed: number;
  stats: {
    matches?: number;
    wins?: number;
    losses?: number;
    draws?: number;
    winRate?: number;
    rankPoints?: number;
    earnings?: number;
  };
  friends: Friend[];
  friendRequests: FriendRequest[];
}

interface FriendRequest {
  id: string;
  username: string;
  avatarUrl: string;
  level: number;
}

interface Friend {
  id: string;
  username: string;
  avatarUrl: string;
  level: number;
  status: 'online' | 'offline';
  stats: {
    winRate: number;
  };
}

// Definir um rank padrão para uso quando não houver rank disponível
const defaultRank: Rank = {
  name: 'Novato',
  icon: '/images/ranks/novato.png',
  color: '#7e7e7e',
  minMatches: 0,
  maxMatches: 10
};

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, isAuthenticated, isLoading, logout, updateUserAvatar } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [activeTab, setActiveTab] = useState<'resumo' | 'estatísticas' | 'conquistas' | 'amigos'>('resumo');
  const [showAvatarUploader, setShowAvatarUploader] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showToast, setShowToast] = useState<boolean>(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [user, setUser] = useState<ProfileUser | null>(null);

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

  // Sincronizar o usuário do Auth com o estado local
  useEffect(() => {
    if (authUser) {
      console.log('Auth User:', authUser); // Log para depuração
      
      // Criar um objeto user de forma segura, sem pressupor propriedades
      const userObj: ProfileUser = {
        id: authUser.id || '',
        username: authUser.username || 'Usuário',
        email: authUser.email || '',
        avatar: (authUser as any).avatarUrl || (authUser as any).avatar || '/images/avatars/default.png',
        avatarUrl: (authUser as any).avatarUrl,
        banner: (authUser as any).banner || '/images/banners/default.png',
        createdAt: authUser.createdAt || new Date().toISOString(),
        isAdmin: Boolean((authUser as any).isAdmin),
        isBanned: Boolean((authUser as any).isBanned),
        rank: (authUser as any).rank || defaultRank,
        coins: Number((authUser as any).coins) || 0,
        matchesPlayed: authUser.stats?.matches || 0,
        stats: authUser.stats || {
          matches: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          winRate: 0,
          rankPoints: 0,
          earnings: 0
        },
        friends: (authUser as any).friends || [],
        friendRequests: (authUser as any).friendRequests || []
      };
      
      setUser(userObj);
    }
  }, [authUser]);

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

  // Manipulador de upload de imagem
  const handleFileSelected = async (file: File) => {
    try {
      setIsUploadingAvatar(true); // Mostrar indicador de carregamento
      await updateUserAvatar(file);
      setShowAvatarUploader(false);
      // Mostrar uma mensagem de sucesso temporária
      setToastMessage("Foto de perfil atualizada com sucesso!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      // Mostrar mensagem de erro
      setToastMessage("Erro ao atualizar foto de perfil. Tente novamente.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Funções para gerenciar solicitações de amizade
  const handleAcceptFriendRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/users/friends/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });

      if (response.ok) {
        setToastMessage('Solicitação de amizade aceita com sucesso!');
        setIsToastVisible(true);
        // Atualizar o estado do usuário com a nova lista de amigos
        setUser(prevUser => {
          if (!prevUser) return prevUser;
          
          // Encontrar a solicitação aceita
          const friendRequests = prevUser.friendRequests || [];
          const acceptedRequest = friendRequests.find((req: FriendRequest) => req.id === requestId);
          
          // Remover da lista de solicitações pendentes
          const updatedRequests = friendRequests.filter((req: FriendRequest) => req.id !== requestId);
          
          // Adicionar à lista de amigos (se encontrado)
          const currentFriends = prevUser.friends || [];
          const updatedFriends = acceptedRequest 
            ? [...currentFriends, {
                ...acceptedRequest,
                status: 'offline' as const,
                stats: { winRate: 0 }
              }]
            : currentFriends;
          
          return {
            ...prevUser,
            friendRequests: updatedRequests,
            friends: updatedFriends
          };
        });

        setTimeout(() => {
          setIsToastVisible(false);
        }, 3000);
      } else {
        setToastMessage('Erro ao aceitar solicitação de amizade.');
        setIsToastVisible(true);
        setTimeout(() => {
          setIsToastVisible(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao aceitar solicitação de amizade:', error);
      setToastMessage('Erro ao aceitar solicitação de amizade.');
      setIsToastVisible(true);
      setTimeout(() => {
        setIsToastVisible(false);
      }, 3000);
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/users/friends/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });

      if (response.ok) {
        setToastMessage('Solicitação de amizade recusada.');
        setIsToastVisible(true);
        
        // Atualizar o estado do usuário removendo a solicitação recusada
        setUser(prevUser => {
          if (!prevUser) return prevUser;
          
          // Remover da lista de solicitações pendentes
          const friendRequests = prevUser.friendRequests || [];
          const updatedRequests = friendRequests.filter((req: FriendRequest) => req.id !== requestId);
          
          return {
            ...prevUser,
            friendRequests: updatedRequests
          };
        });

        setTimeout(() => {
          setIsToastVisible(false);
        }, 3000);
      } else {
        setToastMessage('Erro ao recusar solicitação de amizade.');
        setIsToastVisible(true);
        setTimeout(() => {
          setIsToastVisible(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao recusar solicitação de amizade:', error);
      setToastMessage('Erro ao recusar solicitação de amizade.');
      setIsToastVisible(true);
      setTimeout(() => {
        setIsToastVisible(false);
      }, 3000);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      const response = await fetch('/api/users/friends/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendId }),
      });

      if (response.ok) {
        setToastMessage('Amigo removido com sucesso.');
        setIsToastVisible(true);
        
        // Atualizar o estado do usuário removendo o amigo
        setUser(prevUser => {
          if (!prevUser) return prevUser;
          
          // Remover da lista de amigos
          const friends = prevUser.friends || [];
          const updatedFriends = friends.filter((friend: Friend) => friend.id !== friendId);
          
          return {
            ...prevUser,
            friends: updatedFriends
          };
        });

        setTimeout(() => {
          setIsToastVisible(false);
        }, 3000);
      } else {
        setToastMessage('Erro ao remover amigo.');
        setIsToastVisible(true);
        setTimeout(() => {
          setIsToastVisible(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao remover amigo:', error);
      setToastMessage('Erro ao remover amigo.');
      setIsToastVisible(true);
      setTimeout(() => {
        setIsToastVisible(false);
      }, 3000);
    }
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
    <div className="min-h-screen bg-[#0D0A2A] text-white">
      {/* Header com banner e informações básicas */}
      <div className="relative">
        <ProfileBanner />
        
        <div className="container mx-auto px-4 pb-10" style={{ maxWidth: "75%" }}>
          {/* Layout principal com sidebar e conteúdo */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Card de perfil do usuário */}
            <div className="w-full md:w-80 lg:w-96 shrink-0 mb-6 md:mb-0 md:-mt-14">
              <div className="relative pt-14"> {/* Este espaço é para o avatar ficar visualmente acima do card */}
                {/* Avatar posicionado fora do card */}
                <div className="absolute left-1/2 transform -translate-x-1/2 -top-16 z-20">
                  <div className="rounded-full p-1 bg-gradient-to-r from-[#8860FF] to-[#5D3FD4] inline-block shadow-lg">
                    <div className="bg-[#171335] p-1 rounded-full">
                      <ProfileAvatar size="lg" rankTier={userRank.tier as RankTier} />
                      {/* Botão editar avatar */}
                      <button 
                        onClick={() => setShowAvatarUploader(true)}
                        className="absolute -bottom-1 -right-1 bg-[#8860FF] hover:bg-[#7550F0] p-1.5 rounded-full shadow-lg text-white border border-white/20"
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Card principal com informações */}
                <div className="bg-[#171335] rounded-xl overflow-hidden shadow-xl border border-[#3D2A85]/20">
                  {/* Área de informações do usuário */}
                  <div className="p-6 pt-14 pb-8 text-center">
                    <h1 className="text-2xl font-bold text-white mb-3">
                      {user?.username || 'Jogador'}
                    </h1>
                    <div className="text-[#A89ECC] text-sm mt-2 flex justify-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {formatDate(user?.createdAt || '')}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Activity size={14} />
                        {user?.stats?.matches || 0} partidas
                      </span>
                    </div>
                    
                    {/* Ranking */}
                    <div className="mt-5 bg-gradient-to-r from-[#232048] to-[#28254f] rounded-lg p-6">
                      {/* Imagem do emblema de rank */}
                      <div className="flex flex-col items-center mb-6">
                        <Image 
                          src={userRank.image} 
                          alt={userRank.name} 
                          width={120} 
                          height={120} 
                          className="w-28 h-28 mb-3"
                        />
                        <div className="text-xl font-bold text-white">{userRank.name}</div>
                      </div>
                      
                      {/* Barra de progresso mais visível */}
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[#A89ECC] font-medium">{userRank.points} pontos</span>
                        <span className="text-white font-medium">{Math.round(rankProgress.progressPercentage)}%</span>
                      </div>
                      
                      <div className="h-2.5 bg-[#1A1730] rounded-full overflow-hidden border border-[#3D2A85]/30">
                        <div 
                          className="h-full bg-gradient-to-r from-[#8860FF] to-[#5D3FD4]"
                          style={{ width: `${rankProgress.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Links rápidos */}
                  <div className="border-t border-[#3D2A85]/50">
                    <Link 
                      href="/matches" 
                      className="flex items-center justify-between p-4 hover:bg-[#232048] transition-colors border-b border-[#3D2A85]/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center rounded-md bg-[#3D2A85]/30 text-[#8860FF]">
                          <Activity size={16} />
                        </div>
                        <span>Jogar Partida</span>
                      </div>
                      <ChevronRight size={16} className="text-[#8860FF]" />
                    </Link>
                    
                    <Link 
                      href="/profile/wallet" 
                      className="flex items-center justify-between p-4 hover:bg-[#232048] transition-colors border-b border-[#3D2A85]/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center rounded-md bg-[#3D2A85]/30 text-[#8860FF]">
                          <PieChart size={16} />
                        </div>
                        <span>Histórico</span>
                      </div>
                      <ChevronRight size={16} className="text-[#8860FF]" />
                    </Link>
                    
                    <Link 
                      href="/profile/settings" 
                      className="flex items-center justify-between p-4 hover:bg-[#232048] transition-colors border-b border-[#3D2A85]/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center rounded-md bg-[#3D2A85]/30 text-[#8860FF]">
                          <Settings size={16} />
                        </div>
                        <span>Configurações</span>
                      </div>
                      <ChevronRight size={16} className="text-[#8860FF]" />
                    </Link>
                    
                    <button 
                      onClick={() => {
                        logout();
                        router.push('/auth/login');
                      }} 
                      className="w-full flex items-center justify-between p-4 hover:bg-[#232048] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center rounded-md bg-[#3D2A85]/30 text-[#FF6B6B]">
                          <LogOut size={16} />
                        </div>
                        <span>Sair</span>
                      </div>
                      <ChevronRight size={16} className="text-[#8860FF]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Conteúdo principal */}
            <div className="flex-1 mt-0">
              {/* Tabs de navegação */}
              <div className="bg-[#171335] rounded-xl overflow-hidden shadow-xl mb-6 border border-[#3D2A85]/20">
                <div className="flex flex-wrap md:flex-nowrap">
                  <button 
                    onClick={() => setActiveTab('resumo')}
                    className={`flex-1 py-3 md:py-4 transition-colors relative ${
                      activeTab === 'resumo' ? 'text-white' : 'text-[#A89ECC] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <User size={16} />
                      <span>Resumo</span>
                    </div>
                    {activeTab === 'resumo' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8860FF]"></div>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('estatísticas')}
                    className={`flex-1 py-3 md:py-4 transition-colors relative ${
                      activeTab === 'estatísticas' ? 'text-white' : 'text-[#A89ECC] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <PieChart size={16} />
                      <span>Estatísticas</span>
                    </div>
                    {activeTab === 'estatísticas' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8860FF]"></div>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('conquistas')}
                    className={`flex-1 py-3 md:py-4 transition-colors relative ${
                      activeTab === 'conquistas' ? 'text-white' : 'text-[#A89ECC] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Trophy size={16} />
                      <span>Conquistas</span>
                    </div>
                    {activeTab === 'conquistas' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8860FF]"></div>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('amigos')}
                    className={`flex-1 py-3 md:py-4 transition-colors relative ${
                      activeTab === 'amigos' ? 'text-white' : 'text-[#A89ECC] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Users size={16} />
                      <span>Amigos</span>
                    </div>
                    {activeTab === 'amigos' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8860FF]"></div>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Conteúdo das tabs */}
              <div className="space-y-6">
                {activeTab === 'resumo' && (
                  <>
                    {/* Card resumo de estatísticas */}
                    <div className="bg-[#171335] rounded-xl p-6 shadow-xl border border-[#3D2A85]/20">
                      <div className="flex items-center gap-2 mb-4">
                        <Cpu size={18} className="text-[#8860FF]" />
                        <h2 className="text-lg font-bold text-white">Resumo</h2>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-[#232048] p-4 rounded-lg">
                          <div className="text-[#A89ECC] text-xs mb-1">Partidas</div>
                          <div className="text-xl font-bold">{user?.stats?.matches || 0}</div>
                        </div>
                        
                        <div className="bg-[#232048] p-4 rounded-lg">
                          <div className="text-[#A89ECC] text-xs mb-1">Vitórias</div>
                          <div className="text-xl font-bold">{user?.stats?.wins || 0}</div>
                        </div>
                        
                        <div className="bg-[#232048] p-4 rounded-lg">
                          <div className="text-[#A89ECC] text-xs mb-1">Taxa de Vitória</div>
                          <div className="text-xl font-bold">
                            {user?.stats?.matches ? 
                              Math.round((user?.stats?.wins || 0) / user.stats.matches * 100) : 0}%
                          </div>
                        </div>
                        
                        <div className="bg-[#232048] p-4 rounded-lg">
                          <div className="text-[#A89ECC] text-xs mb-1">Ganhos Totais</div>
                          <div className="text-xl font-bold">{formatCurrency(user?.stats?.earnings || 0)}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Histórico recente */}
                    <div className="bg-[#171335] rounded-xl p-6 shadow-xl border border-[#3D2A85]/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Clock size={18} className="text-[#8860FF]" />
                          <h2 className="text-lg font-bold text-white">Histórico Recente</h2>
                        </div>
                        
                        <Link href="/profile/history" className="text-sm text-[#8860FF] hover:underline">
                          Ver tudo
                        </Link>
                      </div>
                      
                      {(user?.stats?.matches || 0) > 0 ? (
                        <div className="overflow-hidden rounded-lg border border-[#3D2A85]/30">
                          <div className="relative overflow-x-auto">
                            <table className="w-full text-sm text-left">
                              <thead className="bg-[#232048]">
                                <tr>
                                  <th scope="col" className="px-4 py-3 text-white">Partida</th>
                                  <th scope="col" className="px-4 py-3 text-white">Data</th>
                                  <th scope="col" className="px-4 py-3 text-white">Resultado</th>
                                  <th scope="col" className="px-4 py-3 text-white text-right">Valor</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b border-[#3D2A85]/30 hover:bg-[#232048]/50">
                                  <td className="px-4 py-4 text-[#A89ECC]" colSpan={4}>
                                    Dados serão carregados do servidor...
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#232048] rounded-lg p-8 text-center">
                          <Activity size={32} className="mx-auto mb-3 text-[#A89ECC]" />
                          <h4 className="text-lg font-medium text-white mb-1">Nenhuma partida jogada</h4>
                          <p className="text-[#A89ECC] mb-4">Comece a jogar agora para construir seu histórico!</p>
                          <Link href="/lobby" className="inline-block bg-[#8860FF] hover:bg-[#7550F0] text-white py-2 px-4 rounded-lg text-sm font-medium">
                            Jogar Agora
                          </Link>
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                {activeTab === 'estatísticas' && (
                  <div className="bg-[#171335] rounded-xl p-6 shadow-xl border border-[#3D2A85]/20">
                    <div className="flex items-center gap-2 mb-6">
                      <PieChart size={18} className="text-[#8860FF]" />
                      <h2 className="text-lg font-bold text-white">Estatísticas Detalhadas</h2>
                    </div>
                    
                    <div className="bg-[#232048] rounded-lg p-8 text-center">
                      <PieChart size={32} className="mx-auto mb-3 text-[#A89ECC]" />
                      <h4 className="text-lg font-medium text-white mb-1">Estatísticas em breve</h4>
                      <p className="text-[#A89ECC]">Os dados estatísticos detalhados serão exibidos aqui.</p>
                    </div>
                  </div>
                )}
                
                {activeTab === 'conquistas' && (
                  <div className="bg-[#171335] rounded-xl p-6 shadow-xl border border-[#3D2A85]/20">
                    <div className="flex items-center gap-2 mb-6">
                      <Trophy size={18} className="text-[#8860FF]" />
                      <h2 className="text-lg font-bold text-white">Conquistas e Insígnias</h2>
                    </div>
                    
                    <div className="bg-[#232048] rounded-lg p-8 text-center">
                      <Trophy size={32} className="mx-auto mb-3 text-[#A89ECC]" />
                      <h4 className="text-lg font-medium text-white mb-1">Conquistas em breve</h4>
                      <p className="text-[#A89ECC]">Suas conquistas e insígnias serão exibidas aqui.</p>
                    </div>
                  </div>
                )}
                
                {activeTab === 'amigos' && (
                  <div className="mt-6">
                    <FriendRequests onStatusChange={() => {
                      // Atualize os dados do usuário ao mudar o status das solicitações
                      if (user) {
                        setUser({...user});
                      }
                    }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de upload de avatar */}
      {showAvatarUploader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#171335] rounded-xl w-full max-w-md p-6 animate-fade-up shadow-2xl shadow-purple-900/20 border border-[#3D2A85]/30">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Atualizar foto de perfil</h2>
              <button 
                onClick={() => setShowAvatarUploader(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>
            
            <FileUploadAvatar 
              onFileSelected={handleFileSelected} 
              currentImageUrl={user?.avatarUrl}
            />
            
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowAvatarUploader(false)}
                className="bg-[#232048] hover:bg-[#2c295c] text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast de mensagem */}
      {showToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#171335] text-white p-4 rounded-lg shadow-xl border border-[#3D2A85] animate-fade-up">
          <div className="flex items-center gap-2">
            {toastMessage.includes("sucesso") ? (
              <Check size={18} className="text-green-500" />
            ) : (
              <X size={18} className="text-red-500" />
            )}
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
} 