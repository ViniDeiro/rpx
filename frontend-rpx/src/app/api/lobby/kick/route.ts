import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId, Document } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

// POST: Expulsar membro do lobby
export async function POST(request: Request) {
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
    
    // Verificar se o lobby existe
    const lobby = await db.collection('lobbies').findOne({
      _id: new ObjectId(lobbyId)
    });
    
    if (!lobby) {
      return NextResponse.json({
        status: 'error',
        error: 'Lobby não encontrado'
      }, { status: 404 });
    }
    
    // Verificar se o usuário que está expulsando é o capitão/dono do lobby
    if (lobby.owner.toString() !== userId.toString()) {
      return NextResponse.json({
        status: 'error',
        error: 'Apenas o capitão do lobby pode expulsar membros'
      }, { status: 403 });
    }
    
    // Verificar se o membro existe no lobby
    const isMember = lobby.members.some((member: any) => 
      member.toString() === memberId.toString()
    );
    
    if (!isMember) {
      return NextResponse.json({
        status: 'error',
        error: 'Usuário não é membro deste lobby'
      }, { status: 404 });
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
      { $pull: { members: new ObjectId(memberId) } as unknown as Document }
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
  } catch (error: any) {
    console.error('Erro ao expulsar membro do lobby:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao expulsar membro do lobby'
    }, { status: 500 });
  }
} 