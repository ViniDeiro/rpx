import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// GET a fila de matchmaking
export async function GET() {
  console.log("Endpoint de processo de matchmaking chamado");
  
  try {
    // Remover a verificação de sessão para permitir chamadas externas (como do endpoint de status)
    // Isso é temporário até implementar uma autenticação adequada para este endpoint
    
    const { db } = await connectToDatabase();
    console.log("Conexão com o banco de dados estabelecida");
    
    // Obter lobbies na fila de matchmaking
    const queueCollection = db.collection('matchmaking_queue');
    
    // Buscar os lobbies e converter para array
    const queuedLobbiesRaw = await queueCollection.find({}).toArray();

    console.log(`Encontrados ${queuedLobbiesRaw.length} lobbies na fila de matchmaking`);
    
    if (queuedLobbiesRaw.length < 2) {
      console.log("Não há lobbies suficientes para formar uma partida");
      return Response.json({
        message: "Não há lobbies suficientes para formar uma partida",
        processed: false
      });
    }
    
    // Extrair IDs de usuários para debugging
    const userIdsInQueue = queuedLobbiesRaw.map(lobby => ({
      userId: lobby.userId || "",
      lobbyId: lobby.lobbyId || (lobby._id ? lobby._id.toString() : ""),
      createdAt: lobby.createdAt,
      mode: lobby.mode || 'default',
      type: lobby.type || 'solo'
    }));
    console.log("Usuários na fila:", JSON.stringify(userIdsInQueue));

    // Simplificar a lógica pegar os dois primeiros lobbies na fila e criar uma partida
    const lobby1 = queuedLobbiesRaw[0];
    const lobby2 = queuedLobbiesRaw[1];
    
    // Verificar se ambos os lobbies têm usuários válidos
    if (!lobby1.userId || !lobby2.userId) {
      console.log("Um dos lobbies não tem usuário válido:", {
        lobby1UserId: lobby1.userId || "ausente",
        lobby2UserId: lobby2.userId || "ausente"
      });
      return Response.json({
        message: "Lobbies inválidos na fila",
        processed: false
      });
    }
    
    // Normalizar IDs do lobby
    const lobby1Id = lobby1.lobbyId || (lobby1._id ? lobby1._id.toString() : "");
    const lobby2Id = lobby2.lobbyId || (lobby2._id ? lobby2._id.toString() : "");
    
    console.log(`Criando match entre lobbies ${lobby1Id} e ${lobby2Id}`);
    console.log(`Usuários: ${lobby1.userId} e ${lobby2.userId}`);
    
    // VERIFICAÇÃO se lobbies já estão em alguma partida
    const existingMatch = await db.collection('matches').findOne({
      lobbies: { $in: [lobby1Id, lobby2Id] },
      status: { $nin: ['completed', 'canceled'] }
    });
    
    if (existingMatch) {
      console.log(`Um dos lobbies já está em uma partida ativa. Pulando.`);
      return Response.json({
        message: "Lobbies já em partida",
        processed: false
      });
    }
    
    // Criar um novo match - garantir que seja string e não ObjectId
    const matchObjectId = new ObjectId();
    const matchId = matchObjectId.toString();
    
    console.log(`Criando match com ID: ${matchId} (formato string)`);
    
    // Buscar informações dos usuários
    const userQuery1 = {
      $or: [
        { id: lobby1.userId },
        { userId: lobby1.userId }
      ]
    };

    // Adicionar busca por ObjectId apenas se for válido
    if (ObjectId.isValid(lobby1.userId)) {
      userQuery1.$or.push({ _id: new ObjectId(lobby1.userId) });
    }

    const userQuery2 = {
      $or: [
        { id: lobby2.userId },
        { userId: lobby2.userId }
      ]
    };

    // Adicionar busca por ObjectId apenas se for válido
    if (ObjectId.isValid(lobby2.userId)) {
      userQuery2.$or.push({ _id: new ObjectId(lobby2.userId) });
    }

    const user1 = await db.collection('users').findOne(userQuery1);
    const user2 = await db.collection('users').findOne(userQuery2);
    
    if (!user1 || !user2) {
      console.log("Não foi possível encontrar informações de um dos usuários");
      console.log("Usuário 1:", lobby1.userId, user1 ? "encontrado" : "não encontrado");
      console.log("Usuário 2:", lobby2.userId, user2 ? "encontrado" : "não encontrado");
      
      return Response.json({
        message: "Usuários não encontrados",
        processed: false
      });
    }
    
    // Criar documento do match garantindo que todos os campos estejam definidos
    const matchDocument = {
      _id: matchObjectId,
      matchId: matchId,
      match_id: matchId,
      id: matchId,
      lobbies: [lobby1Id, lobby2Id],
      players: [
        {
          userId: lobby1.userId,
          username: user1.username || 'Jogador 1',
          avatar: user1.avatar || '/images/avatars/default.png',
          lobbyId: lobby1Id,
          ready: true,
          team: 'team1'
        },
        {
          userId: lobby2.userId,
          username: user2.username || 'Jogador 2',
          avatar: user2.avatar || '/images/avatars/default.png',
          lobbyId: lobby2Id,
          ready: true,
          team: 'team2'
        }
      ],
      teams: [
        {
          id: 'team1',
          name: 'Time 1',
          players: [
            {
              userId: lobby1.userId,
              id: lobby1.userId,
              name: user1.username || 'Jogador 1',
              username: user1.username || 'Jogador 1',
              avatar: user1.avatar || '/images/avatars/default.png',
              isReady: true,
              isCaptain: true
            }
          ]
        },
        {
          id: 'team2',
          name: 'Time 2',
          players: [
            {
              userId: lobby2.userId,
              id: lobby2.userId,
              name: user2.username || 'Jogador 2',
              username: user2.username || 'Jogador 2',
              avatar: user2.avatar || '/images/avatars/default.png',
              isReady: true,
              isCaptain: true
            }
          ]
        }
      ],
      status: 'created',
      gameType: lobby1.gameType || lobby1.mode || 'default',
      platformMode: lobby1.platformMode || 'cualquier',
      gameplayMode: lobby1.gameplayMode || 'normal',
      createdAt: new Date(),
      startTime: null,
      endTime: null,
      result: null
    };
    
    // Inserir o match no banco de dados
    await db.collection('matches').insertOne(matchDocument);
    
    console.log(`Match criado com sucesso: ${matchId}`);
    
    // Atualizar status dos lobbies na fila como processados
    await queueCollection.updateMany(
      { _id: { $in: [lobby1._id, lobby2._id] } },
      { 
        $set: { 
          processed: true,
          matchId: matchId,
          status: 'matched',
          processedAt: new Date()
        } 
      }
    );
    
    console.log(`Lobbies marcados como processados`);
    
    // Enviar notificações aos usuários
    const notifications = [
      {
        userId: lobby1.userId,
        type: 'matchmaking',
        title: 'Partida encontrada!',
        message: 'Uma partida foi encontrada para você. Preparar-se para jogar!',
        read: false,
        data: {
          type: 'match_found',
          matchId: matchId,
          lobbyId: lobby1Id
        },
        createdAt: new Date()
      },
      {
        userId: lobby2.userId,
        type: 'matchmaking',
        title: 'Partida encontrada!',
        message: 'Uma partida foi encontrada para você. Preparar-se para jogar!',
        read: false,
        data: {
          type: 'match_found',
          matchId: matchId,
          lobbyId: lobby2Id
        },
        createdAt: new Date()
      }
    ];
    
    await db.collection('notifications').insertMany(notifications);
    
    console.log(`Notificações enviadas aos usuários`);
    
    return Response.json({
      message: "Processamento de matchmaking concluído com sucesso",
      processed: true,
      matchId: matchId,
      lobbies: [lobby1Id, lobby2Id]
    });
    
  } catch (error) {
    console.error("Erro ao processar matchmaking:", error);
    return Response.json({
      error: "Erro ao processar matchmaking",
      details: error.message
    }, {
      status: 500
    });
  }
} 