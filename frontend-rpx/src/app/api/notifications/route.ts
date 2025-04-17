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
    
    try {
      const { db } = await connectToDatabase();
      
      if (!db) {
        console.error('API Notifications - Erro de conexão com o banco de dados');
        return NextResponse.json({
          status: 'error',
          error: 'Erro de conexão com o banco de dados'
        }, { status: 500 });
      }
      
      // Buscar notificações tradicionais
      let notificationQuery = db.collection('notifications').find({ 
        $or: [
          { userId: new ObjectId(userId) },
          { userId: userId.toString() }
        ]
      });
      
      // Aplicar ordenação e limite se o objeto suportar
      if (typeof notificationQuery.sort === 'function') {
        notificationQuery = notificationQuery.sort({ createdAt: -1 });
      }
      
      if (typeof notificationQuery.limit === 'function') {
        notificationQuery = notificationQuery.limit(20);
      }
      
      const notifications = await notificationQuery.toArray();
      
      console.log(`API Notifications - Encontradas ${notifications.length} notificações regulares`);
      
      // Buscar também convites de lobby pendentes
      const userIdString = userId.toString();
      console.log('Buscando convites para o ID (string):', userIdString);
      
      // Buscar convites específicos para este usuário
      let inviteQuery = db.collection('lobbyinvites').find({ 
        $or: [
          { recipient: new ObjectId(userId) },
          { recipient: userId.toString() }
        ],
        status: 'pending' 
      });
      
      // Aplicar ordenação se o objeto suportar
      if (typeof inviteQuery.sort === 'function') {
        inviteQuery = inviteQuery.sort({ createdAt: -1 });
      }
      
      const userInvites = await inviteQuery.toArray();
      
      console.log(`API Notifications - Encontrados ${userInvites.length} convites de lobby para o usuário`);
      
      // Log detalhado para debug se não houver convites
      if (userInvites.length === 0) {
        // Verificar se há convites pendentes no sistema
        try {
          const inviteCollection = db.collection('lobbyinvites');
          let pendingCount = 0;
          
          // Verificar se o método countDocuments existe
          if (typeof inviteCollection.countDocuments === 'function') {
            pendingCount = await inviteCollection.countDocuments({ status: 'pending' });
          } else if (typeof inviteCollection.count === 'function') {
            // Fallback para o método count mais antigo
            pendingCount = await inviteCollection.count({ status: 'pending' });
          } else {
            // Última opção: buscar todos e contar manualmente
            const allPending = await inviteCollection.find({ status: 'pending' }).toArray();
            pendingCount = allPending.length;
          }
          
          console.log(`Existem ${pendingCount} convites pendentes no sistema no total`);
          
          if (pendingCount > 0) {
            const sampleInvite = await db.collection('lobbyinvites')
              .findOne({ status: 'pending' });
            
            if (sampleInvite) {
              console.log('Exemplo de convite pendente:');
              console.log('- recipient:', typeof sampleInvite.recipient, sampleInvite.recipient);
              console.log('- inviter:', typeof sampleInvite.inviter, sampleInvite.inviter);
              console.log('- status:', sampleInvite.status);
            }
          }
        } catch (countError) {
          console.error('Erro ao contar convites pendentes:', countError);
        }
      }
      
      // Transformar convites em formato de notificação
      const inviteNotifications = await Promise.all(userInvites.map(async (invite: any) => {
        // Buscar dados do usuário que enviou o convite
        let inviterData = null;
        try {
          inviterData = await db.collection('users').findOne(
            { 
              $or: [
                { _id: new ObjectId(invite.inviter.toString()) },
                { _id: invite.inviter.toString() }
              ]
            },
            { projection: { username: 1, avatar: 1 } }
          );
        } catch (err) {
          console.error('Erro ao buscar dados do inviter:', err);
        }

        // Buscar dados do lobby
        let lobbyData = null;
        try {
          lobbyData = await db.collection('lobbies').findOne(
            { 
              $or: [
                { _id: new ObjectId(invite.lobbyId.toString()) },
                { _id: invite.lobbyId.toString() }
              ]
            },
            { projection: { name: 1, gameMode: 1 } }
          );
        } catch (err) {
          console.error('Erro ao buscar dados do lobby:', err);
        }

        return {
          _id: invite._id.toString(),
          type: 'lobby_invite',
          read: false,
          inviter: invite.inviter,
          recipient: invite.recipient,
          lobbyId: invite.lobbyId,
          gameMode: invite.gameMode || (lobbyData ? lobbyData.gameMode : 'casual'),
          status: invite.status,
          createdAt: invite.createdAt,
          // Adicionar dados do usuário que enviou o convite
          inviterName: inviterData?.username || 'Usuário',
          inviterAvatar: inviterData?.avatar || '/images/avatars/default.png',
          // Adicionar dados do lobby
          lobbyName: lobbyData?.name || 'Lobby'
        };
      }));
      
      // Juntar todas as notificações
      const allNotifications = [...notifications, ...inviteNotifications];
      
      // Ordenar manualmente por lidas e data
      allNotifications.sort((a, b) => {
        // Primeiro por status de leitura (não lidas primeiro)
        if (a.read !== b.read) {
          return a.read ? 1 : -1;
        }
        // Depois por data (mais recentes primeiro)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      // Limitar a 20 notificações
      const limitedNotifications = allNotifications.slice(0, 20);
      
      console.log(`API Notifications - Total de ${limitedNotifications.length} notificações combinadas`);
      
      // Converter ID's ObjectId para strings para serialização JSON
      const serializedNotifications = limitedNotifications.map((notification: any) => {
        try {
          // Verificar se o objeto notification existe e tem os campos necessários
          if (!notification || !notification._id) {
            console.warn('Notificação inválida encontrada:', notification);
            return null;
          }

          // Serializar IDs para strings
          const serialized = {
            ...notification,
            _id: notification._id.toString(),
          };

          // Se for um convite de lobby
          if (notification.type === 'lobby_invite') {
            if (notification.inviter) {
              serialized.inviter = typeof notification.inviter === 'object' 
                ? notification.inviter.toString() 
                : notification.inviter;
            }
            
            if (notification.recipient) {
              serialized.recipient = typeof notification.recipient === 'object' 
                ? notification.recipient.toString() 
                : notification.recipient;
            }
            
            if (notification.lobbyId) {
              serialized.lobbyId = typeof notification.lobbyId === 'object' 
                ? notification.lobbyId.toString() 
                : notification.lobbyId;
            }
          }
          // Caso seja notificação tradicional com userId
          else if (notification.userId) {
            serialized.userId = typeof notification.userId === 'object' 
              ? notification.userId.toString() 
              : notification.userId;
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
        notifications: serializedNotifications,
        unreadCount: serializedNotifications.filter((n: any) => !n.read).length
      });
    } catch (dbError) {
      console.error('Erro ao interagir com o banco de dados:', dbError);
      return NextResponse.json({
        status: 'error',
        error: 'Erro ao recuperar notificações'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro geral na API de notificações:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro interno do servidor'
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