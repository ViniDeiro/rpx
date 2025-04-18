'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Plus, X, UserPlus, Share2, MessageCircle, Settings, PlayCircle, DollarSign, Users, ChevronRight, Shield, Globe, Award, Gift, Star, Clock, Zap, Menu, CheckCircle, RefreshCw, AlertCircle, Check, MessageSquare, Bell, ChevronDown, MoreHorizontal } from 'react-feather';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import CrownIcon from '@/components/ui/CrownIcon';
import { Match } from '@/types/match';
import MatchRoomModal from '@/components/modals/MatchRoomModal';
import SubmitResultModal from '@/components/modals/SubmitResultModal';
import FriendSearch from '@/components/lobby/FriendSearch';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import MatchmakingStatus from '@/components/matchmaking/MatchmakingStatus';

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
  isLeader?: boolean;
  position?: number;
  character?: string;
  username?: string; // Adicionando campo username para navegação ao perfil
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
  const [selectedBetAmount, setSelectedBetAmount] = useState(10); // Valor padrão de aposta
  const [multiplier, setMultiplier] = useState(1.8); // Multiplicador padrão
  const [settingsTab, setSettingsTab] = useState<'game-modes' | 'platforms' | 'payment'>('game-modes'); // Nova state para as abas de configuração
  
  // Nova state para o modal de convite
  const [showInviteModal, setShowInviteModal] = useState(false);
  
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
    setOnlineFriends([
      { id: 'friend1', name: 'Cadu.A', avatar: '/images/avatars/blue.svg', level: 45, status: 'online', username: 'cadu.a' },
      { id: 'friend2', name: 'Panda', avatar: '/images/avatars/green.svg', level: 32, status: 'online', username: 'panda' },
      { id: 'friend3', name: 'Raxixe', avatar: '/images/avatars/purple.svg', level: 28, status: 'in_game', username: 'raxi' },
      { id: 'friend4', name: 'Dacruz', avatar: '/images/avatars/red.svg', level: 57, status: 'online', username: 'dacruz' },
      { id: 'friend5', name: 'Apelapato', avatar: '/images/avatars/yellow.svg', level: 51, status: 'idle', username: 'apel' },
      { id: 'friend6', name: 'GB', avatar: '/images/avatars/blue.svg', level: 45, status: 'online', username: 'gb' },
    ]);
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
  
  // Definir lista mockada de amigos online
  useEffect(() => {
    // Mockup de amigos online quando o componente é montado
    const mockFriends = [
      {
        id: '1',
        name: 'Lucas Silva',
        avatar: '/images/avatars/user1.jpg',
        level: 42,
        status: 'online',
        username: 'lucas.silva'  // Adicionando username para navegação
      },
      {
        id: '2',
        name: 'Amanda Reis',
        avatar: '/images/avatars/user2.jpg',
        level: 38,
        status: 'in_game',
        username: 'amanda.reis'  // Adicionando username para navegação
      },
      {
        id: '3',
        name: 'Carlos Mendes',
        avatar: '/images/avatars/user3.jpg',
        level: 25,
        status: 'online',
        username: 'carlos.mendes'  // Adicionando username para navegação
      },
      {
        id: '4',
        name: 'Juliana Costa',
        avatar: '/images/avatars/user4.jpg',
        level: 56,
        status: 'online',
        username: 'juliana.costa'  // Adicionando username para navegação
      },
      {
        id: '5',
        name: 'Pedro Alves',
        avatar: '/images/avatars/user5.jpg',
        level: 31,
        status: 'in_game',
        username: 'pedro.alves'  // Adicionando username para navegação
      }
    ];
    
    setOnlineFriends(mockFriends);
  }, []);
  
  // Verificar autenticação
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);
  
  // Inicializar o lobby quando o usuário for carregado
  useEffect(() => {
    if (user) {
      console.log('Dados do usuário carregados no lobby:', user);
      // Iniciar com o próprio usuário como líder
      const currentPlayer: LobbyPlayer = {
        id: user.id,
        name: user.username || user.profile?.name || 'Usuário',
        avatar: user.avatarUrl || user.profile?.avatar || user.avatarId || '/images/avatars/default.svg',
        level: user.level || 1,
        rank: 'diamante', // Exemplo, idealmente viria do perfil do usuário
        isLeader: true,
        position: 0,
        username: user.username, // Adicionando campo username para navegação
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
  }, [user]);
  
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
    // Verificar se o lobby pode receber mais jogadores
    if (
      (lobbyType === 'solo' && players.length >= 1) ||
      (lobbyType === 'duo' && players.length >= 2) ||
      (lobbyType === 'squad' && players.length >= 4)
    ) {
      toast.error('O lobby já está cheio');
      return;
    }
    
    // Encontrar o amigo selecionado
    const friend = onlineFriends.find(f => f.id === friendId);
    
    if (friend) {
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
        console.log('Enviando convite para o usuário:', friendId, 'lobby:', currentLobbyId);
        const response = await axios.post('/api/lobby/invite', {
          recipientId: friendId,
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
  
  // Mudança de tipo de lobby
  const changeLobbyType = (type: LobbyType) => {
    setLobbyType(type);
    
    // Manter apenas o líder ao mudar o tipo
    const leader = players.find(p => p.isLeader);
    if (leader) {
      setPlayers([leader]);
    }
  };
  
  // Calcular slots disponíveis baseado no tipo de lobby
  const getAvailableSlots = () => {
    const maxPlayers = lobbyType === 'solo' ? 1 : lobbyType === 'duo' ? 2 : 4;
    return Array(maxPlayers - players.length).fill(null);
  };
  
  // Função para buscar salas oficiais do administrador
  const fetchAdminRooms = async () => {
    try {
      const response = await fetch('/api/admin/salas');
      if (!response.ok) {
        throw new Error('Falha ao buscar salas disponíveis');
      }
      
      const adminMatches = await response.json();
      
      // Filtrar apenas salas configuradas e oficiais
      const officialRooms = adminMatches
        .filter((match: any) => 
          match.configuredRoom && 
          match.isOfficialRoom && 
          match.roomId && 
          match.roomPassword
        )
        .map((match: any) => ({
          id: match.id,
          roomId: match.roomId,
          roomPassword: match.roomPassword,
          gameType: match.gameType as LobbyType,
          format: match.format,
          entryFee: match.entry,
          gameDetails: match.gameDetails || {
            gameName: match.gameDetails?.gameName || 'Free Fire',
            gameMode: match.gameDetails?.gameMode || 'Battle Royale',
            mapName: match.gameDetails?.mapName || 'Bermuda',
            serverRegion: match.gameDetails?.serverRegion || 'Brasil'
          }
        }));
      
      if (officialRooms.length > 0) {
        setAdminRooms(officialRooms);
        console.log('Salas oficiais encontradas:', officialRooms);
      } else {
        console.log('Nenhuma sala oficial encontrada');
        // Se não houver salas oficiais, usar salas mockadas para demonstração
        setDefaultMockRooms();
      }
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
      setDefaultMockRooms();
    }
  };
  
  // Função para definir salas mockadas padrão caso não exista nenhuma sala no localStorage
  const setDefaultMockRooms = () => {
    const mockRooms = [
      {
        id: 1,
        roomId: 'RPX62336',
        roomPassword: 'pass505',
        gameType: 'squad' as LobbyType,
        format: 'Squad (4x4)',
        entryFee: 10,
        gameDetails: {
          gameName: 'Free Fire',
          gameMode: 'Battle Royale',
          mapName: 'Bermuda',
          serverRegion: 'Brasil'
        }
      },
      {
        id: 2,
        roomId: 'RPX75432',
        roomPassword: 'pass123',
        gameType: 'solo' as LobbyType,
        format: 'Solo',
        entryFee: 5,
        gameDetails: {
          gameName: 'PUBG Mobile',
          gameMode: 'Battle Royale',
          mapName: 'Erangel',
          serverRegion: 'Brasil'
        }
      },
      {
        id: 3,
        roomId: 'RPX98765',
        roomPassword: 'pass789',
        gameType: 'duo' as LobbyType,
        format: 'Dupla (2x2)',
        entryFee: 15,
        gameDetails: {
          gameName: 'Free Fire',
          gameMode: 'Clash Squad',
          mapName: 'Bermuda Remastered',
          serverRegion: 'Brasil'
        }
      }
    ];
    
    setAdminRooms(mockRooms);
  };
  
  // Buscar salas disponíveis quando o componente carregar
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchAdminRooms();
      // Buscar amigos do usuário
      fetchFriends();
    }
  }, [isAuthenticated, isLoading]);
  
  // Iniciar jogo - conecta com a API de matchmaking real
  const startGame = async () => {
    // Resetar o estado de partida completa
    setMatchCompleted(false);
    
    // Iniciar a animação de busca de partida
    setIsSearchingMatch(true);
    
    try {
      // Chamar a API de matchmaking real
      const response = await fetch('/api/matchmaking/find', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          mode: lobbyType,
          type: lobbyType,
          platform: 'mixed',
          platformMode: platformMode,
          gameplayMode: gameplayMode,
          teamSize: lobbyType === 'solo' ? 1 : lobbyType === 'duo' ? 2 : 4,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Falha ao encontrar partida');
      }
      
      // Obter a partida do resultado
      const matchResponse = await response.json();
      
      // Se a partida já foi encontrada
      if (matchResponse.matchFound) {
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
      } else {
        // Estamos em modo de espera, exibir o componente de status
        setWaitingId(matchResponse.waitingId);
      }
    } catch (error) {
      console.error('Erro ao iniciar matchmaking:', error);
      toast.error('Não foi possível iniciar a busca por partida');
      setIsSearchingMatch(false);
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
  
  return (
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
                    <Users size={18} className={`${lobbyType === 'squad' ? 'text-white' : 'text-white/70'} transition-all`} />
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
                  <button
                    onClick={() => setGameplayMode('normal')}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      gameplayMode === 'normal' 
                        ? 'bg-gradient-to-r from-[#A44BE1]/40 to-[#5271FF]/30 border-l-4 border-[#A44BE1] shadow-glow-sm' 
                        : 'hover:bg-white/10 hover:border-l-4 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        gameplayMode === 'normal' ? 'bg-gradient-to-r from-[#A44BE1] to-[#5271FF] shadow-glow-sm' : 'bg-white/10'
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${gameplayMode === 'normal' ? 'text-white' : 'text-white/70'} transition-all`}>
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                      </div>
                      <div className="ml-3">
                        <div className={`text-sm font-medium ${gameplayMode === 'normal' ? 'text-white drop-shadow-glow' : 'text-white/70'} transition-all`}>Normal</div>
                        <div className="text-xs text-white/50">Modo padrão</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setGameplayMode('tactical')}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      gameplayMode === 'tactical' 
                        ? 'bg-gradient-to-r from-[#A44BE1]/40 to-[#5271FF]/30 border-l-4 border-[#A44BE1] shadow-glow-sm' 
                        : 'hover:bg-white/10 hover:border-l-4 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        gameplayMode === 'tactical' ? 'bg-gradient-to-r from-[#A44BE1] to-[#5271FF] shadow-glow-sm' : 'bg-white/10'
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${gameplayMode === 'tactical' ? 'text-white' : 'text-white/70'} transition-all`}>
                          <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                          <line x1="6" y1="1" x2="6" y2="4"></line>
                          <line x1="10" y1="1" x2="10" y2="4"></line>
                          <line x1="14" y1="1" x2="14" y2="4"></line>
                        </svg>
                      </div>
                      <div className="ml-3">
                        <div className={`text-sm font-medium ${gameplayMode === 'tactical' ? 'text-white drop-shadow-glow' : 'text-white/70'} transition-all`}>Tático</div>
                        <div className="text-xs text-white/50">Jogabilidade estratégica</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setGameplayMode('infinite_ice')}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      gameplayMode === 'infinite_ice' 
                        ? 'bg-gradient-to-r from-[#A44BE1]/40 to-[#5271FF]/30 border-l-4 border-[#A44BE1] shadow-glow-sm' 
                        : 'hover:bg-white/10 hover:border-l-4 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        gameplayMode === 'infinite_ice' ? 'bg-gradient-to-r from-[#A44BE1] to-[#5271FF] shadow-glow-sm' : 'bg-white/10'
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${gameplayMode === 'infinite_ice' ? 'text-white' : 'text-white/70'} transition-all`}>
                          <path d="M2 12h20"></path>
                          <path d="M12 2v20"></path>
                          <path d="M12 18L7.5 12 12 6"></path>
                          <path d="M12 6l4.5 6-4.5 6"></path>
                        </svg>
                      </div>
                      <div className="ml-3">
                        <div className={`text-sm font-medium ${gameplayMode === 'infinite_ice' ? 'text-white drop-shadow-glow' : 'text-white/70'} transition-all`}>Gelo Infinito</div>
                        <div className="text-xs text-white/50">Modo de deslizamento</div>
                      </div>
                    </div>
                  </button>
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
                    <div className="flex items-center justify-center space-x-10 relative mt-8">
                      {/* Squad - jogador 3 ou botão à esquerda */}
                      {lobbyType === 'squad' && (
                        players.length >= 3 ? (
                          <div className="flex flex-col items-center">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2D0A57]/80 to-[#3F1581]/80 border-2 border-[#5271FF]/70 shadow-[0_0_15px_rgba(82,113,255,0.5)] flex items-center justify-center overflow-hidden group relative">
                              {/* Borda decorativa */}
                              <div className="absolute inset-0 rounded-full border-2 border-[#5271FF]/40 p-0.5 z-20"></div>
                              <div className="absolute inset-0 bg-gradient-to-r from-[#A44BE1]/10 to-[#5271FF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <Image 
                                src={players[2].avatar}
                                alt={players[2].name}
                                width={100}
                                height={100}
                                className="w-full h-full object-cover rounded-full"
                              />
                            </div>
                            <span className="text-sm text-white/90 font-medium mt-3">{players[2].name}</span>
                            <div className="text-xs text-[#5271FF] bg-[#2D0A57]/60 px-2 py-0.5 rounded-md shadow-sm border border-[#5271FF]/30 mt-1">
                              Lvl {players[2].level}
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setShowInviteModal(true)}
                            className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2D0A57]/80 to-[#3F1581]/80 border-2 border-[#5271FF]/30 shadow-[0_0_10px_rgba(82,113,255,0.3)] flex items-center justify-center hover:shadow-[0_0_15px_rgba(82,113,255,0.6)] transition-all group cursor-pointer overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#A44BE1]/10 to-[#5271FF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute inset-0 bg-[url('/images/hex-pattern.svg')] bg-center bg-contain opacity-0 group-hover:opacity-10 transition-opacity"></div>
                            <Plus size={28} className="text-white/80 group-hover:text-white/100 group-hover:drop-shadow-glow transition-all relative z-10" />
                          </button>
                        )
                      )}
                      
                      {/* Capitão no centro com coroa */}
                      <div className="flex flex-col items-center">
                        <div className="relative">
                          {/* Coroa acima do avatar */}
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-20">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 17L6.5 6L12 12L17.5 6L21 17H3Z" fill="#FFD700" stroke="#FF9900" strokeWidth="2"/>
                              <path d="M3 19H21V21H3V19Z" fill="#FFD700" stroke="#FF9900" strokeWidth="2"/>
                            </svg>
                          </div>
                          {/* Borda iluminada especial para capitão */}
                          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 opacity-30 blur-sm"></div>
                          <div 
                            className="w-32 h-32 rounded-full bg-gradient-to-br from-[#2D0A57]/80 to-[#3F1581]/80 border-2 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)] flex items-center justify-center overflow-hidden group relative z-10 cursor-pointer"
                            onClick={() => players[0]?.id && router.push(`/profile/${players[0].username || players[0].name}`)}
                          >
                            {/* Borda decorativa interna */}
                            <div className="absolute inset-0 rounded-full border-2 border-yellow-400/50 p-0.5 z-20"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-amber-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            {players[0]?.avatar ? (
                              <Image 
                                src={players[0].avatar}
                                alt={players[0].name}
                                width={128}
                                height={128}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <User size={42} className="text-white/90 drop-shadow-glow" />
                            )}
                          </div>
                        </div>
                        <span 
                          className="text-base text-white font-medium mt-3 cursor-pointer hover:underline"
                          onClick={() => players[0]?.id && router.push(`/profile/${players[0].username || players[0].name}`)}
                        >
                          {players[0]?.name || 'Usuário'}
                        </span>
                        <div className="text-sm text-yellow-400 bg-[#2D0A57]/60 px-3 py-1 rounded-md shadow-sm border border-yellow-500/20 flex items-center mt-1">
                          <span className="mr-1">Capitão</span> • Lvl {players[0]?.level || 1}
                        </div>
                      </div>
                      
                      {/* Botão à direita para duo e squad ou jogador 2 */}
                      {(lobbyType === 'duo' || lobbyType === 'squad') && (
                        players.length >= 2 ? (
                          <div className="flex flex-col items-center">
                            <div 
                              className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2D0A57]/80 to-[#3F1581]/80 border-2 border-[#5271FF]/70 shadow-[0_0_15px_rgba(82,113,255,0.5)] flex items-center justify-center overflow-hidden group relative cursor-pointer"
                              onClick={() => router.push(`/profile/${players[1].username || players[1].name}`)}
                            >
                              {/* Borda decorativa */}
                              <div className="absolute inset-0 rounded-full border-2 border-[#5271FF]/40 p-0.5 z-20"></div>
                              <div className="absolute inset-0 bg-gradient-to-r from-[#A44BE1]/10 to-[#5271FF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <Image 
                                src={players[1].avatar}
                                alt={players[1].name}
                                width={100}
                                height={100}
                                className="w-full h-full object-cover rounded-full"
                              />
                            </div>
                            <span 
                              className="text-sm text-white/90 font-medium mt-3 cursor-pointer hover:underline"
                              onClick={() => router.push(`/profile/${players[1].username || players[1].name}`)}
                            >
                              {players[1].name}
                            </span>
                            <div className="text-xs text-[#5271FF] bg-[#2D0A57]/60 px-2 py-0.5 rounded-md shadow-sm border border-[#5271FF]/30 mt-1">
                              Lvl {players[1].level}
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setShowInviteModal(true)}
                            className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2D0A57]/80 to-[#3F1581]/80 border-2 border-[#5271FF]/30 shadow-[0_0_10px_rgba(82,113,255,0.3)] flex items-center justify-center hover:shadow-[0_0_15px_rgba(82,113,255,0.6)] transition-all group cursor-pointer overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#A44BE1]/10 to-[#5271FF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute inset-0 bg-[url('/images/hex-pattern.svg')] bg-center bg-contain opacity-0 group-hover:opacity-10 transition-opacity"></div>
                            <Plus size={28} className="text-white/80 group-hover:text-white/100 group-hover:drop-shadow-glow transition-all relative z-10" />
                          </button>
                        )
                      )}
                      
                      {/* Squad - botão adicional à direita ou jogador 4 */}
                      {lobbyType === 'squad' && (
                        players.length >= 4 ? (
                          <div className="flex flex-col items-center">
                            <div 
                              className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2D0A57]/80 to-[#3F1581]/80 border-2 border-[#5271FF]/70 shadow-[0_0_15px_rgba(82,113,255,0.5)] flex items-center justify-center overflow-hidden group relative cursor-pointer"
                              onClick={() => router.push(`/profile/${players[3].username || players[3].name}`)}
                            >
                              {/* Borda decorativa */}
                              <div className="absolute inset-0 rounded-full border-2 border-[#5271FF]/40 p-0.5 z-20"></div>
                              <div className="absolute inset-0 bg-gradient-to-r from-[#A44BE1]/10 to-[#5271FF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <Image 
                                src={players[3].avatar}
                                alt={players[3].name}
                                width={100}
                                height={100}
                                className="w-full h-full object-cover rounded-full"
                              />
                            </div>
                            <span 
                              className="text-sm text-white/90 font-medium mt-3 cursor-pointer hover:underline"
                              onClick={() => router.push(`/profile/${players[3].username || players[3].name}`)}
                            >
                              {players[3].name}
                            </span>
                            <div className="text-xs text-[#5271FF] bg-[#2D0A57]/60 px-2 py-0.5 rounded-md shadow-sm border border-[#5271FF]/30 mt-1">
                              Lvl {players[3].level}
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setShowInviteModal(true)}
                            className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2D0A57]/80 to-[#3F1581]/80 border-2 border-[#5271FF]/30 shadow-[0_0_10px_rgba(82,113,255,0.3)] flex items-center justify-center hover:shadow-[0_0_15px_rgba(82,113,255,0.6)] transition-all group cursor-pointer overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#A44BE1]/10 to-[#5271FF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute inset-0 bg-[url('/images/hex-pattern.svg')] bg-center bg-contain opacity-0 group-hover:opacity-10 transition-opacity"></div>
                            <Plus size={28} className="text-white/80 group-hover:text-white/100 group-hover:drop-shadow-glow transition-all relative z-10" />
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
                            <div key={player.id} className="flex items-center justify-between bg-card-hover backdrop-blur-xl rounded-lg px-3 py-1 border border-border hover:border-border hover:bg-card transition-all group">
                              <div 
                                className="flex items-center cursor-pointer"
                                onClick={() => router.push(`/profile/${player.username || player.name}`)}
                              >
                                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#A44BE1]/20 to-[#5271FF]/20 p-0.5 overflow-hidden group-hover:from-[#A44BE1]/80 group-hover:to-[#5271FF]/80 transition-all duration-300">
                                  <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                                    <Image
                                      src={player.avatar}
                                      alt={player.name}
                                      width={28}
                                      height={28}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>
                                <div className="ml-2">
                                  <div className="text-sm text-white group-hover:drop-shadow-glow transition-all hover:underline">{player.name}</div>
                                  <div className="text-xs text-white/50">Nível {player.level}</div>
                                </div>
                              </div>
                              <button
                                onClick={() => removePlayer(player.id)}
                                className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-500/50 transition-all group/btn"
                              >
                                <X size={12} className="text-white/80 group-hover/btn:text-white" />
                              </button>
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
              <button className="text-white/60 hover:text-white transition-colors" onClick={() => setShowInviteModal(true)}>
                <UserPlus size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2" style={{ maxHeight: "calc(100% - 50px)" }}>
              {onlineFriends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between bg-card-hover backdrop-blur-xl rounded-lg px-3 py-2 border border-border hover:border-border hover:bg-card transition-all group">
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
                    <UserPlus size={14} className="mr-1.5" />
                    Convidar
                  </button>
                </div>
              ))}
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
                <X size={20} />
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
    </div>
  );
} 