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
    console.log('🔔 [DEBUG] API Lobby Invite POST - Iniciando requisição');
    
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      console.error('🔒 [DEBUG] API Lobby Invite POST - Erro de autenticação:', error);
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 401 });
    }
    
    const body = await request.json();
    const { recipientId, lobbyId, gameMode } = body;
    
    console.log('📝 [DEBUG] API Lobby Invite POST - Dados recebidos:', { 
      userId,
      recipientId, 
      lobbyId, 
      gameMode 
    });
    
    if (!recipientId) {
      console.error('❌ [DEBUG] API Lobby Invite POST - Erro: ID do destinatário não fornecido');
      return NextResponse.json({
        status: 'error',
        error: 'ID do destinatário é obrigatório'
      }, { status: 400 });
    }

    if (!lobbyId) {
      console.error('❌ [DEBUG] API Lobby Invite POST - Erro: ID do lobby não fornecido');
      return NextResponse.json({
        status: 'error',
        error: 'ID do lobby é obrigatório'
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se temos uma conexão válida
    if (!db) {
      console.error('❌ [DEBUG] API Lobby Invite POST - Erro: Conexão com banco de dados falhou');
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 500 });
    }
    
    console.log('✓ [DEBUG] API Lobby Invite POST - Conectado ao banco de dados');
    
    // Verificar se o usuário existe
    try {
      const recipient = await db.collection('users').findOne({ 
        _id: new ObjectId(recipientId) 
      });
      
      if (!recipient) {
        console.error('❌ [DEBUG] API Lobby Invite POST - Erro: Usuário não encontrado:', recipientId);
        return NextResponse.json({
          status: 'error',
          error: 'Usuário não encontrado'
        }, { status: 404 });
      }
      
      console.log('✓ [DEBUG] API Lobby Invite POST - Usuário encontrado:', recipient.username);
    } catch (err) {
      console.error('❌ [DEBUG] API Lobby Invite POST - Erro ao verificar usuário:', err);
      return NextResponse.json({
        status: 'error',
        error: 'Erro ao verificar dados do usuário'
      }, { status: 500 });
    }
    
    // Validar ID do lobby e verificar se existe
    let lobbyObjectId;
    try {
      lobbyObjectId = new ObjectId(lobbyId);
      console.log('✓ [DEBUG] API Lobby Invite POST - ID do lobby válido:', lobbyId);
    } catch (e) {
      console.error('❌ [DEBUG] API Lobby Invite POST - Erro: ID do lobby inválido', lobbyId);
      return NextResponse.json({
        status: 'error',
        error: 'ID do lobby inválido'
      }, { status: 400 });
    }
    
    // Verificar se o lobby existe
    try {
      const lobby = await db.collection('lobbies').findOne({
        _id: lobbyObjectId
      });
      
      if (!lobby) {
        console.error('❌ [DEBUG] API Lobby Invite POST - Erro: Lobby não encontrado:', lobbyId);
        return NextResponse.json({
          status: 'error',
          error: 'Lobby não encontrado'
        }, { status: 404 });
      }
      
      console.log('✓ [DEBUG] API Lobby Invite POST - Lobby encontrado:', lobby.name || lobbyId);
    } catch (err) {
      console.error('❌ [DEBUG] API Lobby Invite POST - Erro ao verificar lobby:', err);
      return NextResponse.json({
        status: 'error',
        error: 'Erro ao verificar dados do lobby'
      }, { status: 500 });
    }
    
    // REMOVIDO: Verificação de convites existentes que estava bloqueando novos convites
    // Agora vamos apenas verificar, mas permitir a criação mesmo se já houver convites
    try {
      const existingInvite = await db.collection('lobbyinvites').findOne({
        inviter: new ObjectId(userId),
        recipient: new ObjectId(recipientId),
        lobbyId: lobbyObjectId.toString(),
        status: 'pending'
      });
      
      if (existingInvite) {
        console.log('🔄 [DEBUG] API Lobby Invite POST - Convite já existe, mas permitiremos criar outro');
      }
    } catch (err) {
      console.error('⚠️ [DEBUG] API Lobby Invite POST - Erro ao verificar convites existentes:', err);
      // Continuamos mesmo com erro aqui
    }
    
    // Criar novo convite
    try {
      const newInvite = {
        inviter: new ObjectId(userId),
        recipient: new ObjectId(recipientId),
        lobbyId: lobbyObjectId.toString(),
        gameMode: gameMode || 'casual', // Valor padrão 'casual'
        status: 'pending',
        createdAt: new Date()
      };
      
      console.log('📝 [DEBUG] API Lobby Invite POST - Criando novo convite:', {
        inviter: userId,
        recipient: recipientId,
        lobbyId: lobbyObjectId.toString()
      });
      
      const result = await db.collection('lobbyinvites').insertOne(newInvite);
      
      if (!result.insertedId) {
        console.error('❌ [DEBUG] API Lobby Invite POST - Erro: Falha ao inserir convite');
        return NextResponse.json({
          status: 'error',
          error: 'Erro ao criar convite'
        }, { status: 500 });
      }
      
      console.log('✅ [DEBUG] API Lobby Invite POST - Convite criado com sucesso:', result.insertedId.toString());
      
      // Criar notificação para o destinatário
      try {
        const inviter = await db.collection('users').findOne(
          { _id: new ObjectId(userId) },
          { projection: { _id: 1, username: 1, avatar: 1 } }
        );
        
        // Garantir que o ID do recipiente está em formato string
        const recipientIdString = recipientId.toString();
        
        const notificationData = {
          userId: recipientIdString, // Sempre usar string para userId
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
        };
        
        console.log('📤 [DEBUG] API Lobby Invite POST - Criando notificação:', {
          userId: recipientIdString,
          type: 'lobby_invite',
          inviterId: userId,
          inviterName: inviter?.username || 'Unknown'
        });
        
        const notifResult = await db.collection('notifications').insertOne(notificationData);
        
        console.log('✅ [DEBUG] API Lobby Invite POST - Notificação criada com sucesso. ID:', notifResult.insertedId.toString());
      } catch (notifError) {
        console.error('❌ [DEBUG] API Lobby Invite POST - Erro ao criar notificação:', notifError);
        // Continuar mesmo se a notificação falhar
      }
      
      return NextResponse.json({
        status: 'success',
        message: 'Convite enviado com sucesso',
        invite: {
          ...newInvite,
          _id: result.insertedId
        }
      });
    } catch (createError) {
      console.error('❌ [DEBUG] API Lobby Invite POST - Erro ao criar convite:', createError);
      return NextResponse.json({
        status: 'error',
        error: 'Erro ao criar convite para lobby'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ [DEBUG] API Lobby Invite POST - Erro detalhado:', error);
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