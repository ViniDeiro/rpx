import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { getModels } from '@/lib/mongodb/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { targetUserId } = await request.json();
    if (!targetUserId) {
      return NextResponse.json({ error: 'ID do usuário alvo é necessário' }, { status: 400 });
    }

    await connectToDatabase();
    const { User } = await getModels();

    // Verifica se o usuário alvo existe
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário alvo não encontrado' }, { status: 404 });
    }

    // Verifica se já são amigos
    const currentUser = await User.findById(session.user.id);
    const isAlreadyFriend = currentUser.friends.some((friend: any) => friend.userId.toString() === targetUserId);
    if (isAlreadyFriend) {
      return NextResponse.json({ error: 'Usuários já são amigos' }, { status: 400 });
    }

    // Verifica se já existe uma solicitação pendente
    const hasPendingRequest = targetUser.friendRequests.some(
      (request: any) => request.userId.toString() === session.user.id
    );
    if (hasPendingRequest) {
      return NextResponse.json({ error: 'Já existe uma solicitação pendente' }, { status: 400 });
    }

    // Adiciona a solicitação
    await User.findByIdAndUpdate(targetUserId, {
      $push: {
        friendRequests: {
          userId: session.user.id,
          username: session.user.username,
          avatar: session.user.image,
          requestedAt: new Date()
        }
      }
    });

    // Adiciona aos pedidos enviados do usuário atual
    await User.findByIdAndUpdate(session.user.id, {
      $push: {
        sentFriendRequests: {
          userId: targetUserId,
          username: targetUser.username,
          avatar: targetUser.image,
          requestedAt: new Date()
        }
      }
    });

    return NextResponse.json({ message: 'Solicitação de amizade enviada com sucesso' });
  } catch (error) {
    console.error('Erro ao enviar solicitação de amizade:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação de amizade' },
      { status: 500 }
    );
  }
} 