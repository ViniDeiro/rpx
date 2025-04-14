import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';

// Interface para notificações
interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedId?: string;
  relatedType?: string;
  createdAt: Date;
  readAt?: Date;
}

// GET - Listar notificações do usuário
export async function GET(req: NextRequest) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult;
  
  try {
    // Obter ID do usuário da requisição autenticada
    const userId = getUserId(authenticatedReq);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não encontrado na requisição' },
        { status: 400 }
      );
    }
    
    // Obter parâmetros de consulta
    const url = new URL(authenticatedReq.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const unreadOnly = url.searchParams.get('unread') === 'true';
    
    // Calcular o skip para paginação
    const skip = (page - 1) * limit;
    
    // Preparar filtro de consulta
    const filter: any = { userId: userId };
    
    if (unreadOnly) {
      filter.isRead = false;
    }
    
    // Conectar ao MongoDB
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      );
    }
    
    // Buscar notificações do usuário
    const notifications = await db.collection('notifications')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Contar total de notificações para paginação
    const total = await db.collection('notifications').countDocuments(filter);
    
    // Contar total de notificações não lidas
    const unreadCount = await db.collection('notifications').countDocuments({ 
      userId: userId, 
      isRead: false 
    });
    
    // Processar notificações para resposta
    const formattedNotifications: Notification[] = notifications.map((notification: any) => ({
      id: notification._id.toString(),
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      relatedId: notification.relatedId,
      relatedType: notification.relatedType,
      createdAt: notification.createdAt,
      readAt: notification.readAt
    }));
    
    // Retornar dados
    return NextResponse.json({
      notifications: formattedNotifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    return NextResponse.json(
      { error: 'Erro ao listar notificações' },
      { status: 500 }
    );
  }
}

// POST - Criar uma nova notificação (geralmente usado internamente pelo sistema)
export async function POST(req: NextRequest) {
  // Esta rota geralmente é chamada internamente pelo sistema
  // Para fins de teste ou desenvolvimento, permitimos chamadas diretas
  
  try {
    // Obter dados da requisição
    const body = await req.json();
    const { userId, title, message, type, relatedId, relatedType } = body;
    
    // Validar dados
    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Título e mensagem são obrigatórios' },
        { status: 400 }
      );
    }
    
    if (!type) {
      return NextResponse.json(
        { error: 'Tipo de notificação é obrigatório' },
        { status: 400 }
      );
    }
    
    // Conectar ao MongoDB
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      );
    }
    
    // Criar objeto da notificação
    const notification = {
      userId,
      title,
      message,
      type,
      isRead: false,
      relatedId,
      relatedType,
      createdAt: new Date()
    };
    
    // Inserir a notificação no banco de dados
    const result = await db.collection('notifications').insertOne(notification);
    
    // Formatar notificação para resposta
    const formattedNotification = {
      id: result.insertedId.toString(),
      userId,
      title,
      message,
      type,
      isRead: false,
      relatedId,
      relatedType,
      createdAt: new Date()
    };
    
    // Retornar dados da notificação criada
    return NextResponse.json({
      message: 'Notificação criada com sucesso',
      notification: formattedNotification
    });
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return NextResponse.json(
      { error: 'Erro ao criar notificação' },
      { status: 500 }
    );
  }
} 