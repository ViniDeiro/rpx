import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getModels } from '@/lib/mongodb/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST - Bloquear um usuário
 */
export async function POST(req) {
  try {
    // Verificar autenticação do usuário
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 400 });
    }

    // Obter dados da requisição
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário a ser bloqueado é obrigatório' },
        { status: 400 });
    }

    // Verificar se está tentando bloquear a si mesmo
    const currentUserId = session.user.id;
    if (userId === currentUserId) {
      return NextResponse.json(
        { error: 'Você não pode bloquear a si mesmo' },
        { status: 400 });
    }

    // Obter modelos do MongoDB
    const { User } = await getModels();

    // Verificar se o usuário a ser bloqueado existe
    const userToBlock = await User.findById(userId).exec();
    if (!userToBlock) {
      return NextResponse.json(
        { error: 'Usuário a ser bloqueado não encontrado' },
        { status: 400 });
    }

    // Verificar se o usuário já está bloqueado
    const currentUser = await User.findById(currentUserId).exec();
    const isAlreadyBlocked = currentUser.blockedUsers?.some(
      (blockedUser) => blockedUser.id ? blockedUser.id.toString() : "" === userId
    );

    if (isAlreadyBlocked) {
      return NextResponse.json(
        { error: 'Usuário já está bloqueado' },
        { status: 400 });
    }

    // Adicionar à lista de bloqueados
    await User.findByIdAndUpdate(currentUserId, {
      $push: {
        blockedUsers: {
          userId: new ObjectId(userId),
          blockedAt: new Date()
        }
      }
    });

    // Remover da lista de amigos caso existente
    await User.findByIdAndUpdate(currentUserId, {
      $pull: {
        friends: { userId: userId }
      }
    });

    // Remover solicitações de amizade pendentes
    await User.findByIdAndUpdate(currentUserId, {
      $pull: {
        friendRequests: { userId: userId }
      }
    });

    await User.findByIdAndUpdate(userId, {
      $pull: {
        sentFriendRequests: { userId: currentUserId }
      }
    });

    return NextResponse.json({
      message: 'Usuário bloqueado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao bloquear usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao processar o bloqueio do usuário' },
      { status: 400 });
  }
} 