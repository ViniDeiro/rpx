import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ObjectId, Document, WithId } from 'mongodb';
import { Collection, FindCursor } from 'mongodb';

// Interface para convites
interface LobbyInvite {
  _id: ObjectId;
  inviter: ObjectId | string;
  recipient: ObjectId | string;
  lobbyId: ObjectId | string;
  gameMode?: string;
  status: string;
  createdAt: Date;
}

// Interface para notificações
interface Notification {
  _id: ObjectId;
  userId: string;
  type: string;
  read: boolean;
  data?: any;
  createdAt: Date;
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
    
    if (!db) {
      console.error('API Notifications - Erro de conexão com o banco de dados');
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 500 });
    }
    
    // Usar um único formato de ID para garantir consistência (String)
    const userIdString = userId.toString();
    
    // 1. Buscar notificações tradicionais
    const notificationResults = await db.collection<Notification>('notifications')
      .find({ userId: userIdString })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    
    // 2. Buscar convites de lobby pendentes
    const lobbyInvites = await db.collection<LobbyInvite>('lobbyinvites')
      .find({ recipient: userIdString, status: 'pending' })
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`API Notifications - Encontrados ${notificationResults.length} notificações e ${lobbyInvites.length} convites de lobby`);
    
    // 3. Para cada convite, buscar informações do usuário que enviou o convite
    const invitesWithDetails = await Promise.all(lobbyInvites.map(async (invite: WithId<LobbyInvite>) => {
      const inviterId = invite.inviter.toString();
      
      // Buscar dados do usuário que enviou o convite
      const inviter = await db.collection('users').findOne(
        { _id: new ObjectId(inviterId) },
        { projection: { _id: 1, username: 1, avatar: 1 } }
      );
      
      // Buscar dados do lobby 
      const lobbyId = invite.lobbyId.toString();
      const lobby = await db.collection('lobbies').findOne(
        { _id: new ObjectId(lobbyId) },
        { projection: { _id: 1, name: 1, type: 1, gameMode: 1 } }
      );
      
      // Converter para formato padrão de notificação
      return {
        _id: invite._id.toString(),
        type: 'lobby_invite',
        read: false,
        createdAt: invite.createdAt,
        status: invite.status,
        // Dados específicos de convite
        inviterId: inviterId,
        inviterName: inviter?.username || 'Usuário',
        inviterAvatar: inviter?.avatar || '/images/avatars/default.png',
        lobbyId: lobbyId,
        lobbyName: lobby?.name || 'Lobby',
        gameMode: invite.gameMode || lobby?.gameMode || 'casual'
      };
    }));
    
    // 4. Formatar as notificações tradicionais
    const formattedNotifications = notificationResults.map((notification: WithId<Notification>) => ({
      ...notification,
      _id: notification._id.toString()
    }));
    
    // 5. Juntar e ordenar todas as notificações
    const allNotifications = [...formattedNotifications, ...invitesWithDetails]
      .sort((a, b) => {
        // Primeiro ordem por leitura (não lidas primeiro)
        if (a.read !== b.read) {
          return a.read ? 1 : -1;
        }
        // Depois por data (mais recentes primeiro)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    
    // 6. Contar notificações não lidas
    const unreadCount = allNotifications.filter(n => !n.read).length;
    
    console.log(`API Notifications - Retornando ${allNotifications.length} notificações (${unreadCount} não lidas)`);
    
    return NextResponse.json({
      status: 'success',
      notifications: allNotifications,
      unreadCount
    });
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