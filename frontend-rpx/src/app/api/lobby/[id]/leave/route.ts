import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    if (!isAuth || !userId) {
      return NextResponse.json(
        { status: 'error', error: error || 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter ID do lobby
    const lobbyId = params.id;
    
    if (!lobbyId) {
      return NextResponse.json(
        { status: 'error', error: 'ID do lobby não fornecido' },
        { status: 400 }
      );
    }

    console.log(`Usuário ${userId} saindo do lobby ${lobbyId}`);

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Verificar se o ID tem um formato válido para o MongoDB
    let lobbyObjectId;
    try {
      lobbyObjectId = new ObjectId(lobbyId);
    } catch (error) {
      return NextResponse.json(
        { status: 'error', error: 'ID de lobby inválido' },
        { status: 400 }
      );
    }

    // Buscar o lobby
    const lobby = await db.collection('lobbies').findOne({
      _id: lobbyObjectId
    });

    if (!lobby) {
      return NextResponse.json(
        { status: 'error', error: 'Lobby não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário é membro do lobby
    const isMember = lobby.members.some((memberId: ObjectId | string) => 
      memberId.toString() === userId.toString()
    );
    
    if (!isMember) {
      return NextResponse.json(
        { status: 'error', error: 'Você não é membro deste lobby' },
        { status: 403 }
      );
    }

    const isOwner = lobby.owner.toString() === userId.toString();

    if (isOwner) {
      // Se o usuário é o dono, fechar o lobby
      await db.collection('lobbies').updateOne(
        { _id: lobbyObjectId },
        { 
          $set: { 
            status: 'closed',
            updatedAt: new Date()
          }
        }
      );

      return NextResponse.json({
        status: 'success',
        message: 'Lobby fechado com sucesso',
        closed: true
      });
    } else {
      // Se não for o dono, remover o usuário do lobby
      await db.collection('lobbies').updateOne(
        { _id: lobbyObjectId },
        { 
          $pull: { 
            members: new ObjectId(userId),
            readyMembers: new ObjectId(userId)
          },
          $set: { updatedAt: new Date() }
        }
      );

      return NextResponse.json({
        status: 'success',
        message: 'Saiu do lobby com sucesso'
      });
    }
    
  } catch (error: any) {
    console.error('Erro ao sair do lobby:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 