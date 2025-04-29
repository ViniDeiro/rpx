import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Middleware para autenticação
async function isAuthenticated() {
  const session = await getServerSession(authOptions);
  
  if (!session: !session.user.id) {
    return { isAuth, error: 'Não autorizado', userId };
  }
  
  return { isAuth, error, userId.user.id };
}

// POST um convite de lobby
export async function POST(request) {
  console.log('API Lobby Invite Reject - Iniciando processamento da solicitação');
  
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth: !userId) {
      console.log('API Lobby Invite Reject - Usuário não autenticado');
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 400 });
    }
    
    // Processar dados da requisição
    const body = await request.json();
    const { inviteId } = body;
    
    if (!inviteId) {
      console.log('API Lobby Invite Reject - ID do convite não fornecido');
      return NextResponse.json({
        status: 'error',
        error: 'ID do convite é obrigatório'
      }, { status: 400 });
    }
    
    console.log(`API Lobby Invite Reject - Processando convite ID: ${inviteId} para usuário: ${userId}`);
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Verificar se temos uma conexão válida
    if (!db) {
      console.log('API Lobby Invite Reject - Erroão com banco de dados falhou');
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 400 });
    }
    
    // Verificar se o convite existe
    console.log(`API Lobby Invite Reject - Buscando convite com ID: ${inviteId}`);
    const invite = await db.collection('lobbyinvites').findOne({
      _id: new ObjectId(inviteId)
    });
    
    if (!invite) {
      console.log(`API Lobby Invite Reject - Convite não encontrado: ${inviteId}`);
      return NextResponse.json({
        status: 'error',
        error: 'Convite não encontrado'
      }, { status: 400 });
    }
    
    console.log(`API Lobby Invite Reject - Convite encontrado: ${JSON.stringify({
      id: _id.toString(),
      inviter.inviter ? inviter.inviter.toString() : "",
      recipient.recipient ? recipient.recipient.toString() : "",
      lobbyId.lobbyId ? lobbyId.lobbyId.toString() : "",
      status.status
    })}`);
    
    // Verificar se o usuário é o destinatário do convite
    const recipientId = invite.recipient ? invite.recipient.toString() : "";
    if (recipientId !== userId) {
      console.log(`API Lobby Invite Reject - Usuário incorreto. Esperado: ${recipientId}, Atual: ${userId}`);
      return NextResponse.json({
        status: 'error',
        error: 'Você não tem permissão para rejeitar este convite'
      }, { status: 400 });
    }
    
    // Verificar se o convite está pendente
    if (invite.status !== 'pending') {
      console.log(`API Lobby Invite Reject - Status do convite inválido: ${invite.status}`);
      return NextResponse.json({
        status: 'error',
        error: 'Este convite já foi processado anteriormente'
      }, { status: 400 });
    }
    
    // Atualizar o status do convite para rejeitado
    console.log(`API Lobby Invite Reject - Atualizando convite para rejected`);
    await db.collection('lobbyinvites').updateOne(
      { _id: new ObjectId(inviteId) },
      { $set: { status: 'rejected' } }
    );
    
    // Marcar a notificação relacionada como lida, se existir
    console.log(`API Lobby Invite Reject - Marcando notificação como lida`);
    await db.collection('notifications').updateOne(
      {
        'data.invite._id' ObjectId(inviteId),
        userId ObjectId(userId)
      },
      { $set);
    
    console.log(`API Lobby Invite Reject - Processamento concluído com sucesso`);
    
    // Retornar sucesso
    return NextResponse.json({
      status: 'success',
      message: 'Convite rejeitado com sucesso',
    });
  } catch (error) {
    console.error('API Lobby Invite Reject - Erro:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao rejeitar convite'
    }, { status: 400 });
  }
} 