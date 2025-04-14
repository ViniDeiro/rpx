import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { User } from '@/lib/mongodb/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { requesterId } = await request.json();
    if (!requesterId) {
      return NextResponse.json({ error: 'ID do solicitante é necessário' }, { status: 400 });
    }

    await connectToDatabase();

    // Verifica se o solicitante existe
    const requester = await User.findById(requesterId);
    if (!requester) {
      return NextResponse.json({ error: 'Usuário solicitante não encontrado' }, { status: 404 });
    }

    const currentUser = await User.findById(session.user.id);
    
    // Verifica se existe a solicitação pendente
    const pendingRequest = currentUser.friendRequests.find(
      (request: any) => request.userId.toString() === requesterId
    );
    
    if (!pendingRequest) {
      return NextResponse.json({ error: 'Solicitação de amizade não encontrada' }, { status: 404 });
    }

    // Remove a solicitação pendente do usuário atual
    await User.findByIdAndUpdate(session.user.id, {
      $pull: { friendRequests: { userId: requesterId } }
    });

    // Remove dos pedidos enviados do solicitante
    await User.findByIdAndUpdate(requesterId, {
      $pull: { sentFriendRequests: { userId: session.user.id } }
    });

    return NextResponse.json({ message: 'Solicitação de amizade rejeitada com sucesso' });
  } catch (error) {
    console.error('Erro ao rejeitar solicitação de amizade:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a rejeição da amizade' },
      { status: 500 }
    );
  }
} 