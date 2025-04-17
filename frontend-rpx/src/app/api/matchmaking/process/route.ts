import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId, Collection, Db, WithId } from 'mongodb';

// Definindo interfaces para os documentos do MongoDB
interface LobbyDocument {
  _id: ObjectId;
  lobbyId: string;
  createdAt: Date | string;
  players: {
    userId: string;
    username: string;
    avatar?: string;
    rank?: string;
  }[];
  gameType: string;
  status: string;
  teamSize?: number;
  platformMode?: string;
  gameplayMode?: string;
}

interface MatchDocument {
  _id: ObjectId;
  matchId: string;
  lobbies: string[];
  players: {
    userId: string;
    username: string;
    avatar?: string;
    rank?: string;
    lobbyId: string;
  }[];
  gameType: string;
  status: string;
  createdAt: Date;
}

// Interface para grupos de lobbies
interface LobbyGroups {
  [key: string]: WithId<LobbyDocument>[];
}

// Esta rota é geralmente chamada por um job agendado ou webhook
// No ambiente de produção, deve ser protegida por uma API key ou similar

// Definir interface para lobbies na fila
interface QueuedLobby {
  _id: string;
  createdAt: string | Date;
  lobbyId: string;
  createdBy: string;
  gameType: string;
  betAmount: number;
  platformMode?: string;
  gameplayMode?: string;
  players: {
    userId: string;
    username: string;
    avatar?: string;
  }[];
}

interface PlayerMatch {
  userId: string;
  username: string;
  avatar?: string;
}

// GET: Processar a fila de matchmaking
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar se é uma chamada autorizada (opcional, dependendo da sua configuração)
    if (!session?.user?.email) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const { db } = await connectToDatabase();
    
    // Obter lobbies na fila de matchmaking
    const queueCollection = db.collection('matchmakingQueue') as unknown as Collection<LobbyDocument>;
    
    // Buscar os lobbies e converter para array
    const queuedLobbiesRaw = await queueCollection.find({}).toArray();

    // Ordenar os lobbies por data de criação de forma segura
    const queuedLobbies = [...queuedLobbiesRaw].sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return dateA - dateB;
    });

    // Agrupar lobbies por tipo de jogo e tamanho da equipe
    const lobbyGroups: LobbyGroups = {};
    
    for (const lobby of queuedLobbies) {
      const gameType = lobby.gameType || 'default';
      const teamSize = lobby.teamSize || 1;
      const platformMode = lobby.platformMode || 'mixed';
      const gameplayMode = lobby.gameplayMode || 'normal';
      const key = `${gameType}-${teamSize}-${platformMode}-${gameplayMode}`;
      
      if (!lobbyGroups[key]) {
        lobbyGroups[key] = [];
      }
      
      lobbyGroups[key].push(lobby);
    }
    
    // Processamento de matchmaking
    const processedLobbyIds: string[] = [];
    const matchesCreated: string[] = [];

    // Para cada grupo de lobbies, processar matchmaking
    for (const key in lobbyGroups) {
      const lobbies = lobbyGroups[key];
      const [gameType, teamSizeStr, platformMode, gameplayMode] = key.split('-');
      const teamSize = parseInt(teamSizeStr, 10);
      
      // Lógica para fazer o matchmaking
      // Por exemplo, para um jogo 1v1, precisamos de 2 jogadores (2 lobbies de tamanho 1)
      // Para um jogo 2v2, precisamos de 4 jogadores (podemos ter 2 lobbies de tamanho 2, ou 4 lobbies de tamanho 1)
      
      while (lobbies.length >= 2) {  // Exemplo simples para jogos 1v1
        const lobby1 = lobbies.shift();
        const lobby2 = lobbies.shift();
        
        if (lobby1 && lobby2) {
          // Criar um novo match
          const matchId = new ObjectId().toString();
          
          // Criar documento do match no banco de dados
          await db.collection('matches').insertOne({
            matchId,
            lobbies: [lobby1.lobbyId, lobby2.lobbyId],
            players: [
              ...(lobby1.players || []).map(p => ({ ...p, lobbyId: lobby1.lobbyId })),
              ...(lobby2.players || []).map(p => ({ ...p, lobbyId: lobby2.lobbyId }))
            ],
            gameType,
            platformMode,
            gameplayMode,
            status: 'pending',
            createdAt: new Date()
          });
          
          // Adicionar os lobbies à lista de processados
          processedLobbyIds.push(lobby1.lobbyId, lobby2.lobbyId);
          matchesCreated.push(matchId);
        }
      }
    }
    
    // Remover todos os lobbies processados da fila
    if (processedLobbyIds.length > 0) {
      await queueCollection.deleteMany({
        lobbyId: { $in: processedLobbyIds }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      processed: processedLobbyIds.length,
      matches: matchesCreated 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao processar matchmaking:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 