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

// Interface para friend
interface Friend {
  userId: mongoose.Types.ObjectId;
  username: string;
  avatar?: string;
  status: string;
  since: Date;
}

// Interface para friend request
interface FriendRequest {
  userId: mongoose.Types.ObjectId;
  username: string;
  avatar?: string;
  requestDate: Date;
}

/**
 * GET - Obter lista de amigos e solicitações pendentes
 */
export async function GET(req: NextRequest) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult as AuthenticatedRequest;
  const userId = authenticatedReq.user.id;
  
  try {
    // Obter os modelos do MongoDB
    const { User } = await getModels();
    
    // Buscar o usuário com seus amigos e solicitações
    const user = await User.findById(userId)
      .select('friends friendRequests sentFriendRequests')
      .exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Retornar a lista de amigos e solicitações
    return NextResponse.json({
      friends: user.friends || [],
      receivedRequests: user.friendRequests || [],
      sentRequests: user.sentFriendRequests || []
    });
  } catch (error) {
    console.error('Erro ao buscar amigos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar amigos' },
      { status: 500 }
    );
  }
}

/**
 * POST - Enviar solicitação de amizade
 * Body: { username: string }
 */
export async function POST(req: NextRequest) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult as AuthenticatedRequest;
  const userId = authenticatedReq.user.id;
  
  try {
    // Obter os dados da requisição
    const { username } = await req.json();
    
    if (!username) {
      return NextResponse.json(
        { error: 'Nome de usuário é obrigatório' },
        { status: 400 }
      );
    }
    
    // Obter os modelos do MongoDB
    const { User } = await getModels();
    
    // Buscar o usuário que está enviando a solicitação
    const currentUser = await User.findById(userId).exec();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuário atual não encontrado' },
        { status: 404 }
      );
    }
    
    // Buscar o usuário alvo da solicitação
    const targetUser = await User.findOne({ username: username }).exec();
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Usuário alvo não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário está tentando adicionar a si mesmo
    if (userId === targetUser._id.toString()) {
      return NextResponse.json(
        { error: 'Você não pode enviar solicitação de amizade para si mesmo' },
        { status: 400 }
      );
    }
    
    // Verificar se já são amigos
    const alreadyFriends = currentUser.friends?.some(
      (friend: Friend) => friend.userId.toString() === targetUser._id.toString()
    );
    
    if (alreadyFriends) {
      return NextResponse.json(
        { error: 'Vocês já são amigos' },
        { status: 400 }
      );
    }
    
    // Verificar se já existe uma solicitação pendente enviada
    const alreadySent = currentUser.sentFriendRequests?.some(
      (request: FriendRequest) => request.userId.toString() === targetUser._id.toString()
    );
    
    if (alreadySent) {
      return NextResponse.json(
        { error: 'Você já enviou uma solicitação para este usuário' },
        { status: 400 }
      );
    }
    
    // Verificar se já existe uma solicitação pendente recebida (caso em que podem aceitar diretamente)
    const existingRequest = currentUser.friendRequests?.some(
      (request: FriendRequest) => request.userId.toString() === targetUser._id.toString()
    );
    
    if (existingRequest) {
      return NextResponse.json(
        { 
          message: 'Este usuário já enviou uma solicitação para você',
          action: 'accept'
        },
        { status: 200 }
      );
    }
    
    // Adicionar solicitação à lista de solicitações enviadas do usuário atual
    await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          sentFriendRequests: {
            userId: targetUser._id,
            username: targetUser.username,
            requestDate: new Date()
          }
        }
      }
    );
    
    // Adicionar solicitação à lista de solicitações recebidas do usuário alvo
    await User.findByIdAndUpdate(
      targetUser._id,
      {
        $push: {
          friendRequests: {
            userId: new mongoose.Types.ObjectId(userId),
            username: currentUser.username,
            avatar: currentUser.profile?.avatar,
            requestDate: new Date()
          }
        }
      }
    );
    
    // Retornar sucesso
    return NextResponse.json({
      message: 'Solicitação de amizade enviada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao enviar solicitação de amizade:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar solicitação de amizade' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Aceitar uma solicitação de amizade
 * Body: { requestId: string }
 */
export async function PATCH(req: NextRequest) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult as AuthenticatedRequest;
  const userId = authenticatedReq.user.id;
  
  try {
    // Obter os dados da requisição
    const { requesterId } = await req.json();
    
    if (!requesterId) {
      return NextResponse.json(
        { error: 'ID do solicitante é obrigatório' },
        { status: 400 }
      );
    }
    
    // Obter os modelos do MongoDB
    const { User } = await getModels();
    
    // Buscar o usuário atual
    const currentUser = await User.findById(userId).exec();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se a solicitação existe
    const requestIndex = currentUser.friendRequests?.findIndex(
      (request: FriendRequest) => request.userId.toString() === requesterId
    );
    
    if (requestIndex === -1 || requestIndex === undefined) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      );
    }
    
    // Buscar o usuário que enviou a solicitação
    const requesterUser = await User.findById(requesterId).exec();
    
    if (!requesterUser) {
      return NextResponse.json(
        { error: 'Usuário solicitante não encontrado' },
        { status: 404 }
      );
    }
    
    // Obter a solicitação
    const request = currentUser.friendRequests[requestIndex];
    
    // Remover a solicitação da lista de solicitações recebidas
    await User.findByIdAndUpdate(
      userId,
      { $pull: { friendRequests: { userId: requesterId } } }
    );
    
    // Remover da lista de solicitações enviadas do solicitante
    await User.findByIdAndUpdate(
      requesterId,
      { $pull: { sentFriendRequests: { userId: userId } } }
    );
    
    // Adicionar à lista de amigos do usuário atual
    await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          friends: {
            userId: requesterUser._id,
            username: requesterUser.username,
            avatar: requesterUser.profile?.avatar,
            status: 'offline',
            since: new Date()
          }
        }
      }
    );
    
    // Adicionar à lista de amigos do solicitante
    await User.findByIdAndUpdate(
      requesterId,
      {
        $push: {
          friends: {
            userId: new mongoose.Types.ObjectId(userId),
            username: currentUser.username,
            avatar: currentUser.profile?.avatar,
            status: 'offline',
            since: new Date()
          }
        }
      }
    );
    
    // Retornar sucesso
    return NextResponse.json({
      message: 'Solicitação de amizade aceita com sucesso'
    });
  } catch (error) {
    console.error('Erro ao aceitar solicitação de amizade:', error);
    return NextResponse.json(
      { error: 'Erro ao aceitar solicitação de amizade' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Rejeitar solicitação ou remover amigo
 * Query: ?type=request&id=requesterId - Rejeitar solicitação
 * Query: ?type=friend&id=friendId - Remover amigo
 */
export async function DELETE(req: NextRequest) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult as AuthenticatedRequest;
  const userId = authenticatedReq.user.id;
  
  try {
    // Obter parâmetros da URL
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const id = url.searchParams.get('id');
    
    if (!type || !id) {
      return NextResponse.json(
        { error: 'Tipo e ID são obrigatórios' },
        { status: 400 }
      );
    }
    
    if (type !== 'request' && type !== 'friend') {
      return NextResponse.json(
        { error: 'Tipo inválido. Use "request" ou "friend"' },
        { status: 400 }
      );
    }
    
    // Obter os modelos do MongoDB
    const { User } = await getModels();
    
    if (type === 'request') {
      // Rejeitar solicitação
      
      // Remover a solicitação da lista de solicitações recebidas
      await User.findByIdAndUpdate(
        userId,
        { $pull: { friendRequests: { userId: id } } }
      );
      
      // Remover da lista de solicitações enviadas do solicitante
      await User.findByIdAndUpdate(
        id,
        { $pull: { sentFriendRequests: { userId: userId } } }
      );
      
      return NextResponse.json({
        message: 'Solicitação de amizade rejeitada com sucesso'
      });
    } else {
      // Remover amigo
      
      // Remover da lista de amigos do usuário atual
      await User.findByIdAndUpdate(
        userId,
        { $pull: { friends: { userId: id } } }
      );
      
      // Remover da lista de amigos do outro usuário
      await User.findByIdAndUpdate(
        id,
        { $pull: { friends: { userId: userId } } }
      );
      
      return NextResponse.json({
        message: 'Amigo removido com sucesso'
      });
    }
  } catch (error) {
    console.error('Erro ao rejeitar solicitação ou remover amigo:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a operação' },
      { status: 500 }
    );
  }
} 