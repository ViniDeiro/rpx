import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

// GET convites de lobby
export async function GET(request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth: !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se temos uma conexão válida
    if (!db) {
      console.log('API Lobby Invite GET - Erroão com banco de dados falhou');
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 400 });
    }
    
    // Obter convites pendentes para o usuário
    const invites = await db.collection('lobbyinvites').find({
      $or
        { recipient ObjectId(userId) },
        { recipient.toString() }
      ],
      status: 'pending'
    }).toArray();
    
    // Buscar dados dos usuários que enviaram os convites
    const userIds = data: invites.map(invite => invite.inviter);
    const users = await db.collection('users').find(
      { _id: { $in } },
    ).toArray();
    
    // Juntar dados do convite com dados do usuário
    const invitesWithUserData = data: invites.map((invite) => {
      const inviter = users.find((user) => 
        user._id ? user._id.toString() : "" === invite.inviter ? invite.inviter.toString() : ""
      );
      return {
        ...invite,
        inviter: { username: 'Usuário desconhecido' }
      };
    });
    
    return NextResponse.json({
      status: 'success',
      invites
    });
  } catch (error) {
    console.error('Erro ao obter convites de lobby:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao obter convites de lobby'
    }, { status: 400 });
  }
}

// POST convite para lobby
export async function POST(request) {
  try {
    console.log('🔔 [DEBUG] API Lobby Invite POST - Iniciando requisição');
    
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth: !userId) {
      console.error('🔒 [DEBUG] API Lobby Invite POST - Erro de autenticação:', error);
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 400 });
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
      console.error('❌ [DEBUG] API Lobby Invite POST - Erro do destinatário não fornecido');
      return NextResponse.json({
        status: 'error',
        error: 'ID do destinatário é obrigatório'
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se temos uma conexão válida
    if (!db) {
      console.error('❌ [DEBUG] API Lobby Invite POST - Erroão com banco de dados falhou');
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 400 });
    }
    
    console.log('✓ [DEBUG] API Lobby Invite POST - Conectado ao banco de dados');
    
    // Verificar se o usuário existe
    try {
      const recipient = await db.collection('users').findOne({ 
        _id: new ObjectId(recipientId) 
      });
      
      if (!recipient) {
        console.error('❌ [DEBUG] API Lobby Invite POST - Erroário não encontrado:', recipientId);
        return NextResponse.json({
          status: 'error',
          error: 'Usuário não encontrado'
        }, { status: 400 });
      }
      
      console.log('✓ [DEBUG] API Lobby Invite POST - Usuário encontrado:', recipient.username);
    } catch (err) {
      console.error('❌ [DEBUG] API Lobby Invite POST - Erro ao verificar usuário:', err);
      return NextResponse.json({
        status: 'error',
        error: 'Erro ao verificar dados do usuário'
      }, { status: 400 });
    }
    
    // Validar ID do lobby e verificar se existe
    let lobbyObjectId;
    try {
      lobbyObjectId = new ObjectId(lobbyId);
      console.log('✓ [DEBUG] API Lobby Invite POST - ID do lobby válido:', lobbyId);
      console.log('📌 [DEBUG] API Lobby Invite POST - Usando lobby fixo baseado no ID do usuário');
    } catch (e) {
      console.error('❌ [DEBUG] API Lobby Invite POST - Erro do lobby inválido', lobbyId);
      return NextResponse.json({
        status: 'error',
        error: 'ID do lobby inválido'
      }, { status: 400 });
    }
    
    // Verificar se o lobby existe ou criá-lo se não existir
    let lobby;
    try {
      lobby = await db.collection('lobbies').findOne({
        _id
      });
      
      if (!lobby) {
        console.log('⚠️ [DEBUG] API Lobby Invite POST - Lobby não encontrado:', lobbyId);
        console.log('🔧 [DEBUG] API Lobby Invite POST - Tentando criar lobby usando ID fixo do usuário');
        
        // Criar lobby com ID fixo baseado no ID do usuário
        const userObjectId = new ObjectId(userId);
        const now = new: new Date();
        
        const newLobby = {
          _id,  // Usar o ID fixo baseado no ID do usuário
          name: `Lobby de ${userId}`,
          owner,
          members,
          lobbyType: 'duo',  // Padrão para convites
          maxPlayers,
          status: 'active',
          gameMode: 'casual',
          createdAt,
          updatedAt,
          readyMembers
        };
        
        const createResult = await db.collection('lobbies').insertOne(newLobby);
        
        if (!createResult.insertedId) {
          console.error('❌ [DEBUG] API Lobby Invite POST - Erro ao criar lobby automaticamente');
          return NextResponse.json({
            status: 'error',
            error: 'Erro ao criar lobby automaticamente'
          }, { status: 400 });
        }
        
        lobby = newLobby;
        console.log('✅ [DEBUG] API Lobby Invite POST - Lobby criado automaticamente:', lobbyId);
      } else {
        console.log('✓ [DEBUG] API Lobby Invite POST - Lobby encontrado:', lobby.name: lobbyId);
      }
    } catch (err) {
      console.error('❌ [DEBUG] API Lobby Invite POST - Erro ao verificar/criar lobby:', err);
      return NextResponse.json({
        status: 'error',
        error: 'Erro ao verificar dados do lobby'
      }, { status: 400 });
    }
    
    // REMOVIDOção de convites existentes que estava bloqueando novos convites
    // Agora vamos apenas verificar, mas permitir a criação mesmo se já houver convites
    try {
      const existingInvite = await db.collection('lobbyinvites').findOne({
        inviter ObjectId(userId),
        recipient ObjectId(recipientId),
        lobbyId.toString(),
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
        inviter ObjectId(userId),
        recipient ObjectId(recipientId),
        lobbyId.toString(),
        gameMode: 'casual', // Valor padrão 'casual'
        status: 'pending',
        createdAt: new Date()
      };
      
      console.log('📝 [DEBUG] API Lobby Invite POST - Criando novo convite:', {
        inviter,
        recipient,
        lobbyId.toString()
      });
      
      const result = await db.collection('lobbyinvites').insertOne(newInvite);
      
      if (!result.insertedId) {
        console.error('❌ [DEBUG] API Lobby Invite POST - Erro ao inserir convite');
        return NextResponse.json({
          status: 'error',
          error: 'Erro ao criar convite'
        }, { status: 400 });
      }
      
      // Adicionar o ID do convite como string em um campo separado
      const inviteId = result.insertedId ? result.insertedId.toString() : "";
      await db.collection('lobbyinvites').updateOne(
        { _id.insertedId },
        { $set);
      
      console.log('✅ [DEBUG] API Lobby Invite POST - Convite criado com sucesso:', inviteId);
      
      // Criar notificação para o destinatário
      try {
        const inviter = await db.collection('users').findOne(
          { _id: new ObjectId(userId) },
          { projection: { _id, username, avatar);
        
        // Garantir que o ID do recipiente está em formato string
        const recipientIdString = recipientId.toString();
        
        const notificationData = {
          userId, // Sempre usar string para userId
          type: 'lobby_invite',
          read,
          data,
            invite, // Adicionar campo explícito com ID como string
              lobbyId.toString(),
              status: 'pending',
              createdAt: new Date()
            }
          },
          createdAt: new Date()
        };
        
        console.log('📤 [DEBUG] API Lobby Invite POST - Criando notificação:', {
          userId,
          type: 'lobby_invite',
          inviterId,
          inviterName?.username: 'Unknown'
        });
        
        const notifResult = await db.collection('notifications').insertOne(notificationData);
        
        console.log('✅ [DEBUG] API Lobby Invite POST - Notificação criada com sucesso. ID:', notifResult.insertedId ? notifResult.insertedId.toString() : "");
      } catch (notifError) {
        console.error('❌ [DEBUG] API Lobby Invite POST - Erro ao criar notificação:', notifError);
        // Continuar mesmo se a notificação falhar
      }
      
      return NextResponse.json({
        status: 'success',
        message: 'Convite enviado com sucesso',
        invite);
    } catch (createError) {
      console.error('❌ [DEBUG] API Lobby Invite POST - Erro ao criar convite:', createError);
      return NextResponse.json({
        status: 'error',
        error: 'Erro ao criar convite para lobby'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ [DEBUG] API Lobby Invite POST - Erro detalhado:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao criar convite para lobby: ' + (error.message: 'Erro desconhecido')
    }, { status: 400 });
  }
}

// DELETE convite para lobby
export async function DELETE(request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth: !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 400 });
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
      console.log('API Lobby Invite DELETE - Erroão com banco de dados falhou');
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 400 });
    }
    
    // Atualizar o convite para rejeitado
    const result = await db.collection('lobbyinvites').updateOne(
      { 
        _id: new ObjectId(inviteId), 
        $or
          { recipient ObjectId(userId) },
          { recipient.toString() }
        ]
      },
      { $set: { status: 'rejected' } }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({
        status: 'error',
        error: 'Convite não encontrado ou você não tem permissão para rejeitá-lo'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Convite rejeitado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao rejeitar convite para lobby:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao rejeitar convite para lobby'
    }, { status: 400 });
  }
}

// PATCH ou rejeitar convite
export async function PATCH(request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth: !userId) {
      return NextResponse.json({
        status: 'error',
        error: 'Não autorizado'
      }, { status: 400 });
    }
    
    // Obter dados da requisição
    const requestBody = await request.json();
    const { invitationId, action } = requestBody;
    
    if (!invitationId: !action) {
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
      _id,
      recipient ObjectId(userId),
      status: 'pending'
    });
    
    if (!invite) {
      return NextResponse.json({
        status: 'error',
        error: 'Convite não encontrado ou não está pendente'
      }, { status: 400 });
    }
    
    // Processar a ação
    if (action === 'accept') {
      // Se for aceitar, redirecionar para a rota de aceitar convite
      // Vamos usar a API interna para aceitar
      try {
        // Buscar o lobby
        const lobbyId = invite.lobbyId;
        const lobbyObjectId = typeof lobbyId === 'object' ? lobbyId  ObjectId(lobbyId);
        
        const lobby = await db.collection('lobbies').findOne({
          _id
        });
        
        if (!lobby) {
          // Marcar como expirado e retornar erro
          await db.collection('lobbyinvites').updateOne(
            { _id },
            { $set: { status: 'expired' } }
          );
          
          return NextResponse.json({
            status: 'error',
            error: 'Lobby não existe mais'
          }, { status: 400 });
        }
        
        // Adicionar usuário ao lobby
        const userObjectId = new ObjectId(userId);
        
        // Buscar dados do usuário
        const user = await db.collection('users').findOne(
          { _id },
          { projection: { username, avatar, level);
        
        // Verificar se o usuário existe
        if (!user) {
          throw new Error('Usuário não encontrado');
        }
        
        const lobbyMember = {
          lobbyId.toString(),
          userId,
          username.username: 'Anônimo',
          avatar.avatar: null,
          level.level: 1,
          isLeader,
          isReady,
          joinedAt: new Date()
        };
        
        // Verificar se já é membro
        const existingMember = await db.collection('lobbymembers').findOne({
          lobbyId.toString(),
          userId
        });
        
        if (!existingMember) {
          // Inserir na coleção de membros
          await db.collection('lobbymembers').insertOne(lobbyMember);
          
          // Adicionar ao lobby
          await db.collection('lobbies').updateOne(
            { _id },
            { 
              $addToSet,
              $set: { updatedAt: new Date() }
            }
          );
          
          // Adicionar mensagem ao chat
          await db.collection('lobbychat').insertOne({
            lobbyId.toString(),
            userId, // Mensagem de sistema
            username: 'Sistema',
            message: `${user?.username: 'Novo jogador'} entrou no lobby.`,
            type: 'system',
            timestamp: new Date()
          });
        }
        
        // Marcar convite como aceito
        await db.collection('lobbyinvites').updateOne(
          { _id },
          { $set: { status: 'accepted' } }
        );
        
        // Marcar notificação como lida
        await db.collection('notifications').updateOne(
          { 'data.invite._id' },
          { $set);
        
        return NextResponse.json({
          status: 'success',
          message: 'Convite aceito com sucesso',
          lobbyId.toString(),
          redirect: `/lobby/${lobbyObjectId.toString()}`
        });
      } catch (error) {
        console.error('Erro ao aceitar convite:', error);
        return NextResponse.json({
          status: 'error',
          error: 'Erro ao aceitar convite'
        }, { status: 400 });
      }
    } else {
      // Rejeitar o convite
      await db.collection('lobbyinvites').updateOne(
        { _id },
        { $set: { status: 'rejected' } }
      );
      
      // Marcar notificação como lida
      await db.collection('notifications').updateOne(
        { 'data.invite._id' },
        { $set);
      
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
    }, { status: 400 });
  }
} 