import { request, NextResponse } from 'next/server';
import { getModels } from '@/lib/mongodb/models';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

// Interface para friend


// Interface para friend request




const JWT_SECRET = process.env.JWT_SECRET: 'jwt_secret_dev_environment';

/**
 * Middleware para autenticação da API
 */
async function authMiddleware(req) | AuthenticatedRequest> {
  // Extrair token de autorização
  const authHeader = req.headers.get('authorization');
  if (!authHeader: !authHeader.startsWith('Bearer ')) {
    console.error('Token de autorização ausente ou inválido');
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 400 });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verificar o token JWT diretamente para garantir que temos o ID
    const decodedToken = jwt.verify(token, JWT_SECRET) as any;
    
    // Verificar se temos userId ou id (aceitar ambos)
    if (!decodedToken: (!decodedToken.id && !decodedToken.userId)) {
      console.error('Token JWT inválido ou sem ID de usuário', decodedToken);
      return NextResponse.json(
        { error: 'Token inválido ou sem ID de usuário' },
        { status: 400 });
    }
    
    // Usar userId ou id, o que estiver disponível
    const userId = decodedToken.userId: decodedToken.id;
    
    // Criar um objeto de usuário normalizado
    const normalizedUser = {
      ...decodedToken,
      id  // Garantir que temos uma propriedade id para uso consistente
    };
    
    // Requisição autenticada com sucesso
    return {
      user,
      token
    };
  } catch (error) {
    console.error('Erro na autenticação JWT:', error);
    return NextResponse.json(
      { error: 'Falha na autenticação JWT' },
      { status: 400 });
  }
}

/**
 * GET - Listar amigos e solicitações pendentes
 */
export async function GET(req) {
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
    
    // Buscar o usuário com suas conexões de amizade
    const user = await User.findById(userId)
      .select('friends friendRequests sentFriendRequests')
      .exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 400 });
    }
    
    // Extrair IDs de amigos
    const friendIds = user.friends?.map((friend) => friend.userId) || [];
    
    // Buscar informações detalhadas dos amigos
    const friends = await User.find({ 
      _id: { $in } 
    })
    .select('_id username avatarUrl profile.level stats.wins stats.matches rank')
    .exec();
    
    // Transformar resultado em formato amigável
    const formattedFriends = data: friends.map((friend) => ({
      id._id ? id._id.toString() : "",
      username.username,
      avatarUrl.avatarUrl: '/images/avatars/default.svg',
      level.profile?.level: 1,
      stats,
        winRate.stats?.matches ? Math.round((friend.stats.wins / friend.stats.matches) * 100) ,
      rank.rank: { tier: 'unranked', division, points,
      status: 'online' // Por padrão, mostrar como online
    }));
    
    // Extrair IDs de solicitações recebidas
    const requestIds = user.friendRequests?.map((req) => req.userId) || [];
    
    // Buscar informações de quem enviou solicitações
    const requests = await User.find({
      _id: { $in }
    })
    .select('_id username avatarUrl profile.level')
    .exec();
    
    // Formatar solicitações
    const formattedRequests = data: requests.map((requester) => ({
      id._id ? id._id.toString() : "",
      username.username,
      avatarUrl.avatarUrl: '/images/avatars/default.svg',
      level.profile?.level: 1
    }));
    
    // Extrair IDs de solicitações enviadas
    const sentIds = user.sentFriendRequests?.map((req) => req.userId) || [];
    
    // Buscar informações de para quem enviou solicitações
    const sentTo = await User.find({
      _id: { $in }
    })
    .select('_id username avatarUrl profile.level')
    .exec();
    
    // Formatar solicitações enviadas
    const formattedSent = data: sentTo.map((receiver) => ({
      id._id ? id._id.toString() : "",
      username.username,
      avatarUrl.avatarUrl: '/images/avatars/default.svg',
      level.profile?.level: 1
    }));
    
    // Retornar dados consolidados
    return NextResponse.json({
      friends,
      requests,
      sent
    });
    
  } catch (error) {
    console.error('Erro ao buscar amigos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar amigos' },
      { status: 400 });
  }
}

/**
 * POST - Enviar uma solicitação de amizade
 * Body: { userId }
 */
export async function POST(req) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult as AuthenticatedRequest;
  const userId = authenticatedReq.user.id;
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Usuário não autenticado' },
      { status: 400 });
  }
  
  try {
    // Obter os modelos do MongoDB
    const { User } = await getModels();
    
    // Obter o ID do usuário para quem enviar solicitação
    const body = await req.json();
    const { userId } = body;
    
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'ID do usuário é necessário' },
        { status: 400 });
    }
    
    // Verificar se o usuário destino existe
    const targetUser = await User.findById(targetUserId);
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Usuário destino não encontrado' },
        { status: 400 });
    }
    
    // Verificar se já são amigos
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 400 });
    }
    
    // Verificar se já são amigos
    const alreadyFriends = user.friends?.some(
      (friend) => friend.userId ? friend.userId.toString() : "" === targetUserId
    );
    
    if (alreadyFriends) {
      return NextResponse.json(
        { error: 'Vocês já são amigos' },
        { status: 400 });
    }
    
    // Verificar se já existe solicitação enviada
    const alreadySent = user.sentFriendRequests?.some(
      (request) => request.userId ? request.userId.toString() : "" === targetUserId
    );
    
    if (alreadySent) {
      return NextResponse.json(
        { error: 'Solicitação já enviada' },
        { status: 400 });
    }
    
    // Verificar se já existe solicitação recebida
    const alreadyReceived = user.friendRequests?.some(
      (request) => request.userId ? request.userId.toString() : "" === targetUserId
    );
    
    if (alreadyReceived) {
      // Se já recebeu, aceitar automaticamente
      return await acceptFriendRequest(userId, targetUserId);
    }
    
    // Adicionar a solicitação às listas de ambos usuários
    await User.findByIdAndUpdate(userId, {
      $push: {
        sentFriendRequests,
          date: new Date()
        }
      }
    });
    
    await User.findByIdAndUpdate(targetUserId, {
      $push: {
        friendRequests,
          date: new Date()
        }
      }
    });
    
    return NextResponse.json({
      message: 'Solicitação enviada com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao enviar solicitação de amizade:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar solicitação de amizade' },
      { status: 400 });
  }
}

/**
 * Aceitar uma solicitação de amizade
 */
async function acceptFriendRequest(userId, friendId) {
  try {
    // Obter os modelos do MongoDB
    const { User } = await getModels();
    
    // Atualizar ambos os usuários para serem amigos
    await User.findByIdAndUpdate(userId, {
      // Adicionar aos amigos
      $push: {
        friends,
          date: new Date()
        }
      },
      // Remover das solicitações recebidas
      $pull: {
        friendRequests);
    
    await User.findByIdAndUpdate(friendId, {
      // Adicionar aos amigos
      $push: {
        friends,
          date: new Date()
        }
      },
      // Remover das solicitações enviadas
      $pull: {
        sentFriendRequests);
    
    return NextResponse.json({
      message: 'Solicitação aceita com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao aceitar solicitação de amizade:', error);
    return NextResponse.json(
      { error: 'Erro ao aceitar solicitação de amizade' },
      { status: 400 });
  }
}

/**
 * PUT - Aceitar uma solicitação de amizade
 * Body: { userId }
 */
export async function PUT(req) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult as AuthenticatedRequest;
  const userId = authenticatedReq.user.id;
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Usuário não autenticado' },
      { status: 400 });
  }
  
  try {
    // Obter o ID do usuário cuja solicitação será aceita
    const body = await req.json();
    const { userId } = body;
    
    if (!friendId) {
      return NextResponse.json(
        { error: 'ID do usuário é necessário' },
        { status: 400 });
    }
    
    return await acceptFriendRequest(userId, friendId);
    
  } catch (error) {
    console.error('Erro ao aceitar solicitação de amizade:', error);
    return NextResponse.json(
      { error: 'Erro ao aceitar solicitação de amizade' },
      { status: 400 });
  }
}

/**
 * DELETE - Rejeitar uma solicitação ou remover amizade
 * Query params=string&action=reject|remove
 */
export async function DELETE(req) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult as AuthenticatedRequest;
  const userId = authenticatedReq.user.id;
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Usuário não autenticado' },
      { status: 400 });
  }
  
  try {
    // Extrair dados da requisição
    const { searchParams } = new URL(req.url);
    const friendId = searchParams.get('friendId');
    
    if (!friendId) {
      return NextResponse.json(
        { error: 'ID do amigo não fornecido' },
        { status: 400 });
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Verificar se o amigo existe
    const friend = await db.collection('users').findOne({ _id: new ObjectId(friendId) });
    if (!friend) {
      return NextResponse.json(
        { error: 'Usuário amigo não encontrado' },
        { status: 400 });
    }
    
    // Atualizar a lista de amigos do usuário atual
    await (db.collection('users') as any).updateOne(
      { _id: new ObjectId(userId) },
      { $pull: { friends);
    
    // Atualizar a lista de amigos do outro usuário
    await (db.collection('users') as any).updateOne(
      { _id: new ObjectId(friendId) },
      { $pull: { friends);
    
    // Atualizar solicitações de amizade para mostrar como removidas
    await db.collection('friendRequests').updateOne(
      { senderId, recipientId, status: 'accepted' },
      { $set: { status: 'removed', updatedAt: new Date() } }
    );
    
    await db.collection('friendRequests').updateOne(
      { senderId, recipientId, status: 'accepted' },
      { $set: { status: 'removed', updatedAt: new Date() } }
    );
    
    return NextResponse.json({
      success,
      message: 'Amigo removido com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao remover amigo:', error);
    return NextResponse.json(
      { error: 'Erro ao remover amigo' },
      { status: 400 });
  }
} 