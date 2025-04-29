import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

export async function POST(request) {
  console.log('API Lobby Invite Accept - Iniciando processamento da solicitação');

  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      console.log(`API Lobby Invite Accept - Erro de autenticação: ${error}`);
      return NextResponse.json(
        { status: 'error', error: error || 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Obter o ID do convite do corpo da requisição
    const requestBody = await request.json();
    console.log('API Lobby Invite Accept - Corpo da requisição:', requestBody);
    
    // Extração de todos os identificadores possíveis
    const {
      inviteId,
      _id,
      originalId,
      dataInviteId,
      dataInvite_id,
      dataInviteInviteId,
      recipientId
    } = requestBody;
    
    // Lista de todos os IDs enviados para tentar
    const potentialIds = [
      inviteId,
      _id,
      originalId,
      dataInviteId,
      dataInvite_id,
      dataInviteInviteId
    ].filter(Boolean); // Filtrar valores nulos/undefined
    
    if (potentialIds.length === 0) {
      console.log('API Lobby Invite Accept - Erro ID de convite fornecido');
      return NextResponse.json({
        status: 'error',
        error: 'ID do convite não fornecido'
      }, { status: 400 });
    }
    
    console.log(`API Lobby Invite Accept - IDs potenciais para processamento:`, potentialIds);
    
    // Verificar o formato de cada ID e tentar converter para ObjectId
    const objectIds = potentialIds
      .map(id => {
        try {
          return new ObjectId(id);
        } catch (e) {
          console.log(`API Lobby Invite Accept - ID não é um ObjectId válido: ${id}`);
          return null;
        }
      })
      .filter((id) => id !== null); // Remover IDs inválidos e tipar corretamente
      
    console.log(`API Lobby Invite Accept - ObjectIds válidos:`, objectIds.map(id => id.toString()));
    
    const { db } = await connectToDatabase();
    
    // Verificar se temos uma conexão válida
    if (!db) {
      console.log('API Lobby Invite Accept - Erroão com banco de dados falhou');
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 400 });
    }
    
    // Buscar o convite - usamos estratégias múltiplas para maior confiabilidade
    console.log(`API Lobby Invite Accept - Buscando convite com IDs:`, objectIds.map(id => id.toString()));
    
    // Tentar buscar o convite usando diferentes estratégias
    let invite;
    try {
      // Primeiro, tentar com ObjectId
      if (objectIds.length > 0) {
        invite = await db.collection('lobbyinvites').findOne({
          _id: { $in }
        });
      }
      
      if (invite) {
        console.log(`API Lobby Invite Accept - Convite encontrado pelo ObjectId`);
      } else {
        console.log(`API Lobby Invite Accept - Convite não encontrado pelo ObjectId, tentando outras estratégias`);
        
        // Tentar buscar por ID como string em um campo personalizado (caso tenha sido salvo assim)
        if (potentialIds.length > 0) {
          invite = await db.collection('lobbyinvites').findOne({
            inviteId: { $in }
          });
        }
        
        if (invite) {
          console.log(`API Lobby Invite Accept - Convite encontrado pelo campo inviteId`);
        } else {
          // Buscar pelos campos principais e destinatário sendo o usuário atual
          console.log(`API Lobby Invite Accept - Tentando buscar convite pelo recipient (${userId})`);
          const recentInvites = await db.collection('lobbyinvites')
            .find({
              status: 'pending',
              recipient: new ObjectId(userId)
            })
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray();
            
          console.log(`API Lobby Invite Accept - Encontrados ${recentInvites.length} convites recentes pendentes para o usuário`);
          
          if (recentInvites.length > 0) {
            // Pegar o convite mais recente
            invite = recentInvites[0];
            console.log(`API Lobby Invite Accept - Usando o convite mais recente como fallback`);
          }
        }
      }
    } catch (searchError) {
      console.error(`API Lobby Invite Accept - Erro ao buscar convite:`, searchError);
    }
    
    if (!invite) {
      console.log(`API Lobby Invite Accept - Erro não encontrado após múltiplas tentativas para IDs: ${potentialIds.join(', ')}`);
      return NextResponse.json({
        status: 'error',
        error: 'Convite não encontrado'
      }, { status: 400 });
    }
    
    console.log(`API Lobby Invite Accept - Convite encontrado:`, JSON.stringify({
      id: invite._id ? invite._id.toString() : "",
      inviter: typeof invite.inviter === 'object' ? invite.inviter ? invite.inviter ? invite.inviter.toString() : "" : "" : invite.inviter,
      recipient: typeof invite.recipient === 'object' ? invite.recipient ? invite.recipient ? invite.recipient.toString() : "" : "" : invite.recipient,
      lobbyId: typeof invite.lobbyId === 'object' ? invite.lobbyId ? invite.lobbyId ? invite.lobbyId.toString() : "" : "" : invite.lobbyId,
      status: invite.status
    }, null, 2));
    
    // Garantir que os IDs estejam em formato string para comparação
    const inviterIdString = typeof invite.inviter === 'object' ? invite.inviter ? invite.inviter ? invite.inviter.toString() : "" : "" : invite.inviter;
    const recipientIdString = typeof invite.recipient === 'object' ? invite.recipient ? invite.recipient ? invite.recipient.toString() : "" : "" : invite.recipient;
    const userIdString = userId.toString();
    
    // Verificar se o usuário é o destinatário do convite
    if (recipientIdString !== userIdString) {
      console.log(`API Lobby Invite Accept - Erroário ${userId} não é o destinatário do convite`);
      console.log(`Destinatário esperado: ${recipientIdString}, Usuário atual: ${userIdString}`);
      return NextResponse.json({
        status: 'error',
        error: 'Não autorizado a aceitar este convite'
      }, { status: 400 });
    }
    
    // Verificar se o convite está pendente
    if (invite.status !== 'pending') {
      console.log(`API Lobby Invite Accept - Erro não está pendente (status: ${invite.status})`);
      return NextResponse.json({
        status: 'error',
        error: `Convite já ${invite.status === 'accepted' ? 'aceito' : 'rejeitado ou expirado'}`
      }, { status: 400 });
    }
    
    // Garantir que o lobbyId seja um ObjectId para a consulta
    let lobbyObjectId;
    try {
      lobbyObjectId = typeof invite.lobbyId === 'object' ? invite.lobbyId : new ObjectId(invite.lobbyId);
    } catch (e) {
      console.log(`API Lobby Invite Accept - Erro de lobby inválido: ${invite.lobbyId}`);
      return NextResponse.json({
        status: 'error',
        error: 'ID de lobby inválido'
      }, { status: 400 });
    }
    
    // Verificar se o lobby ainda existe
    const lobby = await db.collection('lobbies').findOne({
      _id
    });
    
    if (!lobby) {
      console.log(`API Lobby Invite Accept - Erro ${invite.lobbyId} não encontrado`);
      
      // Marcar convite como expirado
      await db.collection('lobbyinvites').updateOne(
        { _id: invite._id },
        { $set: { status: 'expired' } }
      );
      
      return NextResponse.json({
        status: 'error',
        error: 'Lobby não existe mais'
      }, { status: 400 });
    }
    
    console.log(`API Lobby Invite Accept - Lobby encontrado:`, JSON.stringify({
      id: lobby._id ? lobby._id.toString() : "",
      name: lobby.name,
      maxPlayers: lobby.maxPlayers,
      type: lobby.lobbyType
    }, null, 2));
    
    // IMPORTANTE ObjectId em vez de string para o lobbyId
    const lobbyIdForQueries = lobbyObjectId;
    
    // Verificar se o lobby tem espaço para mais jogadores
    const currentPlayers = await db.collection('lobbymembers').find({
      lobbyId: lobbyIdForQueries
    }).toArray();
    
    const maxPlayers = lobby.lobbyType === 'solo' ? 1 : lobby.lobbyType === 'duo' ? 2 : 4;
    
    if (currentPlayers.length >= maxPlayers) {
      console.log(`API Lobby Invite Accept - Erro ${lobbyObjectId.toString()} está cheio (${currentPlayers.length}/${maxPlayers})`);
      
      // Marcar convite como expirado
      await db.collection('lobbyinvites').updateOne(
        { _id: invite._id },
        { $set: { status: 'expired' } }
      );
      
      return NextResponse.json({
        status: 'error',
        error: 'Lobby está cheio'
      }, { status: 400 });
    }
    
    // Verificar se o usuário já está no lobby
    const userMember = currentPlayers.find(p => {
      const memberIdString = typeof p.userId === 'object' && p.userId ? p.userId.toString() : p.userId;
      return memberIdString === userIdString;
    });
    
    if (userMember) {
      console.log(`API Lobby Invite Accept - Usuário ${userIdString} já está no lobby ${lobbyObjectId.toString()}`);
      
      // Marcar convite como aceito
      await db.collection('lobbyinvites').updateOne(
        { _id: invite._id },
        { $set: { status: 'accepted' } }
      );
      
      return NextResponse.json({
        status: 'success',
        message: 'Você já está neste lobby',
        lobbyId: lobbyObjectId.toString()
      });
    }
    
    // Criar ObjectId do usuário para inserção
    const userObjectId = new ObjectId(userId);
    
    // Adicionar usuário ao lobby
    try {
      // Buscar dados do usuário
      const user = await db.collection('users').findOne(
        { _id: userObjectId },
        { projection: { username: 1, avatar: 1, level: 1 } }
      );
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      // Criar documento de membro do lobby
      const lobbyMember = {
        lobbyId: lobbyObjectId,  // Usar ObjectId diretamente
        userId: userObjectId,
        username: user.username,
        avatar: user.avatar,
        level: user.level || 1,
        isLeader: false,
        isReady: false,
        joinedAt: new Date()
      };
      
      // Inserir na coleção de membros
      await db.collection('lobbymembers').insertOne(lobbyMember);
      console.log(`API Lobby Invite Accept - Usuário ${userIdString} adicionado ao lobby ${lobbyObjectId.toString()}`);
      
      // Também adicionar o usuário diretamente à coleção de lobbies
      console.log(`API Lobby Invite Accept - Adicionando usuário na coleção de lobbies`);
      try {
        // Adicionar usuário à lista de membros do lobby
        await db.collection('lobbies').updateOne(
          { _id: lobbyObjectId },
          { 
            $addToSet: { members: userObjectId },
            $set: { updatedAt: new Date() }
          }
        );
        
        console.log(`API Lobby Invite Accept - Usuário adicionado com sucesso à coleção lobbies`);
      } catch (lobbyError) {
        console.error('API Lobby Invite Accept - Erro ao adicionar usuário à coleção lobbies:', lobbyError);
        // Continuar mesmo se falhar, pois o usuário já foi adicionado à coleção lobbymembers
      }
    } catch (memberError) {
      console.error('API Lobby Invite Accept - Erro ao adicionar membro ao lobby:', memberError);
      return NextResponse.json({
        status: 'error',
        error: 'Erro ao adicionar usuário ao lobby'
      }, { status: 400 });
    }
    
    // Marcar convite como aceito
    await db.collection('lobbyinvites').updateOne(
      { _id: invite._id },
      { $set: { status: 'accepted' } }
    );
    
    console.log(`API Lobby Invite Accept - Convite aceito com sucesso`);
    
    // Adicionar mensagem ao chat do lobby
    try {
      const user = await db.collection('users').findOne(
        { _id: userObjectId },
        { projection: { username: 1 } }
      );
      
      await db.collection('lobbychat').insertOne({
        lobbyId: lobbyObjectId,  // Usar ObjectId diretamente
        userId: null, // Mensagem de sistema
        username: 'Sistema',
        message: `${user?.username || 'Novo jogador'} entrou no lobby.`,
        type: 'system',
        timestamp: new Date()
      });
    } catch (chatError) {
      console.error('API Lobby Invite Accept - Erro ao adicionar mensagem ao chat:', chatError);
      // Continuar mesmo se falhar a adição da mensagem
    }
    
    // Marcar notificação como lida
    try {
      // Marcar na coleção de notificações
      await db.collection('notifications').updateOne(
        {
          'data.invite._id': invite._id,
          userId: userObjectId
        },
        { $set: { read: true } }
      );
      
      // Também atualizar qualquer notificação que use o ID do convite diretamente
      await db.collection('notifications').updateOne(
        {
          'data._id': invite._id,
          userId: userObjectId
        },
        { $set: { read: true } }
      );
    } catch (notificationError) {
      console.error('API Lobby Invite Accept - Erro ao marcar notificação como lida:', notificationError);
      // Continuar mesmo se falhar a atualização da notificação
    }
    
    console.log(`API Lobby Invite Accept - Processamento concluído com sucesso`);
    
    // Retornar sucesso com ID do lobby e URL de redirecionamento
    return NextResponse.json({
      status: 'success',
      message: 'Convite aceito com sucesso',
      lobbyId: lobbyObjectId.toString(),
      redirect: `/lobby/${lobbyObjectId.toString()}`
    });
  } catch (error) {
    console.error('API Lobby Invite Accept - Erro:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao aceitar convite: ' + (error.message || 'Erro desconhecido')
    }, { status: 400 });
  }
} 