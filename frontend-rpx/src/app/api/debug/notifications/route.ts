import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { Document, WithId } from 'mongodb';

// Interfaces para tipagem
interface NotificationData {
  amount?: number;
  paymentId?: string;
  method?: string;
  lobbyId?: string;
  inviterId?: string;
  inviterName?: string;
  gameTitle?: string;
  [key: string]: any;
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  userId: string;
  createdAt: string;
  data: NotificationData | null;
}

interface LobbyInvite {
  _id: string;
  lobbyId: string;
  inviteeId: string;
  inviterId: string;
  inviterName: string;
  status: string;
  gameTitle: string;
  createdAt: string;
}

// Notificações de exemplo para testes
const mockNotifications: Notification[] = [
  {
    _id: '65f1a2b3c4d5e6f7a8b9c0d1',
    type: 'system',
    title: 'Bem-vindo ao RPX',
    message: 'Bem-vindo à plataforma RPX! Estamos felizes em tê-lo conosco.',
    read: false,
    userId: 'user_test',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    data: null
  },
  {
    _id: '65f1a2b3c4d5e6f7a8b9c0d2',
    type: 'payment',
    title: 'Pagamento Confirmado',
    message: 'Seu pagamento de R$ 50,00 foi confirmado.',
    read: true,
    userId: 'user_test',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    data: {
      amount: 50.00,
      paymentId: 'pay_123456789',
      method: 'pix'
    }
  },
  {
    _id: '65f1a2b3c4d5e6f7a8b9c0d3',
    type: 'lobby_invite',
    title: 'Convite para Lobby',
    message: 'Você foi convidado para participar de uma partida por João Silva',
    read: false,
    userId: 'user_test',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    data: {
      lobbyId: 'lobby_123',
      inviterId: 'user_789',
      inviterName: 'João Silva',
      gameTitle: 'Counter Strike 2'
    }
  }
];

// Mock para convites de lobby
const mockLobbyInvites: LobbyInvite[] = [
  {
    _id: '65f1a2b3c4d5e6f7a8b9c0d4',
    lobbyId: 'lobby_456',
    inviteeId: 'user_test',
    inviterId: 'user_555',
    inviterName: 'Maria Oliveira',
    status: 'pending',
    gameTitle: 'League of Legends',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    console.log('Debug API - Notificações - Ação:', action);

    // Conectar ao banco de dados, se necessário
    let dbConnection = null;
    try {
      dbConnection = await connectToDatabase();
      console.log('Conexão com banco de dados bem-sucedida');
    } catch (dbError) {
      console.error('Erro ao conectar ao banco de dados:', dbError);
      // Continuar com dados mockados se o banco de dados falhar
    }

    // Ação para buscar notificações
    if (action === 'fetch') {
      // Tentar buscar do banco de dados primeiro, se estivermos conectados
      let notifications: Notification[] = [...mockNotifications];
      let lobbyInvites: LobbyInvite[] = [...mockLobbyInvites];
      
      if (dbConnection) {
        try {
          const { db } = dbConnection;
          
          // Buscar as notificações reais, limitando a 20 para não sobrecarregar
          const realNotifications = await db
            .collection('notifications')
            .find({})
            .sort({ createdAt: -1 })
            .limit(20)
            .toArray();
            
          // Buscar os convites reais pendentes
          const realInvites = await db
            .collection('lobbyInvites')
            .find({ status: 'pending' })
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray();
            
          // Usar dados reais se existirem, caso contrário manter os mockados
          if (realNotifications.length > 0) {
            notifications = realNotifications.map((doc: WithId<Document>) => ({
              _id: doc._id.toString(),
              type: doc.type as string,
              title: doc.title as string,
              message: doc.message as string,
              read: doc.read as boolean,
              userId: doc.userId as string,
              createdAt: doc.createdAt as string,
              data: doc.data as NotificationData | null
            }));
          }
          
          if (realInvites.length > 0) {
            lobbyInvites = realInvites.map((doc: WithId<Document>) => ({
              _id: doc._id.toString(),
              lobbyId: doc.lobbyId as string,
              inviteeId: doc.inviteeId as string,
              inviterId: doc.inviterId as string,
              inviterName: doc.inviterName as string,
              status: doc.status as string,
              gameTitle: doc.gameTitle as string,
              createdAt: doc.createdAt as string
            }));
          }
        } catch (fetchError) {
          console.error('Erro ao buscar dados do banco:', fetchError);
          // Manter os dados mockados em caso de erro
        }
      }
      
      // Formatar os convites de lobby como notificações
      const formattedInvites = lobbyInvites.map(invite => ({
        _id: invite._id.toString(),
        type: 'lobby_invite',
        title: `Convite para ${invite.gameTitle}`,
        message: `Você foi convidado para jogar ${invite.gameTitle} por ${invite.inviterName}`,
        read: false,
        userId: invite.inviteeId,
        createdAt: invite.createdAt,
        data: {
          lobbyId: invite.lobbyId,
          inviterId: invite.inviterId,
          inviterName: invite.inviterName,
          gameTitle: invite.gameTitle
        }
      }));
      
      // Combinar as notificações tradicionais com os convites formatados
      const allNotifications = [...notifications, ...formattedInvites]
        .sort((a, b) => {
          // Ordenar por lido/não lido e depois por data
          if (a.read === b.read) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return a.read ? 1 : -1;
        });
        
      return NextResponse.json({
        success: true,
        data: {
          notifications: allNotifications,
          count: allNotifications.length
        }
      });
    } 
    // Ação para criar uma nova notificação
    else if (action === 'create') {
      try {
        const body = await request.json();
        const { type, title, message } = body;
        
        if (!type || !title || !message) {
          return NextResponse.json({
            success: false,
            error: 'Dados incompletos para criar notificação'
          }, { status: 400 });
        }
        
        const notification = {
          _id: new mongoose.Types.ObjectId().toString(),
          type,
          title,
          message,
          read: false,
          userId: 'user_test',
          createdAt: new Date().toISOString(),
          data: body.data || null
        };
        
        // Salvar no banco de dados se estiver conectado
        if (dbConnection) {
          try {
            const { db } = dbConnection;
            // Remover o _id em string para que o MongoDB gere um ObjectId
            const { _id, ...notificationWithoutId } = notification;
            await db.collection('notifications').insertOne(notificationWithoutId);
            console.log('Notificação salva no banco de dados');
          } catch (insertError) {
            console.error('Erro ao salvar notificação no banco:', insertError);
          }
        }
        
        return NextResponse.json({
          success: true,
          data: {
            notification
          }
        });
      } catch (parseError) {
        console.error('Erro ao processar os dados da solicitação:', parseError);
        return NextResponse.json({
          success: false,
          error: 'Erro ao processar os dados da solicitação'
        }, { status: 400 });
      }
    }
    // Ação para limpar todas as notificações
    else if (action === 'clear') {
      if (dbConnection) {
        try {
          // Não excluir do banco real, apenas retornar sucesso para manter segurança
          console.log('Simulando limpeza de notificações (sem excluir dados reais)');
        } catch (clearError) {
          console.error('Erro ao limpar notificações:', clearError);
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Simulação de limpeza de notificações concluída'
      });
    }
    // Ação para marcar como lida
    else if (action === 'mark_read') {
      try {
        const body = await request.json();
        const { notificationId } = body;
        
        if (!notificationId) {
          return NextResponse.json({
            success: false,
            error: 'ID da notificação não fornecido'
          }, { status: 400 });
        }
        
        // Atualizar no banco de dados se estiver conectado
        if (dbConnection) {
          try {
            const { db } = dbConnection;
            await db.collection('notifications').updateOne(
              { _id: new mongoose.Types.ObjectId(notificationId) },
              { $set: { read: true } }
            );
            console.log('Notificação marcada como lida no banco de dados');
          } catch (updateError) {
            console.error('Erro ao marcar notificação como lida:', updateError);
          }
        }
        
        return NextResponse.json({
          success: true,
          message: 'Notificação marcada como lida'
        });
      } catch (parseError) {
        console.error('Erro ao processar os dados da solicitação:', parseError);
        return NextResponse.json({
          success: false,
          error: 'Erro ao processar os dados da solicitação'
        }, { status: 400 });
      }
    }
    // Ação para marcar todas como lidas
    else if (action === 'mark_all_read') {
      // Atualizar no banco de dados se estiver conectado
      if (dbConnection) {
        try {
          const { db } = dbConnection;
          await db.collection('notifications').updateMany(
            { userId: 'user_test', read: false },
            { $set: { read: true } }
          );
          console.log('Todas as notificações marcadas como lidas no banco de dados');
        } catch (updateError) {
          console.error('Erro ao marcar todas as notificações como lidas:', updateError);
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Todas as notificações foram marcadas como lidas'
      });
    }
    // Ação para responder a um convite
    else if (action === 'respond_invite') {
      try {
        const body = await request.json();
        const { inviteId, response } = body;
        
        if (!inviteId || !response) {
          return NextResponse.json({
            success: false,
            error: 'Dados incompletos para responder ao convite'
          }, { status: 400 });
        }
        
        // Atualizar no banco de dados se estiver conectado
        if (dbConnection) {
          try {
            const { db } = dbConnection;
            await db.collection('lobbyInvites').updateOne(
              { _id: new mongoose.Types.ObjectId(inviteId) },
              { $set: { status: response === 'accept' ? 'accepted' : 'rejected' } }
            );
            console.log(`Convite ${inviteId} ${response === 'accept' ? 'aceito' : 'recusado'}`);
          } catch (updateError) {
            console.error('Erro ao atualizar status do convite:', updateError);
          }
        }
        
        return NextResponse.json({
          success: true,
          message: `Convite ${response === 'accept' ? 'aceito' : 'recusado'} com sucesso`
        });
      } catch (parseError) {
        console.error('Erro ao processar os dados da solicitação:', parseError);
        return NextResponse.json({
          success: false,
          error: 'Erro ao processar os dados da solicitação'
        }, { status: 400 });
      }
    }
    // Ação para simular um convite para lobby
    else if (action === 'simulate_invite') {
      const newInviteId = new mongoose.Types.ObjectId().toString();
      const games = ['Counter Strike 2', 'League of Legends', 'Valorant', 'Fortnite', 'Apex Legends'];
      const names = ['Lucas Silva', 'Pedro Santos', 'Ana Oliveira', 'Juliana Ferreira', 'Rafael Costa'];
      
      const randomGame = games[Math.floor(Math.random() * games.length)];
      const randomName = names[Math.floor(Math.random() * names.length)];
      
      const newInvite: LobbyInvite = {
        _id: newInviteId,
        lobbyId: `lobby_${Math.floor(Math.random() * 1000)}`,
        inviteeId: 'user_test',
        inviterId: `user_${Math.floor(Math.random() * 1000)}`,
        inviterName: randomName,
        status: 'pending',
        gameTitle: randomGame,
        createdAt: new Date().toISOString()
      };
      
      // Salvar no banco de dados se estiver conectado
      if (dbConnection) {
        try {
          const { db } = dbConnection;
          // Remover o _id em string para que o MongoDB gere um ObjectId
          const { _id, ...inviteWithoutId } = newInvite;
          await db.collection('lobbyInvites').insertOne(inviteWithoutId);
          console.log('Convite simulado salvo no banco de dados');
        } catch (insertError) {
          console.error('Erro ao salvar convite simulado:', insertError);
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Convite simulado criado com sucesso',
        data: {
          invite: newInvite
        }
      });
    }
    
    // Ação não reconhecida
    return NextResponse.json({
      success: false,
      error: 'Ação não reconhecida'
    }, { status: 400 });
    
  } catch (error) {
    console.error('Erro na API de depuração de notificações:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    console.log('Debug API - Notificações (POST) - Ação:', action);
    
    // Redirecionar para o método GET com a ação apropriada
    const url = new URL(request.url);
    url.searchParams.set('action', action);
    
    return GET(new NextRequest(url, {
      method: 'GET',
      headers: request.headers,
      body: JSON.stringify(body)
    }));
    
  } catch (error) {
    console.error('Erro na API POST de depuração de notificações:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
} 