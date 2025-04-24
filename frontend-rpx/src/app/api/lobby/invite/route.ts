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
    let { recipientId, lobbyId, gameMode } = body;
    
    // Se lobbyId não for fornecido, assume que é o ID do usuário que está enviando o convite
    if (!lobbyId) {
      lobbyId = userId;
      console.log('🔄 [DEBUG] API Lobby Invite POST - ID do lobby não fornecido, usando ID do usuário como lobby:', lobbyId);
    }
    
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
      console.log('📌 [DEBUG] API Lobby Invite POST - Usando lobby fixo baseado no ID do usuário');
    } catch (e) {
      console.error('❌ [DEBUG] API Lobby Invite POST - Erro: ID do lobby inválido', lobbyId);
      return NextResponse.json({
        status: 'error',
        error: 'ID do lobby inválido'
      }, { status: 400 });
    }
    
    // Verificar se o lobby existe ou criá-lo se não existir
    let lobby;
    try {
      lobby = await db.collection('lobbies').findOne({
        _id: lobbyObjectId
      });
      
      if (!lobby) {
        console.log('⚠️ [DEBUG] API Lobby Invite POST - Lobby não encontrado:', lobbyId);
        console.log('🔧 [DEBUG] API Lobby Invite POST - Tentando criar lobby usando ID fixo do usuário');
        
        // Criar lobby com ID fixo baseado no ID do usuário
        const userObjectId = new ObjectId(userId);
        const now = new Date();
        
        const newLobby = {
          _id: lobbyObjectId,  // Usar o ID fixo baseado no ID do usuário
          name: `Lobby de ${userId}`,
          owner: userObjectId,
          members: [userObjectId],
          lobbyType: 'duo',  // Padrão para convites
          maxPlayers: 2,
          status: 'active',
          gameMode: gameMode || 'casual',
          createdAt: now,
          updatedAt: now,
          readyMembers: []
        };
        
        const createResult = await db.collection('lobbies').insertOne(newLobby);
        
        if (!createResult.insertedId) {
          console.error('❌ [DEBUG] API Lobby Invite POST - Erro: Falha ao criar lobby automaticamente');
          return NextResponse.json({
            status: 'error',
            error: 'Erro ao criar lobby automaticamente'
          }, { status: 500 });
        }
        
        lobby = newLobby;
        console.log('✅ [DEBUG] API Lobby Invite POST - Lobby criado automaticamente:', lobbyId);
      } else {
        console.log('✓ [DEBUG] API Lobby Invite POST - Lobby encontrado:', lobby.name || lobbyId);
      }
    } catch (err) {
      console.error('❌ [DEBUG] API Lobby Invite POST - Erro ao verificar/criar lobby:', err);
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
      
      // Adicionar o ID do convite como string em um campo separado
      const inviteId = result.insertedId.toString();
      await db.collection('lobbyinvites').updateOne(
        { _id: result.insertedId },
        { $set: { inviteId: inviteId } }
      );
      
      console.log('✅ [DEBUG] API Lobby Invite POST - Convite criado com sucesso:', inviteId);
      
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
              inviteId: inviteId, // Adicionar campo explícito com ID como string
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

// PATCH: Aceitar ou rejeitar convite
export async function PATCH(request: Request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error: error || 'Não autorizado'
      }, { status: 401 });
    }
    
    // Obter dados da requisição
    const requestBody = await request.json();
    const { invitationId, action } = requestBody;
    
    if (!invitationId || !action) {
      return NextResponse.json({
        status: 'error',
        error: 'ID do convite e ação são obrigatórios'
      }, { status: 400 });
    }
    
    // Verificar se a ação é válida
    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json({
        status: 'error',
        error: 'Ação inválida. Use "accept" ou "reject"'
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se o convite existe
    let objectId;
    try {
      objectId = new ObjectId(invitationId);
    } catch (e) {
      return NextResponse.json({
        status: 'error',
        error: 'ID de convite inválido'
      }, { status: 400 });
    }
    
    const invite = await db.collection('lobbyinvites').findOne({
      _id: objectId,
      recipient: new ObjectId(userId),
      status: 'pending'
    });
    
    if (!invite) {
      return NextResponse.json({
        status: 'error',
        error: 'Convite não encontrado ou não está pendente'
      }, { status: 404 });
    }
    
    // Processar a ação
    if (action === 'accept') {
      // Se for aceitar, redirecionar para a rota de aceitar convite
      // Vamos usar a API interna para aceitar
      try {
        // Buscar o lobby
        const lobbyId = invite.lobbyId;
        const lobbyObjectId = typeof lobbyId === 'object' ? lobbyId : new ObjectId(lobbyId);
        
        const lobby = await db.collection('lobbies').findOne({
          _id: lobbyObjectId
        });
        
        if (!lobby) {
          // Marcar como expirado e retornar erro
          await db.collection('lobbyinvites').updateOne(
            { _id: objectId },
            { $set: { status: 'expired' } }
          );
          
          return NextResponse.json({
            status: 'error',
            error: 'Lobby não existe mais'
          }, { status: 404 });
        }
        
        // Adicionar usuário ao lobby
        const userObjectId = new ObjectId(userId);
        
        // Buscar dados do usuário
        const user = await db.collection('users').findOne(
          { _id: userObjectId },
          { projection: { username: 1, avatar: 1, level: 1 } }
        );
        
        // Verificar se o usuário existe
        if (!user) {
          throw new Error('Usuário não encontrado');
        }
        
        const lobbyMember = {
          lobbyId: lobbyObjectId.toString(),
          userId: userObjectId,
          username: user.username || 'Anônimo',
          avatar: user.avatar || null,
          level: user.level || 1,
          isLeader: false,
          isReady: false,
          joinedAt: new Date()
        };
        
        // Verificar se já é membro
        const existingMember = await db.collection('lobbymembers').findOne({
          lobbyId: lobbyObjectId.toString(),
          userId: userObjectId
        });
        
        if (!existingMember) {
          // Inserir na coleção de membros
          await db.collection('lobbymembers').insertOne(lobbyMember);
          
          // Adicionar ao lobby
          await db.collection('lobbies').updateOne(
            { _id: lobbyObjectId },
            { 
              $addToSet: { members: userObjectId },
              $set: { updatedAt: new Date() }
            }
          );
          
          // Adicionar mensagem ao chat
          await db.collection('lobbychat').insertOne({
            lobbyId: lobbyObjectId.toString(),
            userId: null, // Mensagem de sistema
            username: 'Sistema',
            message: `${user?.username || 'Novo jogador'} entrou no lobby.`,
            type: 'system',
            timestamp: new Date()
          });
        }
        
        // Marcar convite como aceito
        await db.collection('lobbyinvites').updateOne(
          { _id: objectId },
          { $set: { status: 'accepted' } }
        );
        
        // Marcar notificação como lida
        await db.collection('notifications').updateOne(
          { 'data.invite._id': objectId },
          { $set: { read: true } }
        );
        
        return NextResponse.json({
          status: 'success',
          message: 'Convite aceito com sucesso',
          lobbyId: lobbyObjectId.toString(),
          redirect: `/lobby/${lobbyObjectId.toString()}`
        });
      } catch (error) {
        console.error('Erro ao aceitar convite:', error);
        return NextResponse.json({
          status: 'error',
          error: 'Erro ao aceitar convite'
        }, { status: 500 });
      }
    } else {
      // Rejeitar o convite
      await db.collection('lobbyinvites').updateOne(
        { _id: objectId },
        { $set: { status: 'rejected' } }
      );
      
      // Marcar notificação como lida
      await db.collection('notifications').updateOne(
        { 'data.invite._id': objectId },
        { $set: { read: true } }
      );
      
      return NextResponse.json({
        status: 'success',
        message: 'Convite rejeitado com sucesso'
      });
    }
  } catch (error) {
    console.error('Erro ao processar convite:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao processar convite'
    }, { status: 500 });
  }
} 