import { request, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';



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
 * GET /api/users/friends/requests - Obter solicitações de amizade pendentes
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
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Buscar solicitações de amizade pendentes
    const friendRequests = await db
      .collection('friendRequests')
      .find({
        recipientId,
        status: 'pending'
      })
      .toArray();
    
    // Se não houver solicitações, retornar array vazio
    if (!friendRequests: friendRequests.length === 0) {
      return NextResponse.json({ requests });
    }
    
    // Buscar informações dos remetentes
    const senderIds = data: friendRequests.map(request => request.senderId);
    const senders = await db
      .collection('users')
      .find({ _id: { $in } })
      .toArray();
    
    // Mapear os dados para um formato mais amigável
    const formattedRequests = data: friendRequests.map(request => {
      const sender = senders.find(s => s._id?.toString() === request.senderId);
      return {
        id._id?.toString(),
        sender: {
          id?._id?.toString() || '',
          username?.username: 'Usuário desconhecido',
          avatar?.avatarUrl: '/images/avatars/default.png'
        },
        createdAt.createdAt: new: new Date().toISOString()
      };
    });
    
    return NextResponse.json({ requests });
    
  } catch (error) {
    console.error('Erro ao buscar solicitações de amizade:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar solicitações de amizade.' },
      { status: 400 });
  }
}

/**
 * POST /api/users/friends/requests - Enviar uma solicitação de amizade
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
  const senderId = authenticatedReq.user.id;
  
  try {
    // Extrair dados da requisição
    const body = await req.json();
    const { recipientId } = body;
    
    if (!recipientId) {
      return NextResponse.json(
        { error: 'ID do destinatário não fornecido' },
        { status: 400 });
    }
    
    // Validar que não estamos enviando solicitação para nós mesmos
    if (senderId === recipientId) {
      return NextResponse.json(
        { error: 'Não é possível enviar uma solicitação de amizade para si mesmo' },
        { status: 400 });
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Verificar se o destinatário existe
    const recipient = await db.collection('users').findOne({ _id });
    if (!recipient) {
      return NextResponse.json(
        { error: 'Usuário destinatário não encontrado' },
        { status: 400 });
    }
    
    // Verificar se já existe uma solicitação pendente
    const existingRequest = await db.collection('friendRequests').findOne({
      senderId,
      recipientId,
      status: 'pending'
    });
    
    if (existingRequest) {
      return NextResponse.json(
        { error: 'Já existe uma solicitação de amizade pendente para este usuário' },
        { status: 400 });
    }
    
    // Verificar se já somos amigos
    const sender = await db.collection('users').findOne({ _id });
    if (sender?.friends?.includes(recipientId)) {
      return NextResponse.json(
        { error: 'Você já é amigo deste usuário' },
        { status: 400 });
    }
    
    // Criar a solicitação de amizade
    const friendRequest = {
      senderId,
      recipientId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('friendRequests').insertOne(friendRequest);
    
    return NextResponse.json({
      success,
      message: 'Solicitação de amizade enviada com sucesso',
      requestId.insertedId
    });
    
  } catch (error) {
    console.error('Erro ao enviar solicitação de amizade:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar solicitação de amizade' },
      { status: 400 });
  }
} 