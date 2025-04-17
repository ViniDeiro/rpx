import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Middleware para autenticação
async function isAuthenticated() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.id) {
    return { isAuth: false, error: 'Não autorizado', userId: null };
  }
  
  return { isAuth: true, error: null, userId: session.user.id };
}

// POST: Aceitar um convite
export async function POST(request: Request) {
  console.log('API Lobby Invite Accept - Iniciando processamento da solicitação');
  
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      console.log('API Lobby Invite Accept - Usuário não autenticado');
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 401 });
    }
    
    // Processar dados da requisição
    const body = await request.json();
    const { inviteId } = body;
    
    if (!inviteId) {
      console.log('API Lobby Invite Accept - ID do convite não fornecido');
      return NextResponse.json({
        status: 'error',
        error: 'ID do convite é obrigatório'
      }, { status: 400 });
    }
    
    console.log(`API Lobby Invite Accept - Processando convite ID: ${inviteId} para usuário: ${userId}`);
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Verificar se o convite existe
    console.log(`API Lobby Invite Accept - Buscando convite com ID: ${inviteId}`);
    const invite = await db.collection('lobbyinvites').findOne({
      _id: new ObjectId(inviteId)
    });
    
    if (!invite) {
      console.log(`API Lobby Invite Accept - Convite não encontrado: ${inviteId}`);
      return NextResponse.json({
        status: 'error',
        error: 'Convite não encontrado'
      }, { status: 404 });
    }
    
    console.log(`API Lobby Invite Accept - Convite encontrado: ${JSON.stringify({
      _id: invite._id.toString(),
      inviter: invite.inviter.toString(),
      recipient: invite.recipient.toString(),
      lobbyId: invite.lobbyId.toString(),
      status: invite.status
    })}`);
    
    // Verificar se o usuário é o destinatário do convite
    const recipientId = invite.recipient.toString();
    if (recipientId !== userId) {
      console.log(`API Lobby Invite Accept - Usuário incorreto. Esperado: ${recipientId}, Atual: ${userId}`);
      return NextResponse.json({
        status: 'error',
        error: 'Você não tem permissão para aceitar este convite'
      }, { status: 403 });
    }
    
    // Verificar se o convite está pendente
    if (invite.status !== 'pending') {
      console.log(`API Lobby Invite Accept - Status do convite inválido: ${invite.status}`);
      return NextResponse.json({
        status: 'error',
        error: 'Este convite já foi processado anteriormente'
      }, { status: 400 });
    }
    
    // Verificar se o lobby existe
    console.log(`API Lobby Invite Accept - Buscando lobby com ID: ${invite.lobbyId}`);
    const lobby = await db.collection('lobbies').findOne({
      _id: new ObjectId(invite.lobbyId)
    });
    
    if (!lobby) {
      console.log(`API Lobby Invite Accept - Lobby não encontrado: ${invite.lobbyId}`);
      
      // Atualizar o convite para cancelado
      await db.collection('lobbyinvites').updateOne(
        { _id: new ObjectId(inviteId) },
        { $set: { status: 'canceled' } }
      );
      
      return NextResponse.json({
        status: 'error',
        error: 'O lobby não existe mais'
      }, { status: 404 });
    }
    
    // Verificar se o lobby não está cheio
    console.log(`API Lobby Invite Accept - Verificando capacidade do lobby. Membros: ${lobby.members ? lobby.members.length : 0}, Capacidade: ${lobby.capacity || 5}`);
    if (lobby.members && lobby.capacity && lobby.members.length >= lobby.capacity) {
      // Atualizar o convite para rejected
      await db.collection('lobbyinvites').updateOne(
        { _id: new ObjectId(inviteId) },
        { $set: { status: 'rejected' } }
      );
      
      console.log(`API Lobby Invite Accept - Lobby cheio. Atualizando convite para rejected`);
      return NextResponse.json({
        status: 'error',
        error: 'O lobby está cheio'
      }, { status: 400 });
    }
    
    // Verificar se o usuário já está no lobby
    let isAlreadyMember = false;
    if (lobby.members) {
      for (const member of lobby.members) {
        if (member.toString() === userId) {
          isAlreadyMember = true;
          break;
        }
      }
    }
    
    if (isAlreadyMember) {
      console.log(`API Lobby Invite Accept - Usuário já é membro do lobby`);
      
      // Atualizar o convite para aceito mesmo assim
      await db.collection('lobbyinvites').updateOne(
        { _id: new ObjectId(inviteId) },
        { $set: { status: 'accepted' } }
      );
      
      return NextResponse.json({
        status: 'success',
        message: 'Você já é membro deste lobby',
        lobbyId: invite.lobbyId.toString()
      });
    }
    
    // Atualizar o status do convite para aceito
    console.log(`API Lobby Invite Accept - Atualizando convite para accepted`);
    await db.collection('lobbyinvites').updateOne(
      { _id: new ObjectId(inviteId) },
      { $set: { status: 'accepted' } }
    );
    
    // Adicionar o usuário ao lobby
    console.log(`API Lobby Invite Accept - Adicionando usuário ao lobby`);
    await db.collection('lobbies').updateOne(
      { _id: new ObjectId(invite.lobbyId) },
      { $addToSet: { members: new ObjectId(userId) } }
    );
    
    // Marcar a notificação relacionada como lida, se existir
    console.log(`API Lobby Invite Accept - Marcando notificação como lida`);
    await db.collection('notifications').updateOne(
      {
        'data.invite._id': new ObjectId(inviteId),
        userId: new ObjectId(userId)
      },
      { $set: { read: true } }
    );
    
    console.log(`API Lobby Invite Accept - Processamento concluído com sucesso`);
    
    // Retornar sucesso
    return NextResponse.json({
      status: 'success',
      message: 'Convite aceito com sucesso',
      lobbyId: invite.lobbyId.toString()
    });
  } catch (error: any) {
    console.error('API Lobby Invite Accept - Erro:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao aceitar convite'
    }, { status: 500 });
  }
} 