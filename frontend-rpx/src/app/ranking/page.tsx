'use client';

import { useState, useEffect } from 'react';
import { Search, TrendingUp, Target, Filter, Users, ChevronUp, ChevronDown, Star, Award, Activity, DollarSign } from 'react-feather';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Player {
  id: string;
  username: string;
  winRate: number;
  totalMatches?: number; // Opcional, pois pode não vir da API
  victories?: number; // Opcional, pois será calculado como wins 
  earnings?: number; // Opcional, pois será calculado como totalWon
  rank: string | number;
  avatar?: string;
  avatarUrl?: string; // Adicionando campo avatarUrl
  streak?: number;
  lastMatches?: ('win' | 'loss' | 'draw')[];
  rankingChange?: number;
  // Campos da API
  wins?: number;
  losses?: number;
  totalWon?: number;
  biggestWin?: number;
  score?: number;
  betCount?: number;
  rankPoints?: number;
  rankProgress?: number;
  nextRank?: string;
  pointsToNextRank?: number;
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

// Função para determinar o rank baseado nos pontos
const determineRank = (rankPoints: number): string => {
  if (rankPoints >= 1500) return 'CHALLENGER';
  if (rankPoints >= 1400) return 'DIAMOND 3';
  if (rankPoints >= 1300) return 'DIAMOND 2';
  if (rankPoints >= 1200) return 'DIAMOND 1';
  if (rankPoints >= 1100) return 'PLATINUM 3';
  if (rankPoints >= 1000) return 'PLATINUM 2';
  if (rankPoints >= 900) return 'PLATINUM 1';
  if (rankPoints >= 800) return 'GOLD 3';
  if (rankPoints >= 700) return 'GOLD 2';
  if (rankPoints >= 600) return 'GOLD 1';
  if (rankPoints >= 500) return 'SILVER 3';
  if (rankPoints >= 400) return 'SILVER 2';
  if (rankPoints >= 300) return 'SILVER 1';
  if (rankPoints >= 200) return 'BRONZE 3';
  if (rankPoints >= 100) return 'BRONZE 2';
  if (rankPoints >= 1) return 'BRONZE 1';
  return 'UNRANKED';
};

// Função para determinar a cor do rank
const getRankColor = (rank: string | number): string => {
  if (typeof rank === 'number') {
    // Se for um número de ranking, retornamos uma cor padrão
    return 'text-white';
  }
  
  if (rank.includes('CHALLENGER')) return 'text-purple-400';
  if (rank.includes('LEGEND')) return 'text-purple-300';
  if (rank.includes('DIAMOND')) return 'text-blue-400';
  if (rank.includes('PLATINUM')) return 'text-cyan-400';
  if (rank.includes('GOLD')) return 'text-yellow-400';
  if (rank.includes('SILVER')) return 'text-slate-400';
  if (rank.includes('BRONZE')) return 'text-amber-600';
  return 'text-slate-300'; // UNRANKED
};

// Função para calcular o progresso dentro do rank atual
const calculateRankProgress = (rankPoints: number): { progress: number, nextRank: string, pointsNeeded: number } => {
  const rankThresholds = [
    { threshold: 1500, rank: 'CHALLENGER' },
    { threshold: 1400, rank: 'DIAMOND 3' },
    { threshold: 1300, rank: 'DIAMOND 2' },
    { threshold: 1200, rank: 'DIAMOND 1' },
    { threshold: 1100, rank: 'PLATINUM 3' },
    { threshold: 1000, rank: 'PLATINUM 2' },
    { threshold: 900, rank: 'PLATINUM 1' },
    { threshold: 800, rank: 'GOLD 3' },
    { threshold: 700, rank: 'GOLD 2' },
    { threshold: 600, rank: 'GOLD 1' },
    { threshold: 500, rank: 'SILVER 3' },
    { threshold: 400, rank: 'SILVER 2' },
    { threshold: 300, rank: 'SILVER 1' },
    { threshold: 200, rank: 'BRONZE 3' },
    { threshold: 100, rank: 'BRONZE 2' },
    { threshold: 1, rank: 'BRONZE 1' },
    { threshold: 0, rank: 'UNRANKED' }
  ];
  
  let currentRankIndex;
  for (currentRankIndex = 0; currentRankIndex < rankThresholds.length; currentRankIndex++) {
    if (rankPoints >= rankThresholds[currentRankIndex].threshold) {
      break;
    }
  }
  
  // Se for CHALLENGER, não há próximo rank
  if (currentRankIndex === 0) {
    return { progress: 100, nextRank: 'TOP 25', pointsNeeded: 0 };
  }
  
  const currentRank = rankThresholds[currentRankIndex];
  const nextRank = rankThresholds[currentRankIndex - 1];
  
  const rangeSize = nextRank.threshold - currentRank.threshold;
  const progressPoints = rankPoints - currentRank.threshold;
  const progress = Math.min(100, Math.round((progressPoints / rangeSize) * 100));
  const pointsNeeded = nextRank.threshold - rankPoints;
  
  return { 
    progress, 
    nextRank: nextRank.rank,
    pointsNeeded
  };
};

// Função para obter a URL do avatar
const getAvatarUrl = (player: Player) => {
  if (!player) return '/images/avatar-placeholder.svg';
  
  // Verificar se já temos a imagem base64
  if (player.avatarUrl) {
    console.log(`Jogador ${player.username} já tem avatarUrl`);
    return player.avatarUrl;
  }
  
  // Verificar todos os possíveis campos que contêm o avatar
  const avatarSource = player.avatar || (player as any).profile?.avatar;
  
  if (!avatarSource) return '/images/avatar-placeholder.svg';
  
  // Se já for um dado base64, retornar como está
  if (typeof avatarSource === 'string' && avatarSource.startsWith('data:')) {
    return avatarSource;
  }
  
  // Verificar se a URL já é absoluta
  if (typeof avatarSource === 'string' && avatarSource.startsWith('http')) {
    return avatarSource;
  }
  
  // Se for um caminho relativo sem barra inicial, adicionar a barra
  const path = typeof avatarSource === 'string' && avatarSource.startsWith('/') 
    ? avatarSource 
    : `/${avatarSource}`;
  
  // Verificar se o caminho já tem extensão
  if (typeof path === 'string' && path.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
    return path;
  }
  
  // Adicionar domínio se for um caminho relativo
  return `/images${path}`;
};

// Componente de Avatar com fallback melhorado e navegação para o perfil
const PlayerAvatar = ({ player, size = 'md' }: { player: Player, size?: 'sm' | 'md' | 'lg' | 'xl' }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const router = useRouter();
  
  const sizeClasses = {
    'sm': 'w-10 h-10',
    'md': 'w-16 h-16',
    'lg': 'w-20 h-20',
    'xl': 'w-24 h-24'
  };
  
  const fontSize = {
    'sm': 'text-lg',
    'md': 'text-2xl',
    'lg': 'text-3xl', 
    'xl': 'text-4xl'
  };
  
  const borderClasses = {
    'sm': 'border-2',
    'md': 'border-2',
    'lg': 'border-3',
    'xl': 'border-4'
  };

  const navigateToProfile = () => {
    router.push(`/profile/${player.username}`);
  };
  
  // Inicializar a fonte da imagem
  useEffect(() => {
    // Primeiro verificar se temos avatarUrl
    if (player.avatarUrl && !hasError) {
      console.log(`Definindo avatarUrl para ${player.username}`);
      setImgSrc(player.avatarUrl);
      return;
    }
    
    // Se não, usar getAvatarUrl
    const url = getAvatarUrl(player);
    if (url && !hasError) {
      console.log(`Usando URL alternativa para ${player.username}: ${url.substring(0, 30)}...`);
      setImgSrc(url);
    }
  }, [player, hasError]);
  
  // Verificar se é o usuário atual
  useEffect(() => {
    const checkCurrentUser = async () => {
      try {
        // Verificar localStorage primeiro (mais rápido)
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const currentUser = JSON.parse(userData);
          if (currentUser && currentUser.id === player.id && currentUser.avatarUrl) {
            console.log('Usando avatar do localStorage para:', player.username);
            setImgSrc(currentUser.avatarUrl);
            setHasError(false);
            return;
          }
        }
        
        // Se não tem no localStorage, buscar da API
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        
        const response = await fetch('/api/users/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        const currentUser = data.user || data.data?.user;
        
        // Se o jogador for o usuário atual, usar sua imagem diretamente
        if (currentUser && currentUser.id === player.id && currentUser.avatarUrl) {
          console.log('É o usuário atual, usando avatar da API:', player.username);
          setImgSrc(currentUser.avatarUrl);
          setHasError(false); // Resetar erro se estiver usando o avatar direto
        }
      } catch (error) {
        console.error('Erro ao verificar usuário atual:', error);
      }
    };
    
    checkCurrentUser();
  }, [player.id]);
  
  const handleImageError = () => {
    console.error(`Erro ao carregar imagem para ${player.username}`);
    setHasError(true);
    setImgSrc(null);
  };
  
  // Se não temos fonte de imagem ou houve erro, exibir fallback
  if (hasError || !imgSrc) {
    return (
      <div 
        onClick={navigateToProfile}
        className={`${sizeClasses[size]} bg-gradient-to-b from-card-bg to-background rounded-full flex items-center justify-center overflow-hidden ${borderClasses[size]} border-primary/50 shadow-rpx transition-all duration-300 hover:scale-105 hover:shadow-rpx-hover cursor-pointer`}
      >
        <div className={`${fontSize[size]} font-bold text-primary-light`}>
          {player.username.charAt(0).toUpperCase()}
        </div>
      </div>
    );
  }
  
  // Exibir imagem
  return (
    <div 
      onClick={navigateToProfile}
      className={`${sizeClasses[size]} bg-gradient-to-b from-card-bg to-background rounded-full flex items-center justify-center overflow-hidden ${borderClasses[size]} border-primary/50 shadow-rpx transition-all duration-300 hover:scale-105 hover:shadow-rpx-hover cursor-pointer`}
    >
      <img 
        src={imgSrc} 
        alt={player.username} 
        className="w-full h-full object-cover"
        onError={handleImageError}
      />
    </div>
  );
};

// Função para determinar a cor do progresso de rank baseada no rank
const getProgressColor = (rank: string | number) => {
  if (typeof rank !== 'string') return 'bg-gray-400';
  
  if (rank.includes('CHALLENGER')) return 'bg-purple-400';
  if (rank.includes('LEGEND')) return 'bg-purple-300';
  if (rank.includes('DIAMOND')) return 'bg-blue-400';
  if (rank.includes('PLATINUM')) return 'bg-cyan-400';
  if (rank.includes('GOLD')) return 'bg-yellow-400';
  if (rank.includes('SILVER')) return 'bg-slate-400';
  if (rank.includes('BRONZE')) return 'bg-amber-600';
  return 'bg-gray-400'; // UNRANKED
};

// Componente para exibir a barra de progresso do rank
const RankProgressBar = ({ player }: { player: Player }) => {
  const progress = player.rankProgress || 0;
  const pointsNeeded = player.pointsToNextRank || 0;
  
  return (
    <div className="mt-2">
      <div className="flex justify-between items-center text-xs mb-1">
        <span>{player.rank}</span>
        {pointsNeeded > 0 && (
          <span>{pointsNeeded} pts para {player.nextRank}</span>
        )}
        {pointsNeeded === 0 && player.rank === 'CHALLENGER' && (
          <span>TOP 25</span>
        )}
      </div>
      <div className="w-full bg-background rounded-full h-2.5 overflow-hidden">
        <div 
          className={`h-2.5 rounded-full ${getProgressColor(player.rank)}`} 
          style={{ width: `${progress}%`, transition: 'width 1s ease-in-out' }}
        ></div>
      </div>
      <div className="text-xs text-right mt-1">{player.rankPoints || 0} pontos</div>
    </div>
  );
};

export default function RankingPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('rankPoints');
  const [selectedGameType, setSelectedGameType] = useState<'all' | 'solo' | 'duo' | 'squad'>('all');
  const [timeFrame, setTimeFrame] = useState<'all' | 'month' | 'week'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  // Adicionando estado para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [playersPerPage] = useState(25);

  // Buscar o usuário atual
  useEffect(() => {
    // Verificar se temos informações do usuário no localStorage
    const getUserFromLocalStorage = () => {
      try {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          if (parsedUser && parsedUser.avatarUrl) {
            console.log('Usuário encontrado no localStorage com avatarUrl');
            setCurrentUser(parsedUser);
            return parsedUser;
          }
        }
        return null;
      } catch (error) {
        console.error('Erro ao obter usuário do localStorage:', error);
        return null;
      }
    };
    
    // Buscar dados do usuário atual através da API
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return null;
        
        const response = await fetch('/api/users/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!response.ok) return null;
        
        const data = await response.json();
        const userData = data.user || data.data?.user;
        if (userData) {
          console.log('Usuário atual carregado da API:', userData.id);
          if (userData.avatarUrl) {
            console.log('Usuário tem avatarUrl, tamanho:', userData.avatarUrl.length);
          }
          
          // Armazenar no localStorage para uso futuro
          localStorage.setItem('user_data', JSON.stringify(userData));
          
          setCurrentUser(userData);
          return userData;
        }
        return null;
      } catch (error) {
        console.error('Erro ao buscar usuário atual:', error);
        return null;
      }
    };
    
    // Buscar usuário do localStorage primeiro, depois da API
    const localUser = getUserFromLocalStorage();
    if (!localUser) {
      fetchCurrentUser();
    }
  }, []);

  useEffect(() => {
    // Buscar dados da API de rankings
    const fetchPlayers = async () => {
      try {
        setIsLoading(true);
        
        let userAvatar = null;
        // Verificar se temos um usuário atual com avatar
        if (currentUser && currentUser.avatarUrl) {
          userAvatar = {
            id: currentUser.id,
            username: currentUser.username,
            avatarUrl: currentUser.avatarUrl
          };
          console.log('Temos avatar do usuário atual');
        }
        
        // Primeiro, buscar todos os usuários para garantir que temos os avatares
        console.log('Buscando todos os usuários com avatares...');
        const allUsersResponse = await fetch('/api/users?includeAvatars=true&limit=100');
        
        let allUsers: any[] = [];
        if (allUsersResponse.ok) {
          const allUsersData = await allUsersResponse.json();
          allUsers = allUsersData.users || [];
          console.log(`Obtidos ${allUsers.length} usuários, verificando avatares...`);
          
          // Inserir o avatar do usuário atual na lista, se tiver
          if (userAvatar) {
            const userIndex = allUsers.findIndex(u => u.id === userAvatar.id);
            if (userIndex >= 0) {
              console.log('Substituindo dados do usuário atual na lista de usuários');
              allUsers[userIndex].avatarUrl = userAvatar.avatarUrl;
            } else {
              console.log('Adicionando usuário atual à lista de usuários');
              allUsers.push(userAvatar);
            }
          }
          
          const usersWithAvatars = allUsers.filter(u => u.avatarUrl);
          console.log(`${usersWithAvatars.length} usuários têm avatarUrl`);
          
          if (usersWithAvatars.length > 0) {
            usersWithAvatars.forEach(u => {
              console.log(`Usuário ${u.username} tem avatar (tamanho: ${typeof u.avatarUrl === 'string' ? u.avatarUrl.length : 'N/A'})`);
            });
          }
        } else {
          console.error('Falha ao buscar todos os usuários');
          
          // Se não conseguimos buscar todos, mas temos o usuário atual, usar ele na lista
          if (userAvatar) {
            allUsers = [userAvatar];
          }
        }
        
        // Tentar buscar o ranking normal, solicitando 100 jogadores para ter dados suficientes para paginação
        const response = await fetch(`/api/rankings?period=${timeFrame}&type=${selectedCategory === 'earnings' ? 'totalWon' : selectedCategory === 'victories' ? 'wins' : 'winrate'}&limit=100`);
        
        if (!response.ok) {
          throw new Error('Falha ao buscar os rankings');
        }
        
        const data = await response.json();
        
        // Se não temos rankings suficientes, usar os dados de usuários que já buscamos
        if (!data.rankings || data.rankings.length === 0) {
          console.log('Sem dados de ranking, usando dados de usuários');
          
          // Converter dados dos usuários para o formato utilizado pela interface
          const formattedPlayers: Player[] = allUsers.map((user: any, index: number) => {
            console.log(`Formatando usuário ${user.username}, tem avatarUrl: ${Boolean(user.avatarUrl)}`);
            
            // Adicionar pontos de ranking aleatórios para teste
            const rankPoints = user.stats?.rankPoints || Math.floor(Math.random() * 1500);
            const rank = determineRank(rankPoints);
            const rankProgress = calculateRankProgress(rankPoints);
            
            return {
              id: user._id || user.id || String(index + 1),
              username: user.username || `Usuário ${index + 1}`,
              winRate: 0,
              totalMatches: 0,
              victories: 0,
              earnings: 0,
              rank: rank,
              rankPoints: rankPoints,
              rankProgress: rankProgress.progress,
              nextRank: rankProgress.nextRank,
              pointsToNextRank: rankProgress.pointsNeeded,
              avatar: user.avatar || user.profile?.avatar,
              avatarUrl: user.avatarUrl,
              wins: 0,
              losses: 0,
              totalWon: 0,
              biggestWin: 0,
              score: 0,
              betCount: 0
            };
          });
          
          setPlayers(formattedPlayers);
          sortPlayers(formattedPlayers, selectedCategory);
          setIsLoading(false);
          return;
        }
        
        // Converter dados da API para o formato utilizado pela interface
        const formattedPlayers: Player[] = data.rankings.map((player: any) => {
          // Tentar encontrar detalhes completos do usuário, incluindo avatarUrl
          const userDetails = allUsers.find((u: any) => 
            u.id === player.id || u._id === player.id || u.username === player.username
          );
          
          if (userDetails?.avatarUrl) {
            console.log(`Usuário ${player.username} tem avatarUrl nos detalhes`);
          }
          
          // Obter pontos de ranking ou gerar aleatoriamente para teste
          const rankPoints = player.rankPoints || player.score || Math.floor(Math.random() * 1500);
          const rank = determineRank(rankPoints);
          const rankProgress = calculateRankProgress(rankPoints);
          
          return {
            id: player.id,
            username: player.username,
            winRate: player.winRate || 0,
            totalMatches: player.wins + player.losses,
            victories: player.wins,
            earnings: player.totalWon,
            rank: rank,
            rankPoints: rankPoints,
            rankProgress: rankProgress.progress,
            nextRank: rankProgress.nextRank,
            pointsToNextRank: rankProgress.pointsNeeded,
            avatar: player.avatar,
            avatarUrl: userDetails?.avatarUrl || player.avatarUrl,
            wins: player.wins,
            losses: player.losses,
            totalWon: player.totalWon,
            biggestWin: player.biggestWin,
            score: player.score,
            betCount: player.betCount
          };
        });
        
        // Se temos o usuário atual, garantir que os dados estejam atualizados
        if (currentUser) {
          const currentPlayerIndex = formattedPlayers.findIndex(p => p.id === currentUser.id);
          if (currentPlayerIndex >= 0) {
            formattedPlayers[currentPlayerIndex].avatarUrl = currentUser.avatarUrl;
          } else {
            // Se o usuário atual não estiver na lista, adicionar
            formattedPlayers.push({
              id: currentUser.id,
              username: currentUser.username || 'Você',
              winRate: currentUser.stats?.winRate || 0,
              totalMatches: (currentUser.stats?.wins || 0) + (currentUser.stats?.losses || 0),
              victories: currentUser.stats?.wins || 0,
              earnings: currentUser.stats?.earnings || 0,
              rank: determineRank(currentUser.stats?.winRate || 0),
              avatar: currentUser.avatar,
              avatarUrl: currentUser.avatarUrl,
              wins: currentUser.stats?.wins || 0,
              losses: currentUser.stats?.losses || 0,
              totalWon: currentUser.stats?.earnings || 0
            });
          }
        }
        
        console.log(`Ranking formatado com ${formattedPlayers.length} jogadores`);
        
        const playersWithAvatars = formattedPlayers.filter(p => p.avatarUrl);
        console.log(`${playersWithAvatars.length} jogadores têm avatarUrl no ranking final`);
        
        setPlayers(formattedPlayers);
        sortPlayers(formattedPlayers, selectedCategory);
        setIsLoading(false);
      } catch (err) {
        console.error('Erro ao carregar ranking:', err);
        
        setError('Não foi possível carregar o ranking. Tente novamente mais tarde.');
        setIsLoading(false);
      }
    };

    fetchPlayers();
  }, [timeFrame, selectedGameType, selectedCategory, currentUser]);

  // Ordenar jogadores
  const sortPlayers = (data: Player[], category: string) => {
    let sorted;
    switch (category) {
      case 'rankPoints':
        sorted = [...data].sort((a, b) => (b.rankPoints || 0) - (a.rankPoints || 0));
        break;
      case 'winrate':
        sorted = [...data].sort((a, b) => (b.winRate || 0) - (a.winRate || 0));
        break;
      case 'earnings':
        sorted = [...data].sort((a, b) => (b.earnings || b.totalWon || 0) - (a.earnings || a.totalWon || 0));
        break;
      case 'victories':
        sorted = [...data].sort((a, b) => (b.victories || b.wins || 0) - (a.victories || a.wins || 0));
        break;
      case 'matches':
        sorted = [...data].sort((a, b) => (b.totalMatches || (b.wins || 0) + (b.losses || 0)) - (a.totalMatches || (a.wins || 0) + (a.losses || 0)));
        break;
      default:
        sorted = [...data].sort((a, b) => (b.rankPoints || 0) - (a.rankPoints || 0));
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

  // Calcular paginação
  const indexOfLastPlayer = currentPage * playersPerPage;
  const indexOfFirstPlayer = indexOfLastPlayer - playersPerPage;
  const currentPlayers = filteredPlayers.slice(indexOfFirstPlayer, indexOfLastPlayer);
  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);

  // Mudar para próxima página
  const goToNextPage = () => {
    setCurrentPage(page => Math.min(page + 1, totalPages));
  };

  // Mudar para página anterior
  const goToPrevPage = () => {
    setCurrentPage(page => Math.max(page - 1, 1));
  };

  // Mudar para uma página específica
  const goToPage = (pageNumber: number) => {
    setCurrentPage(Math.min(Math.max(1, pageNumber), totalPages));
  };

  const formatCurrency = (value: number = 0) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const togglePlayerDetails = (playerId: string) => {
    if (expandedPlayer === playerId) {
      setExpandedPlayer(null);
    } else {
      setExpandedPlayer(playerId);
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

  // Renderizar controles de paginação
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center mt-6 bg-card-bg border border-border rounded-lg p-3 shadow-rpx">
        <button 
          onClick={goToPrevPage} 
          disabled={currentPage === 1}
          className={`px-3 py-1.5 rounded-lg flex items-center mr-2 ${
            currentPage === 1 
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
              : 'bg-card-hover text-white hover:bg-gray-700 transition'
          }`}
        >
          Anterior
        </button>
        
        <div className="flex space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNumber;
            
            if (totalPages <= 5) {
              // Se temos 5 ou menos páginas, mostrar todas
              pageNumber = i + 1;
            } else if (currentPage <= 3) {
              // No início, mostrar as 5 primeiras páginas
              pageNumber = i + 1;
            } else if (currentPage >= totalPages - 2) {
              // No final, mostrar as 5 últimas páginas
              pageNumber = totalPages - 4 + i;
            } else {
              // No meio, mostrar 2 páginas antes e 2 páginas depois
              pageNumber = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNumber}
                onClick={() => goToPage(pageNumber)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition ${
                  currentPage === pageNumber
                    ? 'bg-primary text-white' 
                    : 'bg-card-hover text-white hover:bg-gray-700'
                }`}
              >
                {pageNumber}
              </button>
            );
          })}
          
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span className="flex items-center justify-center px-1">...</span>
              <button
                onClick={() => goToPage(totalPages)}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-card-hover text-white hover:bg-gray-700 transition"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
        
        <button 
          onClick={goToNextPage} 
          disabled={currentPage === totalPages}
          className={`px-3 py-1.5 rounded-lg flex items-center ml-2 ${
            currentPage === totalPages 
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
              : 'bg-card-hover text-white hover:bg-gray-700 transition'
          }`}
        >
          Próxima
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-card-bg text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center mb-4 md:mb-0">
            <RpxLogo />
            <h1 className="text-3xl font-bold ml-3 text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-primary">Ranking de Jogadores</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <select
                className="appearance-none bg-card-bg border border-border rounded-lg py-2 pl-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value as 'all' | 'month' | 'week')}
              >
                <option value="all">Geral</option>
                <option value="month">Este mês</option>
                <option value="week">Esta semana</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-light pointer-events-none" size={16} />
            </div>
            
            <div className="relative">
              <select
                className="appearance-none bg-card-bg border border-border rounded-lg py-2 pl-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                value={selectedGameType}
                onChange={(e) => setSelectedGameType(e.target.value as 'all' | 'solo' | 'duo' | 'squad')}
              >
                <option value="all">Todos os modos</option>
                <option value="solo">Solo</option>
                <option value="duo">Duplas</option>
                <option value="squad">Esquadrão</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-light pointer-events-none" size={16} />
            </div>
          </div>
        </div>
        
        {/* Barra de busca e filtros */}
        <div className="bg-card-bg backdrop-blur-sm p-4 rounded-lg mb-6 border border-border shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-primary-light" />
              </div>
              <input
                type="text"
                placeholder="Buscar jogador por nome..."
                className="pl-10 pr-4 py-2 w-full bg-card-hover border border-border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedCategory('rankPoints')}
                className={`px-3 py-2 rounded-lg flex items-center ${
                  selectedCategory === 'rankPoints' 
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white' 
                    : 'bg-card-hover text-gray-200 hover:bg-card-hover'
                }`}
              >
                <Award size={16} className="mr-2" />
                <span>Pontos de Rank</span>
              </button>
              
              <button
                onClick={() => setSelectedCategory('winrate')}
                className={`px-3 py-2 rounded-lg flex items-center ${
                  selectedCategory === 'winrate' 
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white' 
                    : 'bg-card-hover text-gray-200 hover:bg-card-hover'
                }`}
              >
                <TrendingUp size={16} className="mr-2" />
                <span>Taxa de Vitória</span>
              </button>
              
              <button
                onClick={() => setSelectedCategory('earnings')}
                className={`px-3 py-2 rounded-lg flex items-center ${
                  selectedCategory === 'earnings' 
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white' 
                    : 'bg-card-hover text-gray-200 hover:bg-card-hover'
                }`}
              >
                <DollarSign size={16} className="mr-2" />
                <span>Ganhos</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Título da seção */}
        <div className="flex items-center mb-4">
          <Award className="text-primary mr-2" size={24} />
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary-light to-primary bg-clip-text text-transparent">
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
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Pódio melhorado para os 3 primeiros */}
            {filteredPlayers.length > 0 && (
              <div className="relative pt-24 pb-10 px-4 mb-10 bg-gradient-to-br from-card-bg to-background rounded-2xl border border-border shadow-xl overflow-hidden">
                {/* Fundo mais sutil com efeito de partículas e iluminação */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary via-primary-light to-transparent"></div>
                <div className="absolute inset-0 bg-[url('/images/particles.svg')] bg-repeat opacity-5 animate-pulse-slow"></div>
                <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl transform -translate-y-1/2"></div>
                <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl transform -translate-y-1/2"></div>
                
                {/* Plataformas do pódio em layout 3D */}
                <div className="flex flex-wrap justify-center items-end h-auto min-h-[300px] relative z-10 gap-4 md:gap-6">
                
                {/* Segundo lugar */}
                {filteredPlayers.length > 1 && (
                    <div className="flex flex-col items-center transform translate-y-4">
                      <div className="relative mb-2 group animate-float-slow">
                        {/* Avatar com efeito de brilho */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full opacity-75 blur group-hover:opacity-100 transition duration-700 group-hover:duration-200 animate-tilt"></div>
                        <PlayerAvatar player={filteredPlayers[1]} size="lg" />
                        
                        {/* Medalha com efeito metálico */}
                        <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-gradient-to-br from-blue-300 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-blue-300 transform rotate-12 group-hover:rotate-0 transition-transform">
                          <span className="font-bold text-sm drop-shadow-md">2</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-center w-full z-10">
                        <div 
                          className="font-bold text-md truncate max-w-full text-white cursor-pointer hover:text-primary transition-colors group-hover:text-blue-300"
                          onClick={() => router.push(`/profile/${filteredPlayers[1].username}`)}
                        >
                          {filteredPlayers[1].username}
                        </div>
                        <div className={`text-sm truncate ${getRankColor(filteredPlayers[1].rank)}`}>
                          {typeof filteredPlayers[1].rank === 'string' ? filteredPlayers[1].rank : `Rank #${filteredPlayers[1].rank}`}
                        </div>
                        <div className="px-2">
                          <RankProgressBar player={filteredPlayers[1]} />
                        </div>
                      </div>
                      
                      {/* Pódio em 3D com reflexo e sombra */}
                      <div className="mt-3 w-full h-36 relative">
                        {/* Reflexo frontal */}
                        <div className="absolute bottom-0 left-0 right-0 h-6 bg-blue-900/30 backdrop-blur-sm rounded-full mx-4 transform perspective-800"></div>
                        
                        {/* Bloco do pódio com bordas iluminadas */}
                        <div className="absolute bottom-2 left-0 right-0 h-32 bg-gradient-to-b from-blue-700 to-blue-900 rounded-md flex items-center justify-center border-t-2 border-x-2 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] overflow-hidden transform perspective-800 rotateX-10">
                          {/* Luz de destaque no topo */}
                          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-blue-400 to-transparent opacity-30"></div>
                          
                          {/* Textura hexagonal */}
                          <div className="absolute inset-0 bg-[url('/images/hex-pattern.svg')] bg-center bg-contain opacity-5"></div>
                          
                          <div className="text-center z-10 p-2">
                            <div className="text-xs text-blue-300 uppercase tracking-wider font-semibold">Vitórias</div>
                            <div className="text-2xl font-bold text-white">{filteredPlayers[1].victories || filteredPlayers[1].wins || 0}</div>
                            {(filteredPlayers[1].totalWon || 0) > 0 && (
                              <div className="mt-1 text-green-400 text-sm font-medium">
                                {formatCurrency(filteredPlayers[1].earnings || filteredPlayers[1].totalWon || 0)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                )}
                
                {/* Primeiro lugar - Campeão */}
                {filteredPlayers.length > 0 && (
                    <div className="flex flex-col items-center z-20 transform -translate-y-4 scale-110">
                      {/* Efeitos de raios de luz */}
                      <div className="absolute -top-8 left-1/2 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl transform -translate-x-1/2"></div>
                      
                      {/* Coroa com animação flutuante */}
                      <div className="relative">
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 animate-float-slow">
                          <div className="relative">
                            {/* Brilho ao redor da coroa */}
                            <div className="absolute -inset-2 bg-yellow-400/30 rounded-full blur-md animate-pulse-slow"></div>
                            <Crown size={48} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative mb-2 group animate-float-slow">
                        {/* Borda iluminada pulsante */}
                        <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 rounded-full opacity-75 blur-md animate-pulse-slow"></div>
                        <PlayerAvatar player={filteredPlayers[0]} size="xl" />
                        
                        {/* Medalha de primeiro lugar */}
                        <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full flex items-center justify-center text-yellow-900 shadow-[0_0_15px_rgba(250,204,21,0.5)] border-2 border-yellow-300 transform rotate-6 group-hover:rotate-0 transition-transform">
                          <span className="font-bold text-lg">1</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-center w-full z-10">
                        <div 
                          className="font-bold text-xl truncate max-w-full text-white cursor-pointer hover:text-primary transition-colors drop-shadow-md"
                          onClick={() => router.push(`/profile/${filteredPlayers[0].username}`)}
                        >
                          {filteredPlayers[0].username}
                        </div>
                        <div className={`text-sm truncate ${getRankColor(filteredPlayers[0].rank)} font-semibold`}>
                          {typeof filteredPlayers[0].rank === 'string' ? filteredPlayers[0].rank : `Rank #${filteredPlayers[0].rank}`}
                        </div>
                        <div className="px-2">
                          <RankProgressBar player={filteredPlayers[0]} />
                        </div>
                      </div>
                      
                      {/* Pódio campeão com efeitos dourados */}
                      <div className="mt-3 w-full h-44 relative">
                        {/* Reflexo frontal */}
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-yellow-900/30 backdrop-blur-sm rounded-full mx-4 transform perspective-800"></div>
                        
                        {/* Bloco do pódio */}
                        <div className="absolute bottom-2 left-0 right-0 h-44 bg-gradient-to-b from-yellow-600 to-amber-900 rounded-md flex items-center justify-center border-t-2 border-x-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)] overflow-hidden transform perspective-800 rotateX-10">
                          {/* Luz de destaque no topo */}
                          <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-yellow-400 to-transparent opacity-30"></div>
                          
                          {/* Textura com padrão */}
                          <div className="absolute inset-0 bg-[url('/images/crown-pattern.svg')] bg-center bg-contain opacity-5 animate-pulse-slow"></div>
                          
                          {/* Efeito de brilho aleatório */}
                          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-ping-slow opacity-70"></div>
                          <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-ping-slow opacity-70" style={{ animationDelay: '1s' }}></div>
                          
                          <div className="text-center z-10 p-3">
                            <div className="text-xs text-yellow-300 uppercase tracking-wider font-semibold">Vitórias</div>
                            <div className="text-3xl font-bold text-white drop-shadow-md">{filteredPlayers[0].victories || filteredPlayers[0].wins || 0}</div>
                            {(filteredPlayers[0].totalWon || 0) > 0 && (
                              <div className="mt-2 text-green-400 text-lg font-bold">
                                {formatCurrency(filteredPlayers[0].earnings || filteredPlayers[0].totalWon || 0)}
                              </div>
                            )}
                            <div className="mt-2">
                              <Trophy size={20} className="text-yellow-300 inline-block mr-1" />
                              <span className="text-yellow-300 text-xs">Campeão</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                )}
                
                {/* Terceiro lugar */}
                {filteredPlayers.length > 2 && (
                    <div className="flex flex-col items-center transform translate-y-8">
                      <div className="relative mb-2 group animate-float-slow">
                        {/* Avatar com efeito de brilho */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-amber-700 rounded-full opacity-75 blur group-hover:opacity-100 transition duration-700 group-hover:duration-200 animate-tilt"></div>
                        <PlayerAvatar player={filteredPlayers[2]} size="md" />
                        
                        {/* Medalha de bronze */}
                        <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-700 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-amber-400/70 transform rotate-12 group-hover:rotate-0 transition-transform">
                          <span className="font-bold text-sm drop-shadow-md">3</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-center w-full z-10">
                        <div 
                          className="font-bold text-md truncate max-w-full text-white cursor-pointer hover:text-primary transition-colors group-hover:text-amber-300"
                          onClick={() => router.push(`/profile/${filteredPlayers[2].username}`)}
                        >
                          {filteredPlayers[2].username}
                        </div>
                        <div className={`text-sm truncate ${getRankColor(filteredPlayers[2].rank)}`}>
                          {typeof filteredPlayers[2].rank === 'string' ? filteredPlayers[2].rank : `Rank #${filteredPlayers[2].rank}`}
                        </div>
                        <div className="px-2">
                          <RankProgressBar player={filteredPlayers[2]} />
                        </div>
                      </div>
                      
                      {/* Pódio em 3D com reflexo e sombra */}
                      <div className="mt-3 w-full h-30 relative">
                        {/* Reflexo frontal */}
                        <div className="absolute bottom-0 left-0 right-0 h-6 bg-amber-900/30 backdrop-blur-sm rounded-full mx-4 transform perspective-800"></div>
                        
                        {/* Bloco do pódio com bordas iluminadas */}
                        <div className="absolute bottom-2 left-0 right-0 h-28 bg-gradient-to-b from-amber-700 to-amber-900 rounded-md flex items-center justify-center border-t-2 border-x-2 border-amber-500/70 shadow-[0_0_10px_rgba(217,119,6,0.5)] overflow-hidden transform perspective-800 rotateX-10">
                          {/* Luz de destaque no topo */}
                          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-amber-500 to-transparent opacity-30"></div>
                          
                          {/* Textura hexagonal */}
                          <div className="absolute inset-0 bg-[url('/images/hex-pattern.svg')] bg-center bg-contain opacity-5"></div>
                          
                          <div className="text-center z-10 p-2">
                            <div className="text-xs text-amber-300 uppercase tracking-wider font-semibold">Vitórias</div>
                            <div className="text-xl font-bold text-white">{filteredPlayers[2].victories || filteredPlayers[2].wins || 0}</div>
                            {(filteredPlayers[2].totalWon || 0) > 0 && (
                              <div className="mt-1 text-green-400 text-xs font-medium">
                                {formatCurrency(filteredPlayers[2].earnings || filteredPlayers[2].totalWon || 0)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                )}
                </div>
                
                {/* Base do pódio */}
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card-bg to-transparent"></div>
                <div className="absolute bottom-6 left-10 right-10 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
              </div>
            )}
            
            {/* Tabela de jogadores */}
            <div className="bg-card-bg backdrop-blur-sm border border-border rounded-xl overflow-hidden shadow-rpx">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-primary-dark to-primary">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Pos.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Jogador
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Pontos de Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell">
                        Vitórias
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider hidden lg:table-cell">
                        Partidas
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Ganhos
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-white uppercase tracking-wider text-center">
                        Detalhes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {currentPlayers.map((player, index) => (
                      <tr key={player.id} className={`${expandedPlayer === player.id ? 'bg-card-hover' : 'hover:bg-card-hover/70'}`}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getPositionIcon(indexOfFirstPlayer + index + 1)}
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
                          <div className="flex items-center group">
                            <div>
                              <PlayerAvatar player={player} size="sm" />
                            </div>
                            <div className="ml-3 max-w-[120px] md:max-w-[200px]">
                              <div 
                                className="font-medium truncate text-white cursor-pointer hover:text-primary transition-colors" 
                                onClick={() => router.push(`/profile/${player.username}`)}
                              >
                                {player.username}
                              </div>
                              <div className={`text-sm truncate ${getRankColor(player.rank)}`}>
                                {typeof player.rank === 'string' ? player.rank : `Rank #${player.rank}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className={`font-medium ${getRankColor(player.rank)}`}>
                              {player.rankPoints || 0} pts
                            </div>
                            <div className="w-full max-w-[120px] bg-background rounded-full h-2 mt-1 overflow-hidden">
                              <div 
                                className={`h-2 rounded-full ${getProgressColor(player.rank)}`} 
                                style={{ width: `${player.rankProgress || 0}%`, transition: 'width 1s ease-in-out' }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="flex items-center">
                            <Trophy size={16} className="text-yellow-500 mr-2" />
                            <span>{player.victories || player.wins || 0}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                          {player.totalMatches || (player.wins || 0) + (player.losses || 0)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-green-400 font-medium">
                            {formatCurrency(player.earnings || player.totalWon || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => togglePlayerDetails(player.id)}
                            className="text-primary hover:text-primary-light transition-colors duration-200"
                          >
                            {expandedPlayer === player.id ? (
                              <ChevronUp size={20} className="transform transition-transform duration-300" />
                            ) : (
                              <ChevronDown size={20} className="transform transition-transform duration-300" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {currentPlayers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-300">
                          Nenhum jogador encontrado com os filtros selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Controles de paginação */}
            {renderPagination()}
          </div>
        )}
      </div>
    </div>
  );
} 