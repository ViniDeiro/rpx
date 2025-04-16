import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

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

// Middleware para autenticação
async function isAuthenticated() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.id) {
    return { isAuth: false, error: 'Não autorizado', userId: null };
  }
  
  return { isAuth: true, error: null, userId: session.user.id };
}

// GET: Obter notificações do usuário
export async function GET(request: Request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 401 });
    }
    
    console.log('API Notifications - Buscando notificações para usuário:', userId);
    
    const { db } = await connectToDatabase();
    
    // Buscar notificações usando um único comando find
    const notifications = await db.collection('notifications')
      .find({ userId: new ObjectId(userId) })
      .toArray();
    
    // Ordenar manualmente por lidas e data
    notifications.sort((a, b) => {
      // Primeiro por status de leitura (não lidas primeiro)
      if (a.read !== b.read) {
        return a.read ? 1 : -1;
      }
      // Depois por data (mais recentes primeiro)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Limitar a 20 notificações
    const limitedNotifications = notifications.slice(0, 20);
    
    console.log(`API Notifications - Encontradas ${limitedNotifications.length} notificações`);
    
    // Converter ID's ObjectId para strings para serialização JSON
    const serializedNotifications = limitedNotifications.map((notification: any) => {
      try {
        // Verificar se o objeto notification existe e tem os campos necessários
        if (!notification || !notification._id) {
          console.warn('Notificação inválida encontrada:', notification);
          return null;
        }

        // Identificar o tipo de notificação para processamento específico
        console.log(`Processando notificação tipo: ${notification.type}`);

        // Objeto base com valores seguros
        const serialized = {
          ...notification,
          _id: notification._id.toString(),
          userId: notification.userId ? notification.userId.toString() : '',
          createdAt: notification.createdAt instanceof Date 
            ? notification.createdAt.toISOString() 
            : (notification.createdAt || new Date().toISOString()),
          read: !!notification.read,
          data: { ...notification.data } // Cópia segura
        };

        // Verificar e processar campos aninhados de forma segura para convites de lobby
        if (notification.type === 'lobby_invite' && serialized.data) {
          console.log('Processando convite de lobby:', JSON.stringify(serialized.data, null, 2));
          
          // Processar inviter se existir
          if (serialized.data.inviter && serialized.data.inviter._id) {
            serialized.data.inviter = {
              ...serialized.data.inviter,
              _id: serialized.data.inviter._id.toString()
            };
          }

          // Processar sender para compatibilidade (se existir em vez de inviter)
          if (serialized.data.sender && serialized.data.sender._id) {
            // Renomear sender para inviter para manter consistência
            serialized.data.inviter = {
              ...serialized.data.sender,
              _id: serialized.data.sender._id.toString()
            };
            // Remover o campo sender para evitar duplicidade
            delete serialized.data.sender;
          }

          // Processar invite se existir
          if (serialized.data.invite && serialized.data.invite._id) {
            serialized.data.invite = {
              ...serialized.data.invite,
              _id: serialized.data.invite._id.toString(),
              lobbyId: serialized.data.invite.lobbyId 
                ? (typeof serialized.data.invite.lobbyId === 'object'
                   ? serialized.data.invite.lobbyId.toString()
                   : serialized.data.invite.lobbyId)
                : ''
            };
          }
        }

        return serialized;
      } catch (err) {
        console.error('Erro ao serializar notificação:', err);
        return null;
      }
    }).filter(Boolean); // Remove itens nulos
    
    console.log(`API Notifications - Retornando ${serializedNotifications.length} notificações serializadas`);
    
    return NextResponse.json({
      status: 'success',
      notifications: serializedNotifications
    });
  } catch (error: any) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao buscar notificações'
    }, { status: 500 });
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