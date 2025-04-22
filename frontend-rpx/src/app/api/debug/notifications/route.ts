import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { Document, WithId, ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAuthenticated } from '@/lib/auth/verify';

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

// Função auxiliar para obter o ID do usuário da sessão
async function getUserFromSession(request: NextRequest) {
  try {
    // Método 1: Usar isAuthenticated (recomendado)
    const { isAuth, userId } = await isAuthenticated();
    if (isAuth && userId) {
      console.log('🔑 Usuário autenticado via middleware:', userId);
      return userId.toString();
    }
    
    // Método 2: Usar getServerSession como fallback
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      console.log('🔑 Usuário autenticado via session:', session.user.id);
      return session.user.id;
    }
    
    // Método 3: Extrair do cookie como último recurso (apenas desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader && cookieHeader.includes('next-auth.session-token')) {
        console.log('⚠️ Modo desenvolvimento: usando ID de usuário de teste');
        return 'user_dev_test';
      }
    }
    
    console.log('⚠️ Usuário não autenticado, usando valor padrão para depuração');
    return 'user_test';
  } catch (error) {
    console.error('Erro ao obter usuário da sessão:', error);
    return 'user_test'; // Fallback para depuração
  }
}

// Notificações de exemplo para testes
const mockNotifications: Notification[] = [
  {
    _id: '65f1a2b3c4d5e6f7a8b9c0d1',
    type: 'system',
    title: 'Bem-vindo ao RPX',
    message: 'Bem-vindo à plataforma RPX! Estamos felizes em tê-lo conosco.',
    read: false,
    userId: 'user_test', // Será substituído pelo ID real do usuário
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    data: null
  },
  {
    _id: '65f1a2b3c4d5e6f7a8b9c0d2',
    type: 'payment',
    title: 'Pagamento Confirmado',
    message: 'Seu pagamento de R$ 50,00 foi confirmado.',
    read: true,
    userId: 'user_test', // Será substituído pelo ID real do usuário
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
    userId: 'user_test', // Será substituído pelo ID real do usuário
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
    inviteeId: 'user_test', // Será substituído pelo ID real do usuário
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
    const userId = await getUserFromSession(request);
    
    console.log(`Debug API - Notificações - Ação: ${action}, Usuário: ${userId}`);

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
      let notifications: Notification[] = mockNotifications.map(n => ({
        ...n,
        userId // Substituir pelo ID do usuário real
      }));
      
      let lobbyInvites: LobbyInvite[] = mockLobbyInvites.map(i => ({
        ...i,
        inviteeId: userId // Substituir pelo ID do usuário real
      }));
      
      if (dbConnection) {
        try {
          const { db } = dbConnection;
          
          // Buscar as notificações reais do usuário atual, limitando a 20
          const realNotifications = await db
            .collection('notifications')
            .find({ userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .toArray();
            
          // Buscar os convites reais pendentes para o usuário atual
          const realInvites = await db
            .collection('lobbyInvites')
            .find({ 
              $or: [
                { inviteeId: userId },
                { recipient: userId },
                { recipient: new ObjectId(userId) }
              ], 
              status: 'pending' 
            })
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray();
            
          console.log(`Encontradas ${realNotifications.length} notificações e ${realInvites.length} convites`);
            
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
              inviteeId: doc.inviteeId || doc.recipient as string,
              inviterId: doc.inviterId || doc.inviter as string,
              inviterName: doc.inviterName as string,
              status: doc.status as string,
              gameTitle: doc.gameTitle as string,
              createdAt: doc.createdAt as string
            }));
            
            // Obter informações adicionais dos usuários para melhorar a exibição
            for (let i = 0; i < lobbyInvites.length; i++) {
              const invite = lobbyInvites[i];
              try {
                // Tentativa 1: Tentar com o ID como ObjectId
                let inviterUser = null;
                try {
                  if (typeof invite.inviterId === 'string' && invite.inviterId.match(/^[0-9a-fA-F]{24}$/)) {
                    inviterUser = await db.collection('users').findOne({
                      _id: new ObjectId(invite.inviterId)
                    });
                  }
                } catch (err) {
                  console.log('Erro ao buscar com ObjectId:', err);
                }
                
                // Tentativa 2: Tentar com o ID como string
                if (!inviterUser) {
                  try {
                    inviterUser = await db.collection('users').findOne({
                      username: invite.inviterName
                    });
                  } catch (err) {
                    console.log('Erro ao buscar por username:', err);
                  }
                }
                
                if (inviterUser) {
                  lobbyInvites[i].inviterName = inviterUser.username || inviterUser.name || 'Usuário';
                }
              } catch (userErr) {
                console.error('Erro ao buscar informações do usuário:', userErr);
              }
            }
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
          count: allNotifications.length,
          userId: userId // Incluir o ID do usuário para depuração
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
          userId, // Usar o ID real do usuário
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
          const { db } = dbConnection;
          // Agora podemos realmente excluir notificações do usuário atual, sem afetar outros
          const result = await db.collection('notifications').deleteMany({ 
            userId: userId 
          });
          
          console.log(`Removidas ${result.deletedCount} notificações do usuário ${userId}`);
          
          return NextResponse.json({
            success: true,
            data: {
              deleted: result.deletedCount || 0,
              message: `${result.deletedCount || 0} notificações removidas com sucesso`
            }
          });
        } catch (clearError) {
          console.error('Erro ao limpar notificações:', clearError);
          return NextResponse.json({
            success: false,
            error: 'Erro ao limpar notificações'
          }, { status: 500 });
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
            // Só permitir atualizar notificações do próprio usuário
            await db.collection('notifications').updateOne(
              { 
                _id: new mongoose.Types.ObjectId(notificationId),
                userId: userId
              },
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
          // Só marcar as notificações do usuário atual
          const result = await db.collection('notifications').updateMany(
            { userId: userId, read: false },
            { $set: { read: true } }
          );
          console.log(`${result.modifiedCount} notificações marcadas como lidas para o usuário ${userId}`);
          
          return NextResponse.json({
            success: true,
            data: {
              modifiedCount: result.modifiedCount,
              message: 'Todas as notificações foram marcadas como lidas'
            }
          });
        } catch (updateError) {
          console.error('Erro ao marcar todas as notificações como lidas:', updateError);
          return NextResponse.json({
            success: false,
            error: 'Erro ao marcar notificações como lidas'
          }, { status: 500 });
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
            
            // Verificar se o convite existe e pertence ao usuário atual
            const invite = await db.collection('lobbyInvites').findOne({
              _id: new mongoose.Types.ObjectId(inviteId),
              $or: [
                { inviteeId: userId },
                { recipient: userId },
                { recipient: new ObjectId(userId) }
              ]
            });
            
            if (!invite) {
              return NextResponse.json({
                success: false,
                error: 'Convite não encontrado ou não pertence ao usuário atual'
              }, { status: 404 });
            }
            
            // Atualizar o status do convite
            await db.collection('lobbyInvites').updateOne(
              { _id: new mongoose.Types.ObjectId(inviteId) },
              { $set: { 
                status: response === 'accept' ? 'accepted' : 'rejected',
                respondedAt: new Date()
              } }
            );
            
            // Se aceitou, adicionar o usuário ao lobby
            if (response === 'accept' && invite.lobbyId) {
              try {
                await db.collection('lobbies').updateOne(
                  { _id: new mongoose.Types.ObjectId(invite.lobbyId.toString()) },
                  { $addToSet: { members: userId } }
                );
                console.log(`Usuário ${userId} adicionado ao lobby ${invite.lobbyId}`);
              } catch (lobbyError) {
                console.error('Erro ao adicionar usuário ao lobby:', lobbyError);
              }
            }
            
            console.log(`Convite ${inviteId} ${response === 'accept' ? 'aceito' : 'recusado'} por ${userId}`);
            
            return NextResponse.json({
              success: true,
              data: {
                status: response === 'accept' ? 'accepted' : 'rejected',
                message: `Convite ${response === 'accept' ? 'aceito' : 'recusado'} com sucesso`
              }
            });
          } catch (updateError) {
            console.error('Erro ao atualizar status do convite:', updateError);
            return NextResponse.json({
              success: false,
              error: 'Erro ao atualizar status do convite'
            }, { status: 500 });
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
      const newInviteId = new mongoose.Types.ObjectId();
      const games = ['Counter Strike 2', 'League of Legends', 'Valorant', 'Fortnite', 'Apex Legends'];
      const names = ['Lucas Silva', 'Pedro Santos', 'Ana Oliveira', 'Juliana Ferreira', 'Rafael Costa'];
      
      const randomGame = games[Math.floor(Math.random() * games.length)];
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomInviterId = new mongoose.Types.ObjectId();
      const lobbyId = new mongoose.Types.ObjectId();
      
      const newInvite = {
        _id: newInviteId,
        lobbyId: lobbyId,
        inviteeId: userId,
        recipient: userId,
        inviterId: randomInviterId,
        inviter: randomInviterId,
        inviterName: randomName,
        status: 'pending',
        gameTitle: randomGame,
        createdAt: new Date()
      };
      
      // Salvar no banco de dados se estiver conectado
      if (dbConnection) {
        try {
          const { db } = dbConnection;
          
          // Primeiro criar um lobby simulado
          const lobbyResult = await db.collection('lobbies').insertOne({
            _id: lobbyId,
            name: `Lobby de ${randomName}`,
            game: randomGame,
            maxPlayers: 5,
            owner: randomInviterId,
            members: [randomInviterId.toString()],
            status: 'waiting',
            createdAt: new Date()
          });
          
          console.log(`Lobby simulado criado: ${lobbyId}`);
          
          // Agora criar o convite
          const inviteResult = await db.collection('lobbyInvites').insertOne(newInvite);
          console.log('Convite simulado salvo no banco de dados:', inviteResult.insertedId);
          
          return NextResponse.json({
            success: true,
            message: 'Convite simulado criado com sucesso',
            data: {
              invite: {
                _id: newInviteId.toString(),
                inviteeId: userId,
                inviterId: randomInviterId.toString(),
                inviterName: randomName,
                status: 'pending',
                gameTitle: randomGame,
                lobbyId: lobbyId.toString(),
                createdAt: new Date().toISOString()
              }
            }
          });
        } catch (insertError) {
          console.error('Erro ao salvar convite simulado:', insertError);
          return NextResponse.json({
            success: false,
            error: 'Erro ao criar convite simulado'
          }, { status: 500 });
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Convite simulado criado com sucesso (modo offline)',
        data: {
          invite: {
            _id: newInviteId.toString(),
            inviteeId: userId,
            inviterId: randomInviterId.toString(),
            inviterName: randomName,
            status: 'pending',
            gameTitle: randomGame,
            createdAt: new Date().toISOString()
          }
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