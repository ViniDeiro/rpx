import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getModels } from '@/lib/mongodb/models';

// Parse os headers da requisição para obter o token de autenticação
const getAuthToken = (req) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

// Segredo para o JWT (idealmente deve vir de variáveis de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_dev_environment';

/**
 * Middleware para autenticação da API
 */
async function authMiddleware(req) {
  // Extrair token de autorização
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Token de autorização ausente ou inválido');
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 400 });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verificar o token JWT diretamente para garantir que temos o ID
    const decodedToken = jwt.verify(token, JWT_SECRET);
    
    // Verificar se temos userId ou id (aceitar ambos)
    if (!decodedToken || (!decodedToken.id && !decodedToken.userId)) {
      console.error('Token JWT inválido ou sem ID de usuário', decodedToken);
      return NextResponse.json(
        { error: 'Token inválido ou sem ID de usuário' },
        { status: 400 });
    }
    
    // Usar userId ou id, o que estiver disponível
    const userId = decodedToken.userId || decodedToken.id;
    
    // Criar um objeto de usuário normalizado
    const user = {
      ...decodedToken,
      id: userId  // Garantir que temos uma propriedade id para uso consistente
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
  const authenticatedReq = authResult;
  const userId = authenticatedReq.user.id;
  
  try {
    // Obter os modelos do MongoDB
    const { User } = await getModels();
    
    // Buscar o usuário atual com a lista de amigos
    const user = await User.findById(userId)
      .select('friends friendRequests sentFriendRequests')
      .exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 });
    }
    
    // Extrair IDs de amigos
    const friendIds = user.friends?.map((friend) => friend.userId) || [];
    
    // Buscar informações detalhadas dos amigos
    const friends = await User.find({
      _id: { $in: friendIds }
    })
    .select('_id username avatarUrl profile.level stats rank')
    .exec();
    
    // Transformar resultado em formato amigável
    const formattedFriends = friends.map((friend) => ({
      id: friend._id ? friend._id.toString() : "",
      username: friend.username,
      avatarUrl: friend.avatarUrl || '/images/avatars/default.svg',
      level: friend.profile?.level || 1,
      stats: friend.stats || {},
      winRate: friend.stats?.matches ? Math.round((friend.stats.wins / friend.stats.matches) * 100) : 0,
      rank: friend.rank || { tier: 'unranked', division: 0, points: 0 },
      status: 'online' // Por padrão, mostrar como online
    }));
    
    // Extrair IDs de solicitações recebidas
    const requestIds = user.friendRequests?.map((req) => req.userId) || [];
    
    // Buscar informações dos usuários que enviaram solicitações
    const requests = await User.find({
      _id: { $in: requestIds }
    })
    .select('_id username avatarUrl profile.level')
    .exec();
    
    // Formatar solicitações
    const formattedRequests = requests.map((requester) => ({
      id: requester._id ? requester._id.toString() : "",
      username: requester.username,
      avatarUrl: requester.avatarUrl || '/images/avatars/default.svg',
      level: requester.profile?.level || 1
    }));
    
    // Extrair IDs de solicitações enviadas
    const sentIds = user.sentFriendRequests?.map((req) => req.userId) || [];
    
    // Buscar informações dos usuários que receberam solicitações
    const sentTo = await User.find({
      _id: { $in: sentIds }
    })
    .select('_id username avatarUrl profile.level')
    .exec();
    
    // Formatar solicitações enviadas
    const formattedSent = sentTo.map((receiver) => ({
      id: receiver._id ? receiver._id.toString() : "",
      username: receiver.username,
      avatarUrl: receiver.avatarUrl || '/images/avatars/default.svg',
      level: receiver.profile?.level || 1
    }));
    
    // Retornar dados consolidados
    return NextResponse.json({
      friends: formattedFriends,
      requests: formattedRequests,
      sent: formattedSent,
      total: formattedFriends.length
    });
  } catch (error) {
    console.error('Erro ao listar amigos:', error);
    return NextResponse.json(
      { error: 'Erro ao listar amigos' },
      { status: 500 });
  }
}

/**
 * POST - Enviar solicitação de amizade
 */
export async function POST(req) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult;
  const userId = authenticatedReq.user.id;
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Usuário não autenticado' },
      { status: 401 });
  }
  
  try {
    // Obter os dados da requisição
    const { targetUserId } = await req.json();
    
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'ID do usuário alvo é obrigatório' },
        { status: 400 });
    }
    
    // Verificar se está enviando solicitação para si mesmo
    if (targetUserId === userId) {
      return NextResponse.json(
        { error: 'Não é possível enviar solicitação para si mesmo' },
        { status: 400 });
    }
    
    // Obter os modelos do MongoDB
    const { User } = await getModels();
    
    // Verificar se o usuário alvo existe
    const targetUser = await User.findById(targetUserId);
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Usuário alvo não encontrado' },
        { status: 404 });
    }
    
    // Verificar se já são amigos
    const currentUser = await User.findById(userId);
    
    const alreadyFriends = currentUser.friends?.some(
      (friend) => friend.userId ? friend.userId.toString() : "" === targetUserId
    );
    
    if (alreadyFriends) {
      return NextResponse.json(
        { error: 'Vocês já são amigos' },
        { status: 400 });
    }
    
    // Verificar se já enviou solicitação
    const alreadySent = currentUser.sentFriendRequests?.some(
      (request) => request.userId ? request.userId.toString() : "" === targetUserId
    );
    
    if (alreadySent) {
      return NextResponse.json(
        { error: 'Você já enviou uma solicitação para este usuário' },
        { status: 400 });
    }
    
    // Verificar se já recebeu solicitação
    const alreadyReceived = currentUser.friendRequests?.some(
      (request) => request.userId ? request.userId.toString() : "" === targetUserId
    );
    
    if (alreadyReceived) {
      // Se já recebeu, aceitar automaticamente
      return await acceptFriendRequest(userId, targetUserId);
    }
    
    // Adicionar a solicitação às listas de ambos usuários
    await User.findByIdAndUpdate(userId, {
      $push: {
        sentFriendRequests: {
          userId: targetUserId,
          date: new Date()
        }
      }
    });
    
    await User.findByIdAndUpdate(targetUserId, {
      $push: {
        friendRequests: {
          userId: userId,
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
        friends: {
          userId: friendId,
          date: new Date()
        }
      },
      // Remover das solicitações recebidas
      $pull: {
        friendRequests: { userId: friendId }
      }
    });
    
    await User.findByIdAndUpdate(friendId, {
      // Adicionar aos amigos
      $push: {
        friends: {
          userId: userId,
          date: new Date()
        }
      },
      // Remover das solicitações enviadas
      $pull: {
        sentFriendRequests: { userId: userId }
      }
    });
    
    return NextResponse.json({
      message: 'Solicitação aceita com sucesso'
    });
  } catch (error) {
    console.error('Erro ao aceitar solicitação de amizade:', error);
    return NextResponse.json(
      { error: 'Erro ao aceitar solicitação de amizade' },
      { status: 500 });
  }
}

/**
 * PUT - Aceitar solicitação de amizade
 */
export async function PUT(req) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult;
  const userId = authenticatedReq.user.id;
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Usuário não autenticado' },
      { status: 401 });
  }
  
  try {
    // Obter o ID do amigo a aceitar a solicitação
    const { friendId } = await req.json();
    
    if (!friendId) {
      return NextResponse.json(
        { error: 'ID do amigo é obrigatório' },
        { status: 400 });
    }
    
    return await acceptFriendRequest(userId, friendId);
    
  } catch (error) {
    console.error('Erro ao aceitar solicitação de amizade:', error);
    return NextResponse.json(
      { error: 'Erro ao aceitar solicitação de amizade' },
      { status: 500 });
  }
}

/**
 * DELETE - Remover amigo
 */
export async function DELETE(req) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult;
  const userId = authenticatedReq.user.id;
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Usuário não autenticado' },
      { status: 401 });
  }
  
  try {
    // Obter o ID do amigo a remover
    const { friendId } = await req.json();
    
    if (!friendId) {
      return NextResponse.json(
        { error: 'ID do amigo é obrigatório' },
        { status: 400 });
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Verificar se o amigo existe
    const friend = await db.collection('users').findOne({ _id: new ObjectId(friendId) });
    if (!friend) {
      return NextResponse.json(
        { error: 'Usuário amigo não encontrado' },
        { status: 404 });
    }
    
    // Atualizar a lista de amigos do usuário atual
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $pull: { friends: { userId: friendId } } }
    );
    
    // Atualizar a lista de amigos do outro usuário
    await db.collection('users').updateOne(
      { _id: new ObjectId(friendId) },
      { $pull: { friends: { userId: userId } } }
    );
    
    // Atualizar solicitações de amizade para mostrar como removidas
    await db.collection('friendRequests').updateOne(
      { senderId: userId, recipientId: friendId, status: 'accepted' },
      { $set: { status: 'removed', updatedAt: new Date() } }
    );
    
    await db.collection('friendRequests').updateOne(
      { senderId: friendId, recipientId: userId, status: 'accepted' },
      { $set: { status: 'removed', updatedAt: new Date() } }
    );
    
    return NextResponse.json({
      message: 'Amigo removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover amigo:', error);
    return NextResponse.json(
      { error: 'Erro ao remover amigo' },
      { status: 500 });
  }
} 