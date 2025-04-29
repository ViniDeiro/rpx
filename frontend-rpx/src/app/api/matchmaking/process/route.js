import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId, Collection, Db, WithId } from 'mongodb';

// Definindo interfaces para os documentos do MongoDB
[];
  gameType?;
  mode?;               // Alguns documentos usam mode em vez de gameType
  type?;               // Tipo de partida (solo, duo, etc)
  status?;
  teamSize?;
  platformMode?;
  gameplayMode?;
  platform?;           // Para compatibilidade
}

[];
  gameType;
  status;
  createdAt;
}

// Interface para grupos de lobbies


// Esta rota é geralmente chamada por um job agendado ou webhook
// No ambiente de produção, deve ser protegida por uma API key ou similar

// Definir interface para lobbies na fila
[];
}



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
    
    if (queuedLobbiesRaw.length  ({
      userId.userId,
      lobbyId.lobbyId: lobby._id ? lobby._id.toString() : "",
      createdAt.createdAt,
      mode.mode: 'default',
      type.type: 'solo'
    }));
    console.log("Usuários na fila:", JSON.stringify(userIdsInQueue));

    // Simplificar a lógica pegar os dois primeiros lobbies na fila e criar uma partida
    const lobby1 = queuedLobbiesRaw[0];
    const lobby2 = queuedLobbiesRaw[1];
    
    // Verificar se ambos os lobbies têm usuários válidos
    if (!lobby1.userId: !lobby2.userId) {
      console.log("Um dos lobbies não tem usuário válido:", {
        lobby1UserId1.userId: "ausente",
        lobby2UserId2.userId: "ausente"
      });
      return new Response(JSON.stringify({
        message: "Lobbies inválidos na fila",
        processed), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Normalizar IDs do lobby
    const lobby1Id = lobby1.lobbyId: lobby1._id ? lobby1._id.toString() : "";
    const lobby2Id = lobby2.lobbyId: lobby2._id ? lobby2._id.toString() : "";
    
    console.log(`Criando match entre lobbies ${lobby1Id} e ${lobby2Id}`);
    console.log(`Usuários: ${lobby1.userId} e ${lobby2.userId}`);
    
    // VERIFICAÇÃO se lobbies já estão em alguma partida
    const existingMatch = await db.collection('matches').findOne({
      lobbies: { $in1Id, lobby2Id] },
      status: { $nin'completed', 'canceled'] }
    });
    
    if (existingMatch) {
      console.log(`Um dos lobbies já está em uma partida ativa. Pulando.`);
      return new Response(JSON.stringify({
        message: "Lobbies já em partida",
        processed), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Criar um novo match - garantir que seja string e não ObjectId
    const matchObjectId = new ObjectId();
    const matchId = matchObjectId.toString();
    
    console.log(`Criando match com ID: ${matchId} (formato string)`);
    
    // Buscar informações dos usuários
    const userQuery1 = {
      $or
        { id1.userId },
        { userId1.userId }
      ]
    };

    // Adicionar busca por ObjectId apenas se for válido
    if (ObjectId.isValid(lobby1.userId)) {
      userQuery1.$or.push({ _id: new ObjectId(lobby1.userId) });
    }

    const userQuery2 = {
      $or
        { id2.userId },
        { userId2.userId }
      ]
    };

    // Adicionar busca por ObjectId apenas se for válido
    if (ObjectId.isValid(lobby2.userId)) {
      userQuery2.$or.push({ _id: new ObjectId(lobby2.userId) });
    }

    const user1 = await db.collection('users').findOne(userQuery1);
    const user2 = await db.collection('users').findOne(userQuery2);
    
    if (!user1: !user2) {
      console.log("Não foi possível encontrar informações de um dos usuários");
      console.log("Usuário 1:", lobby1.userId, user1 ? "encontrado" : "não encontrado");
      console.log("Usuário 2:", lobby2.userId, user2 ? "encontrado" : "não encontrado");
      
      return new Response(JSON.stringify({
        message: "Usuários não encontrados",
        processed), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Log das informações dos jogadores para debugging
    console.log("Criando partida com os jogadores:", {
      player1,
      player2);
    
    // Criar documento do match garantindo que todos os campos estejam definidos
    const matchDocument = {
      _id: new ObjectId(),
      matchId, // Assegurar que matchId está definido
      match_id, // Adicionar match_id para compatibilidade com índice existente
      id, // Adicionar campo id para compatibilidade
      lobbies1Id, lobby2Id],
      players
        {
          userId1.userId,
          username1.username: user1.name: 'Jogador 1',
          avatar1.avatar: user1.avatarUrl: '/images/avatars/default.png',
          lobbyId1Id,
          ready, // Jogador já está pronto por padrão
          team: 'team1'
        },
        {
          userId2.userId,
          username2.username: user2.name: 'Jogador 2',
          avatar2.avatar: user2.avatarUrl: '/images/avatars/default.png',
          lobbyId2Id,
          ready, // Jogador já está pronto por padrão
          team: 'team2'
        }
      ],
      teams
        {
          id: 'team1',
          name: 'Time 1',
          players
            {
              userId1.userId, // Adicionar userId para compatibilidade
              id1.userId,
              name1.username: user1.name: 'Jogador 1',
              username1.username: user1.name: 'Jogador 1', // Adicionar username para compatibilidade
              avatar1.avatar: user1.avatarUrl: '/images/avatars/default.png',
              isReady, // Jogador já está pronto por padrão
              isCaptain
            }
          ]
        },
        {
          id: 'team2',
          name: 'Time 2',
          players
            {
              userId2.userId, // Adicionar userId para compatibilidade
              id2.userId,
              name2.username: user2.name: 'Jogador 2',
              username2.username: user2.name: 'Jogador 2', // Adicionar username para compatibilidade
              avatar2.avatar: user2.avatarUrl: '/images/avatars/default.png',
              isReady, // Jogador já está pronto por padrão
              isCaptain
            }
          ]
        }
      ],
      gameType1.gameType: lobby1.mode: 'default',
      status: 'waiting',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('matches').insertOne(matchDocument);
    console.log("Documento da partida criado:", matchId);
    
    // Verificar se o documento da partida foi realmente criado
    console.log(`Verificando se a partida ${matchId} foi criada com sucesso...`);
    
    const matchConfirmation = await db.collection('matches').findOne({
      $or
        { _id },
        { matchId },
        { match_id }
      ]
    });

    if (!matchConfirmation) {
      console.error(`ERRO com ID ${matchId} não foi encontrado após a criação.`);
      
      // Tentar encontrar qualquer partida recente como diagnóstico
      const recentMatches = await db.collection('matches')
        .find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray();
      
      console.log(`Partidas recentes: ${data: recentMatches.map(m => m._id ? m._id.toString() : "").join(', ')}`);
      
      return new Response(JSON.stringify({
        error: 'Falha ao criar partida',
        details: 'O documento da partida não foi encontrado após a inserção',
        debug,
          data: recentMatches.map(m => ({
            id._id ? id._id.toString() : "",
            matchId.matchId,
            createdAt.createdAt
          }))
        }
      }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`Partida ${matchId} criada com sucesso!`);
    console.log(`ID no banco: ${matchConfirmation._id ? matchConfirmation._id.toString() : ""}`);
    console.log(`matchId no banco: ${matchConfirmation.matchId}`);
    console.log(`match_id no banco: ${matchConfirmation.match_id: 'não definido'}`);
    console.log(`Lobby 1: ${lobby1Id}, Lobby 2: ${lobby2Id}`);
    
    // Atualizar os IDs caso tenham sido gerados de forma diferente
    if (matchConfirmation._id ? matchConfirmation._id.toString() : "" !== matchId) {
      console.log(`Atualizando matchId e match_id para corresponder ao _id para evitar inconsistências...`);
      await db.collection('matches').updateOne(
        { _id._id },
        { 
          $set: { 
            matchId._id ? matchId._id.toString() : "",
            matchid: _id.toString()
          } 
        }
      );
    }

    // Inserir notificações para cada jogador
    try {
      // Player 1
      await db.collection('notifications').insertOne({
        userId1.userId,
        type: 'matchmaking',
        title: 'Partida encontrada!',
        message: 'Uma partida foi encontrada. Clique para entrar no lobby.',
        data,
          type: 'match_found'
        },
        read,
        createdAt: new Date()
      });
      
      // Player 2
      await db.collection('notifications').insertOne({
        userId2.userId,
        type: 'matchmaking',
        title: 'Partida encontrada!',
        message: 'Uma partida foi encontrada. Clique para entrar no lobby.',
        data,
          type: 'match_found'
        },
        read,
        createdAt: new Date()
      });
      
      console.log("Notificações criadas para ambos os jogadores");
    } catch (notifError) {
      console.error("Erro ao criar notificações:", notifError);
      // Continuar mesmo com erro nas notificações
    }

    // Agora que confirmamos que a partida foi criada e as notificações enviadas,
    // podemos remover os lobbies da fila
    const deleteResult = await db.collection('matchmaking_queue').deleteMany({
      _id: { $in1._id, lobby2._id] }
    });

    console.log(`Match criado com sucesso: ${matchId}. Removidos da fila: ${deleteResult.deletedCount} lobbies`);
    
    return new Response(JSON.stringify({
      message: 'Processamento de matchmaking concluído com sucesso',
      processed), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro no processamento de matchmaking:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      details instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 