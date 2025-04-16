import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

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
 * PATCH /api/users/friends/requests/[id] - Aceitar ou recusar solicitação de amizade
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { id } = params;
    const { action } = await req.json();
    
    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Ação inválida. Use "accept" ou "reject".' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Verificar se a solicitação existe e pertence ao usuário
    const friendRequest = await db
      .collection('friendRequests')
      .findOne({
        _id: new ObjectId(id),
        recipientId: userId,
        status: 'pending'
      });
    
    if (!friendRequest) {
      return NextResponse.json(
        { error: 'Solicitação de amizade não encontrada ou já processada.' },
        { status: 404 }
      );
    }
    
    // Processar a solicitação com base na ação
    if (action === 'accept') {
      // Atualizar o status da solicitação
      await db.collection('friendRequests').updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: 'accepted', updatedAt: new Date() } }
      );
      
      // Adicionar conexão de amizade para ambos os usuários
      await db.collection('users').updateOne(
        { _id: userId },
        { $addToSet: { friends: friendRequest.senderId } }
      );
      
      await db.collection('users').updateOne(
        { _id: friendRequest.senderId },
        { $addToSet: { friends: userId } }
      );
      
      return NextResponse.json({
        success: true,
        message: 'Solicitação de amizade aceita com sucesso!'
      });
    } else {
      // Rejeitar a solicitação
      await db.collection('friendRequests').updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: 'rejected', updatedAt: new Date() } }
      );
      
      return NextResponse.json({
        success: true,
        message: 'Solicitação de amizade rejeitada com sucesso!'
      });
    }
    
  } catch (error) {
    console.error('Erro ao processar solicitação de amizade:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação de amizade.' },
      { status: 500 }
    );
  }
} 