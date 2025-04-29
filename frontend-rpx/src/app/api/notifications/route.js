import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

// Interface para convites


// Interface para notificações


// Função para formatar uma notificação para o cliente
const formatNotification = (notification) => {
  // Criar uma cópia para não modificar o original
  const formatted = { ...notification };
  
  // Converter _id para id (compatibilidade com frontend)
  if (formatted._id) {
    formatted.id = formatted._id ? formatted._id.toString() : "";
    delete formatted._id;
  }
  
  // Garantir que o tipo da notificação seja compatível com o frontend
  // Se necessário, mapear tipos do banco para tipos do frontend
  if (formatted.type) {
    // Adicione mapeamentos específicos conforme necessário
    switch (formatted.type) {
      case 'system_alert':
        formatted.type = 'system';
        break;
      case 'payment_update':
        formatted.type = 'payment';
        break;
      // Outros mapeamentos conforme necessário
    }
  }
  
  // Garantir que createdAt seja uma string para o frontend
  if (formatted.createdAt && typeof formatted.createdAt !== 'string') {
    formatted.createdAt = formatted.createdAt.toISOString();
  }
  
  return formatted;
};

/**
 * Lida com a solicitação GET para buscar notificações
 */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Você precisa estar autenticado' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Estabelecer conexão com o banco de dados
    const { db } = await connectToDatabase();
    
    // Buscar notificações do usuário atual
    const notifications = await db.collection('notifications')
      .find({ 
        recipientId: userId,
        isDeleted: { $ne: true }
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    
    // Formatar as notificações para envio
    const formattedNotifications = notifications.map(notification => ({
      id: notification._id.toString(),
      type: notification.type || 'info',
      message: notification.message || 'Nova notificação',
      link: notification.link || null,
      read: notification.read || false,
      timestamp: notification.createdAt || new Date(),
      sender: notification.senderId || null,
      data: notification.data || {}
    }));
    
    // Verificar se há notificações não lidas e contar
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Retornar as notificações formatadas
    return NextResponse.json({
      notifications: formattedNotifications,
      unreadCount,
      total: notifications.length
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar notificações' },
      { status: 500 }
    );
  }
}

/**
 * Lida com a solicitação PUT para marcar notificações como lidas
 */
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Você precisa estar autenticado' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const body = await req.json();
    
    // Validar os parâmetros
    if (!body) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }
    
    const { notificationId, markAllAsRead } = body;
    
    // Estabelecer conexão com o banco de dados
    const { db } = await connectToDatabase();
    
    // Marcar todas as notificações como lidas
    if (markAllAsRead) {
      await db.collection('notifications').updateMany(
        { recipientId: userId, read: false },
        { $set: { read: true, updatedAt: new Date() } }
      );
      
      return NextResponse.json({
        message: 'Todas as notificações foram marcadas como lidas'
      });
    }
    
    // Marcar uma notificação específica como lida
    if (notificationId) {
      // Verificar se a notificação existe e pertence ao usuário
      const notification = await db.collection('notifications').findOne({
        _id: new ObjectId(notificationId),
        recipientId: userId
      });
      
      if (!notification) {
        return NextResponse.json(
          { error: 'Notificação não encontrada' },
          { status: 404 }
        );
      }
      
      // Atualizar a notificação
      await db.collection('notifications').updateOne(
        { _id: new ObjectId(notificationId) },
        { $set: { read: true, updatedAt: new Date() } }
      );
      
      return NextResponse.json({
        message: 'Notificação marcada como lida'
      });
    }
    
    // Se nem notificationId nem markAllAsRead foram fornecidos
    return NextResponse.json(
      { error: 'Parâmetros inválidos' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    return NextResponse.json(
      { error: 'Erro ao marcar notificações como lidas' },
      { status: 500 }
    );
  }
}

/**
 * Lida com a solicitação DELETE para excluir notificações
 */
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Você precisa estar autenticado' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Extrair ID da notificação da URL
    const url = new URL(req.url);
    const notificationId = url.searchParams.get('id');
    
    // Validar o ID da notificação
    if (!notificationId) {
      return NextResponse.json(
        { error: 'ID da notificação não fornecido' },
        { status: 400 }
      );
    }
    
    // Estabelecer conexão com o banco de dados
    const { db } = await connectToDatabase();
    
    // Verificar se a notificação existe e pertence ao usuário
    const notification = await db.collection('notifications').findOne({
      _id: new ObjectId(notificationId),
      recipientId: userId
    });
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notificação não encontrada' },
        { status: 404 }
      );
    }
    
    // Marcar a notificação como excluída (exclusão lógica)
    await db.collection('notifications').updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: { isDeleted: true, updatedAt: new Date() } }
    );
    
    return NextResponse.json({
      message: 'Notificação excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir notificação:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir notificação' },
      { status: 500 }
    );
  }
}

// POST - Criar uma nova notificação (geralmente usado internamente pelo sistema)
export async function POST(req) {
  // Esta rota geralmente é chamada internamente pelo sistema
  // Para fins de teste ou desenvolvimento, permitimos chamadas diretas
  
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    if (!isAuth) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não autorizado'
        },
        { status: 400 });
    }

    const body = await req.json();
    const { targetUserId, type, data = {} } = body;

    if (!targetUserId || !type) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID do usuário alvo e tipo são obrigatórios' 
        },
        { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Criar a notificação
    const notification = {
      userId: targetUserId,
      type,
      data: data,
      read: false,
      createdAt: new Date()
    };

    const result = await db.collection('notifications').insertOne(notification);

    // Formatar a notificação criada para retornar ao cliente
    const formattedNotification = formatNotification({
      ...notification,
      _id: result.insertedId
    });

    return NextResponse.json({
      success: true,
      data: formattedNotification
    });
  } catch (error) {
    console.error('❌ [DEBUG] API Notifications - Erro ao criar notificação:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao criar notificação' 
      },
      { status: 400 });
  }
} 