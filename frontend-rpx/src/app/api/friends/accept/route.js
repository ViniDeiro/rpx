import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { getModels } from '@/lib/mongodb/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 400 });
    }

    const { requesterId } = await request.json();
    if (!requesterId) {
      return NextResponse.json({ error: 'ID do solicitante é necessário' }, { status: 400 });
    }

    await connectToDatabase();
    const { User } = await getModels();

    // Verifica se o solicitante existe
    const requester = await User.findById(requesterId);
    if (!requester) {
      return NextResponse.json({ error: 'Usuário solicitante não encontrado' }, { status: 400 });
    }

    const currentUser = await User.findById(session.user.id);
    
    // Verifica se existe a solicitação pendente
    const pendingRequest = currentUser.friendRequests.find(
      (request) => request.userId ? request.userId ? request.userId.toString() : "" : "" === requesterId
    );
    
    if (!pendingRequest) {
      return NextResponse.json({ error: 'Solicitação de amizade não encontrada' }, { status: 400 });
    }

    // Remove a solicitação pendente
    await User.findByIdAndUpdate(session.user.id, {
      $pull: { friendRequests: { userId: new ObjectId(requesterId) } },
      $push: { 
        friends: {
          userId: new ObjectId(requesterId),
          since: new Date()
        }
      }
    });

    // Remove dos pedidos enviados do solicitante e adiciona aos amigos
    await User.findByIdAndUpdate(requesterId, {
      $pull: { sentFriendRequests: { userId: new ObjectId(session.user.id) } },
      $push: { 
        friends: {
          userId: new ObjectId(session.user.id),
          since: new Date()
        }
      }
    });

    return NextResponse.json({ message: 'Solicitação de amizade aceita com sucesso' });
  } catch (error) {
    console.error('Erro ao aceitar solicitação de amizade:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a aceitação da amizade' },
      { status: 400 });
  }
} 