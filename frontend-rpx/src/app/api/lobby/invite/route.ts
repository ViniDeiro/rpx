import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// Middleware para autenticação
async function isAuthenticated() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.id) {
    return { isAuth: false, error: 'Não autorizado', userId: null };
  }
  
  return { isAuth: true, error: null, userId: session.user.id };
}

// GET: Obter convites de lobby
export async function GET() {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 401 });
    }
    
    const { db } = await connectToDatabase();
    
    // Obter convites pendentes para o usuário
    const invites = await db.collection('lobbyinvites').find({
      recipient: new ObjectId(userId),
      status: 'pending'
    }).toArray();
    
    // Buscar dados dos usuários que enviaram os convites
    const userIds = invites.map(invite => invite.inviter);
    const users = await db.collection('users').find(
      { _id: { $in: userIds } },
    ).toArray();
    
    // Juntar dados do convite com dados do usuário
    const invitesWithUserData = invites.map((invite: any) => {
      const inviter = users.find((user: any) => 
        user._id.toString() === invite.inviter.toString()
      );
      return {
        ...invite,
        inviter: inviter || { username: 'Usuário desconhecido' }
      };
    });
    
    return NextResponse.json({
      status: 'success',
      invites: invitesWithUserData
    });
  } catch (error: any) {
    console.error('Erro ao obter convites de lobby:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao obter convites de lobby'
    }, { status: 500 });
  }
}

// POST: Criar convite para lobby
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
    const { recipientId, lobbyId, gameMode } = body;
    
    if (!recipientId || !lobbyId) {
      return NextResponse.json({
        status: 'error',
        error: 'Dados inválidos'
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se o usuário existe
    const recipient = await db.collection('users').findOne({ 
      _id: new ObjectId(recipientId) 
    });
    
    if (!recipient) {
      return NextResponse.json({
        status: 'error',
        error: 'Usuário não encontrado'
      }, { status: 404 });
    }
    
    // Verificar se já existe um convite pendente
    const existingInvite = await db.collection('lobbyinvites').findOne({
      inviter: new ObjectId(userId),
      recipient: new ObjectId(recipientId),
      lobbyId,
      status: 'pending'
    });
    
    if (existingInvite) {
      return NextResponse.json({
        status: 'error',
        error: 'Convite já enviado'
      }, { status: 400 });
    }
    
    // Criar novo convite
    const newInvite = {
      inviter: new ObjectId(userId),
      recipient: new ObjectId(recipientId),
      lobbyId,
      gameMode,
      status: 'pending',
      createdAt: new Date()
    };
    
    const result = await db.collection('lobbyinvites').insertOne(newInvite);
    
    return NextResponse.json({
      status: 'success',
      invite: {
        ...newInvite,
        _id: result.insertedId
      }
    });
  } catch (error: any) {
    console.error('Erro ao criar convite para lobby:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao criar convite para lobby'
    }, { status: 500 });
  }
}

// DELETE: Rejeitar convite para lobby
export async function DELETE(request: Request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get('inviteId');
    
    if (!inviteId) {
      return NextResponse.json({
        status: 'error',
        error: 'ID do convite não fornecido'
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Atualizar o convite para rejeitado
    const result = await db.collection('lobbyinvites').updateOne(
      { 
        _id: new ObjectId(inviteId), 
        recipient: new ObjectId(userId) 
      },
      { $set: { status: 'rejected' } }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({
        status: 'error',
        error: 'Convite não encontrado'
      }, { status: 404 });
    }
    
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