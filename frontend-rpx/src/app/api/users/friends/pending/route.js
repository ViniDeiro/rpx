import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

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
      { status: 401 });
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
        { status: 401 });
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
      { status: 401 });
  }
}

/**
 * GET - Listar solicitações de amizade pendentes
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
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Usuário não autenticado' },
      { status: 401 });
  }
  
  try {
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Buscar o usuário
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { 'friendRequests': 1 } }
    );
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 });
    }
    
    // Extrair IDs dos usuários que enviaram solicitações
    const requestIds = Array.isArray(user.friendRequests) 
      ? user.friendRequests.map(req => {
          try {
            return new ObjectId(req.userId);
          } catch (error) {
            console.warn('ID inválido nas solicitações de amizade', req.userId);
            return null;
          }
        }).filter(id => id !== null)
      : [];
    
    if (requestIds.length === 0) {
      return NextResponse.json({
        requests: [],
        total: 0
      });
    }
    
    // Buscar informações dos usuários que enviaram solicitações
    const senders = await db.collection('users')
      .find({ _id: { $in: requestIds } })
      .project({
        _id: 1,
        username: 1,
        avatarUrl: 1,
        'profile.level': 1,
        createdAt: 1
      })
      .toArray();
    
    // Formatar resultado para retorno
    const formattedRequests = senders.map(sender => {
      // Encontrar a data da solicitação
      const request = user.friendRequests.find(req => req.userId === sender._id.toString());
      
      return {
        id: sender._id.toString(),
        username: sender.username,
        avatarUrl: sender.avatarUrl || '/images/avatars/default.svg',
        level: sender.profile?.level || 1,
        requestDate: request?.date || new Date(),
        memberSince: sender.createdAt || new Date()
      };
    });
    
    return NextResponse.json({
      requests: formattedRequests,
      total: formattedRequests.length
    });
  } catch (error) {
    console.error('Erro ao listar solicitações de amizade pendentes:', error);
    return NextResponse.json(
      { error: 'Erro ao listar solicitações de amizade pendentes' },
      { status: 500 });
  }
}

/**
 * POST - Aceitar ou rejeitar solicitação de amizade
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
    const { senderId, action } = await req.json();
    
    if (!senderId) {
      return NextResponse.json(
        { error: 'ID do remetente é obrigatório' },
        { status: 400 });
    }
    
    if (!action || (action !== 'accept' && action !== 'reject')) {
      return NextResponse.json(
        { error: 'Ação inválida. Use "accept" ou "reject"' },
        { status: 400 });
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Verificar se o remetente existe
    const sender = await db.collection('users').findOne(
      { _id: new ObjectId(senderId) }
    );
    
    if (!sender) {
      return NextResponse.json(
        { error: 'Usuário remetente não encontrado' },
        { status: 404 });
    }
    
    // Buscar o usuário atual
    const currentUser = await db.collection('users').findOne(
      { _id: new ObjectId(userId) }
    );
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuário atual não encontrado' },
        { status: 404 });
    }
    
    // Verificar se realmente existe uma solicitação pendente
    const pendingRequest = (currentUser.friendRequests || []).find(
      req => req.userId === senderId
    );
    
    if (!pendingRequest) {
      return NextResponse.json(
        { error: 'Nenhuma solicitação pendente deste usuário' },
        { status: 404 });
    }
    
    if (action === 'accept') {
      // Adicionar aos amigos do usuário atual
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { 
          $push: { 
            friends: { 
              userId: senderId, 
              date: new Date() 
            } 
          },
          $pull: { 
            friendRequests: { 
              userId: senderId 
            } 
          }
        }
      );
      
      // Adicionar aos amigos do remetente
      await db.collection('users').updateOne(
        { _id: new ObjectId(senderId) },
        { 
          $push: { 
            friends: { 
              userId: userId, 
              date: new Date() 
            } 
          },
          $pull: { 
            sentFriendRequests: { 
              userId: userId 
            } 
          }
        }
      );
      
      // Registrar a aceitação da amizade
      await db.collection('friendRequests').insertOne({
        senderId,
        recipientId: userId,
        status: 'accepted',
        createdAt: pendingRequest.date || new Date(),
        updatedAt: new Date()
      });
      
      return NextResponse.json({
        message: 'Solicitação de amizade aceita com sucesso'
      });
    } else {
      // Rejeitar a solicitação (remover da lista de pendentes)
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { 
          $pull: { 
            friendRequests: { 
              userId: senderId 
            } 
          }
        }
      );
      
      // Remover das solicitações enviadas pelo remetente
      await db.collection('users').updateOne(
        { _id: new ObjectId(senderId) },
        { 
          $pull: { 
            sentFriendRequests: { 
              userId: userId 
            } 
          }
        }
      );
      
      // Registrar a rejeição
      await db.collection('friendRequests').insertOne({
        senderId,
        recipientId: userId,
        status: 'rejected',
        createdAt: pendingRequest.date || new Date(),
        updatedAt: new Date()
      });
      
      return NextResponse.json({
        message: 'Solicitação de amizade rejeitada com sucesso'
      });
    }
  } catch (error) {
    console.error('Erro ao processar solicitação de amizade:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação de amizade' },
      { status: 500 });
  }
} 