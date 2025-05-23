'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Plus, X, UserPlus, Share2, MessageCircle, Settings, PlayCircle, DollarSign, Users, ChevronRight, Shield, Globe, Award, Gift, Star, Clock, Zap, Menu, CheckCircle, RefreshCw, AlertCircle, Check, MessageSquare, Bell, ChevronDown, MoreHorizontal, Maximize2, Book } from 'react-feather';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import CrownIcon from '@/components/ui/CrownIcon';
import { Match, GameTypeMode, PlatformMode, GameplayMode } from '@/types/match';
import MatchRoomModal from '@/components/modals/MatchRoomModal';
import SubmitResultModal from '@/components/modals/SubmitResultModal';
import FriendSearch from '@/components/lobby/FriendSearch';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import MatchmakingStatus from '@/components/matchmaking/MatchmakingStatus';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { RankTier, RANK_FRAMES } from '@/utils/ranking';
import MatchmakingListener from '@/components/matchmaking/MatchmakingListener';
import { Users as LucideUsers, UserPlus as LucideUserPlus, X as LucideX, ChevronRight as LucideChevronRight, Trophy, Clock as LucideClock, DollarSign as LucideDollarSign, Zap as LucideZap, Search, SkipForward, AlertTriangle } from 'lucide-react';
import TutorialModal from '@/components/lobby/TutorialModal';

// Adicionar os tipos

type LobbyType = 'solo' | 'duo' | 'squad';
type PlatformMode = 'emulator' | 'mobile' | 'mixed';
type GameplayMode = 'normal' | 'tactical' | 'infinite_ice';

// Tipo para jogador no lobby
interface LobbyPlayer {
  id: string;
  name: string;
  avatar: string;
  level: number;
  rank?: string;
  rankTier?: RankTier;
  isLeader?: boolean;
  position?: number;
  character?: string;
  username?: string;
}

// Tipo estendido para usuário que inclui stats
interface UserWithStats extends Omit<any, 'stats'> {
  id: string;
  name: string;
  avatarId?: string;
  level?: number;
  balance?: number;
  stats?: {
    wins: number;
    winRate: number;
    earnings: number;
    matches: number;
  }
}

// Tipo para o objeto de rank no contexto do lobby
interface UserRank {
  tier?: string;
  division?: string | null;
  points?: number;
}

// Adicionar interface para as regras
interface GameRules {
  general: string[];
  x1: {
    infiniteIce: string[];
    normalIce: string[];
  };
  tactical: string[]; // Nova seção para regras do modo tático
}

// Definir as regras
const gameRules: GameRules = {
  general: [
    "SEM SUBIR EM CASA",
    "SÓ VALE 'SUBIR' ATÉ METADE DAS ESCADAS PARA PEGAR PÉ / PULAR / ATIRAR",
    "PLATAFORMA DE OBS E TODOS OS CONTAINERS VALE",
    "TELHADINHOS E SKIPS E CAMINHÕES VALEM",
    "FULL UMP e FULL UMP XM8 VALE MINI UZI e DESERT no 1º ROUND",
    "NÃO VALE SUBIR GALPÃO DE MIL E TORRE DE CLOCK TOWER",
    "FULL UMP E FULL UMP XM8 VALE USAR USP",
    "PROIBIDO TELA PARADA! (EMULADOR)",
    "PROIBIDO IMPEDIR O ADVERSÁRIO DE DAR ROUND, EX: FICAR SE MATANDO, IMPOSSIBILITANDO O ADVERSÁRIO DE DAR O ROUND",
    "PEDIR ROUND DESNECESSARIO É W.O DIRETO",
    "EMULADOR ENTRAR NA FILA DE MOBILE W.O",
    "MOBILE ENTRAR NA FILA DE EMULADOR, SEGUE JOGO",
    "EM CASO DE RACISMO, TER PROVA DE VIDEO COM AUDIO! CASO NÃO TENHA AUDIO, NÃO SERA APLICADO W.O!!",
    "EM CASO QUE O JOGADOR QUEIRA PROVAR ALGUMA QUEBRA DE REGRA TERA APENAS 5 MINUTOS PARA A MANDAR A PROVA",
    "VALIDO COLETE 4"
  ],
  x1: {
    infiniteIce: [
      "GELO INFINITO",
      "BATER SOCO OU FAZER GELO PRA VALER",
      "MINI UZI E DESERT SOMENTE NO 1º ROUND",
      "2 ARMAS DE RUSH DIFERENTES OU 2 ARMAS DE RUSH IGUAIS (ex: 1 ump e 1 doze ou 2 ump e 2 doze)",
      "PODE MATAR O INIMIGO BUGADO NO GEL NORMALMENTE",
      "NÃO PODE SE TRANCAR NO GEL",
      "NÃO PODE TRANCAR NO GÁS (A NÃO SER QUE A SAFE ESTEJA PEQUENA (5 SEGUNDOS PARA ACABAR)",
      "NÃO VALE COLOCAR GEL VARANDO PAREDE/CERCA PARA TRANCAR O INIMIGO",
      "QUEBRA DE REGRA = DAR ROUND ATÉ O FIM OU W.O (PEDIR ROUND NA HORA, OU SEGUE NORMALMENTE)",
      "AO MATAR O ADVERSÁRIO PROPOSITALMENTE COM FINS DE REDUZIR QUANTIDADE DE ROUND, DAR 2 ROUNDS ATÉ O FIM DA PARTIDA OU W.O"
    ],
    normalIce: [
      "GELO NORMAL",
      "VALE 2 DE RUSH",
      "VALE SE TRANCAR/TRANCAR INIMIGO"
    ]
  },
  tactical: [
    "SEM SUBIR EM CASA",
    "DESERT NÃO VALE NEM NO 1º ROUND",
    "PLATAFORMA DE OBS E TODOS OS CONTAINERS VALE",
    "TODOS OS SKIPS VALE",
    "VÁLIDO SUBIR NOS CAMINHÕES",
    "SEM SKYLER",
    "SEM ÁLVARO",
    "SEM HOMERO",
    "SEM JUSTIN BIEBER",
    "SEM ÍRIS",
    "SEM A124",
    "SEM WOLFRAH",
    "SEM RAFAEL",
    "SEM ORION",
    "SEM SONIA",
    "SEM IGNIS",
    "SEM RYDEN",
    "SEM KAIROS",
    "SEM DRAKINHO",
    "SEM ARITA",
    "SEM MANDRAKO",
    "SEM AWP",
    "SEM M590",
    "SEM BARRET",
    "SEM AC80",
    "SEM CARGA EXTRA",
    "SEM DESERT",
    "SEM GRANADA"
  ]
};

// Adicionar esta função auxiliar após as definições de interfaces no início do arquivo (antes da função principal)
interface Match {
  id: string;
  title: string;
  createdAt: string;
  status: string;
  type: LobbyType;
  mode: LobbyType;
  format: LobbyType;
  teamSize: number;
  entryFee: number;
  prize: number;
  platformMode: PlatformMode;
  gameplayMode: GameplayMode;
  teams: {
    team1: {
      id: string;
      name: string;
      players: Array<{
        id: string;
        name: string;
        avatar: string;
        isReady: boolean;
        isLeader: boolean;
      }>;
    };
    team2: {
      id: string;
      name: string;
      players: Array<{
        id: string;
        name: string;
        avatar: string;
        isReady: boolean;
        isLeader: boolean;
      }>;
    };
  };
}

// Função auxiliar para criar uma partida simulada
const createSimulatedMatch = (
  user: any,
  lobbyType: LobbyType,
  platformMode: PlatformMode,
  gameplayMode: GameplayMode,
  betAmount: number
): Match => {
  return {
    id: `match-${Date.now()}`,
    title: `Partida ${lobbyType.charAt(0).toUpperCase() + lobbyType.slice(1)}`,
    createdAt: new Date().toISOString(),
    status: 'in_progress',
    type: lobbyType,
    mode: lobbyType,
    format: lobbyType,
    teamSize: lobbyType === 'solo' ? 1 : lobbyType === 'duo' ? 2 : 4,
    entryFee: betAmount,
    prize: betAmount * 2 * 0.95,
    platformMode: platformMode,
    gameplayMode: gameplayMode,
    teams: [
      {
        team1: {
          id: 'team1',
          name: 'Time 1',
          players: [{
            id: user?.id || 'user-1',
            name: user?.name || 'Jogador',
            avatar: user?.avatarId || '/avatars/default.png',
            isReady: true,
            isLeader: true
          }]
        },
        team2: {
          id: 'team2',
          name: 'Time 2',
          players: [{
            id: 'bot-1',
            name: 'Oponente',
            avatar: '/avatars/default.png',
            isReady: true,
            isLeader: false
          }]
        }
      }
    ]
  };
};

export default function LobbyPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, token } = useAuth();
  const [lobbyType, setLobbyType] = useState<LobbyType>('solo');
  const [platformMode, setPlatformMode] = useState<PlatformMode>('mixed');
  const [gameplayMode, setGameplayMode] = useState<GameplayMode>('normal');
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [showLobbyAnimation, setShowLobbyAnimation] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paymentOption, setPaymentOption] = useState<'captain' | 'split'>('captain');
  const [activeTab, setActiveTab] = useState<'lobby' | 'shop' | 'battle-pass' | 'challenges'>('lobby');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{id: number, user: string, message: string, isSystem?: boolean}[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [readyStatus, setReadyStatus] = useState(false);
  const [selectedBetAmount, setSelectedBetAmount] = useState(10);
  const [multiplier, setMultiplier] = useState(1.8);
  const [settingsTab, setSettingsTab] = useState<'game-modes' | 'platforms' | 'payment'>('game-modes');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  // Adicionar estado para o tutorial
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Nova state para salas oficiais do administrador
  const [adminRooms, setAdminRooms] = useState<Array<{
    id: number;
    roomId: string;
    roomPassword: string;
    gameType: LobbyType;
    format: string;
    entryFee: number;
    gameDetails: {
      gameName: string;
      gameMode: string;
      mapName: string;
      serverRegion: string;
    };
  }>>([]);
  
  
  const [isConnectingToOfficialRoom, setIsConnectingToOfficialRoom] = useState(false);
  
  const [selectedOfficialRoom, setSelectedOfficialRoom] = useState<any>(null);
  
  // Amigos online
  const [onlineFriends, setOnlineFriends] = useState<Array<{
    id: string;
    name: string;
    avatar: string;
    level: number;
    status: string;
    username?: string; // Adicionando campo username para navegação
  }>>([]);
  
  // Carregar amigos do usuário
  const fetchFriends = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/users/friends', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar amigos');
      }
      
      const data = await response.json();
      
      // Formatar os amigos para o formato esperado pelo componente
      const formattedFriends = data.friends.map((friend: any) => ({
        id: friend.id,
        name: friend.username,
        avatar: friend.avatarUrl,
        level: friend.level,
        status: 'online', // Por padrão, todos são mostrados como online
        username: friend.username // Adicionando username para navegação
      }));
      
      setOnlineFriends(formattedFriends);
    } catch (error) {
      console.error('Erro ao buscar amigos:', error);
      // Se falhar, mostrar amigos de demonstração
      setDefaultFriends();
    }
  };
  
  // Define amigos padrão caso a API falhe
  const setDefaultFriends = () => {
    console.log('Configurando amigos padrão para exibição');
    const defaultFriends = [
      { id: 'friend1', name: 'Cadu.A', avatar: '/images/avatars/blue.svg', level: 45, status: 'online', username: 'cadu.a' },
      { id: 'friend2', name: 'Panda', avatar: '/images/avatars/green.svg', level: 32, status: 'online', username: 'panda' },
      { id: 'friend3', name: 'Raxixe', avatar: '/images/avatars/purple.svg', level: 28, status: 'in_game', username: 'raxi' },
      { id: 'friend4', name: 'Dacruz', avatar: '/images/avatars/red.svg', level: 57, status: 'online', username: 'dacruz' },
      { id: 'friend5', name: 'Apelapato', avatar: '/images/avatars/yellow.svg', level: 51, status: 'idle', username: 'apel' },
      { id: 'friend6', name: 'GB', avatar: '/images/avatars/blue.svg', level: 45, status: 'online', username: 'gb' },
      { id: 'friend7', name: 'Vinizious', avatar: '/images/avatars/purple.svg', level: 38, status: 'online', username: 'vini' },
      { id: 'friend8', name: 'ElCastro', avatar: '/images/avatars/red.svg', level: 49, status: 'online', username: 'castro' },
    ];
    
    setOnlineFriends(defaultFriends);
  };
  
  const userWithStats = user as UserWithStats;
  
  
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);
  const [foundMatch, setFoundMatch] = useState<Match | null>(null);
  const [showMatchRoomModal, setShowMatchRoomModal] = useState(false);
  const [showSubmitResultModal, setShowSubmitResultModal] = useState(false);
  const [matchCompleted, setMatchCompleted] = useState(false);
  
  // Mais código no início do componente
  const [selectedCharacter, setSelectedCharacter] = useState<string>('warrior');
  const [characterRotation, setCharacterRotation] = useState(0);
  const [showPlatform, setShowPlatform] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [characterOptions, setCharacterOptions] = useState([
    { id: 'warrior', name: 'Guerreiro', image: '/images/champions/warrior.png' },
    { id: 'mage', name: 'Mago', image: '/images/champions/mage.png' },
    { id: 'archer', name: 'Arqueiro', image: '/images/champions/archer.png' },
    { id: 'rogue', name: 'Ladino', image: '/images/champions/rogue.png' }
  ]);
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [lightIntensity, setLightIntensity] = useState(30);
  const [platformRotation, setPlatformRotation] = useState(0);
  const [platformEffects, setPlatformEffects] = useState(false);
  const [characterScale, setCharacterScale] = useState(1);
  const [particlesVisible, setParticlesVisible] = useState(true);
  const [fakeFriends, setFakeFriends] = useState<Array<{
    id: string;
    username: string;
    isReady: boolean;
    isFake: boolean;
    rank?: {
      tier: RankTier;
      division: string;
      points: number;
    };
    avatarUrl?: string;
  }>>([]);
  
  // Definir lista mockada de amigos online
  useEffect(() => {
    // Inicializa com amigos padrão imediatamente
    setDefaultFriends();
    
    // Se não tiver token ou não estiver autenticado, mantém os amigos padrão
    if (!token || !isAuthenticated) return;
    
    // Estado para controlar os mocks durante carregamento
    let isMounted = true;
    // Inicializar a variável loadingTimeout como undefined para evitar erros
    let loadingTimeout: NodeJS.Timeout | undefined = undefined;
    
    // Buscar amigos reais da API
    const loadFriends = async () => {
      try {
        const response = await fetch('/api/users/friends', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Erro ao buscar amigos');
        }
        
        const data = await response.json();
        
        // Só atualizar se o componente ainda estiver montado
        if (isMounted) {
          // Formatar os amigos para o formato esperado pelo componente
          const formattedFriends = data.friends.map((friend: any) => ({
            id: friend.id,
            name: friend.username,
            avatar: friend.avatarUrl,
            level: friend.level || 1,
            status: 'online', // Por padrão, todos são mostrados como online
            username: friend.username // Adicionando username para navegação
          }));
          
          // Limpar o timeout dos mocks
          if (loadingTimeout) {
            clearTimeout(loadingTimeout);
          }
          
          setOnlineFriends(formattedFriends);
        }
      } catch (error) {
        console.error('Erro ao buscar amigos:', error);
        // Se falhar, manter os mocks (que já estão carregados)
      }
    };
    
    // Carregar mocks temporários enquanto busca da API
    const mockFriends = [
      {
        id: '1',
        name: 'Carregando...',
        avatar: '/images/avatars/user1.jpg',
        level: 0,
        status: 'online',
        username: 'loading'
      },
      {
        id: '2',
        name: 'Carregando...',
        avatar: '/images/avatars/user2.jpg',
        level: 0,
        status: 'online',
        username: 'loading'
      },
      {
        id: '3',
        name: 'Carregando...',
        avatar: '/images/avatars/user3.jpg',
        level: 0,
        status: 'online',
        username: 'loading'
      }
    ];
    
    // Mostrar os mocks só durante o carregamento
    setOnlineFriends(mockFriends);
    
    // Definir um timeout para carregar os amigos reais (simulação de requisição à API)
    loadingTimeout = setTimeout(() => {
      loadFriends();
    }, 500);
    
    return () => {
      isMounted = false;
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [token, isAuthenticated]);
  
  // Verificar autenticação
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);
  
  // Novo useEffect específico para buscar os dados do perfil do usuário (avatar)
  useEffect(() => {
    if (token && user && user.id) {
      const loadUserProfileData = async () => {
        try {
          const response = await fetch('/api/user/profile', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            // Tentar obter os dados do perfil da resposta
            const profileData = await response.json();
            
            // Usar o rank do usuário do contexto de autenticação
            const userRank = user.rank || { tier: 'unranked', division: null };
            const { rankName, rankTier } = getUserRankInfo(userRank);
            
            // Usar dados do perfil da API se disponíveis, senão usar do contexto de auth
            const currentPlayer: LobbyPlayer = {
              id: user.id,
              name: profileData?.username || user.username || (user.profile?.name as string) || 'Usuário',
              avatar: profileData?.avatarUrl || user.avatarUrl || (user.profile?.avatar as string) || (user.avatarId as string) || '/images/avatars/default.svg',
              level: profileData?.level || user.level || 1,
              rank: rankName,
              rankTier: rankTier,
              isLeader: true,
              position: 0,
              username: profileData?.username || user.username
            };
            
            setPlayers([currentPlayer]);
            
            // Adicionar mensagem do sistema
            setChatMessages([
              {id: 1, user: 'Sistema', message: `Bem-vindo ao lobby, ${currentPlayer.name}! Convide seus amigos para jogar.`, isSystem: true}
            ]);
            
            // Mostrar animação de entrada no lobby
            setShowLobbyAnimation(true);
            
            // Esconder a animação após 2 segundos
            setTimeout(() => {
              setShowLobbyAnimation(false);
            }, 2000);
          }
        } catch (error) {
          console.error('Erro ao carregar dados do perfil:', error);
        }
      };
      
      loadUserProfileData();
    }
  }, [token, user?.id]);
  
  // Função utilitária para obter informações do rank do usuário
  const getUserRankInfo = (userRank: any) => {
    // Valores padrão
    let rankName = 'Unranked';
    let rankTier: RankTier = 'unranked';
    
    // Verificar se o rank existe e tem um tier válido
    if (userRank && typeof userRank.tier === 'string') {
      // Verificar se é um tier válido de RankTier
      const validTiers: RankTier[] = ['unranked', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend', 'challenger'];
      
      if (validTiers.includes(userRank.tier as RankTier)) {
        rankTier = userRank.tier as RankTier;
        
        // Formatar o nome exibido com base no tier e division
        if (rankTier !== 'unranked') {
          rankName = rankTier.charAt(0).toUpperCase() + rankTier.slice(1);
          
          // Adicionar a divisão se ela existir e não for null
          if (userRank.division) {
            rankName += ` ${userRank.division}`;
          }
        }
      }
    }
    
    return { rankName, rankTier };
  };
  
  useEffect(() => {
    // Mostrar a plataforma com um pequeno atraso para criar efeito de entrada
    const timer = setTimeout(() => {
      setShowPlatform(true);
      // Iniciar os efeitos da plataforma após um curto atraso
      setTimeout(() => setPlatformEffects(true), 800);
    }, 500);
    
    // Iniciar rotação suave da plataforma
    const rotationInterval = setInterval(() => {
      setPlatformRotation(prev => (prev + 0.5) % 360);
    }, 50);
    
    return () => {
      clearTimeout(timer);
      clearInterval(rotationInterval);
    };
  }, []);
  
  // Função para trocar de personagem com efeitos avançados
  const changeCharacter = (characterId: string) => {
    // Ativar animação ao selecionar novo personagem
    setIsAnimating(true);
    setShowPlatform(false);
    setParticlesVisible(false);
    setCharacterScale(0.8);
    
    // Efeito de luz pulsante
    const pulseLight = () => {
      // Sequência de pulsos
      setLightIntensity(70); // Aumenta intensidade
      setTimeout(() => setLightIntensity(40), 300);
      setTimeout(() => setLightIntensity(80), 600);
      setTimeout(() => setLightIntensity(30), 900);
    };
    
    pulseLight();
    
    // Trocar personagem com efeito de transição
    setTimeout(() => {
      setSelectedCharacter(characterId);
      setShowPlatform(true);
      setCharacterScale(1.2); // Escala maior para efeito de entrada
      
      // Mostrar partículas após troca
      setTimeout(() => {
        setParticlesVisible(true);
        setCharacterScale(1); // Voltar ao tamanho normal com animação
        
        // Desativar animação após um tempo
        setTimeout(() => setIsAnimating(false), 800);
      }, 300);
    }, 300);
  };
  
  // Função para adicionar mensagem ao chat
  const addChatMessage = (message: string) => {
    if (!message.trim()) return;
    
    const newMessage = {
      id: chatMessages.length + 1,
      user: user?.username || user?.profile?.name || 'Você',
      message: message
    };
    
    setChatMessages([...chatMessages, newMessage]);
    setMessageInput('');
  };
  
  // Adicionar um jogador ao lobby (simulado)
  const addPlayer = () => {
    // Abrir modal de convite ao invés de adicionar diretamente
    setShowInviteModal(true);
  };
  
  // Enviar convite para um amigo
  const inviteFriend = async (friendId: string) => {
    // Verificar se o modo é solo (não permite convidar)
    if (lobbyType === 'solo') {
      toast.error('Modo Solo não permite convidar jogadores');
      return;
    }

    // Verificar limites de jogadores por modo
    const currentPlayers = players.length;
    if (lobbyType === 'duo' && currentPlayers >= 2) {
      toast.error('Lobby de Dupla já está cheio');
      return;
    }
    if (lobbyType === 'squad' && currentPlayers >= 4) {
      toast.error('Lobby de Squad já está cheio');
      return;
    }

    // Verificar se ainda há vagas disponíveis
    if (lobbyType === 'duo' && currentPlayers >= 1) {
      toast.error('Só é permitido adicionar mais 1 jogador no modo Dupla');
      return;
    }
    if (lobbyType === 'squad' && currentPlayers >= 3) {
      toast.error('Só é permitido adicionar mais 3 jogadores no modo Squad');
      return;
    }
    
    // Encontrar o amigo selecionado
    const foundFriend = onlineFriends.find(f => f.id === friendId);
    
    if (!foundFriend) {
      toast.error("Amigo não encontrado");
      return;
    }
    
    // Sabemos que o amigo existe, então podemos usar com segurança
    const friend = foundFriend;
    
    try {
      console.log('Iniciando processo de convite para:', friend.name);
      console.log('Informações do amigo:', friend);
      
      toast.loading('Enviando convite...');
      
      // Determinar a posição para o novo jogador
      // No modo Duo, o jogador vai para a posição 1
      // No modo Squad, os jogadores vão para posições 1, 2 ou 3, dependendo de quais estão livres
      let newPosition = 1; // Posição padrão para o segundo jogador
      
      // Se for squad, procurar a primeira posição vazia (1, 2 ou 3)
      if (lobbyType === 'squad') {
        // Verificar quais posições já estão ocupadas
        const occupiedPositions = players.map(p => p.position);
        
        // Encontrar a primeira posição disponível entre 1, 2 e 3
        for (let pos = 1; pos <= 3; pos++) {
          if (!occupiedPositions.includes(pos)) {
            newPosition = pos;
            break;
          }
        }
      }
      
      // Para testar a visualização, adicionamos diretamente o amigo ao lobby com rank platinum
      const newPlayer: LobbyPlayer = {
        id: friend.id,
        name: friend.name,
        avatar: friend.avatar,
        level: friend.level || 1,
        rank: 'Platinum IV',
        rankTier: 'platinum',
        isLeader: false,
        position: newPosition, // Atribuir a posição correta
        username: friend.username
      };
      
      // Adicionar o jogador à lista
      setPlayers([...players, newPlayer]);
      
      // Adicionar mensagem ao sistema
      setChatMessages([...chatMessages, {
        id: chatMessages.length + 1,
        user: 'Sistema',
        message: `${friend.name} juntou-se ao lobby.`,
        isSystem: true
      }]);
      
      // Remover o amigo da lista de amigos online para evitar convites duplicados
      setOnlineFriends(onlineFriends.filter(f => f.id !== friend.id));
      
      toast.dismiss();
      toast.success(`${friend.name} juntou-se ao lobby!`);
      
      // Fechar o modal de convite se estiver aberto
      setShowInviteModal(false);
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      toast.dismiss();
      toast.error('Erro ao enviar convite. Tente novamente.');
    }
  };
  
  // Remover um jogador do lobby
  const removePlayer = (playerId: string) => {
    // Não permite remover o líder (você mesmo)
    if (players.find(p => p.id === playerId)?.isLeader) {
      return;
    }
    
    setPlayers(players.filter(p => p.id !== playerId));
  };
  
  // Função para modificar o tipo de lobby
  const changeLobbyType = (type: LobbyType) => {
    setLobbyType(type);
    // Ajustar o gameplay mode baseado no tipo de lobby
    if (type === 'solo') {
      // Para Solo (1x1), apenas "infinite_ice" (gelo infinito) ou "normal" (gelo finito)
      setGameplayMode('infinite_ice');
    } else {
      // Para Duo (2x2) ou Squad (4x4), apenas "normal" ou "tactical"
      setGameplayMode('normal');
    }
    // Manter apenas o jogador atual (líder) ao mudar o tipo de lobby
    const leader = players.find(p => p.isLeader);
    if (leader) {
      setPlayers([leader]);
    }
  };
  
  // Calcular slots disponíveis baseado no tipo de lobby
  const getAvailableSlots = () => {
    const maxPlayers = lobbyType === 'solo' ? 1 : lobbyType === 'duo' ? 2 : 4;
    return Array(maxPlayers - players.length - fakeFriends.length).fill(null);
  };
  
  // Função para adicionar amigo fake
  const addFakeFriend = () => {
    // Lista de nomes fictícios para amigos
    const fakeNames = [
      "FastSniper", "ProGamer99", "QuickShot", "NinjaPlayer", "MegaKiller",
      "LegendX", "StealthHawk", "FireStorm", "ToxicRanger", "PhantomShade",
      "ThunderBolt", "DiamondWolf", "SilverFox", "GoldenEagle", "IronHeart"
    ];
    
    // Só permitir adicionar amigos se há slots disponíveis
    const maxPlayers = lobbyType === 'solo' ? 1 : lobbyType === 'duo' ? 2 : 4;
    if (players.length + fakeFriends.length >= maxPlayers) {
      return;
    }
    
    // Gerar um ID fictício
    const fakeId = `fake-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Escolher um nome aleatório
    const randomIndex = Math.floor(Math.random() * fakeNames.length);
    const fakeName = fakeNames[randomIndex];
    
    // Lista de tiers possíveis
    const possibleTiers: RankTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    
    // Se o nome for LegendX, definir como Legend (caso específico)
    let randomTier: RankTier = fakeName === "LegendX" ? 'legend' : possibleTiers[Math.floor(Math.random() * possibleTiers.length)];
    
    // Criar jogador fictício
    const fakeFriend = {
      id: fakeId,
      username: fakeName,
      isReady: true,
      isFake: true,
      rank: {
        tier: randomTier,
        division: ['1', '2', '3'][Math.floor(Math.random() * 3)],
        points: Math.floor(Math.random() * 1000) + 100
      },
      rankTier: randomTier, // Adicionar rankTier corresponde ao rank.tier para o ProfileAvatar
      avatarUrl: `/images/avatars/${Math.floor(Math.random() * 5) + 1}.png`
    };
    
    // Adicionar ao estado
    setFakeFriends([...fakeFriends, fakeFriend]);
    
    // Mostrar notificação
    toast.success(`${fakeName} entrou no lobby`);
  };
  
  // Função para remover amigo fake
  const removeFakeFriend = (fakeId: string) => {
    const friendToRemove = fakeFriends.find(f => f.id === fakeId);
    if (friendToRemove) {
      toast.success(`${friendToRemove.username} removido do lobby`);
    }
    setFakeFriends(fakeFriends.filter(friend => friend.id !== fakeId));
  };
  
  // Função para buscar salas oficiais do administrador
  const fetchAdminRooms = async () => {
    try {
      if (!user) {
        toast.error('Usuário não encontrado. Faça login novamente.');
        return;
      }

      console.log('Iniciando busca por partida com parâmetros:', {
        userId: user.id,
        mode: lobbyType,
        type: lobbyType,
        platform: 'mixed',
        platformMode,
        gameplayMode,
        teamSize: lobbyType === 'solo' ? 1 : lobbyType === 'duo' ? 2 : 4,
      });
      
      // Criação automática imediata de uma partida simulada em vez de esperar
      console.log('Criando partida simulada imediatamente');
      
      // Criar uma partida simulada
      const simulatedMatch = {
        id: `match-${Date.now()}`,
        title: `Partida ${lobbyType.charAt(0).toUpperCase() + lobbyType.slice(1)}`,
        createdAt: new Date().toISOString(),
        status: 'in_progress',
        type: lobbyType,
        mode: lobbyType,
        format: lobbyType,
        teamSize: lobbyType === 'solo' ? 1 : lobbyType === 'duo' ? 2 : 4,
        entryFee: selectedBetAmount,
        prize: selectedBetAmount * 2 * 0.95,
        platformMode: platformMode,
        gameplayMode: gameplayMode,
        roomId: `ROOM-${Math.floor(Math.random() * 10000)}`,
        roomPassword: `${Math.floor(Math.random() * 10000)}`,
        teams: [
          {
            id: 'team1',
            name: 'Time 1',
            players: [{
              id: user?.id || 'user-1',
              name: user?.name || 'Jogador',
              avatar: user?.avatarId || '/images/avatars/blue.svg',
              isReady: true,
              isCaptain: true
            }]
          },
          {
            id: 'team2',
            name: 'Time 2',
            players: [{
              id: 'bot-1',
              name: 'Oponente',
              avatar: '/images/avatars/red.svg',
              isReady: true,
              isCaptain: false
            }]
          }
        ]
      };
      
      // Parar a animação de busca e mostrar a partida encontrada
      setIsSearchingMatch(false);
      setFoundMatch(simulatedMatch);
      
      // Exibir o modal da sala imediatamente
      setShowMatchRoomModal(true);
      
      return; // Terminar a função aqui para não chamar a API real
      
      // O código abaixo não será executado
      
      // Chamar a API de matchmaking real
      const response = await fetch('/api/matchmaking/find', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          mode: lobbyType,
          type: lobbyType,
          platform: 'mixed',
          platformMode: platformMode,
          gameplayMode: gameplayMode,
          teamSize: lobbyType === 'solo' ? 1 : lobbyType === 'duo' ? 2 : 4,
        }),
        // Adicionar timeout para evitar que a requisição fique pendente indefinidamente
        signal: AbortSignal.timeout(15000)
      });
      
      // Verificar se houve erro na resposta HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('Erro na resposta da API:', response.status, errorData);
        throw new Error(errorData.error || `Erro ${response.status}: Falha na busca por partida`);
      }
      
      // Obter a partida do resultado
      const matchResponse = await response.json();
      console.log('Resposta da API de matchmaking:', matchResponse);
      
      // Se houve algum erro na API
      if (matchResponse.error) {
        throw new Error(matchResponse.error);
      }
      
      // Se a partida já foi encontrada
      if (matchResponse.matchFound) {
        console.log('Partida encontrada imediatamente:', matchResponse.match);
        
        // Se a partida tiver informações de sala oficial, atualizar estados
        if (matchResponse.match.isOfficialRoom) {
          setIsConnectingToOfficialRoom(true);
          setSelectedOfficialRoom({
            id: matchResponse.match.id,
            roomId: matchResponse.match.roomId,
            roomPassword: matchResponse.match.roomPassword,
            gameType: matchResponse.match.gameType || lobbyType,
            format: matchResponse.match.title?.replace('Partida Oficial ', '').split(' #')[0] || lobbyType,
            entryFee: matchResponse.match.entryFee,
            gameDetails: matchResponse.match.gameDetails
          });
        }
        
        // Parar a animação de busca e mostrar a partida encontrada
        setIsSearchingMatch(false);
        setFoundMatch(matchResponse.match);
        
        // Exibir o modal da sala após um pequeno delay
        setTimeout(() => {
          setShowMatchRoomModal(true);
        }, 1500);
      } else if (matchResponse.waitingId) {
        // Estamos em modo de espera, exibir o componente de status
        console.log('Adicionado à fila de espera com ID:', matchResponse.waitingId);
        setWaitingId(matchResponse.waitingId);
        toast.success('Busca por partida iniciada com sucesso!');
      } else {
        // Caso não reconheça a resposta
        console.error('Formato de resposta desconhecido:', matchResponse);
        throw new Error('Erro inesperado na resposta do servidor');
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Ocorreu um erro desconhecido ao buscar partida';
      
      console.error('Erro detalhado ao iniciar matchmaking:', error);
      toast.error(`Não foi possível iniciar a busca por partida: ${errorMessage}`);
      setIsSearchingMatch(false);
      setWaitingId(null);
    }
  };

  // Adicionar um novo estado para o ID de espera
  const [waitingId, setWaitingId] = useState<string | null>(null);

  // Adicionar função para lidar com partida encontrada
  const handleMatchFound = (match: any) => {
    if (match.isOfficialRoom) {
      setIsConnectingToOfficialRoom(true);
      setSelectedOfficialRoom({
        id: match.id,
        roomId: match.roomId,
        roomPassword: match.roomPassword,
        gameType: match.gameType || lobbyType,
        format: match.title?.replace('Partida Oficial ', '').split(' #')[0] || lobbyType,
        entryFee: match.entryFee,
        gameDetails: match.gameDetails
      });
    }
    
    // Parar a animação de busca e mostrar a partida encontrada
    setIsSearchingMatch(false);
    setFoundMatch(match);
    
    // Exibir o modal da sala após um pequeno delay
    setTimeout(() => {
      setShowMatchRoomModal(true);
    }, 1500);
  };

  // Adicionar função para cancelar a busca
  const handleCancelMatchmaking = () => {
    setIsSearchingMatch(false);
    setWaitingId(null);
  };
  
  // Fechar o modal da sala
  const handleCloseRoomModal = () => {
    // Limpar completamente todos os estados relacionados à partida
    setShowMatchRoomModal(false);
    setShowSubmitResultModal(false);
    setFoundMatch(null);
    setIsSearchingMatch(false);
  };
  
  // Redirecionar para a tela de envio de resultado
  const handleSubmitResult = () => {
    setShowMatchRoomModal(false);
    
    // Verificar se temos um match encontrado
    if (foundMatch) {
      // Mostrar modal de resultado diretamente em vez de redirecionar
      setShowSubmitResultModal(true);
    }
  };
  
  // Manipular envio de resultado
  const handleResultSubmit = (result: {
    matchId: string;
    winner: 'team1' | 'team2';
    screenshot: File | null;
    comment: string;
  }) => {
    // Lógica para processar o resultado
    console.log('Resultado enviado:', result);
    
    // Fechar todos os modais e redefinir todos os estados relacionados à partida
    setShowSubmitResultModal(false);
    setShowMatchRoomModal(false);
    setFoundMatch(null);
    setIsSearchingMatch(false);
    setMatchCompleted(true);
    
    // Notificar o usuário
    alert('Resultado enviado com sucesso! Nossa equipe irá analisar e liberar o pagamento em breve.');
  };
  
  // Função para iniciar partida
  const startGame = () => {
    // Verificar se o usuário tem saldo suficiente
    const userBalance = userWithStats?.balance || 0;
    if (userBalance < selectedBetAmount) {
      toast.error(`Saldo insuficiente. Você precisa de R$${selectedBetAmount} para jogar.`);
      return;
    }
    
    // Iniciar busca por partida
    setIsSearchingMatch(true);
    setReadyStatus(true);
    
    // Chamar a função que busca partidas
    fetchAdminRooms();
  };
  
  // Mostrar componente de loading enquanto carrega
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }
  
  // Encontrar jogador pela posição
  const getPlayerByPosition = (position: number) => {
    return players.find(player => player.position === position);
  };
  
  useEffect(() => {
    // Verificar se é a primeira visita do usuário ao lobby
    const hasSeenTutorial = localStorage.getItem('rpx_tutorial_seen');
    
    if (!hasSeenTutorial && !isLoading && isAuthenticated) {
      // Marcar que o tutorial foi visto
      localStorage.setItem('rpx_tutorial_seen', 'true');
      // Mostrar o tutorial
      setShowTutorial(true);
    }
    
    // Carregar dados do lobby...
  }, [isLoading, isAuthenticated]);
  
  return (
    <>
      <div className="min-h-screen bg-rpx-dark">
        {/* Componente de notificações de matchmaking */}
        <MatchmakingListener
          onMatchFound={handleMatchFound}
          onCancelMatchmaking={handleCancelMatchmaking}
        />
        
        {/* Tutorial Modal */}
        <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
        
        {/* Conteúdo existente... */}
        <div className="min-h-screen bg-gradient-to-b from-[#120821] via-[#0D0A2A] to-[#0A1B4D] relative overflow-hidden">
          {/* Background elements */}
          <div className="absolute inset-0 bg-[url('/images/stars-bg.png')] bg-repeat opacity-40 z-0 animate-twinkle"></div>
          
          {/* Gradient beams */}
          <div className="absolute -top-[400px] left-1/3 w-[800px] h-[1000px] bg-gradient-to-b from-[#A44BE1]/5 to-transparent rotate-15 animate-beam-move-slow"></div>
          <div className="absolute -top-[300px] right-1/3 w-[600px] h-[800px] bg-gradient-to-b from-[#5271FF]/5 to-transparent -rotate-15 animate-beam-move-delay"></div>
          <div className="absolute top-[30%] left-[10%] w-[200px] h-[200px] rounded-full radial-pulse bg-[#A44BE1]/3 animate-pulse-slow"></div>
          <div className="absolute top-[60%] right-[15%] w-[300px] h-[300px] rounded-full radial-pulse bg-[#5271FF]/3 animate-pulse-slower"></div>
          
          {/* Floating lights */}
          <div className="absolute top-[10%] right-[20%] w-[400px] h-[400px] rounded-full bg-gradient-to-r from-[#A44BE1]/10 to-transparent blur-3xl animate-pulse-very-slow"></div>
          <div className="absolute bottom-[20%] left-[15%] w-[350px] h-[350px] rounded-full bg-gradient-to-r from-[#5271FF]/10 to-transparent blur-3xl animate-pulse-slow"></div>
          <div className="absolute top-[40%] left-[30%] w-[250px] h-[250px] rounded-full bg-gradient-to-r from-[#3FB2E9]/10 to-transparent blur-3xl animate-pulse-slower" style={{ animationDelay: '2s' }}></div>
          
          {/* Main content with enhanced blur and glow effects */}
          <main className="relative z-10 h-screen flex items-center">
            {/* Improved main lobby area with enhanced glass effect */}
            <div className="flex px-10 h-[90vh] max-h-[850px] w-full">
              {/* Enhanced left sidebar with better glass effect */}
              <div className="w-72 bg-card backdrop-blur-md rounded-2xl p-5 mr-6 flex flex-col border border-border shadow-glow-sm overflow-hidden relative">
                {/* Glass card effect */}
                <div className="absolute -top-6 -right-6 w-20 h-32 bg-primary/5 rotate-45 blur-md"></div>
                
                {/* Tabs de navegação para as diferentes configurações */}
                <div className="flex border-b border-white/10 mb-4">
                  <button 
                    onClick={() => setSettingsTab('game-modes')}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${settingsTab === 'game-modes' ? 'text-white border-b-2 border-[#A44BE1]' : 'text-white/60 hover:text-white/80'}`}
                  >
                    Modos
                  </button>
                  <button 
                    onClick={() => setSettingsTab('platforms')}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${settingsTab === 'platforms' ? 'text-white border-b-2 border-[#A44BE1]' : 'text-white/60 hover:text-white/80'}`}
                  >
                    Plataforma
                  </button>
                  <button 
                    onClick={() => setSettingsTab('payment')}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${settingsTab === 'payment' ? 'text-white border-b-2 border-[#A44BE1]' : 'text-white/60 hover:text-white/80'}`}
                  >
                    Pagamento
                  </button>
                </div>
                
                {/* Conteúdo das abas */}
                {settingsTab === 'game-modes' && (
                  <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-white/90 text-sm uppercase tracking-wider font-semibold">Modos de Jogo</h2>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={fetchAdminRooms}
                      className="p-1 rounded-full hover:bg-white/10 transition-colors"
                      title="Atualizar salas disponíveis"
                    >
                      <RefreshCw size={14} className="text-white/70" />
                    </button>
                  </div>
                </div>
                
                    <div className="space-y-3 mb-4">
                <button
                  onClick={() => changeLobbyType('solo')}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      lobbyType === 'solo' 
                        ? 'bg-gradient-to-r from-[#A44BE1]/40 to-[#5271FF]/30 border-l-4 border-[#A44BE1] shadow-glow-sm' 
                        : 'hover:bg-white/10 hover:border-l-4 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        lobbyType === 'solo' ? 'bg-gradient-to-r from-[#A44BE1] to-[#5271FF] shadow-glow-sm' : 'bg-white/10'
                      }`}>
                        <User size={18} className={`${lobbyType === 'solo' ? 'text-white' : 'text-white/70'} transition-all`} />
                      </div>
                      <div className="ml-3">
                        <div className={`text-sm font-medium ${lobbyType === 'solo' ? 'text-white drop-shadow-glow' : 'text-white/70'} transition-all`}>Solo</div>
                        <div className="text-xs text-white/50">1 jogador</div>
                      </div>
                  </div>
                </button>
                
                <button
                  onClick={() => changeLobbyType('duo')}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      lobbyType === 'duo' 
                        ? 'bg-gradient-to-r from-[#A44BE1]/40 to-[#5271FF]/30 border-l-4 border-[#A44BE1] shadow-glow-sm' 
                        : 'hover:bg-white/10 hover:border-l-4 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        lobbyType === 'duo' ? 'bg-gradient-to-r from-[#A44BE1] to-[#5271FF] shadow-glow-sm' : 'bg-white/10'
                      }`}>
                        <div className="flex items-center justify-center w-full h-full">
                          <div className="relative w-5 h-5">
                            <User size={13} className={`absolute left-0 top-0 ${lobbyType === 'duo' ? 'text-white' : 'text-white/70'} transition-all`} />
                            <User size={13} className={`absolute right-0 bottom-0 ${lobbyType === 'duo' ? 'text-white' : 'text-white/70'} transition-all`} />
                          </div>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className={`text-sm font-medium ${lobbyType === 'duo' ? 'text-white drop-shadow-glow' : 'text-white/70'} transition-all`}>Dupla</div>
                        <div className="text-xs text-white/50">2 jogadores</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => changeLobbyType('squad')}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      lobbyType === 'squad' 
                        ? 'bg-gradient-to-r from-[#A44BE1]/40 to-[#5271FF]/30 border-l-4 border-[#A44BE1] shadow-glow-sm' 
                        : 'hover:bg-white/10 hover:border-l-4 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        lobbyType === 'squad' ? 'bg-gradient-to-r from-[#A44BE1] to-[#5271FF] shadow-glow-sm' : 'bg-white/10'
                      }`}>
                        <LucideUsers size={18} className={`${lobbyType === 'squad' ? 'text-white' : 'text-white/70'} transition-all`} />
                      </div>
                      <div className="ml-3">
                        <div className={`text-sm font-medium ${lobbyType === 'squad' ? 'text-white drop-shadow-glow' : 'text-white/70'} transition-all`}>Squad</div>
                        <div className="text-xs text-white/50">4 jogadores</div>
                    </div>
                  </div>
                </button>
              </div>
                
                    <h2 className="text-white/90 text-sm uppercase tracking-wider mb-4 font-semibold">Modo de Jogo</h2>
                    <div className="space-y-3">
                      {/* Configurações do jogo - Gameplay Mode */}
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                          <div className="mr-2 bg-rpx-orange/20 p-1 rounded">
                            <Maximize2 size={16} className="text-rpx-orange" />
                          </div>
                          Modo de Gameplay
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {lobbyType === 'solo' ? (
                            // Opções para Solo (1x1)
                            <>
                              <button
                                className={`p-3 text-sm rounded-md border transition-all flex items-center ${
                                  gameplayMode === 'infinite_ice' 
                                    ? 'bg-rpx-orange/20 border-rpx-orange text-white' 
                                    : 'bg-rpx-blue/20 border-white/10 text-white/60 hover:bg-rpx-blue/30'
                                }`}
                                onClick={() => setGameplayMode('infinite_ice')}
                              >
                                <Zap size={16} className="mr-2" />
                                Gelo Infinito
                              </button>
                              
                              <button
                                className={`p-3 text-sm rounded-md border transition-all flex items-center ${
                                  gameplayMode === 'normal' 
                                    ? 'bg-rpx-orange/20 border-rpx-orange text-white' 
                                    : 'bg-rpx-blue/20 border-white/10 text-white/60 hover:bg-rpx-blue/30'
                                }`}
                                onClick={() => setGameplayMode('normal')}
                              >
                                <Zap size={16} className="mr-2" />
                                Gelo Finito
                              </button>
                            </>
                          ) : (
                            // Opções para Duo (2x2) e Squad (4x4)
                            <>
                              <button
                                className={`p-3 text-sm rounded-md border transition-all flex items-center ${
                                  gameplayMode === 'normal' 
                                    ? 'bg-rpx-orange/20 border-rpx-orange text-white' 
                                    : 'bg-rpx-blue/20 border-white/10 text-white/60 hover:bg-rpx-blue/30'
                                }`}
                                onClick={() => setGameplayMode('normal')}
                              >
                                <Zap size={16} className="mr-2" />
                                Normal
                              </button>
                              
                              <button
                                className={`p-3 text-sm rounded-md border transition-all flex items-center ${
                                  gameplayMode === 'tactical' 
                                    ? 'bg-rpx-orange/20 border-rpx-orange text-white' 
                                    : 'bg-rpx-blue/20 border-white/10 text-white/60 hover:bg-rpx-blue/30'
                                }`}
                                onClick={() => setGameplayMode('tactical')}
                              >
                                <Zap size={16} className="mr-2" />
                                Tático
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                {settingsTab === 'platforms' && (
                  <>
                    <h2 className="text-white/90 text-sm uppercase tracking-wider mb-4 font-semibold">Plataforma</h2>
                    <div className="space-y-3 mb-4">
                      <button
                        onClick={() => setPlatformMode('emulator')}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                          platformMode === 'emulator' 
                            ? 'bg-gradient-to-r from-[#A44BE1]/40 to-[#5271FF]/30 border-l-4 border-[#A44BE1] shadow-glow-sm' 
                            : 'hover:bg-white/10 hover:border-l-4 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            platformMode === 'emulator' ? 'bg-gradient-to-r from-[#A44BE1] to-[#5271FF] shadow-glow-sm' : 'bg-white/10'
                          }`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${platformMode === 'emulator' ? 'text-white' : 'text-white/70'} transition-all`}>
                              <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                              <rect x="9" y="9" width="6" height="6"></rect>
                              <line x1="9" y1="2" x2="9" y2="4"></line>
                              <line x1="15" y1="2" x2="15" y2="4"></line>
                              <line x1="9" y1="20" x2="9" y2="22"></line>
                              <line x1="15" y1="20" x2="15" y2="22"></line>
                              <line x1="20" y1="9" x2="22" y2="9"></line>
                              <line x1="20" y1="14" x2="22" y2="14"></line>
                              <line x1="2" y1="9" x2="4" y2="9"></line>
                              <line x1="2" y1="14" x2="4" y2="14"></line>
                            </svg>
                          </div>
                          <div className="ml-3">
                            <div className={`text-sm font-medium ${platformMode === 'emulator' ? 'text-white drop-shadow-glow' : 'text-white/70'} transition-all`}>Emulador</div>
                            <div className="text-xs text-white/50">PC ou emuladores</div>
                          </div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setPlatformMode('mobile')}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                          platformMode === 'mobile' 
                            ? 'bg-gradient-to-r from-[#A44BE1]/40 to-[#5271FF]/30 border-l-4 border-[#A44BE1] shadow-glow-sm' 
                            : 'hover:bg-white/10 hover:border-l-4 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            platformMode === 'mobile' ? 'bg-gradient-to-r from-[#A44BE1] to-[#5271FF] shadow-glow-sm' : 'bg-white/10'
                          }`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${platformMode === 'mobile' ? 'text-white' : 'text-white/70'} transition-all`}>
                              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                              <line x1="12" y1="18" x2="12" y2="18"></line>
                            </svg>
                          </div>
                          <div className="ml-3">
                            <div className={`text-sm font-medium ${platformMode === 'mobile' ? 'text-white drop-shadow-glow' : 'text-white/70'} transition-all`}>Mobile</div>
                            <div className="text-xs text-white/50">Smartphones e tablets</div>
                          </div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setPlatformMode('mixed')}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                          platformMode === 'mixed' 
                            ? 'bg-gradient-to-r from-[#A44BE1]/40 to-[#5271FF]/30 border-l-4 border-[#A44BE1] shadow-glow-sm' 
                            : 'hover:bg-white/10 hover:border-l-4 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            platformMode === 'mixed' ? 'bg-gradient-to-r from-[#A44BE1] to-[#5271FF] shadow-glow-sm' : 'bg-white/10'
                          }`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${platformMode === 'mixed' ? 'text-white' : 'text-white/70'} transition-all`}>
                              <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                              <line x1="16" y1="8" x2="2" y2="22"></line>
                              <line x1="17.5" y1="15" x2="9" y2="15"></line>
                            </svg>
                          </div>
                          <div className="ml-3">
                            <div className={`text-sm font-medium ${platformMode === 'mixed' ? 'text-white drop-shadow-glow' : 'text-white/70'} transition-all`}>Misto</div>
                            <div className="text-xs text-white/50">Todas as plataformas</div>
                          </div>
                        </div>
                      </button>
                    </div>
                    
                    <h2 className="text-white/90 text-sm uppercase tracking-wider mb-4 font-semibold">Valor da Aposta</h2>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {[2, 5, 10].map((value) => (
                        <button
                          key={value}
                          onClick={() => setSelectedBetAmount(value)}
                          className={`${
                            selectedBetAmount === value 
                              ? 'bg-gradient-to-r from-[#A44BE1]/40 to-[#5271FF]/30 border border-[#A44BE1]/70' 
                              : 'bg-white/10 hover:bg-white/15 border border-white/10'
                          } rounded-lg py-2 flex flex-col items-center justify-center transition-all group`}
                        >
                          <span className={`text-sm ${
                            selectedBetAmount === value 
                              ? 'text-white drop-shadow-glow' 
                              : 'text-white/80 group-hover:text-white'
                          } transition-all`}>
                            {value} R$
                          </span>
                        </button>
                      ))}
          </div>
          
                    <div className="grid grid-cols-3 gap-2">
                      {[20, 50, 100].map((value) => (
                        <button
                          key={value}
                          onClick={() => setSelectedBetAmount(value)}
                          className={`${
                            selectedBetAmount === value 
                              ? 'bg-gradient-to-r from-[#A44BE1]/40 to-[#5271FF]/30 border border-[#A44BE1]/70' 
                              : 'bg-white/10 hover:bg-white/15 border border-white/10'
                          } rounded-lg py-2 flex flex-col items-center justify-center transition-all group`}
                        >
                          <span className={`text-sm ${
                            selectedBetAmount === value 
                              ? 'text-white drop-shadow-glow' 
                              : 'text-white/80 group-hover:text-white'
                          } transition-all`}>
                            {value} R$
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  </>
                )}
                
                {settingsTab === 'payment' && (
                  <>
                    <h2 className="text-white/90 text-sm uppercase tracking-wider mb-4 font-semibold">Opções de Pagamento</h2>
                     <div className="space-y-2 mb-6">
                      <button
                        onClick={() => setPaymentOption('captain')}
                        className={`w-full text-left px-4 py-2 rounded-xl flex items-center group transition-all ${
                          paymentOption === 'captain' 
                            ? 'bg-gradient-to-r from-[#A44BE1]/20 to-[#5271FF]/20 shadow-inner' 
                            : 'hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                          paymentOption === 'captain' ? 'border-[#A44BE1]' : 'border-white/30 group-hover:border-white/50'
                        }`}>
                          {paymentOption === 'captain' && (
                            <div className="w-2 h-2 rounded-full bg-[#A44BE1] shadow-glow-sm"></div>
                          )}
                        </div>
                        <span className={`ml-3 text-sm transition-all ${paymentOption === 'captain' ? 'text-white' : 'text-white/70 group-hover:text-white/90'}`}>
                          Capitão paga
                        </span>
                      </button>
                      
                      <button
                        onClick={() => setPaymentOption('split')}
                        className={`w-full text-left px-4 py-2 rounded-xl flex items-center group transition-all ${
                          paymentOption === 'split' 
                            ? 'bg-gradient-to-r from-[#A44BE1]/20 to-[#5271FF]/20 shadow-inner' 
                            : 'hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                          paymentOption === 'split' ? 'border-[#A44BE1]' : 'border-white/30 group-hover:border-white/50'
                        }`}>
                          {paymentOption === 'split' && (
                            <div className="w-2 h-2 rounded-full bg-[#A44BE1] shadow-glow-sm"></div>
                          )}
                        </div>
                        <span className={`ml-3 text-sm transition-all ${paymentOption === 'split' ? 'text-white' : 'text-white/70 group-hover:text-white/90'}`}>
                          Custos divididos
                        </span>
                      </button>
                    </div>
                    
                    {/* Removi a seção de Status e o botão "Marcar como pronto" */}
                   </>
                 )}
                
                {/* Botão de iniciar partida fixo na parte inferior */}
                <div className="mt-auto pt-4 border-t border-white/10">
                  <button
                    onClick={startGame}
                    className="w-full py-3 rounded-xl flex items-center justify-center bg-gradient-to-r from-[#A44BE1] to-[#5271FF] text-white shadow-glow-sm hover:shadow-glow transition-all"
                  >
                    <span className="flex items-center">
                      <PlayCircle size={18} className="mr-2" />
                      Iniciar Partida
                    </span>
                  </button>
                </div>

                {/* Área de configurações avançadas e extras */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setInviteModalOpen(true)} 
                    className="flex flex-col items-center justify-center p-3 bg-rpx-blue/20 border border-white/10 rounded-xl hover:bg-rpx-blue/30 transition-colors"
                  >
                    <UserPlus size={20} className="text-white mb-2" />
                    <span className="text-white/90 text-xs">Convidar</span>
                  </button>
                  
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="flex flex-col items-center justify-center p-3 bg-rpx-blue/20 border border-white/10 rounded-xl hover:bg-rpx-blue/30 transition-colors"
                  >
                    <Settings size={20} className="text-white mb-2" />
                    <span className="text-white/90 text-xs">Ajustes</span>
                  </button>
                  
                  <button
                    onClick={() => setShowTutorial(true)}
                    className="flex flex-col items-center justify-center p-3 bg-rpx-blue/20 border border-white/10 rounded-xl hover:bg-rpx-blue/30 transition-colors"
                  >
                    <Book size={20} className="text-white mb-2" />
                    <span className="text-white/90 text-xs">Tutorial</span>
                  </button>
                </div>
              </div>
              
              {/* Enhanced main content area with advanced holographic display */}
              <div className="flex-1 relative flex flex-col">
                <div className="flex-1 relative bg-card backdrop-blur-md rounded-2xl overflow-hidden border border-border shadow-glow-sm">
                  {/* Background effects */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#A44BE1]/3 to-[#5271FF]/3"></div>
                  <div className="absolute inset-0 bg-[url('/images/grid-pattern.png')] bg-repeat opacity-10 animate-pulse-very-slow"></div>
                  
                  {/* Central light */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[500px] bg-gradient-to-b from-[#A44BE1]/10 via-[#5271FF]/5 to-transparent opacity-20 blur-2xl"></div>
                  
                  {/* Enhanced central holographic display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {/* Enhanced mode indicator - agora no topo */}
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/5 rounded-full blur-md transform scale-110"></div>
                        <div className="relative inline-block px-10 py-2.5 bg-card-hover backdrop-blur-xl rounded-full border border-border shadow-glow-sm">
                          <span className="text-base text-white/90 uppercase tracking-wider font-medium">
                            {lobbyType === 'solo' ? 'Modo Solo' : lobbyType === 'duo' ? 'Modo Dupla' : 'Modo Squad'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative w-full max-w-2xl flex flex-col items-center justify-center mt-8">
                      {/* Main hologram container */}
                      <div className="flex flex-col items-center justify-center text-center">
                        {/* Círculos dos jogadores - layout horizontal fixo */}
                        <div className="flex items-center justify-center space-x-20 relative mt-8">
                          {/* Squad - jogador 3 ou botão à esquerda */}
                          {lobbyType === 'squad' && (
                            getPlayerByPosition(2) ? (
                              <div className="flex flex-col items-center">
                                <div 
                                  className="w-24 h-24 relative flex items-center justify-center group cursor-pointer"
                                  onClick={() => {
                                    const player = getPlayerByPosition(2);
                                    if (player) {
                                      router.push(`/profile/${player.username || player.name}`);
                                    }
                                  }}
                                >
                                  <ProfileAvatar 
                                    size="md" 
                                    rankTier={getPlayerByPosition(2)?.rankTier}
                                    avatarUrl={getPlayerByPosition(2)?.avatar}
                                    showRankFrame={true}
                                  />
                                </div>
                                
                                {/* Nome com possível indicador ao lado - adicionando mais margem superior */}
                                <div className="flex items-center mt-10 gap-1 justify-center">
                                  <span 
                                    className="text-sm text-white/90 font-medium cursor-pointer hover:underline"
                                    onClick={() => {
                                      const player = getPlayerByPosition(2);
                                      if (player) {
                                        router.push(`/profile/${player.username || player.name}`);
                                      }
                                    }}
                                  >
                                    {getPlayerByPosition(2)?.name}
                                  </span>
                                  {getPlayerByPosition(2)?.isLeader && (
                                    <div className="bg-yellow-500 text-black p-0.5 rounded-full shadow-sm flex items-center justify-center">
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 17L6.5 6L12 12L17.5 6L21 17H3Z" fill="currentColor"/>
                                        <path d="M3 19H21V21H3V19Z" fill="currentColor"/>
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex flex-col items-center gap-1 mt-1">
                                  <div className="text-xs text-[#5271FF] bg-[#2D0A57]/60 px-2 py-0.5 rounded-md shadow-sm border border-[#5271FF]/30">
                                    Lvl {getPlayerByPosition(2)?.level}
                                  </div>
                                  {getPlayerByPosition(2)?.rank && (
                                    <div className="text-xs bg-gradient-to-r from-[#A44BE1]/30 to-[#5271FF]/30 px-2 py-0.5 rounded-md shadow-sm border border-[#5271FF]/20 flex items-center">
                                      <Award size={12} className="mr-1 text-[#5271FF]" /> {getPlayerByPosition(2)?.rank}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setShowInviteModal(true)}
                                className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2D0A57]/80 to-[#3F1581]/80 border-2 border-[#5271FF]/30 shadow-[0_0_10px_rgba(82,113,255,0.3)] flex items-center justify-center hover:shadow-[0_0_15px_rgba(82,113,255,0.6)] transition-all group cursor-pointer overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-[#A44BE1]/10 to-[#5271FF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="absolute inset-0 bg-[url('/images/hex-pattern.svg')] bg-center bg-contain opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                <LucideUserPlus size={28} className="text-white/80 group-hover:text-white/100 group-hover:drop-shadow-glow transition-all relative z-10" />
                              </button>
                            )
                          )}
                          
                          {/* Capitão no centro sem indicador no avatar */}
                          <div className="flex flex-col items-center">
                            <div 
                              className="w-32 h-32 relative flex items-center justify-center group cursor-pointer"
                              onClick={() => {
                                const player = getPlayerByPosition(0);
                                if (player) {
                                  router.push(`/profile/${player.username || player.name}`);
                                }
                              }}
                            >
                                <ProfileAvatar 
                                  size="lg" 
                                  rankTier={getPlayerByPosition(0)?.rankTier}
                                  avatarUrl={getPlayerByPosition(0)?.avatar}
                                  showRankFrame={true}
                                />
                            </div>
                            
                            {/* Nome com possível indicador ao lado - margem maior */}
                            <div className="flex items-center mt-12 gap-1 justify-center">
                              <span 
                                className="text-sm text-white/90 font-medium cursor-pointer hover:underline"
                                onClick={() => {
                                  const player = getPlayerByPosition(0);
                                  if (player) {
                                    router.push(`/profile/${player.username || player.name}`);
                                  }
                                }}
                              >
                                {getPlayerByPosition(0)?.name}
                              </span>
                              {getPlayerByPosition(0)?.isLeader && (
                                <div className="bg-yellow-500 text-black p-0.5 rounded-full shadow-sm flex items-center justify-center">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3 17L6.5 6L12 12L17.5 6L21 17H3Z" fill="currentColor"/>
                                  <path d="M3 19H21V21H3V19Z" fill="currentColor"/>
                                </svg>
                              </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-center gap-1 mt-1">
                              <div className="text-sm text-yellow-400 bg-[#2D0A57]/60 px-3 py-1 rounded-md shadow-sm border border-yellow-500/20 flex items-center">
                                <span className="mr-1">Capitão</span> • Lvl {getPlayerByPosition(0)?.level || 1}
                              </div>
                              {getPlayerByPosition(0)?.rank && (
                                <div className="text-sm bg-gradient-to-r from-[#A44BE1]/30 to-[#5271FF]/30 px-3 py-1 rounded-md shadow-sm border border-[#5271FF]/20 flex items-center">
                                  <Award size={14} className="mr-1.5 text-[#5271FF]" /> {getPlayerByPosition(0)?.rank}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Botão à direita para duo e squad ou jogador 2 */}
                          {(lobbyType === 'duo' || lobbyType === 'squad') && (
                            getPlayerByPosition(1) ? (
                              <div className="flex flex-col items-center">
                                <div 
                                  className="w-24 h-24 relative flex items-center justify-center group cursor-pointer"
                                  onClick={() => {
                                    const player = getPlayerByPosition(1);
                                    if (player) {
                                      router.push(`/profile/${player.username || player.name}`);
                                    }
                                  }}
                                >
                                  <ProfileAvatar 
                                    size="md" 
                                    rankTier={getPlayerByPosition(1)?.rankTier}
                                    avatarUrl={getPlayerByPosition(1)?.avatar}
                                    showRankFrame={true}
                                  />
                                </div>
                                
                                {/* Nome com possível indicador ao lado - margem aumentada */}
                                <div className="flex items-center mt-10 gap-1 justify-center">
                                  <span 
                                    className="text-sm text-white/90 font-medium cursor-pointer hover:underline"
                                    onClick={() => {
                                      const player = getPlayerByPosition(1);
                                      if (player) {
                                        router.push(`/profile/${player.username || player.name}`);
                                      }
                                    }}
                                  >
                                    {getPlayerByPosition(1)?.name}
                                  </span>
                                  {getPlayerByPosition(1)?.isLeader && (
                                    <div className="bg-yellow-500 text-black p-0.5 rounded-full shadow-sm flex items-center justify-center">
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 17L6.5 6L12 12L17.5 6L21 17H3Z" fill="currentColor"/>
                                        <path d="M3 19H21V21H3V19Z" fill="currentColor"/>
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex flex-col items-center gap-1 mt-1">
                                  <div className="text-xs text-[#5271FF] bg-[#2D0A57]/60 px-2 py-0.5 rounded-md shadow-sm border border-[#5271FF]/30">
                                    Lvl {getPlayerByPosition(1)?.level}
                                  </div>
                                  {getPlayerByPosition(1)?.rank && (
                                    <div className="text-xs bg-gradient-to-r from-[#A44BE1]/30 to-[#5271FF]/30 px-2 py-0.5 rounded-md shadow-sm border border-[#5271FF]/20 flex items-center">
                                      <Award size={12} className="mr-1 text-[#5271FF]" /> {getPlayerByPosition(1)?.rank}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setShowInviteModal(true)}
                                className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2D0A57]/80 to-[#3F1581]/80 border-2 border-[#5271FF]/30 shadow-[0_0_10px_rgba(82,113,255,0.3)] flex items-center justify-center hover:shadow-[0_0_15px_rgba(82,113,255,0.6)] transition-all group cursor-pointer overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-[#A44BE1]/10 to-[#5271FF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="absolute inset-0 bg-[url('/images/hex-pattern.svg')] bg-center bg-contain opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                <LucideUserPlus size={28} className="text-white/80 group-hover:text-white/100 group-hover:drop-shadow-glow transition-all relative z-10" />
                              </button>
                            )
                          )}
                          
                          {/* Squad - botão adicional à direita ou jogador 4 */}
                          {lobbyType === 'squad' && (
                            getPlayerByPosition(3) ? (
                              <div className="flex flex-col items-center">
                                <div 
                                  className="w-24 h-24 relative flex items-center justify-center group cursor-pointer"
                                  onClick={() => {
                                    const player = getPlayerByPosition(3);
                                    if (player) {
                                      router.push(`/profile/${player.username || player.name}`);
                                    }
                                  }}
                                >
                                  <ProfileAvatar 
                                    size="md" 
                                    rankTier={getPlayerByPosition(3)?.rankTier}
                                    avatarUrl={getPlayerByPosition(3)?.avatar}
                                    showRankFrame={true}
                                  />
                                </div>
                                
                                {/* Nome com possível indicador ao lado - margem aumentada */}
                                <div className="flex items-center mt-10 gap-1 justify-center">
                                  <span 
                                    className="text-sm text-white/90 font-medium cursor-pointer hover:underline"
                                    onClick={() => {
                                      const player = getPlayerByPosition(3);
                                      if (player) {
                                        router.push(`/profile/${player.username || player.name}`);
                                      }
                                    }}
                                  >
                                    {getPlayerByPosition(3)?.name}
                                  </span>
                                  {getPlayerByPosition(3)?.isLeader && (
                                    <div className="bg-yellow-500 text-black p-0.5 rounded-full shadow-sm flex items-center justify-center">
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 17L6.5 6L12 12L17.5 6L21 17H3Z" fill="currentColor"/>
                                        <path d="M3 19H21V21H3V19Z" fill="currentColor"/>
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex flex-col items-center gap-1 mt-1">
                                  <div className="text-xs text-[#5271FF] bg-[#2D0A57]/60 px-2 py-0.5 rounded-md shadow-sm border border-[#5271FF]/30">
                                    Lvl {getPlayerByPosition(3)?.level}
                                  </div>
                                  {getPlayerByPosition(3)?.rank && (
                                    <div className="text-xs bg-gradient-to-r from-[#A44BE1]/30 to-[#5271FF]/30 px-2 py-0.5 rounded-md shadow-sm border border-[#5271FF]/20 flex items-center">
                                      <Award size={12} className="mr-1 text-[#5271FF]" /> {getPlayerByPosition(3)?.rank}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setShowInviteModal(true)}
                                className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2D0A57]/80 to-[#3F1581]/80 border-2 border-[#5271FF]/30 shadow-[0_0_10px_rgba(82,113,255,0.3)] flex items-center justify-center hover:shadow-[0_0_15px_rgba(82,113,255,0.6)] transition-all group cursor-pointer overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-[#A44BE1]/10 to-[#5271FF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="absolute inset-0 bg-[url('/images/hex-pattern.svg')] bg-center bg-contain opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                <LucideUserPlus size={28} className="text-white/80 group-hover:text-white/100 group-hover:drop-shadow-glow transition-all relative z-10" />
                              </button>
                            )
                          )}
                        </div>
                        
                        {/* Lista de jogadores - agora só mostra jogadores após o 4º, quando aplicável */}
                        {players.length > 0 && players.length > (lobbyType === 'squad' ? 4 : lobbyType === 'duo' ? 2 : 1) && (
                          <div className="w-full max-w-xs mt-4">
                            <h3 className="text-xs text-white/80 uppercase tracking-wider mb-2 font-medium">Jogadores</h3>
                            <div className="space-y-1">
                              {players.slice(Math.min(players.length, lobbyType === 'squad' ? 4 : lobbyType === 'duo' ? 2 : 1)).map((player) => (
                                <div key={player.id} className="flex items-center justify-between bg-card-hover backdrop-blur-xl rounded-lg px-3 py-2 border border-border hover:border-border hover:bg-card transition-all group">
                                  <div 
                                    className="flex items-center cursor-pointer w-full"
                                    onClick={() => router.push(`/profile/${player.username || player.name}`)}
                                  >
                                    <div className="mr-3 relative">
                                      <ProfileAvatar 
                                        size="sm" 
                                        rankTier="platinum" 
                                        avatarUrl={player.avatar}
                                        showRankFrame={true}
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-1">
                                        <div className="text-sm font-medium">{player.name}</div>
                                        {player.isLeader && (
                                          <div className="bg-yellow-500 text-black p-0.5 rounded-full shadow-sm flex items-center justify-center" title="Capitão">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                              <path d="M3 17L6.5 6L12 12L17.5 6L21 17H3Z" fill="currentColor"/>
                                              <path d="M3 19H21V21H3V19Z" fill="currentColor"/>
                                            </svg>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <div className="text-xs text-white/60">Lvl {player.level}</div>
                                        {player.rank && (
                                          <div className="text-xs bg-gradient-to-r from-[#A44BE1]/30 to-[#5271FF]/30 px-2 py-0.5 rounded-md shadow-sm border border-[#5271FF]/20 flex items-center">
                                            <Award size={10} className="mr-1 text-[#5271FF]" /> {player.rank}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {player.id !== user?.id && (
                                    <button 
                                      onClick={() => removePlayer(player.id)} 
                                      className="text-red-400 hover:text-red-300 p-1 ml-2"
                                    >
                                      <LucideX size={16} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced match info panel at the bottom - alinhado com as barras laterais */}
                  <div className="absolute bottom-4 inset-x-4">
                    <div className="relative">
                      {/* Glow effect behind panel */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#A44BE1]/20 via-[#5271FF]/20 to-[#A44BE1]/20 rounded-xl blur-md -z-10 transform scale-105"></div>
                      
                      {/* Main panel */}
                      <div className="bg-card-hover backdrop-blur-xl rounded-xl p-3 border border-border shadow-glow-sm">
                        <div className="flex justify-between mb-2">
                          <div className="flex flex-col items-center group">
                            <div className="text-xs text-white/70 uppercase tracking-wider group-hover:text-white/90 transition-all">Entrada</div>
                            <div className="text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#A44BE1] to-[#5271FF] drop-shadow-glow">{selectedBetAmount} R$</div>
                          </div>
                          
                          <div className="flex flex-col items-center group">
                            <div className="text-xs text-white/70 uppercase tracking-wider group-hover:text-white/90 transition-all">Prêmio</div>
                            <div className="text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#A44BE1] to-[#5271FF] drop-shadow-glow">{(selectedBetAmount * multiplier).toFixed(1)} R$</div>
                          </div>
                          
                          <div className="flex flex-col items-center group">
                            <div className="text-xs text-white/70 uppercase tracking-wider group-hover:text-white/90 transition-all">Multiplicador</div>
                            <div className="text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#A44BE1] to-[#5271FF] drop-shadow-glow">{multiplier.toFixed(1)}×</div>
                          </div>
                      </div>
                      
                        <button 
                          onClick={startGame}
                          disabled={!readyStatus}
                          className={`relative w-full py-2.5 rounded-lg overflow-hidden transition-all ${
                            readyStatus 
                              ? 'bg-gradient-to-r from-[#A44BE1] to-[#5271FF] text-white hover:shadow-glow' 
                              : 'bg-white/10 text-white/40 cursor-not-allowed'
                          }`}
                        >
                          {/* Animated shine effect */}
                          {readyStatus && (
                            <div className="absolute inset-0 w-full animate-shine"></div>
                          )}
                          
                          <span className="relative z-10 font-medium tracking-wide uppercase text-sm">
                            {readyStatus ? 'Iniciar Partida' : 'Aguardando jogadores...'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                  </div>
              </div>
              
              {/* Enhanced right sidebar - Friends online instead of chat */}
              <div className="w-80 bg-card backdrop-blur-md rounded-2xl p-5 ml-4 flex flex-col border border-border shadow-glow-sm overflow-hidden relative">
                {/* Subtle top light streak effect */}
                <div className="absolute -top-6 -left-6 w-20 h-32 bg-primary/5 rotate-45 blur-md"></div>
                
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-white/90 text-sm uppercase tracking-wider font-semibold">Amigos Online</h2>
                  <div className="flex items-center space-x-2">
                    <button 
                      className="text-white/60 hover:text-white transition-colors" 
                      onClick={() => fetchFriends()}
                      title="Recarregar amigos"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button 
                      className="text-white/60 hover:text-white transition-colors" 
                      onClick={() => setShowInviteModal(true)}
                      title="Convidar amigos"
                    >
                      <LucideUserPlus size={16} />
                    </button>
                  </div>
                </div>
                
                <div 
                  className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2" 
                  style={{ 
                    maxHeight: "calc(100% - 50px)",
                    minHeight: "300px" // Garantir altura mínima para visibilidade
                  }}
                >
                  {onlineFriends.length === 0 ? (
                    // Mostrar estado vazio
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <LucideUsers size={48} className="text-white/20 mb-4" />
                      <p className="text-white/50 text-sm mb-2">Nenhum amigo online no momento</p>
                      <button 
                        onClick={() => setDefaultFriends()} 
                        className="text-primary-light hover:text-primary text-xs underline"
                      >
                        Carregar amigos de exemplo
                      </button>
                    </div>
                  ) : (
                    // Mostrar a lista de amigos
                    onlineFriends.map((friend) => (
                      <div key={friend.id} className="flex items-center justify-between bg-card-hover backdrop-blur-xl rounded-lg px-3 py-2 border border-border hover:border-primary/20 hover:bg-card transition-all group">
                        <div 
                          className="flex items-center cursor-pointer"
                          onClick={() => router.push(`/profile/${friend.username || friend.name}`)}
                        >
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#A44BE1]/20 to-[#5271FF]/20 p-0.5 overflow-hidden group-hover:from-[#A44BE1]/80 group-hover:to-[#5271FF]/80 transition-all duration-300">
                              <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                                <Image
                                  src={friend.avatar}
                                  alt={friend.name}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#170A2E] ${
                              friend.status === 'online' ? 'bg-green-500' : 
                              friend.status === 'in_game' ? 'bg-yellow-500' : 'bg-gray-500'
                            }`}></div>
                          </div>
                          <div className="ml-2">
                            <div className="text-sm text-white group-hover:drop-shadow-glow transition-all hover:underline">{friend.name}</div>
                            <div className="text-xs text-white/50">Nível {friend.level}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => inviteFriend(friend.id)}
                          className="px-2 py-1 rounded bg-gradient-to-r from-[#A44BE1] to-[#5271FF] text-white text-sm flex items-center transition-all hover:shadow-glow"
                        >
                          <LucideUserPlus size={14} className="mr-1.5" />
                          Convidar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </main>

          {/* Modal para convidar amigos */}
          {showInviteModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div 
                className="bg-gradient-to-br from-card to-card-hover border border-border rounded-xl shadow-xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">Convidar Amigos</h3>
                  <button 
                    onClick={() => setShowInviteModal(false)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <LucideX size={20} />
                  </button>
                </div>
                
                {/* Usar o componente FriendSearch para buscar e convidar amigos reais */}
                <FriendSearch 
                  onInviteFriend={async (friend) => {
                    // Verificar se o lobby pode receber mais jogadores
                    if (
                      (lobbyType === 'solo' && players.length >= 1) ||
                      (lobbyType === 'duo' && players.length >= 2) ||
                      (lobbyType === 'squad' && players.length >= 4)
                    ) {
                      toast.error('O lobby já está cheio');
                      return;
                    }
                    
                    try {
                      console.log('Iniciando processo de convite para:', friend.name);
                      console.log('Informações do amigo:', friend);
                      
                      // Criar o lobby primeiro
                      console.log('Criando lobby...');
                      const createLobbyResponse = await axios.post('/api/lobby/create', {
                        lobbyType: lobbyType,
                        maxPlayers: lobbyType === 'solo' ? 1 : lobbyType === 'duo' ? 2 : 4
                      });
                      
                      console.log('Resposta da criação do lobby:', createLobbyResponse.data);
                      
                      if (createLobbyResponse.data.status !== 'success') {
                        toast.error('Erro ao criar lobby: ' + (createLobbyResponse.data.error || 'Erro desconhecido'));
                        return;
                      }
                      
                      const currentLobbyId = createLobbyResponse.data.lobbyId;
                      console.log('Lobby criado com ID:', currentLobbyId);
                      
                      // Verificar se o ID do lobby é válido
                      if (!currentLobbyId || typeof currentLobbyId !== 'string' || currentLobbyId.length !== 24) {
                        console.error('ID do lobby inválido:', currentLobbyId);
                        toast.error('Erro: ID do lobby inválido');
                        return;
                      }
                      
                      // Enviar convite via API
                      console.log('Enviando convite para o usuário:', friend.id, 'lobby:', currentLobbyId);
                      const response = await axios.post('/api/lobby/invite', {
                        recipientId: friend.id,
                        lobbyId: currentLobbyId
                      });
                      
                      console.log('Resposta do envio de convite:', response.data);
                      
                      if (response.data.status === 'success') {
                        toast.success(`Convite enviado para ${friend.name}`);
                        
                        // Adicionar mensagem ao chat
                        setChatMessages([...chatMessages, {
                          id: chatMessages.length + 1,
                          user: 'Sistema',
                          message: `Convite enviado para ${friend.name}.`,
                          isSystem: true
                        }]);
                      } else {
                        toast.error(response.data.error || 'Erro ao enviar convite');
                      }
                      
                      // Fechar o modal
                      setShowInviteModal(false);
                    } catch (error) {
                      console.error('Erro detalhado ao enviar convite:', error);
                      if (axios.isAxiosError(error)) {
                        console.error('Detalhes da resposta:', error.response?.data);
                        toast.error('Falha ao enviar convite: ' + (error.response?.data?.error || error.message));
                      } else {
                        toast.error('Falha ao enviar convite para o lobby');
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Modal para partida encontrada */}
          {showMatchRoomModal && foundMatch && (
            <MatchRoomModal 
              match={foundMatch}
              isOpen={showMatchRoomModal}
              onClose={handleCloseRoomModal}
              onSubmitResult={handleSubmitResult}
              isOfficialRoom={isConnectingToOfficialRoom}
              officialRoomData={selectedOfficialRoom}
            />
          )}
          
          {/* Modal para submeter resultado */}
          {showSubmitResultModal && foundMatch && (
            <SubmitResultModal 
              match={foundMatch}
              isOpen={showSubmitResultModal}
              onClose={() => setShowSubmitResultModal(false)}
              onSubmit={handleResultSubmit}
            />
          )}
          
          {/* Busca de partida */}
          {isSearchingMatch && !foundMatch && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
              <div className="max-w-md w-full mx-auto">
                {waitingId ? (
                  <MatchmakingStatus
                    waitingId={waitingId}
                    userId={user?.id || ''}
                    mode={lobbyType}
                    onMatchFound={handleMatchFound}
                    onCancel={handleCancelMatchmaking}
                  />
                ) : (
                  <div className="bg-gray-900 p-8 rounded-lg text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-900/30 flex items-center justify-center">
                      <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Iniciando busca...</h3>
                    <p className="text-gray-400">Preparando para encontrar uma partida</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Animação de partida completa */}
          <AnimatePresence>
            {matchCompleted && (
              <motion.div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="bg-primary/20 backdrop-blur-lg p-8 rounded-xl border border-primary/30 shadow-glow text-center"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <CheckCircle className="text-green-500" size={80} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Resultado Enviado!</h2>
                  <p className="text-white/80 mb-6">Nosso time irá revisar o resultado em breve.</p>
                  <button
                    onClick={() => setMatchCompleted(false)}
                    className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg transition-colors"
                  >
                    Voltar ao Lobby
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Adicionar o MatchmakingListener controlado pelo estado */}
          {user?.id && <MatchmakingListener userId={user.id} isActive={isSearchingMatch} />}

          {/* Adicionar botão de regras no canto superior direito */}
          <button
            onClick={() => setShowRulesModal(true)}
            className="fixed top-4 right-4 z-50 bg-gradient-to-r from-[#A44BE1] to-[#5271FF] p-2 rounded-full shadow-glow hover:shadow-glow-lg transition-all duration-300"
            title="Regras do Jogo"
          >
            <Shield size={24} className="text-white" />
          </button>

          {/* Modal de Regras */}
          {showRulesModal && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-rpx-blue/90 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto relative border border-rpx-orange/50">
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="absolute top-4 right-4 text-white/70 hover:text-white"
                >
                  <X size={24} />
                </button>
                
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-rpx-orange">Regras do Jogo</h2>
                  <p className="text-white/70 mt-2">
                    Estas são as regras que todos os jogadores devem seguir. Violações podem resultar em penalidades.
                  </p>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-3">Regras Gerais</h3>
                  <ul className="list-disc list-inside space-y-2 text-white/90">
                    {gameRules.general.map((rule, index) => (
                      <li key={index} className="pl-2">{rule}</li>
                    ))}
                  </ul>
                </div>
                
                {/* Regras do Modo Tático (sempre exibir) */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Regras do Modo Tático
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-white/90">
                    {gameRules.tactical.map((rule, index) => (
                      <li key={index} className="pl-2">{rule}</li>
                    ))}
                  </ul>
                </div>
                
                {lobbyType === 'solo' && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-3">
                      Regras Específicas - {gameplayMode === 'infinite_ice' ? 'Gelo Infinito' : 'Gelo Finito'}
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-white/90">
                      {gameplayMode === 'infinite_ice' ? (
                        gameRules.x1.infiniteIce.map((rule, index) => (
                          <li key={index} className="pl-2">{rule}</li>
                        ))
                      ) : (
                        gameRules.x1.normalIce.map((rule, index) => (
                          <li key={index} className="pl-2">{rule}</li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
                
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowRulesModal(false)}
                    className="bg-rpx-orange hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
                  >
                    Entendi
                  </button>
                </div>

                {/* Botão para ver regras */}
                <div className="mt-4">
                  <button
                    onClick={() => setShowRulesModal(true)}
                    className="w-full flex justify-center items-center py-2 px-4 bg-rpx-blue/20 border border-rpx-orange/40 text-white rounded-md hover:bg-rpx-blue/30 transition-colors"
                  >
                    <Book size={16} className="mr-2 text-rpx-orange" />
                    Ver Regras do Jogo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 