import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId, Collection, Db, WithId } from 'mongodb';

// Definindo interfaces para os documentos do MongoDB
interface LobbyDocument {
  _id: ObjectId;
  lobbyId: string | ObjectId;  // Pode ser string ou ObjectId
  userId?: string;             // Para compatibilidade com chamadas individuais de usuários
  createdAt: Date | string;
  players?: {
    userId: string;
    username: string;
    avatar?: string;
    rank?: string;
  }[];
  gameType?: string;
  mode?: string;               // Alguns documentos usam mode em vez de gameType
  type?: string;               // Tipo de partida (solo, duo, etc)
  status?: string;
  teamSize?: number;
  platformMode?: string;
  gameplayMode?: string;
  platform?: string;           // Para compatibilidade
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
  createdBy?: string;
  userId?: string;
  gameType?: string;
  mode?: string;
  betAmount?: number;
  platformMode?: string;
  gameplayMode?: string;
  players?: {
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
    
    // Obter lobbies na fila de matchmaking - atualizado nome da coleção
    const queueCollection = db.collection('matchmaking_queue') as unknown as Collection<LobbyDocument>;
    
    // Buscar os lobbies e converter para array
    const queuedLobbiesRaw = await queueCollection.find({}).toArray();

    // Ordenar os lobbies por data de criação de forma segura
    const queuedLobbies = [...queuedLobbiesRaw].sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return dateA - dateB;
    });

    console.log(`Encontrados ${queuedLobbies.length} lobbies na fila de matchmaking`);

    // Agrupar lobbies por tipo de jogo e tamanho da equipe
    const lobbyGroups: LobbyGroups = {};
    
    for (const lobby of queuedLobbies) {
      // Normalizar propriedades, priorizando determinados campos
      const gameType = lobby.gameType || lobby.mode || 'default';
      const teamSize = lobby.teamSize || 1;
      const platformMode = lobby.platformMode || lobby.platform || 'mixed';
      const gameplayMode = lobby.gameplayMode || 'normal';
      const key = `${gameType}-${teamSize}-${platformMode}-${gameplayMode}`;
      
      if (!lobbyGroups[key]) {
        lobbyGroups[key] = [];
      }
      
      lobbyGroups[key].push(lobby);
    }
    
    console.log(`Grupos formados: ${Object.keys(lobbyGroups).join(', ')}`);
    
    // Processamento de matchmaking
    const processedLobbyIds: string[] = [];
    const matchesCreated: string[] = [];

    // Para cada grupo de lobbies, processar matchmaking
    for (const key in lobbyGroups) {
      const lobbies = lobbyGroups[key];
      console.log(`Processando grupo ${key} com ${lobbies.length} lobbies`);
      
      const [gameType, teamSizeStr, platformMode, gameplayMode] = key.split('-');
      const teamSize = parseInt(teamSizeStr, 10);
      
      // Verificar número mínimo necessário de jogadores baseado no tamanho do time
      const requiredLobbies = 2; // Precisamos de dois lobbies para formar uma partida

      // Garantir que existam pelo menos 2 lobbies para formar uma partida
      // Não podemos criar partida com um único jogador/lobby
      if (lobbies.length < requiredLobbies) {
        console.log(`Grupo ${key} não tem lobbies suficientes (${lobbies.length}/${requiredLobbies}). Pulando.`);
        continue;
      }
      
      // Lógica para fazer o matchmaking
      // Vamos juntar dois lobbies para formar uma partida
      
      while (lobbies.length >= requiredLobbies) {
        const lobby1 = lobbies.shift();
        const lobby2 = lobbies.shift();
        
        if (lobby1 && lobby2) {
          // Normalizar IDs do lobby (podem ser string ou ObjectId)
          const lobby1Id = lobby1.lobbyId instanceof ObjectId 
            ? lobby1.lobbyId.toString() 
            : lobby1.lobbyId?.toString() || lobby1._id.toString();
            
          const lobby2Id = lobby2.lobbyId instanceof ObjectId 
            ? lobby2.lobbyId.toString() 
            : lobby2.lobbyId?.toString() || lobby2._id.toString();
            
          console.log(`Criando match entre lobbies ${lobby1Id} e ${lobby2Id}`);
          
          // VERIFICAÇÃO: Checar se lobbies já estão em alguma partida
          const existingMatch = await db.collection('matches').findOne({
            lobbies: { $in: [lobby1Id, lobby2Id] },
            status: { $nin: ['completed', 'canceled'] }
          });
          
          if (existingMatch) {
            console.log(`Um dos lobbies já está em uma partida ativa (ID: ${existingMatch.matchId}). Pulando.`);
            continue;
          }
          
          // Criar um novo match
          const matchId = new ObjectId().toString();
          
          // Obter os jogadores para cada lobby
          const players1 = lobby1.players || [];
          const players2 = lobby2.players || [];
          
          // Adicionar o usuário da fila se não houver players (uso individual)
          if (players1.length === 0 && lobby1.userId) {
            const userInfo = await db.collection('users').findOne({ 
              $or: [
                { _id: new ObjectId(lobby1.userId) },
                { id: lobby1.userId }
              ]
            });
            
            if (userInfo) {
              players1.push({
                userId: lobby1.userId,
                username: userInfo.username || 'Jogador',
                avatar: userInfo.avatar || '/images/avatars/default.png'
              });
            }
          }
          
          if (players2.length === 0 && lobby2.userId) {
            const userInfo = await db.collection('users').findOne({ 
              $or: [
                { _id: new ObjectId(lobby2.userId) },
                { id: lobby2.userId }
              ]
            });
            
            if (userInfo) {
              players2.push({
                userId: lobby2.userId,
                username: userInfo.username || 'Jogador',
                avatar: userInfo.avatar || '/images/avatars/default.png'
              });
            }
          }
          
          // Verificar se os dois lobbies têm jogadores
          if (players1.length === 0 || players2.length === 0) {
            console.log('Um dos lobbies não tem jogadores. Pulando criação de partida.');
            continue;
          }
          
          // Criar documento do match no banco de dados com informações completas
          await db.collection('matches').insertOne({
            matchId,
            lobbies: [lobby1Id, lobby2Id],
            players: [
              ...players1.map(p => ({ ...p, lobbyId: lobby1Id })),
              ...players2.map(p => ({ ...p, lobbyId: lobby2Id }))
            ],
            gameType,
            platformMode,
            gameplayMode,
            status: 'waiting_admin',  // Status específico para indicar que aguarda configuração do admin
            idSala: null,          // Campo para o admin preencher com ID da sala
            senhaSala: null,       // Campo para o admin preencher com senha da sala
            salaConfigurada: false, // Indica se o admin já configurou a sala
            timerStarted: false,   // Indica se o timer de 5 minutos já foi iniciado
            timerStartedAt: null,  // Timestamp de quando o timer foi iniciado
            timerDuration: 5 * 60, // Duração do timer em segundos (5 minutos)
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          // Adicionar os lobbies à lista de processados
          processedLobbyIds.push(lobby1Id, lobby2Id);
          matchesCreated.push(matchId);
          
          console.log(`Match ${matchId} criado com sucesso`);
          
          // Notificar usuários sobre o match criado
          const allPlayers = [...players1, ...players2];
          for (const player of allPlayers) {
            await db.collection('notifications').insertOne({
              userId: player.userId,
              type: 'match_created',  // Tipo específico para notificação de partida
              title: 'Partida encontrada!',
              message: 'Uma partida foi encontrada! Aguarde a configuração da sala pelo administrador.',
              read: false,
              data: {
                matchId,
                gameType,
                platformMode,
                gameplayMode
              },
              createdAt: new Date()
            });
          }
        }
      }
    }
    
    // Remover todos os lobbies processados da fila
    if (processedLobbyIds.length > 0) {
      console.log(`Removendo ${processedLobbyIds.length} lobbies da fila`);
      
      try {
        // Tentar remover por lobbyId
        await queueCollection.deleteMany({
          $or: [
            { lobbyId: { $in: processedLobbyIds } },
            { _id: { $in: processedLobbyIds.map(id => {
              try { 
                // Converter apenas strings válidas para ObjectId
                return typeof id === 'string' && ObjectId.isValid(id) ? new ObjectId(id) : id; 
              } catch (e) { 
                return id; 
              }
            }) as unknown as ObjectId[] } }
          ]
        });
      } catch (deleteError) {
        console.error('Erro ao remover lobbies da fila:', deleteError);
      }
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