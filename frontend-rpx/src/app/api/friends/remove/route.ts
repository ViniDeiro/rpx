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

    const { friendId } = await request.json();
    if (!friendId) {
      return NextResponse.json({ error: 'ID do amigo é necessário' }, { status: 400 });
    }

    await connectToDatabase();
    const { User } = await getModels();

    // Verifica se o amigo existe
    const friend = await User.findById(friendId);
    if (!friend) {
      return NextResponse.json({ error: 'Usuário amigo não encontrado' }, { status: 404 });
    }

    const currentUser = await User.findById(session.user.id);
    
    // Verifica se são amigos
    const areFriends = currentUser.friends.some(
      (f: any) => f.userId.toString() === friendId
    );
    
    if (!areFriends) {
      return NextResponse.json({ error: 'Este usuário não está na sua lista de amigos' }, { status: 404 });
    }

    // Remove o amigo da lista do usuário atual
    await User.findByIdAndUpdate(session.user.id, {
      $pull: { friends: { userId: friendId } }
    });

    // Remove o usuário atual da lista de amigos do amigo
    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: { userId: session.user.id } }
    });

    return NextResponse.json({ message: 'Amigo removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover amigo:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a remoção de amizade' },
      { status: 500 }
    );
  }
} 