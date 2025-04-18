import { NextRequest, NextResponse } from 'next/server';
import { getModels } from '@/lib/mongodb/models';
import { authMiddleware } from '@/lib/auth/middleware';
import mongoose from 'mongoose';

// Definir tipos para o usuário autenticado
interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    name: string;
    email: string;
    username?: string;
  };
}

/**
 * GET - Obter detalhes de um amigo específico
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult as AuthenticatedRequest;
  const currentUserId = authenticatedReq.user.id;
  const friendId = params.userId;
  
  try {
    // Obter os modelos do MongoDB
    const { User } = await getModels();
    
    // Buscar o usuário atual
    const currentUser = await User.findById(currentUserId)
      .select('friends')
      .exec();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário é amigo
    const isFriend = currentUser.friends?.some(
      (friend: any) => friend.userId.toString() === friendId
    );
    
    if (!isFriend) {
      return NextResponse.json(
        { error: 'Este usuário não está na sua lista de amigos' },
        { status: 403 }
      );
    }
    
    // Buscar informações completas do amigo
    const friend = await User.findById(friendId)
      .select('username profile.name profile.avatar profile.bio stats status lastLogin')
      .exec();
    
    if (!friend) {
      return NextResponse.json(
        { error: 'Amigo não encontrado' },
        { status: 404 }
      );
    }
    
    // Formatar as informações para retorno
    const friendData = {
      id: friend._id,
      username: friend.username,
      name: friend.profile?.name,
      avatar: friend.profile?.avatar,
      bio: friend.profile?.bio,
      stats: friend.stats,
      status: friend.status,
      lastSeen: friend.lastLogin
    };
    
    // Retornar as informações do amigo
    return NextResponse.json(friendData);
  } catch (error) {
    console.error('Erro ao buscar informações do amigo:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar informações do amigo' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Atualizar status do amigo (como favorito, bloqueado, etc.)
 * No futuro pode ser usado para adicionar outras funcionalidades
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult as AuthenticatedRequest;
  const currentUserId = authenticatedReq.user.id;
  const friendId = params.userId;
  
  try {
    // Obter os dados da requisição
    const { action } = await req.json();
    
    if (!action) {
      return NextResponse.json(
        { error: 'Ação é obrigatória' },
        { status: 400 }
      );
    }
    
    // Validar a ação
    if (!['favorite', 'unfavorite', 'block', 'unblock'].includes(action)) {
      return NextResponse.json(
        { error: 'Ação inválida' },
        { status: 400 }
      );
    }
    
    // Obter os modelos do MongoDB
    const { User } = await getModels();
    
    // Buscar o usuário atual para verificar se são amigos
    const currentUser = await User.findById(currentUserId)
      .select('friends blockedUsers')
      .exec();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário é amigo
    const friendIndex = currentUser.friends?.findIndex(
      (friend: any) => friend.userId.toString() === friendId
    );
    
    if (friendIndex === -1 || friendIndex === undefined) {
      return NextResponse.json(
        { error: 'Este usuário não está na sua lista de amigos' },
        { status: 403 }
      );
    }
    
    // Realizar a ação solicitada
    if (action === 'favorite' || action === 'unfavorite') {
      // Atualizar o status de favorito
      const isFavorite = action === 'favorite';
      
      // Atualizar o amigo na lista
      await User.updateOne(
        { 
          _id: currentUserId,
          'friends.userId': new mongoose.Types.ObjectId(friendId)
        },
        {
          $set: { 'friends.$.isFavorite': isFavorite }
        }
      );
      
      return NextResponse.json({
        message: isFavorite
          ? 'Amigo adicionado aos favoritos'
          : 'Amigo removido dos favoritos'
      });
    } else if (action === 'block') {
      // Remover da lista de amigos
      await User.findByIdAndUpdate(
        currentUserId,
        { $pull: { friends: { userId: friendId } } }
      );
      
      // Remover da lista de amigos do outro usuário
      await User.findByIdAndUpdate(
        friendId,
        { $pull: { friends: { userId: currentUserId } } }
      );
      
      // Adicionar à lista de bloqueados
      await User.findByIdAndUpdate(
        currentUserId,
        {
          $push: {
            blockedUsers: {
              userId: new mongoose.Types.ObjectId(friendId),
              blockedAt: new Date()
            }
          }
        }
      );
      
      return NextResponse.json({
        message: 'Usuário bloqueado com sucesso'
      });
    } else if (action === 'unblock') {
      // Remover da lista de bloqueados
      await User.findByIdAndUpdate(
        currentUserId,
        { $pull: { blockedUsers: { userId: friendId } } }
      );
      
      return NextResponse.json({
        message: 'Usuário desbloqueado com sucesso'
      });
    }
    
    // Não deveria chegar aqui, mas por garantia
    return NextResponse.json(
      { error: 'Ação não implementada' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Erro ao atualizar status do amigo:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status do amigo' },
      { status: 500 }
    );
  }
} 