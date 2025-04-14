import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';

// POST - Marcar uma notificação como lida
export async function POST(
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
  const authenticatedReq = authResult;
  
  try {
    // Obter ID da notificação da URL
    const notificationId = params.id;
    
    if (!notificationId) {
      return NextResponse.json(
        { error: 'ID da notificação não fornecido' },
        { status: 400 }
      );
    }
    
    // Obter ID do usuário da requisição autenticada
    const userId = getUserId(authenticatedReq);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não encontrado na requisição' },
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
    
    // Buscar notificação pelo ID
    const notification = await db.collection('notifications').findOne(
      { _id: new mongoose.Types.ObjectId(notificationId) }
    );
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notificação não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se a notificação pertence ao usuário
    if (notification.userId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para modificar esta notificação' },
        { status: 403 }
      );
    }
    
    // Verificar se a notificação já está marcada como lida
    if (notification.isRead) {
      return NextResponse.json({
        message: 'Notificação já está marcada como lida',
        notification: {
          id: notification._id.toString(),
          isRead: true,
          readAt: notification.readAt
        }
      });
    }
    
    // Marcar a notificação como lida
    const now = new Date();
    await db.collection('notifications').updateOne(
      { _id: new mongoose.Types.ObjectId(notificationId) },
      { 
        $set: { 
          isRead: true,
          readAt: now,
          updatedAt: now
        } 
      }
    );
    
    // Buscar notificação atualizada
    const updatedNotification = await db.collection('notifications').findOne(
      { _id: new mongoose.Types.ObjectId(notificationId) }
    );
    
    if (!updatedNotification) {
      return NextResponse.json(
        { error: 'Erro ao obter a notificação atualizada' },
        { status: 500 }
      );
    }
    
    // Formatar notificação para resposta
    const formattedNotification = {
      id: updatedNotification._id.toString(),
      title: updatedNotification.title,
      isRead: updatedNotification.isRead,
      readAt: updatedNotification.readAt
    };
    
    // Retornar dados atualizados
    return NextResponse.json({
      message: 'Notificação marcada como lida com sucesso',
      notification: formattedNotification
    });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return NextResponse.json(
      { error: 'Erro ao marcar notificação como lida' },
      { status: 500 }
    );
  }
}

// POST - Marcar todas as notificações do usuário como lidas
export async function PUT(req: NextRequest) {
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
    
    // Conectar ao MongoDB
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      );
    }
    
    // Marcar todas as notificações do usuário como lidas
    const now = new Date();
    const result = await db.collection('notifications').updateMany(
      { userId: userId, isRead: false },
      { 
        $set: { 
          isRead: true,
          readAt: now,
          updatedAt: now
        } 
      }
    );
    
    // Verificar resultado da operação
    if (!result.acknowledged) {
      return NextResponse.json(
        { error: 'Erro ao marcar notificações como lidas' },
        { status: 500 }
      );
    }
    
    // Retornar dados atualizados
    return NextResponse.json({
      message: 'Todas as notificações foram marcadas como lidas',
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    return NextResponse.json(
      { error: 'Erro ao marcar todas as notificações como lidas' },
      { status: 500 }
    );
  }
} 