import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// Middleware para autenticação de administrador
async function isAdminAuthenticated() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.id) {
    return { isAuth: false, error: 'Não autorizado', userId: null };
  }
  
  // Obter o usuário para verificar se é administrador
  const { db } = await connectToDatabase();
  const user = await db.collection('users').findOne({ _id: new ObjectId(session.user.id) });
  
  if (!user || user.role !== 'admin') {
    return { isAuth: false, error: 'Acesso restrito a administradores', userId: null };
  }
  
  return { isAuth: true, error: null, userId: session.user.id };
}

// GET: Listar partidas pendentes para configuração
export async function GET(req: NextRequest) {
  try {
    const { isAuth, error } = await isAdminAuthenticated();
    
    if (!isAuth) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 401 });
    }
    
    const { db } = await connectToDatabase();
    
    // Buscar partidas que estão aguardando configuração de sala
    const matches = await db.collection('matches')
      .find({ status: 'waiting' })
      .toArray();
    
    // Obter informações dos jogadores
    const playerIds = matches.flatMap((match: any) => match.players);
    const uniquePlayerIds = [...new Set(playerIds.map((id: any) => id.toString()))].map(id => new ObjectId(id));
    
    const users = await db.collection('users')
      .find({ _id: { $in: uniquePlayerIds } })
      .toArray();
    
    // Mapear ID para dados do usuário
    const userMap = users.reduce((acc: any, user: any) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {});
    
    // Adicionar informações dos jogadores às partidas
    const matchesWithPlayerInfo = matches.map((match: any) => {
      const playersInfo = match.players.map((playerId: any) => {
        const user = userMap[playerId.toString()];
        return user ? {
          _id: user._id,
          username: user.username,
          avatarUrl: user.avatarUrl
        } : { _id: playerId, username: 'Usuário desconhecido' };
      });
      
      return {
        ...match,
        playersInfo
      };
    });
    
    return NextResponse.json({
      status: 'success',
      matches: matchesWithPlayerInfo
    });
  } catch (error: any) {
    console.error('Erro ao listar partidas para administração:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao listar partidas'
    }, { status: 500 });
  }
}

// PUT: Atualizar partida com ID e senha da sala
export async function PUT(req: NextRequest) {
  try {
    const { isAuth, error } = await isAdminAuthenticated();
    
    if (!isAuth) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 401 });
    }
    
    const body = await req.json();
    const { matchId, roomId, roomPassword } = body;
    
    if (!matchId || !roomId || !roomPassword) {
      return NextResponse.json({
        status: 'error',
        error: 'ID da partida, ID da sala e senha da sala são obrigatórios'
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Buscar a partida
    const match = await db.collection('matches').findOne({ 
      _id: new ObjectId(matchId)
    });
    
    if (!match) {
      return NextResponse.json({
        status: 'error',
        error: 'Partida não encontrada'
      }, { status: 404 });
    }
    
    // Verificar se a partida está no estado correto
    if (match.status !== 'waiting') {
      return NextResponse.json({
        status: 'error',
        error: 'Esta partida não está aguardando configuração de sala'
      }, { status: 400 });
    }
    
    // Atualizar a partida com as informações da sala
    const now = new Date();
    const timerExpiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutos
    
    await db.collection('matches').updateOne(
      { _id: new ObjectId(matchId) },
      { 
        $set: { 
          roomId,
          roomPassword,
          status: 'ready',
          startedAt: now,
          timerExpiresAt
        } 
      }
    );
    
    return NextResponse.json({
      status: 'success',
      message: 'Sala configurada com sucesso',
      match: {
        _id: matchId,
        roomId,
        roomPassword,
        timerExpiresAt
      }
    });
  } catch (error: any) {
    console.error('Erro ao configurar sala da partida:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao configurar sala da partida'
    }, { status: 500 });
  }
} 