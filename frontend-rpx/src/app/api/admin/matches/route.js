import { NextResponse } from 'next/server';
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
  
  try {
    // Obter o usuário para verificar se é administrador
    const { db } = await connectToDatabase();
    
    // Verificar se temos conexão com o banco
    if (!db) {
      console.error('Erro: conexão com banco de dados falhou');
      return { isAuth: false, error: 'Erro de conexão com o banco de dados', userId: session.user.id };
    }
    
    const user = await db.collection('users').findOne({ _id: new ObjectId(session.user.id) });
    
    if (!user || user.role !== 'admin') {
      return { isAuth: false, error: 'Acesso restrito a administradores', userId: session.user.id };
    }
    
    return { isAuth: true, error: null, userId: session.user.id };
  } catch (error) {
    console.error('Erro ao verificar autenticação de admin:', error);
    return { isAuth: false, error: 'Erro ao verificar permissões de administrador', userId: session.user.id };
  }
}

// GET partidas pendentes para configuração
export async function GET(req) {
  try {
    const { isAuth, error } = await isAdminAuthenticated();
    
    if (!isAuth) {
      return NextResponse.json({
        status: 'error',
        error: error
      }, { status: 403 });
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se temos conexão com o banco
    if (!db) {
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 500 });
    }
    
    // Buscar partidas que estão aguardando configuração de sala
    const matches = await db.collection('matches')
      .find({ status: 'waiting' })
      .toArray();
    
    // Obter informações dos jogadores
    const playerIds = matches.flatMap((match) => match.players || []);
    const uniquePlayerIds = [...new Set(playerIds.map((player) => player.userId ? player.userId.toString() : ""))].map(id => new ObjectId(id));
    
    const users = await db.collection('users')
      .find({ _id: { $in: uniquePlayerIds } })
      .toArray();
    
    // Mapear ID para dados do usuário
    const userMap = users.reduce((acc, user) => {
      acc[user._id ? user._id.toString() : ""] = user;
      return acc;
    }, {});
    
    // Adicionar informações dos jogadores às partidas
    const matchesWithPlayerInfo = matches.map((match) => {
      const playersInfo = (match.players || []).map((player) => {
        const user = userMap[player.userId ? player.userId.toString() : ""];
        return user ? {
          _id: user._id,
          username: user.username,
          avatarUrl: user.avatarUrl
        } : { username: 'Usuário desconhecido' };
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
  } catch (error) {
    console.error('Erro ao listar partidas para administração:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao listar partidas'
    }, { status: 500 });
  }
}

// PUT partida com ID e senha da sala
export async function PUT(req) {
  try {
    const { isAuth, error } = await isAdminAuthenticated();
    
    if (!isAuth) {
      return NextResponse.json({
        status: 'error',
        error: error
      }, { status: 403 });
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
    
    // Verificar se temos conexão com o banco
    if (!db) {
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 500 });
    }
    
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
          roomId: roomId,
          roomPassword: roomPassword,
          status: 'ready',
          startedAt: now,
          timerExpiresAt: timerExpiresAt
        } 
      }
    );
    
    return NextResponse.json({
      status: 'success',
      message: 'Sala configurada com sucesso',
      match: {
        ...match,
        roomId,
        roomPassword,
        status: 'ready'
      }
    });
  } catch (error) {
    console.error('Erro ao configurar sala da partida:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao configurar sala da partida'
    }, { status: 500 });
  }
} 