import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

// POST: Rejeitar convite para lobby
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
    const { inviteId } = body;
    
    if (!inviteId) {
      return NextResponse.json({
        status: 'error',
        error: 'ID do convite não fornecido'
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se o convite existe e é para o usuário atual
    const invite = await db.collection('lobbyinvites').findOne({
      _id: new ObjectId(inviteId),
      recipient: new ObjectId(userId),
      status: 'pending'
    });
    
    if (!invite) {
      return NextResponse.json({
        status: 'error',
        error: 'Convite não encontrado ou já processado'
      }, { status: 404 });
    }
    
    // Atualizar status do convite
    await db.collection('lobbyinvites').updateOne(
      { _id: new ObjectId(inviteId) },
      { $set: { status: 'rejected' } }
    );
    
    // Marcar notificação como lida
    await db.collection('notifications').updateOne(
      { 
        userId: new ObjectId(userId),
        'data.invite._id': invite._id,
        type: 'lobby_invite'
      },
      { $set: { read: true } }
    );
    
    return NextResponse.json({
      status: 'success',
      message: 'Convite rejeitado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao rejeitar convite para lobby:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao rejeitar convite para lobby'
    }, { status: 500 });
  }
} 