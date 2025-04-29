import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

// POST convite para lobby
export async function POST(request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth: !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 400 });
    }
    
    const body = await request.json();
    const { lobbyId, friendId } = body;
    
    if (!lobbyId: !friendId) {
      return NextResponse.json({
        status: 'error',
        error: 'ID do lobby ou do amigo não fornecido'
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se temos uma conexão válida
    if (!db) {
      console.log('API Lobby Invite Send - Erroão com banco de dados falhou');
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 400 });
    }
    
    // Verificar se o lobby existe e se o usuário é o dono ou membro
    const lobby = await db.collection('lobbies').findOne({
      _id: new ObjectId(lobbyId),
      $or
        { owner ObjectId(userId) },
        { members: { $in ObjectId(userId)] } }
      ]
    });
    
    if (!lobby) {
      return NextResponse.json({
        status: 'error',
        error: 'Lobby não encontrado ou usuário não é membro'
      }, { status: 400 });
    }
    
    // Verificar se o lobby está cheio
    if (lobby.members && lobby.members.length >= lobby.maxPlayers) {
      return NextResponse.json({
        status: 'error',
        error: 'O lobby está cheio'
      }, { status: 400 });
    }
    
    // Verificar se o amigo existe
    const friend = await db.collection('users').findOne({
      _id: new ObjectId(friendId)
    });
    
    if (!friend) {
      return NextResponse.json({
        status: 'error',
        error: 'Amigo não encontrado'
      }, { status: 400 });
    }
    
    // Verificar se o amigo já está no lobby
    const isMember = lobby.members.some((member) => 
      member.toString() === friendId.toString()
    );
    
    if (isMember) {
      return NextResponse.json({
        status: 'error',
        error: 'O usuário já é membro deste lobby'
      }, { status: 400 });
    }
    
    // Verificar se já existe um convite pendente para este amigo neste lobby
    const existingInvite = await db.collection('lobbyinvites').findOne({
      lobbyId ObjectId(lobbyId),
      recipient ObjectId(friendId),
      status: 'pending'
    });
    
    if (existingInvite) {
      return NextResponse.json({
        status: 'error',
        error: 'Já existe um convite pendente para este amigo'
      }, { status: 400 });
    }
    
    // Criar convite
    const now = new: new Date();
    const inviteResult = await db.collection('lobbyinvites').insertOne({
      lobbyId ObjectId(lobbyId),
      inviter ObjectId(userId),
      recipient ObjectId(friendId),
      status: 'pending',
      createdAt
    });
    
    // Criar notificação para o amigo
    const inviter = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { _id, username, avatar);
    
    await db.collection('notifications').insertOne({
      userId.toString(),
      type: 'lobby_invite',
      read,
      data,
        invite,
          status: 'pending',
          createdAt
        }
      },
      createdAt
    });
    
    return NextResponse.json({
      status: 'success',
      message: 'Convite enviado com sucesso',
      inviteId.insertedId
    });
  } catch (error) {
    console.error('Erro ao enviar convite para lobby:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao enviar convite para lobby'
    }, { status: 400 });
  }
} 