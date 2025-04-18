import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

// GET: Obter convites de lobby
export async function GET(request: Request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 401 });
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se temos uma conexão válida
    if (!db) {
      console.log('API Lobby Invite GET - Erro: Conexão com banco de dados falhou');
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 500 });
    }
    
    // Obter convites pendentes para o usuário
    const invites = await db.collection('lobbyinvites').find({
      $or: [
        { recipient: new ObjectId(userId) },
        { recipient: userId.toString() }
      ],
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
    
    console.log('API - Recebido pedido de convite:', { recipientId, lobbyId, gameMode });
    
    if (!recipientId || !lobbyId) {
      console.log('API - Erro: dados inválidos ou faltando');
      return NextResponse.json({
        status: 'error',
        error: 'Dados inválidos ou faltando'
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se temos uma conexão válida
    if (!db) {
      console.log('API Lobby Invite POST - Erro: Conexão com banco de dados falhou');
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 500 });
    }
    
    // Verificar se o usuário existe
    const recipient = await db.collection('users').findOne({ 
      _id: new ObjectId(recipientId) 
    });
    
    if (!recipient) {
      console.log('API - Erro: usuário não encontrado');
      return NextResponse.json({
        status: 'error',
        error: 'Usuário não encontrado'
      }, { status: 404 });
    }
    
    // Validar ID do lobby e verificar se existe
    let lobbyObjectId;
    try {
      lobbyObjectId = new ObjectId(lobbyId);
    } catch (e) {
      console.log('API - Erro: ID do lobby inválido', lobbyId);
      return NextResponse.json({
        status: 'error',
        error: 'ID do lobby inválido'
      }, { status: 400 });
    }
    
    // Verificar se o lobby existe
    const lobby = await db.collection('lobbies').findOne({
      _id: lobbyObjectId
    });
    
    if (!lobby) {
      console.log('API - Erro: lobby não encontrado');
      return NextResponse.json({
        status: 'error',
        error: 'Lobby não encontrado'
      }, { status: 404 });
    }
    
    // Verificar se já existe um convite pendente
    const existingInvite = await db.collection('lobbyinvites').findOne({
      $and: [
        {
          $or: [
            { inviter: new ObjectId(userId) },
            { inviter: userId.toString() }
          ]
        },
        {
          $or: [
            { recipient: new ObjectId(recipientId) },
            { recipient: recipientId.toString() }
          ]
        }
      ],
      lobbyId: lobbyObjectId.toString(),
      status: 'pending'
    });
    
    if (existingInvite) {
      console.log('API - Convite já enviado anteriormente');
      return NextResponse.json({
        status: 'success',
        message: 'Convite já enviado anteriormente',
        invite: existingInvite
      });
    }
    
    // Criar novo convite
    const newInvite = {
      inviter: new ObjectId(userId),
      recipient: new ObjectId(recipientId),
      lobbyId: lobbyObjectId.toString(),
      gameMode: gameMode || lobby.lobbyType,
      status: 'pending',
      createdAt: new Date()
    };
    
    console.log('API - Criando novo convite:', newInvite);
    const result = await db.collection('lobbyinvites').insertOne(newInvite);
    
    if (!result.insertedId) {
      console.log('API - Erro ao inserir convite no banco de dados');
      return NextResponse.json({
        status: 'error',
        error: 'Erro ao criar convite'
      }, { status: 500 });
    }
    
    // Criar notificação para o destinatário
    try {
      const inviter = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { _id: 1, username: 1, avatar: 1 } }
      );
      
      await db.collection('notifications').insertOne({
        userId: recipientId.toString(),
        type: 'lobby_invite',
        read: false,
        data: {
          inviter,
          invite: {
            _id: result.insertedId,
            lobbyId: lobbyObjectId.toString(),
            status: 'pending',
            createdAt: new Date()
          }
        },
        createdAt: new Date()
      });
      
      console.log('API - Notificação criada com sucesso');
    } catch (notifError) {
      console.error('API - Erro ao criar notificação:', notifError);
      // Continuar mesmo se a notificação falhar
    }
    
    console.log('API - Convite criado com sucesso:', result.insertedId);
    return NextResponse.json({
      status: 'success',
      message: 'Convite enviado com sucesso',
      invite: {
        ...newInvite,
        _id: result.insertedId
      }
    });
  } catch (error: any) {
    console.error('Erro detalhado ao criar convite para lobby:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao criar convite para lobby: ' + (error.message || 'Erro desconhecido')
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
    
    // Verificar se temos uma conexão válida
    if (!db) {
      console.log('API Lobby Invite DELETE - Erro: Conexão com banco de dados falhou');
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 500 });
    }
    
    // Atualizar o convite para rejeitado
    const result = await db.collection('lobbyinvites').updateOne(
      { 
        _id: new ObjectId(inviteId), 
        $or: [
          { recipient: new ObjectId(userId) },
          { recipient: userId.toString() }
        ]
      },
      { $set: { status: 'rejected' } }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({
        status: 'error',
        error: 'Convite não encontrado ou você não tem permissão para rejeitá-lo'
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