import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    if (!isAuth || !userId) {
      return NextResponse.json(
        { status: 'error', error: error || 'Não autorizado' },
        { status: 401 }
      );
    }

    const lobbyId = params.id;
    if (!lobbyId) {
      return NextResponse.json(
        { status: 'error', error: 'ID do lobby não fornecido' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Verificar se temos uma conexão válida
    if (!db) {
      return NextResponse.json(
        { status: 'error', error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      );
    }

    // Buscar o lobby
    const lobby = await db.collection('lobbies').findOne({
      _id: new ObjectId(lobbyId)
    });

    if (!lobby) {
      return NextResponse.json(
        { status: 'error', error: 'Lobby não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem acesso ao lobby
    const isMember = lobby.members && lobby.members.some((memberId: any) =>
      (typeof memberId === 'object' ? memberId.toString() : memberId) === userId
    );

    if (!isMember && lobby.owner.toString() !== userId) {
      return NextResponse.json(
        { status: 'error', error: 'Não autorizado a acessar este lobby' },
        { status: 403 }
      );
    }

    // Verificar status de matchmaking
    let matchmakingStatus = null;
    let matchInfo = null;

    if (lobby.status === 'matchmaking') {
      // Buscar na fila de matchmaking
      matchmakingStatus = await db.collection('matchmaking_queue').findOne({
        lobbyId: lobbyId,
        processed: { $ne: true }
      });
    } else if (lobby.status === 'match_found' && lobby.matchId) {
      // Buscar informações da partida
      const match = await db.collection('matches').findOne({
        _id: new ObjectId(lobby.matchId)
      });

      if (match) {
        matchInfo = {
          matchId: match._id.toString(),
          status: match.status,
          teams: match.teams,
          type: match.type,
          createdAt: match.createdAt,
          startTime: match.startTime
        };
      }
    }

    return NextResponse.json({
      status: 'success',
      data: {
        lobbyId: lobbyId,
        lobbyStatus: lobby.status,
        lobbyType: lobby.lobbyType,
        matchmaking: matchmakingStatus ? {
          inQueue: true,
          queuedAt: matchmakingStatus.createdAt,
          waitTime: Math.floor((Date.now() - new Date(matchmakingStatus.createdAt).getTime()) / 1000)
        } : {
          inQueue: false
        },
        match: matchInfo
      }
    });
    
  } catch (error: any) {
    console.error('Erro ao verificar status de matchmaking:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao verificar status de matchmaking: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
} 