import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

export async function POST(request: Request) {
  console.log('API Lobby Invite Accept - Iniciando processamento da solicitação');

  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      console.log(`API Lobby Invite Accept - Erro de autenticação: ${error}`);
      return NextResponse.json({
        status: 'error',
        error: error || 'Não autorizado'
      }, { status: 401 });
    }
    
    // Obter o ID do convite do corpo da requisição
    const { inviteId } = await request.json();
    if (!inviteId) {
      console.log('API Lobby Invite Accept - Erro: ID do convite não fornecido');
      return NextResponse.json({
        status: 'error',
        error: 'ID do convite não fornecido'
      }, { status: 400 });
    }
    
    console.log(`API Lobby Invite Accept - Processando convite ${inviteId} para usuário ${userId}`);
    
    // Converter para ObjectId para garantir compatibilidade
    let inviteObjectId;
    try {
      inviteObjectId = new ObjectId(inviteId);
    } catch (e) {
      console.log(`API Lobby Invite Accept - Erro: ID de convite inválido: ${inviteId}`);
      return NextResponse.json({
        status: 'error',
        error: 'ID de convite inválido'
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Buscar o convite
    const invite = await db.collection('lobbyinvites').findOne({
      _id: inviteObjectId
    });
    
    if (!invite) {
      console.log(`API Lobby Invite Accept - Erro: Convite ${inviteId} não encontrado`);
      return NextResponse.json({
        status: 'error',
        error: 'Convite não encontrado'
      }, { status: 404 });
    }
    
    console.log(`API Lobby Invite Accept - Convite encontrado:`, JSON.stringify({
      _id: invite._id.toString(),
      inviter: typeof invite.inviter === 'object' ? invite.inviter.toString() : invite.inviter,
      recipient: typeof invite.recipient === 'object' ? invite.recipient.toString() : invite.recipient,
      lobbyId: typeof invite.lobbyId === 'object' ? invite.lobbyId.toString() : invite.lobbyId,
      status: invite.status
    }, null, 2));
    
    // Garantir que os IDs estejam em formato string para comparação
    const inviterIdString = typeof invite.inviter === 'object' ? invite.inviter.toString() : invite.inviter;
    const recipientIdString = typeof invite.recipient === 'object' ? invite.recipient.toString() : invite.recipient;
    const userIdString = userId.toString();
    
    // Verificar se o usuário é o destinatário do convite
    if (recipientIdString !== userIdString) {
      console.log(`API Lobby Invite Accept - Erro: Usuário ${userId} não é o destinatário do convite ${inviteId}`);
      console.log(`Destinatário esperado: ${recipientIdString}, Usuário atual: ${userIdString}`);
      return NextResponse.json({
        status: 'error',
        error: 'Não autorizado a aceitar este convite'
      }, { status: 403 });
    }
    
    // Verificar se o convite está pendente
    if (invite.status !== 'pending') {
      console.log(`API Lobby Invite Accept - Erro: Convite ${inviteId} não está pendente (status: ${invite.status})`);
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
      console.log(`API Lobby Invite Accept - Erro: ID de lobby inválido: ${invite.lobbyId}`);
      return NextResponse.json({
        status: 'error',
        error: 'ID de lobby inválido'
      }, { status: 400 });
    }
    
    // Verificar se o lobby ainda existe
    const lobby = await db.collection('lobbies').findOne({
      _id: lobbyObjectId
    });
    
    if (!lobby) {
      console.log(`API Lobby Invite Accept - Erro: Lobby ${invite.lobbyId} não encontrado`);
      
      // Marcar convite como expirado
      await db.collection('lobbyinvites').updateOne(
        { _id: inviteObjectId },
        { $set: { status: 'expired' } }
      );
      
      return NextResponse.json({
        status: 'error',
        error: 'Lobby não existe mais'
      }, { status: 404 });
    }
    
    console.log(`API Lobby Invite Accept - Lobby encontrado:`, JSON.stringify({
      _id: lobby._id.toString(),
      name: lobby.name,
      maxPlayers: lobby.maxPlayers,
      type: lobby.type
    }, null, 2));
    
    // Obter o lobbyId como string para consultas subsequentes
    const lobbyIdString = lobbyObjectId.toString();
    
    // Verificar se o lobby tem espaço para mais jogadores
    const currentPlayers = await db.collection('lobbymembers').find({
      lobbyId: lobbyIdString
    }).toArray();
    
    const maxPlayers = lobby.maxPlayers || (lobby.type === 'solo' ? 1 : lobby.type === 'duo' ? 2 : 4);
    
    if (currentPlayers.length >= maxPlayers) {
      console.log(`API Lobby Invite Accept - Erro: Lobby ${lobbyIdString} está cheio (${currentPlayers.length}/${maxPlayers})`);
      
      // Marcar convite como expirado
      await db.collection('lobbyinvites').updateOne(
        { _id: inviteObjectId },
        { $set: { status: 'expired' } }
      );
      
      return NextResponse.json({
        status: 'error',
        error: 'Lobby está cheio'
      }, { status: 400 });
    }
    
    // Verificar se o usuário já está no lobby
    const userMember = currentPlayers.find(p => {
      const memberIdString = typeof p.userId === 'object' ? p.userId.toString() : p.userId;
      return memberIdString === userIdString;
    });
    
    if (userMember) {
      console.log(`API Lobby Invite Accept - Usuário ${userIdString} já está no lobby ${lobbyIdString}`);
      
      // Marcar convite como aceito
      await db.collection('lobbyinvites').updateOne(
        { _id: inviteObjectId },
        { $set: { status: 'accepted' } }
      );
      
      return NextResponse.json({
        status: 'success',
        message: 'Você já está neste lobby',
        lobbyId: lobbyIdString
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
        lobbyId: lobbyIdString,
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
      console.log(`API Lobby Invite Accept - Usuário ${userIdString} adicionado ao lobby ${lobbyIdString}`);
    } catch (memberError) {
      console.error('API Lobby Invite Accept - Erro ao adicionar membro ao lobby:', memberError);
      return NextResponse.json({
        status: 'error',
        error: 'Erro ao adicionar usuário ao lobby'
      }, { status: 500 });
    }
    
    // Marcar convite como aceito
    await db.collection('lobbyinvites').updateOne(
      { _id: inviteObjectId },
      { $set: { status: 'accepted' } }
    );
    
    console.log(`API Lobby Invite Accept - Convite ${inviteId} aceito com sucesso`);
    
    // Adicionar mensagem ao chat do lobby
    try {
      const user = await db.collection('users').findOne(
        { _id: userObjectId },
        { projection: { username: 1 } }
      );
      
      await db.collection('lobbychat').insertOne({
        lobbyId: lobbyIdString,
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
          'data.invite._id': inviteObjectId,
          userId: userIdString
        },
        { $set: { read: true } }
      );
      
      // Também atualizar qualquer notificação que use o ID do convite diretamente
      await db.collection('notifications').updateOne(
        {
          _id: inviteObjectId,
          userId: userIdString
        },
        { $set: { read: true } }
      );
    } catch (notificationError) {
      console.error('API Lobby Invite Accept - Erro ao marcar notificação como lida:', notificationError);
      // Continuar mesmo se falhar a atualização da notificação
    }
    
    console.log(`API Lobby Invite Accept - Processamento concluído com sucesso`);
    
    // Retornar sucesso
    return NextResponse.json({
      status: 'success',
      message: 'Convite aceito com sucesso',
      lobbyId: lobbyIdString
    });
  } catch (error: any) {
    console.error('API Lobby Invite Accept - Erro:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao aceitar convite: ' + (error.message || 'Erro desconhecido')
    }, { status: 500 });
  }
} 