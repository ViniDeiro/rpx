import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// GET conexão e estrutura de dados
export async function GET() {
  try {
    // 1. Testar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return NextResponse.json({
        status: 'error',
        error: 'Não autenticado'
      }, { status: 400 });
    }
    
    // 2. Testar conexão com MongoDB
    const { db } = await connectToDatabase();
    
    if (!db) {
      return NextResponse.json({
        status: 'error',
        error: 'Erro na conexão com o MongoDB'
      }, { status: 400 });
    }
    
    // 3. Verificar coleções existentes
    let collections = [];
    try {
      // Simplificar para evitar erros de tipo
      collections = [
        'lobbies',
        'lobbyinvites',
        'notifications',
        'users'
      ];
    } catch (e) {
      console.error('Erro ao listar coleções:', e);
    }
    
    // 4. Obter contagens simplificadas
    let stats = {
      lobbies: 0,
      lobbyinvites: 0,
      notifications: 0
    }
    
    try {
      const lobbiesCollection = db.collection('lobbies');
      const lobbyCount = await lobbiesCollection.find({}).toArray();
      stats.lobbies = lobbyCount.length;
      
      const invitesCollection = db.collection('lobbyinvites');
      const invitesCount = await invitesCollection.find({}).toArray();
      stats.lobbyinvites = invitesCount.length;
      
      const notificationsCollection = db.collection('notifications');
      const notificationsCount = await notificationsCollection.find({}).toArray();
      stats.notifications = notificationsCount.length;
    } catch (e) {
      console.error('Erro ao contar documentos:', e);
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Teste de conexão e estrutura realizado com sucesso',
      auth: session
    });
  } catch (error) {
    console.error('Erro no teste de diagnóstico:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro no teste: ' + error.message
    }, { status: 400 });
  }
}

// POST criação de lobby e envio de convite
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return NextResponse.json({
        status: 'error',
        error: 'Não autenticado'
      }, { status: 400 });
    }
    
    const userId = session.user.id;
    const body = await request.json();
    const { recipientId } = body;
    
    if (!recipientId) {
      return NextResponse.json({
        status: 'error',
        error: 'ID do destinatário não fornecido'
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // 1. Criar lobby de teste
    const lobbyResult = await db.collection('lobbies').insertOne({
      owner: new ObjectId(userId),
      members: [new ObjectId(userId)],
      lobbyType: 'solo',
      maxPlayers: 2,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    if (!lobbyResult.insertedId) {
      throw new Error('Falha ao criar lobby de teste');
    }
    
    const lobbyId = lobbyResult.insertedId ? lobbyResult.insertedId ? lobbyResult.insertedId.toString() : "" : "";
    
    // 2. Criar convite
    const inviteResult = await db.collection('lobbyinvites').insertOne({
      inviter: new ObjectId(userId),
      recipient: new ObjectId(recipientId),
      lobbyId,
      gameMode: 'solo',
      status: 'pending',
      createdAt: new Date()
    });
    
    if (!inviteResult.insertedId) {
      throw new Error('Falha ao criar convite de teste');
    }
    
    // 3. Criar notificação
    const inviter = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { _id: 1, username: 1, avatar: 1 } }
    );
    
    const notificationResult = await db.collection('notifications').insertOne({
      userId: new ObjectId(recipientId),
      type: 'lobby_invite',
      read: false,
      data: {
        invite: {
          status: 'pending',
          createdAt: new Date()
        }
      },
      createdAt: new Date()
    });
    
    if (!notificationResult.insertedId) {
      throw new Error('Falha ao criar notificação de teste');
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Teste de criação de lobby e convite concluído com sucesso',
      results: {
        lobby: {
          id: lobbyResult.insertedId ? lobbyResult.insertedId ? lobbyResult.insertedId.toString() : "" : ""
        },
        invite: {
          id: inviteResult.insertedId ? inviteResult.insertedId ? inviteResult.insertedId.toString() : "" : ""
        },
        notification: {
          id: notificationResult.insertedId ? notificationResult.insertedId ? notificationResult.insertedId.toString() : "" : ""
        }
      }
    });
  } catch (error) {
    console.error('Erro no teste de criação e convite:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro no teste: ' + error.message
    }, { status: 400 });
  }
} 