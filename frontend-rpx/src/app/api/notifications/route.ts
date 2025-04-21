import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ObjectId, Document, WithId } from 'mongodb';
import { Collection, FindCursor } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

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

// Função para formatar uma notificação para o cliente
const formatNotification = (notification: any) => {
  // Criar uma cópia para não modificar o original
  const formatted = { ...notification };
  
  // Converter _id para id (compatibilidade com frontend)
  if (formatted._id) {
    formatted.id = formatted._id.toString();
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

// GET: Obter notificações do usuário
export async function GET(request: Request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    if (!isAuth || !userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: error || 'Não autorizado'
        },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();

    // Consultar notificações convencionais
    const notificationsQuery = {
      userId: userId.toString()
    };

    // Obter notificações do usuário
    const notificationsResults = await db
      .collection('notifications')
      .find(notificationsQuery)
      .sort({ read: 1, createdAt: -1 }) // Não lidas primeiro, depois por data recente
      .toArray();

    // Buscar possíveis convites de lobby pendentes
    const lobbyInviteQuery = {
      $or: [
        { recipient: new ObjectId(userId) },
        { recipient: userId.toString() }
      ],
      status: 'pending'
    };

    const lobbyInvites = await db
      .collection('lobbyinvites')
      .find(lobbyInviteQuery)
      .toArray();

    // Para cada convite de lobby, obter informações do convidador
    const formattedInvites = [];
    for (const invite of lobbyInvites) {
      let inviter;
      try {
        // Tentar obter dados do convidador
        inviter = await db.collection('users').findOne({
          _id: typeof invite.inviter === 'string' ? new ObjectId(invite.inviter) : invite.inviter
        });
      } catch (err) {
        console.error('Erro ao buscar dados do convidador:', err);
        inviter = { username: 'Usuário Desconhecido' };
      }

      // Formatar o convite como uma notificação
      formattedInvites.push({
        id: invite._id.toString(),
        type: 'lobby_invite',
        userId: userId.toString(),
        read: false,
        title: 'Convite para Lobby',
        message: `${inviter?.username || 'Alguém'} convidou você para um lobby`,
        createdAt: invite.createdAt instanceof Date ? invite.createdAt.toISOString() : new Date().toISOString(),
        data: {
          lobbyId: invite.lobbyId.toString(),
          inviterId: inviter?._id?.toString(),
          inviterName: inviter?.username,
          inviterAvatar: (inviter as any)?.avatar || null,
          inviteId: invite._id.toString()
        }
      });
    }

    // Formatar todas as notificações para o modelo esperado pelo cliente
    const formattedNotifications = notificationsResults.map(notification => {
      const baseNotification = formatNotification(notification);
      
      // Adicionar campos específicos se estiverem faltando
      if (!baseNotification.title) {
        baseNotification.title = baseNotification.type.charAt(0).toUpperCase() + baseNotification.type.slice(1);
      }
      
      if (!baseNotification.message) {
        baseNotification.message = 'Nova notificação recebida';
      }
      
      return baseNotification;
    });

    // Combinar notificações e convites
    const allNotifications = [...formattedNotifications, ...formattedInvites];
    
    // Ordenar por lidas/não lidas e por data
    allNotifications.sort((a, b) => {
      // Primeiro por status não lido (não lidas primeiro)
      if (a.read !== b.read) {
        return a.read ? 1 : -1;
      }
      // Depois por data (mais recentes primeiro)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Contar notificações não lidas
    const unreadCount = allNotifications.filter(n => !n.read).length;

    // Retornar resposta no formato esperado pelo frontend
    return NextResponse.json({
      success: true,
      data: {
        notifications: allNotifications,
        unreadCount: unreadCount,
        total: allNotifications.length
      }
    });
  } catch (error) {
    console.error('❌ [DEBUG] API Notifications - Erro ao buscar notificações:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar notificações'
      },
      { status: 500 }
    );
  }
}

// POST - Criar uma nova notificação (geralmente usado internamente pelo sistema)
export async function POST(req: NextRequest) {
  // Esta rota geralmente é chamada internamente pelo sistema
  // Para fins de teste ou desenvolvimento, permitimos chamadas diretas
  
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    if (!isAuth) {
      return NextResponse.json(
        { 
          success: false, 
          error: error || 'Não autorizado'
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { targetUserId, type, data = {} } = body;

    if (!targetUserId || !type) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID do usuário alvo e tipo são obrigatórios' 
        },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Criar a notificação
    const notification = {
      userId: targetUserId,
      type,
      data,
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
      data: {
        notification: formattedNotification
      }
    });
  } catch (error) {
    console.error('❌ [DEBUG] API Notifications - Erro ao criar notificação:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao criar notificação' 
      },
      { status: 500 }
    );
  }
} 