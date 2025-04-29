import { request, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

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
  const authenticatedReq = authResult;
  const userId = authenticatedReq.user.id;
  
  try {
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Buscar solicitações de amizade pendentes recebidas pelo usuário
    const friendRequests = await db
      .collection('friendRequests')
      .find({
        recipientId: userId,
        status: 'pending'
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    // Se não houver solicitações, retornar array vazio
    if (!friendRequests || friendRequests.length === 0) {
      return NextResponse.json({ requests: [] });
    }
    
    // Buscar informações dos usuários que enviaram as solicitações
    const senderIds = friendRequests.map(request => request.senderId);
    const senders = await db
      .collection('users')
      .find({ _id: { $in: senderIds.map(id => new ObjectId(id)) } })
      .project({ _id: 1, username: 1, avatarUrl: 1 })
      .toArray();
    
    // Formatar os dados para retorno
    const requests = friendRequests.map(request => {
      const sender = senders.find(s => s._id?.toString() === request.senderId);
      return {
        id: request._id?.toString() || '',
        sender: {
          id: sender?._id?.toString() || '',
          username: sender?.username || 'Usuário desconhecido',
          avatar: sender?.avatarUrl || '/images/avatars/default.png'
        },
        createdAt: request.createdAt || new Date().toISOString()
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
  const authenticatedReq = authResult;
  const senderId = authenticatedReq.user.id;
  
  try {
    // Obter dados da requisição
    const { recipientId } = await req.json();
    
    if (!recipientId) {
      return NextResponse.json(
        { error: 'ID do destinatário é obrigatório' },
        { status: 400 });
    }
    
    // Verificar se está tentando enviar solicitação para si mesmo
    if (recipientId === senderId) {
      return NextResponse.json(
        { error: 'Não é possível enviar solicitação para si mesmo' },
        { status: 400 });
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Verificar se o usuário destinatário existe
    const recipient = await db
      .collection('users')
      .findOne({ _id: new ObjectId(recipientId) });
    
    if (!recipient) {
      return NextResponse.json(
        { error: 'Usuário destinatário não encontrado' },
        { status: 400 });
    }
    
    // Verificar se já existe solicitação pendente
    const existingRequest = await db
      .collection('friendRequests')
      .findOne({
        senderId,
        recipientId,
        status: 'pending'
      });
    
    if (existingRequest) {
      return NextResponse.json(
        { error: 'Já existe uma solicitação pendente para este usuário' },
        { status: 400 });
    }
    
    // Verificar se já são amigos
    const sender = await db
      .collection('users')
      .findOne({ 
        _id: new ObjectId(senderId),
        'friends.userId': recipientId
      });
    
    if (sender) {
      return NextResponse.json(
        { error: 'Vocês já são amigos' },
        { status: 400 });
    }
    
    // Criar solicitação de amizade
    const friendRequest = {
      senderId,
      recipientId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('friendRequests').insertOne(friendRequest);
    
    return NextResponse.json({
      success: true,
      message: 'Solicitação de amizade enviada com sucesso',
      requestId: result.insertedId
    });
    
  } catch (error) {
    console.error('Erro ao enviar solicitação de amizade:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar solicitação de amizade.' },
      { status: 400 });
  }
} 