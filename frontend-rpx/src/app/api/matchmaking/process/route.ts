import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// Esta rota é geralmente chamada por um job agendado ou webhook
// No ambiente de produção, deve ser protegida por uma API key ou similar

// GET: Processar a fila de matchmaking
export async function GET(request: Request) {
  try {
    // Verificação básica de autenticação (para ambiente de desenvolvimento)
    const session = await getServerSession(authOptions);
    
    // Verificar se é admin usando verificação na base de dados
    let isAdmin = false;
    if (session?.user?.id) {
      try {
        const { db } = await connectToDatabase();
        const user = await db.collection('users').findOne({
          _id: new ObjectId(session.user.id),
        });
        isAdmin = user?.role === 'admin';
      } catch (error) {
        console.error('Erro ao verificar permissões de admin:', error);
      }
    }
    
    // Em produção, verificar uma chave de API ou token especial
    const url = new URL(request.url);
    const apiKey = url.searchParams.get('apiKey');
    const isValidApiKey = apiKey === process.env.MATCHMAKING_API_KEY;
    
    if (!isAdmin && !isValidApiKey) {
      return NextResponse.json({
        status: 'error',
        error: 'Não autorizado'
      }, { status: 401 });
    }
    
    const { db } = await connectToDatabase();
    
    // Obter lobbies na fila de matchmaking, ordenados pelo tempo de espera
    const queuedLobbies = await db.collection('matchmakingQueue')
      .find({})
      .sort({ createdAt: 1 })
      .toArray();
    
    if (queuedLobbies.length < 2) {
      return NextResponse.json({
        status: 'success',
        message: 'Não há lobbies suficientes na fila para matchmaking',
        processed: 0
      });
    }
    
    // Agrupar lobbies por tamanho de equipe
    const lobbiesByTeamSize = {};
    queuedLobbies.forEach(lobby => {
      const size = lobby.teamSize.toString();
      if (!lobbiesByTeamSize[size]) {
        lobbiesByTeamSize[size] = [];
      }
      lobbiesByTeamSize[size].push(lobby);
    });
    
    let matchesCreated = 0;
    const processedLobbyIds = [];
    
    // Para cada grupo de tamanho, tentar fazer matches
    for (const teamSize in lobbiesByTeamSize) {
      const lobbies = lobbiesByTeamSize[teamSize];
      
      // Precisamos de pelo menos 2 lobbies do mesmo tamanho
      if (lobbies.length < 2) continue;
      
      // Processar lobbies em pares
      for (let i = 0; i < lobbies.length; i += 2) {
        if (i + 1 >= lobbies.length) break;
        
        const lobby1 = lobbies[i];
        const lobby2 = lobbies[i + 1];
        
        // Verificar compatibilidade adicional se necessário
        // Exemplo: verificar região, skill, etc.
        
        // Buscar informações completas dos lobbies
        const lobby1Data = await db.collection('lobbies').findOne({
          _id: new ObjectId(lobby1.lobbyId)
        });
        
        const lobby2Data = await db.collection('lobbies').findOne({
          _id: new ObjectId(lobby2.lobbyId)
        });
        
        if (!lobby1Data || !lobby2Data) continue;
        
        // Criar uma nova partida
        const matchResult = await db.collection('matches').insertOne({
          status: 'preparing',
          teams: [
            {
              lobbyId: lobby1.lobbyId,
              members: lobby1Data.members,
              captain: lobby1Data.owner
            },
            {
              lobbyId: lobby2.lobbyId,
              members: lobby2Data.members,
              captain: lobby2Data.owner
            }
          ],
          config: {
            gameType: 'squad',
            teamSize: parseInt(teamSize),
            // Outras configurações
          },
          roomInfo: {
            // Será preenchido pelo admin mais tarde
            roomId: null,
            password: null,
            createdBy: null,
            createdAt: null
          },
          createdAt: new Date(),
          startedAt: null,
          endedAt: null
        });
        
        const matchId = matchResult.insertedId;
        
        // Atualizar status dos lobbies
        await db.collection('lobbies').updateOne(
          { _id: new ObjectId(lobby1.lobbyId) },
          { $set: { status: 'in_match', matchId } }
        );
        
        await db.collection('lobbies').updateOne(
          { _id: new ObjectId(lobby2.lobbyId) },
          { $set: { status: 'in_match', matchId } }
        );
        
        // Notificar todos os membros dos lobbies
        const allMembers = [
          ...(lobby1Data.members || []), 
          ...(lobby2Data.members || [])
        ];
        
        for (const memberId of allMembers) {
          await db.collection('notifications').insertOne({
            userId: new ObjectId(memberId.toString()),
            type: 'match_found',
            read: false,
            data: {
              message: 'Uma partida foi encontrada! Clique para entrar na sala.',
              matchId: matchId.toString()
            },
            createdAt: new Date()
          });
        }
        
        // Remover lobbies da fila de matchmaking
        processedLobbyIds.push(lobby1.lobbyId, lobby2.lobbyId);
        matchesCreated++;
      }
    }
    
    // Remover todos os lobbies processados da fila
    if (processedLobbyIds.length > 0) {
      await db.collection('matchmakingQueue').deleteMany({
        lobbyId: { $in: processedLobbyIds.map(id => new ObjectId(id)) }
      });
    }
    
    return NextResponse.json({
      status: 'success',
      message: `Processamento de matchmaking concluído. ${matchesCreated} partidas criadas.`,
      matchesCreated,
      processedLobbies: processedLobbyIds.length
    });
    
  } catch (error: any) {
    console.error('Erro ao processar matchmaking:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao processar matchmaking'
    }, { status: 500 });
  }
} 