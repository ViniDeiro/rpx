'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  User, Lock, Shield, Activity, LogOut, Edit, ChevronRight, 
  Clock, Award, Star, Calendar, Gift, Settings, Zap,
  PieChart, TrendingUp, Users, MessageCircle, Cpu, Bookmark, X, Check,
  Instagram, Twitter, Facebook, Youtube, Twitch, MessageSquare, ShoppingCart,
  ChevronLeft
} from 'react-feather';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Medal } from '@/components/ui/icons';
import { RankTier, RankDivision, calculateRank, calculateRankProgress, RANK_FRAMES } from '@/utils/ranking';
import ProfileBanner from '@/components/profile/ProfileBanner';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import FileUploadAvatar from '@/components/profile/FileUploadAvatar';
import FriendRequests from '@/components/profile/FriendRequests';
import { BANNERS } from '@/data/customization';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  bio?: string; // Biografia do usuário
  userNumber?: number; // ID sequencial
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
    twitch?: string;
    discord?: string;
  };
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

// Interface para Insignias
interface Insignia {
  id: string;
  nome: string;
  descricao: string;
  imagem: string;
  data: string;
  raridade: 'comum' | 'rara' | 'epica' | 'lendaria';
}

// Interface para Troféus
interface Trofeu {
  id: string;
  nome: string;
  descricao: string;
  imagem: string;
  data: string;
  tipo: 'ouro' | 'prata' | 'bronze' | 'platina' | 'diamante';
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
  const { user: authUser, isAuthenticated, isLoading, logout, updateUserAvatar, updateCustomization } = useAuth();
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
  
  // Estados para controlar os carousels
  const [insigniaAtual, setInsigniaAtual] = useState(0);
  const [trofeuAtual, setTrofeuAtual] = useState(0);
  
  // Dados de exemplo para as insignias
  const insignias: Insignia[] = [
    {
      id: '1',
      nome: 'Season 1',
      descricao: 'Season 1',
      imagem: '/images/insignias/0RPX-01.png',
      data: '2023-01-10',
      raridade: 'comum'
    },
    {
      id: '2',
      nome: 'Season 3',
      descricao: 'Season 3',
      imagem: '/images/insignias/0RPX-03.png',
      data: '2023-01-15',
      raridade: 'comum'
    },
    {
      id: '3',
      nome: 'Season 6',
      descricao: 'Season 6',
      imagem: '/images/insignias/0RPX-06.png',
      data: '2023-02-20',
      raridade: 'rara'
    },
    {
      id: '4',
      nome: 'Season 12',
      descricao: 'Season 12',
      imagem: '/images/insignias/0RPX-12.png',
      data: '2023-03-05',
      raridade: 'rara'
    },
    {
      id: '5',
      nome: 'Season 18',
      descricao: 'Season 18',
      imagem: '/images/insignias/0RPX-18.png',
      data: '2023-03-15',
      raridade: 'epica'
    },
    {
      id: '6',
      nome: 'Season 24',
      descricao: 'Season 24',
      imagem: '/images/insignias/0RPX-24.png',
      data: '2023-04-01',
      raridade: 'lendaria'
    },
    {
      id: '7',
      nome: 'Participação da Copa RPX S1',
      descricao: 'Participação da Copa RPX S1',
      imagem: '/images/insignias/1Joguei-Copa-RPX-S1.png',
      data: '2023-04-10',
      raridade: 'rara'
    },
    {
      id: '8',
      nome: 'MVP Copa RPX S1',
      descricao: 'MVP Copa RPX S1',
      imagem: '/images/insignias/1MVP-Copa-RPX-S1.png',
      data: '2023-04-15',
      raridade: 'epica'
    },
    {
      id: '9',
      nome: 'Participação da Copa RPX S2',
      descricao: 'Participação da Copa RPX S2',
      imagem: '/images/insignias/2Joguei-liga-RPX-S1.png',
      data: '2023-05-01',
      raridade: 'rara'
    },
    {
      id: '10',
      nome: 'MVP Copa RPX S2',
      descricao: 'MVP Copa RPX S2',
      imagem: '/images/insignias/2MVP-liga-RPX-S1.png',
      data: '2023-05-15',
      raridade: 'epica'
    },
    {
      id: '11',
      nome: 'Apoiador Inicial',
      descricao: 'Apoiador Inicial',
      imagem: '/images/insignias/Apoiador-Inicial.png',
      data: '2023-06-01',
      raridade: 'lendaria'
    },
    {
      id: '12',
      nome: 'Beta',
      descricao: 'Beta',
      imagem: '/images/insignias/Beta_Player.png',
      data: '2023-06-15',
      raridade: 'rara'
    },
    {
      id: '13',
      nome: 'Premium RPX',
      descricao: 'Premium RPX',
      imagem: '/images/insignias/Premium-RPX.png',
      data: '2023-07-01',
      raridade: 'lendaria'
    },
    {
      id: '14',
      nome: 'Staff',
      descricao: 'Staff',
      imagem: '/images/insignias/Staff.png',
      data: '2023-07-15',
      raridade: 'lendaria'
    }
  ];
  
  // Dados de exemplo para os troféus
  const trofeus: Trofeu[] = [
    {
      id: '1',
      nome: 'Torneio Regional',
      descricao: 'Vencedor do torneio regional',
      imagem: '/images/trofeus/regional.png',
      data: '2023-02-15',
      tipo: 'bronze'
    },
    {
      id: '2',
      nome: 'Campeonato Estadual',
      descricao: 'Segundo lugar no campeonato estadual',
      imagem: '/images/trofeus/estadual.png',
      data: '2023-03-20',
      tipo: 'prata'
    },
    {
      id: '3',
      nome: 'Copa Nacional',
      descricao: 'Vencedor da copa nacional',
      imagem: '/images/trofeus/nacional.png',
      data: '2023-05-10',
      tipo: 'ouro'
    },
    {
      id: '4',
      nome: 'Campeonato Mundial',
      descricao: 'Top 10 no campeonato mundial',
      imagem: '/images/trofeus/mundial.png',
      data: '2023-06-30',
      tipo: 'platina'
    }
  ];
  
  // Funções para navegação dos carousels
  const proximaInsignia = () => {
    const totalGroups = Math.ceil(insignias.length / 5);
    setInsigniaAtual((prev) => (prev === totalGroups - 1 ? 0 : prev + 1));
  };
  
  const insigniaAnterior = () => {
    const totalGroups = Math.ceil(insignias.length / 5);
    setInsigniaAtual((prev) => (prev === 0 ? totalGroups - 1 : prev - 1));
  };
  
  const proximoTrofeu = () => {
    setTrofeuAtual((prev) => (prev === trofeus.length - 1 ? 0 : prev + 1));
  };
  
  const trofeuAnterior = () => {
    setTrofeuAtual((prev) => (prev === 0 ? trofeus.length - 1 : prev - 1));
  };

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
      
      // Verificar e usar os dados de rank do usuário autenticado
      let userRank = (authUser as any).rank || defaultRank;
      
      // Para o usuário Yuri, forçar o rank como platinum
      if (authUser.username === 'yuri') {
        // Forçar o rank platinum para o usuário Yuri
        userRank = {
          name: 'Platinum',
          icon: '/images/ranks/platinum.png',
          color: '#4fd1c5', // Cor teal para platinum
          minMatches: 900,
          maxMatches: 1100,
          tier: 'platinum',
          division: '1'
        };
      }
      
      console.log('User Rank:', userRank); // Log para depurar os dados de rank
      
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
        rank: userRank, // Usar os dados de rank verificados
        coins: Number((authUser as any).coins) || 0,
        matchesPlayed: authUser.stats?.matches || 0,
        bio: authUser.bio || '', 
        userNumber: (authUser as any).userNumber || null,
        socialLinks: authUser.socialLinks || {},
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

  // Função para selecionar avatar predefinido
  const handleSelectAvatar = async (avatarId: string) => {
    try {
      setIsUploadingAvatar(true);
      await updateCustomization('avatar', avatarId);
      setShowAvatarUploader(false);
      
      // Mostrar mensagem de sucesso
      setToastMessage("Avatar atualizado com sucesso!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Erro ao selecionar avatar:', error);
      setToastMessage("Erro ao atualizar avatar. Tente novamente.");
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

  // Usar o rank que vem do usuário (backend) ao invés de calcular novamente
  // Só calcular de novo se o rank do usuário não estiver disponível
  let userRank;
  
  // Forçar o rank como platinum para o usuário Yuri
  if (user?.username === 'yuri') {
    userRank = {
      tier: 'platinum' as RankTier,
      division: '1' as RankDivision,
      name: 'Platinum',
      points: 900,
      nextRankPoints: 1000,
      color: RANK_FRAMES['platinum'].color || '',
      borderColor: RANK_FRAMES['platinum'].borderColor || '',
      image: RANK_FRAMES['platinum'].image || '',
      requiredPointsForPromotion: 1000
    };
    console.log('Using forced Platinum rank for Yuri:', userRank);
  } else if (authUser?.rank?.tier) {
    userRank = {
      tier: authUser.rank.tier as RankTier,
      division: authUser.rank.division as RankDivision,
      name: authUser.rank.tier.charAt(0).toUpperCase() + authUser.rank.tier.slice(1),
      points: authUser.rank.points || 0,
      nextRankPoints: 100, // valor padrão
      color: RANK_FRAMES[authUser.rank.tier as RankTier].color || '',
      borderColor: RANK_FRAMES[authUser.rank.tier as RankTier].borderColor || '',
      image: RANK_FRAMES[authUser.rank.tier as RankTier].image || '',
      requiredPointsForPromotion: 100 // valor padrão
    };
    
    // Log do rank do usuário para debug
    console.log('Using Rank from backend:', userRank);
  } else {
    // Fallback: Calcular Rank apenas se não estiver disponível no backend
    userRank = calculateRank(user?.stats?.rankPoints || 0);
    console.log('Calculated rank (fallback):', userRank);
  }
  
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
                  <div 
                    className="rounded-full cursor-pointer relative group" 
                    onClick={() => setShowAvatarUploader(true)}
                  >
                    <ProfileAvatar 
                      size="lg"
                      rankTier={typeof user?.rank === 'object' ? (user?.rank as any)?.tier as RankTier || "unranked" : "unranked"}
                      avatarUrl={user?.avatarUrl}
                      showRankFrame={true}
                    />
                    {/* Overlay ao passar o mouse */}
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 z-30">
                      <Edit size={20} className="text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Card principal com informações */}
                <div className="bg-[#171335] rounded-xl overflow-hidden shadow-xl border border-[#3D2A85]/20">
                  {/* Área de informações do usuário */}
                  <div className="p-6 pt-14 pb-8 text-center">
                    <h1 className="text-2xl font-bold text-white mb-3 flex items-center justify-center gap-2">
                      {user?.username || 'Jogador'}
                      <Link 
                        href="/profile/edit" 
                        className="inline-flex items-center justify-center bg-[#8860FF]/20 hover:bg-[#8860FF]/30 p-1 rounded-full transition-colors"
                        title="Editar perfil"
                      >
                        <Edit size={14} className="text-[#8860FF]" />
                      </Link>
                    </h1>
                    {user?.userNumber && (
                      <p className="text-[#A89ECC] text-xs mb-2">ID: #{user.userNumber}</p>
                    )}
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
                    
                    {/* Biografia do usuário */}
                    {user?.bio && (
                      <div className="mt-4 bg-[#1A1730] rounded-lg p-4 text-left">
                        <h3 className="text-sm font-semibold text-white mb-2">Sobre mim</h3>
                        <p className="text-[#A89ECC] text-xs">
                          {user.bio}
                        </p>
                      </div>
                    )}
                    
                    {/* Redes Sociais */}
                    {user?.socialLinks && Object.values(user.socialLinks).some(link => link) && (
                      <div className="mt-4">
                        <h3 className="text-sm font-semibold text-white mb-2">Redes Sociais</h3>
                        <div className="flex flex-wrap justify-center gap-2">
                          {user.socialLinks.instagram && (
                            <a href={`https://instagram.com/${user.socialLinks.instagram}`} 
                              target="_blank" rel="noopener noreferrer"
                              title="Instagram"
                              className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                              <Instagram size={16} />
                            </a>
                          )}
                          {user.socialLinks.twitter && (
                            <a href={`https://twitter.com/${user.socialLinks.twitter}`} 
                              target="_blank" rel="noopener noreferrer"
                              title="Twitter"
                              className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <Twitter size={16} />
                            </a>
                          )}
                          {user.socialLinks.facebook && (
                            <a href={user.socialLinks.facebook} 
                              target="_blank" rel="noopener noreferrer"
                              title="Facebook"
                              className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <Facebook size={16} />
                            </a>
                          )}
                          {user.socialLinks.youtube && (
                            <a href={user.socialLinks.youtube} 
                              target="_blank" rel="noopener noreferrer"
                              title="YouTube"
                              className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                              <Youtube size={16} />
                            </a>
                          )}
                          {user.socialLinks.twitch && (
                            <a href={`https://twitch.tv/${user.socialLinks.twitch}`} 
                              target="_blank" rel="noopener noreferrer"
                              title="Twitch"
                              className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                              <Twitch size={16} />
                            </a>
                          )}
                          {user.socialLinks.discord && (
                            <a href={user.socialLinks.discord} 
                              target="_blank" rel="noopener noreferrer"
                              title="Discord"
                              className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                              <MessageSquare size={16} />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Ranking */}
                    <div className="mt-5 bg-gradient-to-r from-[#232048] to-[#28254f] rounded-lg p-6">
                      {/* Imagem do emblema de rank */}
                      <div className="flex flex-col items-center mb-6">
                        <Image 
                          src={userRank.image || '/images/ranks/platinum.png'} 
                          alt={userRank.name} 
                          width={140} 
                          height={140} 
                          className="w-36 h-36 mb-4"
                        />
                        <div className="text-2xl font-bold text-white">
                          {userRank.name}
                        </div>
                      </div>
                      
                      {/* Barra de progresso mais visível */}
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[#A89ECC] font-medium text-base">
                          {userRank.points} pontos
                        </span>
                        <span className="text-white font-medium text-base">{Math.round(rankProgress.progressPercentage)}%</span>
                      </div>
                      
                      <div className="h-3 bg-[#1A1730] rounded-full overflow-hidden border border-[#3D2A85]/30">
                        <div 
                          className="h-full bg-gradient-to-r from-[#8860FF] to-[#5D3FD4]"
                          style={{ width: `${rankProgress.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Carousel de Insígnias abaixo do rank */}
                  <div className="mt-[-15px] mb-8 bg-gradient-to-r from-[#232048] to-[#28254f] rounded-lg border border-[#3D2A85]/20 py-2 w-[calc(100%-45px)] mx-auto">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center space-x-4 mb-1 justify-center">
                        {Array.from({ length: Math.min(5, insignias.length) }).map((_, i) => {
                          const index = insigniaAtual * 5 + i;
                          if (index >= insignias.length) return null;
                          const insignia = insignias[index];
                          return (
                            <div 
                              key={insignia.id} 
                              className="w-10 h-10 flex items-center justify-center group relative"
                              title={insignia.nome}
                            >
                              {insignia.imagem ? (
                                <img 
                                  src={insignia.imagem} 
                                  alt={insignia.nome}
                                  className="w-full h-full object-contain" 
                                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white text-xs font-bold">${insignia.nome.charAt(0)}</div>`;
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                                  {insignia.nome.charAt(0)}
                                </div>
                              )}
                              
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-32 bg-black/80 text-white text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <div className="font-bold text-center">{insignia.nome}</div>
                                <div className="text-center text-gray-300 text-[10px]">{insignia.descricao}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Indicadores de navegação por grupo */}
                      <div className="flex justify-center space-x-1">
                        {Array.from({ length: Math.ceil(insignias.length / 5) }).map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setInsigniaAtual(index)}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                              index === Math.floor(insigniaAtual / 5) ? 'bg-[#8860FF]' : 'bg-[#3D2A85]/30 hover:bg-[#3D2A85]/50'
                            }`}
                            aria-label={`Ir para grupo de insignias ${index + 1}`}
                          />
                        ))}
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
                    
                    {/* Seção de Insignias */}
                    <div className="mb-8">
                      <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                        <Award size={16} className="text-[#F3A953]" />
                        INSIGNIAS
                      </h3>
                      
                      {insignias.length > 0 ? (
                        <div className="bg-[#232048] rounded-lg p-4 relative">
                          {/* Carousel de Insignias */}
                          <div className="flex flex-col items-center justify-center py-4">
                            {/* Detalhes da insignia selecionada */}
                            <div className="text-center px-12 mb-3">
                              <div className="flex justify-center mb-3">
                                <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
                                  {insignias[insigniaAtual * 5]?.imagem ? (
                                    <img 
                                      src={insignias[insigniaAtual * 5].imagem} 
                                      alt={insignias[insigniaAtual * 5].nome}
                                      className="w-full h-full object-contain" 
                                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white text-lg font-bold">${insignias[insigniaAtual * 5].nome.charAt(0)}</div>`;
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
                                      {insignias[insigniaAtual * 5]?.nome?.charAt(0) || '?'}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <h4 className="text-white font-medium">{insignias[insigniaAtual * 5]?.nome || 'Carregando...'}</h4>
                              <p className="text-sm text-[#A89ECC] mt-1">{insignias[insigniaAtual * 5]?.descricao || ''}</p>
                              <p className="text-xs text-[#8860FF] mt-2">
                                {insignias[insigniaAtual * 5]?.data ? new Date(insignias[insigniaAtual * 5].data).toLocaleDateString('pt-BR') : ''}
                              </p>
                            </div>
                            
                            {/* Barra de insignias do grupo atual */}
                            <div className="bg-[#171335]/40 backdrop-blur-sm rounded-lg border border-[#3D2A85]/20 p-2 mb-4 max-w-md">
                              <div className="flex items-center space-x-4 mb-1 justify-center">
                                {Array.from({ length: Math.min(5, insignias.length) }).map((_, i) => {
                                  const index = insigniaAtual * 5 + i;
                                  if (index >= insignias.length) return null;
                                  const insignia = insignias[index];
                                  return (
                                    <div 
                                      key={insignia.id} 
                                      className="w-10 h-10 flex items-center justify-center group relative"
                                      title={insignia.nome}
                                    >
                                      {insignia.imagem ? (
                                        <img 
                                          src={insignia.imagem} 
                                          alt={insignia.nome}
                                          className="w-full h-full object-contain" 
                                          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white text-xs font-bold">${insignia.nome.charAt(0)}</div>`;
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                                          {insignia.nome.charAt(0)}
                                        </div>
                                      )}
                                      
                                      {/* Tooltip */}
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-32 bg-black/80 text-white text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <div className="font-bold text-center">{insignia.nome}</div>
                                        <div className="text-center text-gray-300 text-[10px]">{insignia.descricao}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            
                            {/* Indicadores */}
                            <div className="flex justify-center mt-2 space-x-1">
                              {Array.from({ length: Math.ceil(insignias.length / 5) }).map((_, index) => (
                                <button
                                  key={index}
                                  onClick={() => setInsigniaAtual(index)}
                                  className={`w-2 h-2 rounded-full transition-colors ${
                                    index === insigniaAtual ? 'bg-[#8860FF]' : 'bg-[#3D2A85]/50'
                                  }`}
                                  aria-label={`Ir para grupo de insignias ${index + 1}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#232048] rounded-lg p-8 text-center">
                          <Award size={32} className="mx-auto mb-3 text-[#A89ECC]" />
                          <h4 className="text-lg font-medium text-white mb-1">Nenhuma insignia conquistada</h4>
                          <p className="text-[#A89ECC]">Continue jogando para desbloquear insignias.</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Seção de Troféus */}
                    <div>
                      <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                        <Trophy size={16} className="text-[#F3D253]" />
                        TROFÉUS
                      </h3>
                      
                      {trofeus.length > 0 ? (
                        <div className="bg-[#232048] rounded-lg p-4 relative">
                          {/* Carousel de Troféus */}
                          <div className="flex flex-col items-center justify-center py-4">
                            {/* Detalhes do troféu selecionado */}
                            <div className="text-center px-12 mb-3">
                              <div className="flex justify-center mb-3">
                                <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
                                  {trofeus[trofeuAtual]?.imagem ? (
                                    <img 
                                      src={trofeus[trofeuAtual].imagem} 
                                      alt={trofeus[trofeuAtual].nome}
                                      className="w-full h-full object-contain" 
                                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white text-lg font-bold">${trofeus[trofeuAtual].nome.charAt(0)}</div>`;
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
                                      {trofeus[trofeuAtual]?.nome?.charAt(0) || '?'}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <h4 className="text-white font-medium">{trofeus[trofeuAtual]?.nome || 'Carregando...'}</h4>
                              <p className="text-sm text-[#A89ECC] mt-1">{trofeus[trofeuAtual]?.descricao || ''}</p>
                              <p className="text-xs text-[#8860FF] mt-2">
                                {trofeus[trofeuAtual]?.data ? new Date(trofeus[trofeuAtual].data).toLocaleDateString('pt-BR') : ''}
                              </p>
                            </div>
                            
                            {/* Barra de troféus */}
                            <div className="bg-[#171335]/40 backdrop-blur-sm rounded-lg border border-[#3D2A85]/20 p-2 mb-4 max-w-md">
                              <div className="flex items-center space-x-3 justify-center">
                                {trofeus.map((trofeu, index) => (
                                  <div 
                                    key={trofeu.id} 
                                    className={`w-8 h-8 flex items-center justify-center group relative ${index === trofeuAtual ? 'scale-110' : ''}`}
                                    title={trofeu.nome}
                                    onClick={() => setTrofeuAtual(index)}
                                  >
                                    {trofeu.imagem ? (
                                      <img 
                                        src={trofeu.imagem} 
                                        alt={trofeu.nome}
                                        className="w-full h-full object-contain" 
                                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white text-xs font-bold">${trofeu.nome.charAt(0)}</div>`;
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                                        {trofeu.nome.charAt(0)}
                                      </div>
                                    )}
                                    
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-32 bg-black/80 text-white text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                      <div className="font-bold text-center">{trofeu.nome}</div>
                                      <div className="text-center text-gray-300 text-[10px]">{trofeu.descricao}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Indicadores */}
                            <div className="flex justify-center mt-2 space-x-1">
                              {trofeus.map((_, index) => (
                                <button
                                  key={index}
                                  onClick={() => setTrofeuAtual(index)}
                                  className={`w-2 h-2 rounded-full transition-colors ${
                                    index === trofeuAtual ? 'bg-[#8860FF]' : 'bg-[#3D2A85]/50'
                                  }`}
                                  aria-label={`Troféu ${index + 1}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#232048] rounded-lg p-8 text-center">
                          <Trophy size={32} className="mx-auto mb-3 text-[#A89ECC]" />
                          <h4 className="text-lg font-medium text-white mb-1">Nenhum troféu conquistado</h4>
                          <p className="text-[#A89ECC]">Participe de torneios para ganhar troféus.</p>
                        </div>
                      )}
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
      
      {/* Modal para foto de perfil */}
      {showAvatarUploader && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-[#171335] rounded-xl overflow-hidden shadow-xl border border-[#3D2A85]/20 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Alterar Foto de Perfil</h2>
                <button 
                  onClick={() => setShowAvatarUploader(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="mb-6">
                <h3 className="text-base font-medium mb-4">Upload de imagem personalizada:</h3>
                <FileUploadAvatar 
                  onFileSelected={handleFileSelected}
                  currentImageUrl={user?.avatarUrl}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast de notificação */}
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