import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// Middleware para autenticação
async function isAuthenticated() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.id) {
    return { isAuth: false, error: 'Não autorizado', userId: null };
  }
  
  return { isAuth: true, error: null, userId: session.user.id };
}

// POST sala da partida (admin)
export async function POST(request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error: error
      }, { status: 400 });
    }
    
    // Agora que o tipo está corretamente definido, podemos usar a desestruturação direta
    const { db } = await connectToDatabase();
    
    // Verificar se o usuário é um admin
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    });
    
    if (!user && user.role !== 'admin') {
      return NextResponse.json({
        status: 'error',
        error: 'Apenas administradores podem configurar salas'
      }, { status: 400 });
    }
    
    // Obter dados da requisição
    const body = await request.json();
    const { matchId, roomId, password } = body;
    
    if (!matchId || !roomId || !password) {
      return NextResponse.json({
        status: 'error',
        error: 'ID da partida, ID da sala e senha são obrigatórios'
      }, { status: 400 });
    }
    
    // Verificar se a partida existe
    const match = await db.collection('matches').findOne({
      _id: new ObjectId(matchId)
    });
    
    if (!match) {
      return NextResponse.json({
        status: 'error',
        error: 'Partida não encontrada'
      }, { status: 400 });
    }
    
    if (match.status !== 'preparing') {
      return NextResponse.json({
        status: 'error',
        error: 'Esta partida não está no estado correto para configuração'
      }, { status: 400 });
    }
    
    // Atualizar informações da sala
    await db.collection('matches').updateOne(
      { _id: new ObjectId(matchId) },
      { 
        $set: { 
          status: 'ready',
          'roomInfo.roomId': roomId,
          'roomInfo.password': password,
          'roomInfo.createdBy': userId,
          'roomInfo.createdAt': new Date()
        } 
      }
    );
    
    // Notificar todos os jogadores
    const allMembers = [];
    match.teams.forEach((team) => {
      if (team.members && Array.isArray(team.members)) {
        // Garantir que cada membro é convertido para string
        team.members.forEach((member) => {
          allMembers.push(member.toString());
        });
      }
    });
    
    for (const memberId of allMembers) {
      await db.collection('notifications').insertOne({
        userId: new ObjectId(memberId),
        type: 'match_ready',
        read: false,
        data: {
          message: 'A sala da partida está pronta! ID e senha estão disponíveis na sala da partida.',
          matchId: matchId
        },
        createdAt: new Date()
      });
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Sala configurada com sucesso',
      matchId: matchId
    });
    
  } catch (error) {
    console.error('Erro ao configurar sala da partida:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao configurar sala da partida'
    }, { status: 400 });
  }
} 