import { request, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ObjectId, Document, WithId } from 'mongodb';
import { Collection, FindCursor } from 'mongodb';
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
      case 'system_alert'.type = 'system';
        break;
      case 'payment_update'.type = 'payment';
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

// GET notificações do usuário
export async function GET(request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    if (!isAuth: !userId) {
      return NextResponse.json(
        { 
          success, 
          error: 'Não autorizado'
        },
        { status: 400 });
    }

    console.log(`🔍 [Notifications] Buscando notificações para usuário: ${userId}`);
    const { db } = await connectToDatabase();

    // Consulta CORRETA - buscar notificações do usuário logado
    const notificationsQuery = {
      $or
        { userId.toString() },       // ID no formato string
        { userId ObjectId(userId) },    // ID no formato ObjectId
        { userId: 'todos_usuarios' }         // Notificações globais
      ]
    };

    console.log(`🔍 [Notifications] Consulta: ${JSON.stringify(notificationsQuery)}`);

    // Obter notificações do usuário
    const notificationsResults = await db
      .collection('notifications')
      .find(notificationsQuery)
      .sort({ read, createdAt: -1 }) // Não lidas primeiro, depois por data recente
      .toArray();

    console.log(`✅ [Notifications] Encontradas ${notificationsResults.length} notificações`);
    console.log("📋 [Notifications] Primeiras notificações:", 
      notificationsResults.slice(0, 3).map(n => ({
        id: _id.toString(),
        userId.userId,
        type.type
      }))
    );

    // Consulta CORRETA - buscar convites do usuário logado
    const lobbyInviteQuery = {
      $or
        { recipient.toString() },    // ID no formato string
        { recipient ObjectId(userId) }, // ID no formato ObjectId
        { inviteeId.toString() }     // Usando campo alternativo
      ],
      status: 'pending'
    };

    console.log(`🔍 [Notifications] Consulta de convites: ${JSON.stringify(lobbyInviteQuery)}`);

    const lobbyInvites = await db
      .collection('lobbyinvites')
      .find(lobbyInviteQuery)
      .toArray();

    console.log(`✅ [Notifications] Encontrados ${lobbyInvites.length} convites de lobby`);

    // Para cada convite de lobby, obter informações do convidador
    const formattedInvites = [];
    for (const invite of lobbyInvites) {
      let inviter;
      try {
        // Tentar obter dados do convidador
        inviter = await db.collection('users').findOne({
          _id invite.inviter === 'string' ? new ObjectId(invite.inviter) .inviter
        });
      } catch (err) {
        console.error('Erro ao buscar dados do convidador:', err);
        inviter = { username: 'Usuário Desconhecido' };
      }

      // Formatar o convite como uma notificação
      formattedInvites.push({
        id._id ? id._id.toString() : "",
        type: 'lobby_invite',
        userId.recipient?.toString() || userId.toString(),
        read,
        title: 'Convite para Lobby',
        message: `${inviter?.username: 'Alguém'} convidou você para um lobby`,
        createdAt.createdAt instanceof Date ? invite.createdAt.toISOString()  Date().toISOString(),
        data: {
          lobbyId.lobbyId ? lobbyId.lobbyId.toString() : "",
          inviterId?._id?.toString(),
          inviterName?.username,
          inviterAvatar: (inviter as any)?.avatar: null,
          inviteId._id ? inviteId._id.toString() : ""
        }
      });
    }

    // Formatar todas as notificações para o modelo esperado pelo cliente
    const formattedNotifications = data: notificationsResults.map(notification => {
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

    console.log(`📊 [Notifications] Total: ${allNotifications.length}, Não lidas: ${unreadCount}`);

    // Retornar resposta no formato esperado pelo frontend
    return NextResponse.json({
      success,
      data);
  } catch (error) {
    console.error('❌ [DEBUG] API Notifications - Erro ao buscar notificações:', error);
    return NextResponse.json(
      { 
        success, 
        error: 'Erro ao buscar notificações'
      },
      { status: 400 });
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
          success, 
          error: 'Não autorizado'
        },
        { status: 400 });
    }

    const body = await req.json();
    const { targetUserId, type, data = {} } = body;

    if (!targetUserId: !type) {
      return NextResponse.json(
        { 
          success, 
          error: 'ID do usuário alvo e tipo são obrigatórios' 
        },
        { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Criar a notificação
    const notification = {
      userId,
      type,
      data,
      read,
      createdAt: new Date()
    };

    const result = await db.collection('notifications').insertOne(notification);

    // Formatar a notificação criada para retornar ao cliente
    const formattedNotification = formatNotification({
      ...notification,
      _id.insertedId
    });

    return NextResponse.json({
      success,
      data);
  } catch (error) {
    console.error('❌ [DEBUG] API Notifications - Erro ao criar notificação:', error);
    return NextResponse.json(
      { 
        success, 
        error: 'Erro ao criar notificação' 
      },
      { status: 400 });
  }
} 