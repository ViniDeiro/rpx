import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Users, Clock, Settings, ChevronRight, Play, Share2, 
  MessageCircle, DollarSign, Copy, UserPlus, X
} from 'react-feather';
import { useAuth } from '@/contexts/AuthContext';
import CharacterDisplay, { PLAYER_TYPES } from './CharacterDisplay';
import { toast } from 'react-hot-toast';

// Dados mockados para exemplo
const MOCK_PLAYERS = [
  {
    id: 'p1',
    username: 'Capitão',
    level: 27,
    skin: 'soldier',
    isCaptain: true,
    isReady: true,
    rank: 'Gold',
  },
  {
    id: 'p2',
    username: 'Usuario123',
    level: 14,
    skin: 'default',
    isCaptain: false,
    isReady: true,
  },
  {
    id: 'p3',
    username: 'ProPlayer',
    level: 42,
    skin: 'ninja',
    isCaptain: false,
    isReady: false,
  },
  {
    id: 'o1',
    username: 'Adversário1',
    level: 31,
    skin: 'cyber',
    isCaptain: true,
    isReady: true,
    team: 'opponent',
    rank: 'Diamond',
  },
  {
    id: 'o2',
    username: 'Inimigo2',
    level: 22,
    skin: 'neon',
    isCaptain: false,
    isReady: true,
    team: 'opponent',
  },
];

export default function LobbyRoom({
  matchId = '123456',
  matchDetails = {
    title: 'Lobby de Free Fire',
    mode: 'squad',
    teamSize: 4,
    entryFee: 20,
    prize: 38,
    platform: 'mixed',
    startTime: new Date(Date.now() + 10 * 60000), // 10 minutos no futuro
    maxPlayers: 8,
  },
  isCaptain = false,
  onExit = () => {},
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, username: 'Sistema', message: 'Bem-vindo ao lobby de partida!', type: 'system' },
    { id: 2, username: 'Capitão', message: 'Vamos jogar pessoal!', type: 'player' },
  ]);
  const [messageInput, setMessageInput] = useState('');
  
  // Carregar jogadores (mockado)
  useEffect(() => {
    // Simulando chamada de API
    setTimeout(() => {
      setPlayers(MOCK_PLAYERS);
    }, 500);
  }, []);
  
  // Atualizar contagem regressiva
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = matchDetails.startTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('Iniciando...');
        clearInterval(interval);
        // Em uma implementação real, aqui iniciaria a partida
        return;
      }
      
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [matchDetails.startTime]);
  
  // Filtrar jogadores por equipe
  const teamPlayers = players.filter(p => !p.team || p.team === 'ally');
  const opponentPlayers = players.filter(p => p.team === 'opponent');
  
  // Definir o número de slots vazios em cada equipe
  const emptyTeamSlots = Math.max(0, matchDetails.teamSize - teamPlayers.length);
  const emptyOpponentSlots = Math.max(0, matchDetails.teamSize - opponentPlayers.length);
  
  // Verificar se todos os jogadores estão prontos
  const allPlayersReady = teamPlayers.every(p => p.isReady) && opponentPlayers.every(p => p.isReady);
  
  // Copiar link de convite
  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}/lobby/join/${matchId}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Link de convite copiado!');
  };
  
  // Marcar como pronto
  const handleReady = () => {
    setIsReady(!isReady);
    
    // Em uma implementação real, enviaria status para API
    // Atualização simulada
    const updatedPlayers = players.map(p => 
      p.id === user?.id ? { ...p, isReady: !isReady } : p
    );
    setPlayers(updatedPlayers);
  };
  
  // Iniciar partida (apenas para capitão)
  const handleStartMatch = async () => {
    if (!allPlayersReady) {
      toast.error('Nem todos os jogadores estão prontos!');
      return;
    }
    
    try {
      toast.loading('Criando partida...');
      
      // Identificadores dos jogadores no lobby
      const playerIds = players.map(p => p.id);
      
      // Criar partida no banco de dados através da API
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          lobbyId: matchId,
          playerIds,
          betAmount: matchDetails.entryFee,
          gameMode: matchDetails.mode
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        toast.dismiss();
        toast.success('Partida criada! Aguardando sala...');
        
        // Em uma implementação real, redirecionaria para a página de aguardo da partida
        setTimeout(() => {
          router.push(`/matches/${data.match._id}`);
        }, 1500);
      } else {
        toast.dismiss();
        toast.error(data.error || 'Erro ao criar partida');
      }
    } catch (error) {
      console.error('Erro ao iniciar partida:', error);
      toast.dismiss();
      toast.error('Erro ao iniciar partida. Tente novamente.');
    }
  };
  
  // Enviar mensagem no chat
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!messageInput.trim()) return;
    
    const newMessage = {
      id: chatMessages.length + 1,
      username: user?.username || 'Você',
      message: messageInput,
      type: 'player',
    };
    
    setChatMessages([...chatMessages, newMessage]);
    setMessageInput('');
  };
  
  return (
    <div className="bg-card rounded-lg shadow-md overflow-hidden">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-primary/20 to-card-hover p-4 border-b border-border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold">{matchDetails.title}</h2>
            <div className="flex items-center gap-3 text-sm text-muted">
              <div className="flex items-center gap-1">
                <Users size={14} />
                {players.length}/{matchDetails.maxPlayers} jogadores
              </div>
              <div className="flex items-center gap-1">
                <DollarSign size={14} />
                R$ {matchDetails.entryFee} / R$ {matchDetails.prize}
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                {timeLeft}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopyInvite}
              className="btn-secondary btn-sm flex items-center gap-1"
            >
              <Copy size={14} />
              Convidar
            </button>
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="btn-secondary btn-sm flex items-center gap-1"
            >
              <MessageCircle size={14} />
              Chat
            </button>
            {isCaptain && (
              <button 
                onClick={handleStartMatch}
                disabled={!allPlayersReady}
                className={`btn-primary btn-sm flex items-center gap-1 ${
                  !allPlayersReady ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Play size={14} />
                Iniciar
              </button>
            )}
            <button 
              onClick={onExit}
              className="btn-danger btn-sm"
              title="Sair do lobby"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        {/* Time do jogador */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-blue-500 flex items-center gap-1">
              <Users size={16} />
              Seu Time
            </h3>
            <span className="text-sm text-muted">
              {teamPlayers.length}/{matchDetails.teamSize} jogadores
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Jogadores */}
            {teamPlayers.map(player => (
              <CharacterDisplay 
                key={player.id}
                player={player}
                playerType={player.isCaptain ? PLAYER_TYPES.CAPTAIN : PLAYER_TYPES.TEAMMATE}
                size="medium"
                showReady={true}
                onClick={setSelectedPlayer}
              />
            ))}
            
            {/* Slots vazios */}
            {Array(emptyTeamSlots).fill(0).map((_, index) => (
              <div 
                key={`empty-team-${index}`}
                className="border border-dashed border-border rounded-lg flex flex-col items-center justify-center p-4 h-40"
              >
                <UserPlus size={24} className="text-muted mb-2" />
                <div className="text-sm text-muted">Slot vazio</div>
                <button className="mt-2 text-xs text-primary">Convidar</button>
              </div>
            ))}
          </div>
          
          {/* Controles */}
          <div className="bg-card-hover rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Status: 
                  <span className={isReady ? "text-green-500 ml-1" : "text-amber-500 ml-1"}>
                    {isReady ? "Pronto" : "Aguardando"}
                  </span>
                </div>
                <div className="text-xs text-muted mt-1">
                  {allPlayersReady 
                    ? "Todos os jogadores estão prontos!" 
                    : "Aguardando jogadores..."
                  }
                </div>
              </div>
              
              <button 
                onClick={handleReady}
                className={`btn ${isReady ? 'btn-success' : 'btn-primary'}`}
              >
                {isReady ? "Pronto!" : "Pronto"}
              </button>
            </div>
          </div>
        </div>
        
        {/* Visualização central / Informações */}
        <div className="space-y-4">
          <div className="bg-card-hover rounded-lg overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="font-bold">Informações da Partida</h3>
            </div>
            
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted mb-1">Modo de Jogo</div>
                  <div className="font-medium capitalize">
                    {matchDetails.mode} ({matchDetails.teamSize} x {matchDetails.teamSize})
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted mb-1">Plataforma</div>
                  <div className="font-medium capitalize">
                    {matchDetails.platform === 'mixed' ? 'Mista (Mobile/Emulador)' : 
                     matchDetails.platform === 'mobile' ? 'Mobile' : 'Emulador'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted mb-1">Entrada</div>
                  <div className="font-medium">
                    R$ {matchDetails.entryFee} por jogador
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted mb-1">Premiação</div>
                  <div className="font-medium text-primary">
                    R$ {matchDetails.prize} por jogador
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-3 bg-primary/10 rounded-lg">
                <div className="text-sm flex items-center gap-1">
                  <Clock size={14} className="text-primary" />
                  <span className="font-medium">Iniciando em {timeLeft}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Time adversário */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-red-500 flex items-center gap-1">
              <Users size={16} />
              Time Adversário
            </h3>
            <span className="text-sm text-muted">
              {opponentPlayers.length}/{matchDetails.teamSize} jogadores
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Jogadores */}
            {opponentPlayers.map(player => (
              <CharacterDisplay 
                key={player.id}
                player={player}
                playerType={player.isCaptain ? PLAYER_TYPES.CAPTAIN : PLAYER_TYPES.OPPONENT}
                size="medium"
                showReady={true}
                onClick={setSelectedPlayer}
              />
            ))}
            
            {/* Slots vazios */}
            {Array(emptyOpponentSlots).fill(0).map((_, index) => (
              <div 
                key={`empty-opponent-${index}`}
                className="border border-dashed border-border bg-card-hover rounded-lg flex flex-col items-center justify-center p-4 h-40"
              >
                <UserPlus size={24} className="text-muted mb-2" />
                <div className="text-sm text-muted">Aguardando jogador...</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Chat lateral */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-card shadow-xl transform transition-transform z-50 ${
        isChatOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h3 className="font-bold">Chat do Lobby</h3>
            <button 
              onClick={() => setIsChatOpen(false)}
              className="text-muted hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {chatMessages.map(msg => (
              <div 
                key={msg.id} 
                className={`rounded-lg p-3 ${
                  msg.type === 'system' 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-card-hover'
                }`}
              >
                <div className="font-medium text-sm">{msg.username}</div>
                <div className="text-sm mt-1">{msg.message}</div>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t border-border">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input 
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-card-hover rounded-lg px-3 py-2 text-sm"
              />
              <button 
                type="submit"
                className="btn-primary"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Modal de detalhes do jogador */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40 p-4">
          <div className="bg-card rounded-lg overflow-hidden max-w-md w-full">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-bold">Detalhes do Jogador</h3>
              <button 
                onClick={() => setSelectedPlayer(null)}
                className="text-muted hover:text-foreground"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col items-center">
                <div className="h-64 w-full mb-4">
                  <CharacterViewer 
                    skinId={selectedPlayer.skin} 
                    animation="idle"
                    controls={true}
                    autoRotate={false}
                    background="transparent"
                    height="100%"
                    quality="high"
                  />
                </div>
                
                <div className="text-center mb-4">
                  <h4 className="text-xl font-bold">{selectedPlayer.username}</h4>
                  <div className="text-sm text-muted">Nível {selectedPlayer.level}</div>
                  {selectedPlayer.rank && (
                    <div className="mt-1 inline-block bg-primary/20 text-primary px-2 py-1 rounded text-xs font-medium">
                      Rank: {selectedPlayer.rank}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3 w-full">
                  <div className="bg-card-hover rounded-lg p-3 text-center">
                    <div className="text-xs text-muted mb-1">Status</div>
                    <div className={`font-medium ${selectedPlayer.isReady ? 'text-green-500' : 'text-amber-500'}`}>
                      {selectedPlayer.isReady ? 'Pronto' : 'Aguardando'}
                    </div>
                  </div>
                  <div className="bg-card-hover rounded-lg p-3 text-center">
                    <div className="text-xs text-muted mb-1">Função</div>
                    <div className="font-medium">
                      {selectedPlayer.isCaptain ? 'Capitão' : 'Jogador'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-border flex justify-end">
              <button
                onClick={() => setSelectedPlayer(null)}
                className="btn-secondary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 