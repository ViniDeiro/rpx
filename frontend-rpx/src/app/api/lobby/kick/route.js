import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId, Document } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

// POST membro do lobby
export async function POST(request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 401 });
    }
    
    const body = await request.json();
    const { lobbyId, memberId } = body;
    
    if (!lobbyId || !memberId) {
      return NextResponse.json({
        status: 'error',
        error: 'ID do lobby ou do membro não fornecido'
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se temos uma conexão válida
    if (!db) {
      console.log('API Lobby Kick - Erroão com banco de dados falhou');
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 400 });
    }
    
    // Verificar se o lobby existe
    const lobby = await db.collection('lobbies').findOne({
      _id: new ObjectId(lobbyId)
    });
    
    if (!lobby) {
      return NextResponse.json({
        status: 'error',
        error: 'Lobby não encontrado'
      }, { status: 400 });
    }
    
    // Verificar se o usuário que está expulsando é o capitão/dono do lobby
    if (lobby.owner ? lobby.owner.toString() : "" !== userId.toString()) {
      return NextResponse.json({
        status: 'error',
        error: 'Apenas o capitão do lobby pode expulsar membros'
      }, { status: 400 });
    }
    
    // Verificar se o membro existe no lobby
    const isMember = lobby.members.some((member) => 
      member.toString() === memberId.toString()
    );
    
    if (!isMember) {
      return NextResponse.json({
        status: 'error',
        error: 'Usuário não é membro deste lobby'
      }, { status: 400 });
    }
    
    // Não permitir expulsar a si mesmo (dono do lobby)
    if (memberId.toString() === userId.toString()) {
      return NextResponse.json({
        status: 'error',
        error: 'Não é possível expulsar a si mesmo do lobby'
      }, { status: 400 });
    }
    
    // Remover o membro do lobby
    const result = await db.collection('lobbies').updateOne(
      { _id: new ObjectId(lobbyId), owner: new ObjectId(userId) },
      { $pull: { members: new ObjectId(memberId) } }
    );
    
    // Notificar o membro expulso
    await db.collection('notifications').insertOne({
      userId: new ObjectId(memberId),
      type: 'system',
      read: false,
      data: {
        message: 'Você foi expulso do lobby'
      },
      createdAt: new Date()
    });
    
    return NextResponse.json({
      status: 'success',
      message: 'Membro expulso com sucesso'
    });
  } catch (error) {
    console.error('Erro ao expulsar membro do lobby:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao expulsar membro do lobby'
    }, { status: 400 });
  }
} 