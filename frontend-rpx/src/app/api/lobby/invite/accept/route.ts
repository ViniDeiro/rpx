import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

// POST: Aceitar convite para lobby
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
    
    // Verificar se o lobby ainda existe
    const lobby = await db.collection('lobbies').findOne({
      _id: new ObjectId(invite.lobbyId)
    });
    
    if (!lobby) {
      // Atualizar o convite para expirado
      await db.collection('lobbyinvites').updateOne(
        { _id: new ObjectId(inviteId) },
        { $set: { status: 'expired' } }
      );
      
      return NextResponse.json({
        status: 'error',
        error: 'O lobby não existe mais'
      }, { status: 404 });
    }
    
    // Verificar se o lobby está cheio
    if (lobby.members && lobby.members.length >= lobby.maxPlayers) {
      // Atualizar o convite para expirado
      await db.collection('lobbyinvites').updateOne(
        { _id: new ObjectId(inviteId) },
        { $set: { status: 'expired' } }
      );
      
      return NextResponse.json({
        status: 'error',
        error: 'O lobby está cheio'
      }, { status: 400 });
    }
    
    // Verificar se o usuário já está no lobby
    const isMember = lobby.members.some((member: any) => 
      member.toString() === userId.toString()
    );
    
    if (isMember) {
      // Atualizar o convite para aceito mesmo assim
      await db.collection('lobbyinvites').updateOne(
        { _id: new ObjectId(inviteId) },
        { $set: { status: 'accepted' } }
      );
      
      return NextResponse.json({
        status: 'success',
        message: 'Você já é membro deste lobby',
        lobbyId: lobby._id
      });
    }
    
    // Adicionar usuário ao lobby
    await db.collection('lobbies').updateOne(
      { _id: new ObjectId(invite.lobbyId) },
      { $addToSet: { members: new ObjectId(userId) } }
    );
    
    // Atualizar status do convite
    await db.collection('lobbyinvites').updateOne(
      { _id: new ObjectId(inviteId) },
      { $set: { status: 'accepted' } }
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
      message: 'Convite aceito com sucesso',
      lobbyId: lobby._id
    });
  } catch (error: any) {
    console.error('Erro ao aceitar convite para lobby:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao aceitar convite para lobby'
    }, { status: 500 });
  }
} 