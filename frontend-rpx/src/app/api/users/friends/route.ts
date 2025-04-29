import { NextRequest, NextResponse } from 'next/server';
import { getModels } from '@/lib/mongodb/models';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

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

interface AuthenticatedRequest {
  user: any;
  token: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_dev_environment';

/**
 * Middleware para autenticação da API
 */
async function authMiddleware(req: NextRequest): Promise<NextResponse | AuthenticatedRequest> {
  // Extrair token de autorização
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Token de autorização ausente ou inválido');
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verificar o token JWT diretamente para garantir que temos o ID
    const decodedToken = jwt.verify(token, JWT_SECRET) as any;
    
    // Verificar se temos userId ou id (aceitar ambos)
    if (!decodedToken || (!decodedToken.id && !decodedToken.userId)) {
      console.error('Token JWT inválido ou sem ID de usuário', decodedToken);
      return NextResponse.json(
        { error: 'Token inválido ou sem ID de usuário' },
        { status: 401 }
      );
    }
    
    // Usar userId ou id, o que estiver disponível
    const userId = decodedToken.userId || decodedToken.id;
    
    // Criar um objeto de usuário normalizado
    const normalizedUser = {
      ...decodedToken,
      id: userId  // Garantir que temos uma propriedade id para uso consistente
    };
    
    // Requisição autenticada com sucesso
    return {
      user: normalizedUser,
      token: token
    };
  } catch (error) {
    console.error('Erro na autenticação JWT:', error);
    return NextResponse.json(
      { error: 'Falha na autenticação JWT' },
      { status: 401 }
    );
  }
}

/**
 * GET - Listar amigos e solicitações pendentes
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
    
    // Buscar o usuário com suas conexões de amizade
    const user = await User.findById(userId)
      .select('friends friendRequests sentFriendRequests')
      .exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Extrair IDs de amigos
    const friendIds = user.friends?.map((friend: any) => friend.userId) || [];
    
    // Buscar informações detalhadas dos amigos
    const friends = await User.find({ 
      _id: { $in: friendIds } 
    })
    .select('_id username avatarUrl profile.level stats.wins stats.matches rank')
    .exec();
    
    // Transformar resultado em formato amigável
    const formattedFriends = friends.map((friend: any) => ({
      id: friend._id.toString(),
      username: friend.username,
      avatarUrl: friend.avatarUrl || '/images/avatars/default.svg',
      level: friend.profile?.level || 1,
      stats: {
        wins: friend.stats?.wins || 0,
        matches: friend.stats?.matches || 0,
        winRate: friend.stats?.matches ? Math.round((friend.stats.wins / friend.stats.matches) * 100) : 0
      },
      rank: friend.rank || { tier: 'unranked', division: null, points: 0 },
      status: 'online' // Por padrão, mostrar como online
    }));
    
    // Extrair IDs de solicitações recebidas
    const requestIds = user.friendRequests?.map((req: any) => req.userId) || [];
    
    // Buscar informações de quem enviou solicitações
    const requests = await User.find({
      _id: { $in: requestIds }
    })
    .select('_id username avatarUrl profile.level')
    .exec();
    
    // Formatar solicitações
    const formattedRequests = requests.map((requester: any) => ({
      id: requester._id.toString(),
      username: requester.username,
      avatarUrl: requester.avatarUrl || '/images/avatars/default.svg',
      level: requester.profile?.level || 1
    }));
    
    // Extrair IDs de solicitações enviadas
    const sentIds = user.sentFriendRequests?.map((req: any) => req.userId) || [];
    
    // Buscar informações de para quem enviou solicitações
    const sentTo = await User.find({
      _id: { $in: sentIds }
    })
    .select('_id username avatarUrl profile.level')
    .exec();
    
    // Formatar solicitações enviadas
    const formattedSent = sentTo.map((receiver: any) => ({
      id: receiver._id.toString(),
      username: receiver.username,
      avatarUrl: receiver.avatarUrl || '/images/avatars/default.svg',
      level: receiver.profile?.level || 1
    }));
    
    // Retornar dados consolidados
    return NextResponse.json({
      friends: formattedFriends,
      requests: formattedRequests,
      sent: formattedSent
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
 * POST - Enviar uma solicitação de amizade
 * Body: { userId: string }
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
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Usuário não autenticado' },
      { status: 401 }
    );
  }
  
  try {
    // Obter os modelos do MongoDB
    const { User } = await getModels();
    
    // Obter o ID do usuário para quem enviar solicitação
    const body = await req.json();
    const { userId: targetUserId } = body;
    
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'ID do usuário é necessário' },
        { status: 400 }
      );
    }
    
    // Verificar se o usuário destino existe
    const targetUser = await User.findById(targetUserId);
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Usuário destino não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se já são amigos
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se já são amigos
    const alreadyFriends = user.friends?.some(
      (friend: any) => friend.userId.toString() === targetUserId
    );
    
    if (alreadyFriends) {
      return NextResponse.json(
        { error: 'Vocês já são amigos' },
        { status: 400 }
      );
    }
    
    // Verificar se já existe solicitação enviada
    const alreadySent = user.sentFriendRequests?.some(
      (request: any) => request.userId.toString() === targetUserId
    );
    
    if (alreadySent) {
      return NextResponse.json(
        { error: 'Solicitação já enviada' },
        { status: 400 }
      );
    }
    
    // Verificar se já existe solicitação recebida
    const alreadyReceived = user.friendRequests?.some(
      (request: any) => request.userId.toString() === targetUserId
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
      { status: 500 }
    );
  }
}

/**
 * Aceitar uma solicitação de amizade
 */
async function acceptFriendRequest(userId: string, friendId: string) {
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
        friendRequests: {
          userId: friendId
        }
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
        sentFriendRequests: {
          userId: userId
        }
      }
    });
    
    return NextResponse.json({
      message: 'Solicitação aceita com sucesso'
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
 * PUT - Aceitar uma solicitação de amizade
 * Body: { userId: string }
 */
export async function PUT(req: NextRequest) {
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
      { status: 401 }
    );
  }
  
  try {
    // Obter o ID do usuário cuja solicitação será aceita
    const body = await req.json();
    const { userId: friendId } = body;
    
    if (!friendId) {
      return NextResponse.json(
        { error: 'ID do usuário é necessário' },
        { status: 400 }
      );
    }
    
    return await acceptFriendRequest(userId, friendId);
    
  } catch (error) {
    console.error('Erro ao aceitar solicitação de amizade:', error);
    return NextResponse.json(
      { error: 'Erro ao aceitar solicitação de amizade' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Rejeitar uma solicitação ou remover amizade
 * Query params: userId=string&action=reject|remove
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
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Usuário não autenticado' },
      { status: 401 }
    );
  }
  
  try {
    // Extrair dados da requisição
    const { searchParams } = new URL(req.url);
    const friendId = searchParams.get('friendId');
    
    if (!friendId) {
      return NextResponse.json(
        { error: 'ID do amigo não fornecido' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Verificar se o amigo existe
    const friend = await db.collection('users').findOne({ _id: new ObjectId(friendId) });
    if (!friend) {
      return NextResponse.json(
        { error: 'Usuário amigo não encontrado' },
        { status: 404 }
      );
    }
    
    // Atualizar a lista de amigos do usuário atual
    await (db.collection('users') as any).updateOne(
      { _id: new ObjectId(userId) },
      { $pull: { friends: { userId: friendId } } }
    );
    
    // Atualizar a lista de amigos do outro usuário
    await (db.collection('users') as any).updateOne(
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
      success: true,
      message: 'Amigo removido com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao remover amigo:', error);
    return NextResponse.json(
      { error: 'Erro ao remover amigo' },
      { status: 500 }
    );
  }
} 