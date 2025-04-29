import { request, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

export async function POST(
  request,
  { params }) {
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    if (!isAuth || !userId) {
      return NextResponse.json(
        { status: 'error', error: error || 'Não autorizado' },
        { status: 400 });
    }

    // Obter ID do lobby
    const lobbyId = params.id;
    
    if (!lobbyId) {
      return NextResponse.json(
        { status: 'error', error: 'ID do lobby não fornecido' },
        { status: 400 });
    }

    // Obter dados do body
    const body = await request.json();
    const isReady = body.isReady === true;

    console.log(`Usuário ${userId} alterando status para ${isReady ? 'pronto' : 'não pronto'} no lobby ${lobbyId}`);

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Verificar se o ID tem um formato válido para o MongoDB
    let lobbyObjectId;
    try {
      lobbyObjectId = new ObjectId(lobbyId);
    } catch (error) {
      return NextResponse.json(
        { status: 'error', error: 'ID de lobby inválido' },
        { status: 400 });
    }

    // Buscar o lobby
    const lobby = await db.collection('lobbies').findOne({
      _id: lobbyObjectId
    });

    if (!lobby) {
      return NextResponse.json(
        { status: 'error', error: 'Lobby não encontrado' },
        { status: 400 });
    }

    // Verificar se o usuário é membro do lobby
    const isMember = lobby.members.some((memberId) => 
      memberId.toString() === userId.toString()
    );
    
    if (!isMember) {
      return NextResponse.json(
        { status: 'error', error: 'Você não é membro deste lobby' },
        { status: 400 });
    }

    // Atualizar status de pronto
    if (isReady) {
      // Adicionar usuário à lista de prontos se ainda não estiver
      await db.collection('lobbies').updateOne(
        { 
          _id: lobbyObjectId,
          readyMembers: { $nin: [new ObjectId(userId)] }
        },
        { 
          $push: { readyMembers: new ObjectId(userId) },
          $set: { updatedAt: new Date() }
        }
      );
    } else {
      // Remover usuário da lista de prontos
      await db.collection('lobbies').updateOne(
        { _id: lobbyObjectId },
        { 
          $pull: { readyMembers: new ObjectId(userId) },
          $set: { updatedAt: new Date() }
        }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: isReady ? 'Marcado como pronto' : 'Marcado como não pronto'
    });
    
  } catch (error) {
    console.error('Erro ao alterar status de pronto:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro interno do servidor' },
      { status: 400 });
  }
} 