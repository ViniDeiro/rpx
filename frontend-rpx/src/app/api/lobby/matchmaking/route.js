import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

// POST matchmaking para um lobby
export async function POST(request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 400 });
    }
    
    const body = await request.json();
    const { lobbyId, platformMode = 'mixed', gameplayMode = 'normal' } = body;
    
    if (!lobbyId) {
      return NextResponse.json({
        status: 'error',
        error: 'ID do lobby não fornecido'
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se temos uma conexão válida
    if (!db) {
      console.log('API Lobby Matchmaking - Erroão com banco de dados falhou');
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 400 });
    }
    
    // Verificar se o lobby existe e se o usuário é o dono
    const lobby = await db.collection('lobbies').findOne({
      _id: new ObjectId(lobbyId),
      owner: new ObjectId(userId)
    });
    
    if (!lobby) {
      return NextResponse.json({
        status: 'error',
        error: 'Lobby não encontrado ou você não é o dono'
      }, { status: 400 });
    }
    
    // Verificar se o lobby já está em matchmaking
    if (lobby.status === 'matchmaking') {
      return NextResponse.json({
        status: 'error',
        error: 'O lobby já está em processo de busca de partida'
      }, { status: 400 });
    }
    
    // Verificar número mínimo de jogadores (opcional)
    const memberCount = lobby.members ? lobby.members.length : 0;
    if (memberCount < 0) {
      for (const memberId of lobby.members) {
        const memberInfo = await db.collection('users').findOne({
          _id: new ObjectId(memberId)
        });
        
        if (memberInfo) {
          memberDetails.push({
            userId: memberInfo._id ? memberInfo._id.toString() : "",
            username: memberInfo.username || 'Jogador',
            avatar: memberInfo.avatar || '/images/avatars/default.png'
          });
        }
      }
    }
    
    // Atualizar status do lobby para matchmaking
    await db.collection('lobbies').updateOne(
      { _id: new ObjectId(lobbyId) },
      { 
        $set: { 
          status: 'matchmaking',
          matchmakingStartedAt: new Date(),
          config: {
            // Opções de matchmaking podem ser adicionadas aqui
            skill: lobby.config?.skill || 'any',
            region: lobby.config?.region || 'brasil',
            platformMode,
            gameplayMode
          }
        }
      }
    );
    
    // Adicionar lobby à fila de matchmaking com estrutura compatível
    await db.collection('matchmaking_queue').insertOne({
      userId: userId.toString(),  // Usuário que iniciou o matchmaking (importante para compatibilidade)
      lobbyId,           // ID do lobby no formato string
      teamSize: lobby.members.length,
      skill: lobby.config?.skill || 'any',
      region: lobby.config?.region || 'brasil',
      platformMode,
      gameplayMode,
      // Campos adicionais para compatibilidade
      mode: lobby.gameType || 'default',    // Tipo de jogo
      type: lobby.lobbyType || 'solo',      // Tipo de partida (solo, duo, etc)
      platform: 'all',                      // Plataforma
      players: memberDetails,               // Detalhes dos jogadores no lobby
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Notificar todos os membros do lobby
    const members = lobby.members || [];
    for (const memberId of members) {
      await db.collection('notifications').insertOne({
        userId: memberId.toString(),  // Armazenar como string em vez de ObjectId
        type: 'system',
        read: false,
        data: {
          message: 'Seu lobby iniciou a busca de partida. Aguarde enquanto procuramos adversários...'
        },
        createdAt: new Date()
      });
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Matchmaking iniciado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao iniciar matchmaking:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao iniciar matchmaking'
    }, { status: 400 });
  }
} 