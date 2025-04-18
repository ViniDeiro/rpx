import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// Middleware para autenticação
async function isAuthenticated() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.id) {
    return { isAuth: false, error: 'Não autorizado', userId: null };
  }
  
  return { isAuth: true, error: null, userId: session.user.id };
}

// GET: Obter solicitações de amizade
export async function GET() {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 401 });
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se temos uma conexão válida
    if (!db) {
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 500 });
    }
    
    // Obter solicitações pendentes para o usuário
    const requests = await db.collection('friendrequests').find({
      recipient: new ObjectId(userId),
      status: 'pending'
    }).toArray();
    
    // Buscar dados dos usuários que enviaram as solicitações
    const userIds = requests.map((request: any) => request.sender);
    const users = await db.collection('users').find({
      _id: { $in: userIds }
    }).toArray();
    
    // Juntar dados da solicitação com dados do usuário
    const requestsWithUserData = requests.map((request: any) => {
      const sender = users.find((user: any) => 
        user._id.toString() === request.sender.toString()
      );
      return {
        ...request,
        sender: sender || { username: 'Usuário desconhecido' }
      };
    });
    
    return NextResponse.json({
      status: 'success',
      requests: requestsWithUserData
    });
  } catch (error: any) {
    console.error('Erro ao obter solicitações de amizade:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao obter solicitações de amizade'
    }, { status: 500 });
  }
}

// POST: Criar solicitação de amizade
export async function POST(request: Request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 401 });
    }
    
    const body = await request.json();
    const { recipientId } = body;
    
    if (!recipientId) {
      return NextResponse.json({
        status: 'error',
        error: 'ID do destinatário não fornecido'
      }, { status: 400 });
    }
    
    // Impedir que o usuário envie solicitação para si mesmo
    if (userId === recipientId) {
      return NextResponse.json({
        status: 'error',
        error: 'Não é possível enviar solicitação para si mesmo'
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se temos uma conexão válida
    if (!db) {
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 500 });
    }
    
    // Verificar se o usuário existe
    const recipient = await db.collection('users').findOne({ 
      _id: new ObjectId(recipientId) 
    });
    
    if (!recipient) {
      return NextResponse.json({
        status: 'error',
        error: 'Usuário não encontrado'
      }, { status: 404 });
    }
    
    // Verificar se já são amigos
    const existingFriendship = await db.collection('friends').findOne({
      $or: [
        { user1: new ObjectId(userId), user2: new ObjectId(recipientId) },
        { user1: new ObjectId(recipientId), user2: new ObjectId(userId) }
      ]
    });
    
    if (existingFriendship) {
      return NextResponse.json({
        status: 'error',
        error: 'Vocês já são amigos'
      }, { status: 400 });
    }
    
    // Verificar se já existe uma solicitação pendente
    const existingRequest = await db.collection('friendrequests').findOne({
      sender: new ObjectId(userId),
      recipient: new ObjectId(recipientId),
      status: 'pending'
    });
    
    if (existingRequest) {
      return NextResponse.json({
        status: 'error',
        error: 'Solicitação já enviada'
      }, { status: 400 });
    }
    
    // Verificar se já existe uma solicitação pendente inversa (o outro usuário já enviou para você)
    const inverseRequest = await db.collection('friendrequests').findOne({
      sender: new ObjectId(recipientId),
      recipient: new ObjectId(userId),
      status: 'pending'
    });
    
    if (inverseRequest) {
      return NextResponse.json({
        status: 'error',
        error: 'Este usuário já enviou uma solicitação para você'
      }, { status: 400 });
    }
    
    // Criar nova solicitação
    const newRequest = {
      sender: new ObjectId(userId),
      recipient: new ObjectId(recipientId),
      status: 'pending',
      createdAt: new Date()
    };
    
    const result = await db.collection('friendrequests').insertOne(newRequest);
    
    return NextResponse.json({
      status: 'success',
      request: {
        ...newRequest,
        _id: result.insertedId
      }
    });
  } catch (error: any) {
    console.error('Erro ao criar solicitação de amizade:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao criar solicitação de amizade'
    }, { status: 500 });
  }
}

// PUT: Aceitar solicitação de amizade
export async function PUT(request: Request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    
    if (!requestId) {
      return NextResponse.json({
        status: 'error',
        error: 'ID da solicitação não fornecido'
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se temos uma conexão válida
    if (!db) {
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 500 });
    }
    
    // Buscar a solicitação
    const friendRequest = await db.collection('friendrequests').findOne({
      _id: new ObjectId(requestId),
      recipient: new ObjectId(userId),
      status: 'pending'
    });
    
    if (!friendRequest) {
      return NextResponse.json({
        status: 'error',
        error: 'Solicitação não encontrada'
      }, { status: 404 });
    }
    
    // Atualizar a solicitação para aceita
    await db.collection('friendrequests').updateOne(
      { _id: new ObjectId(requestId) },
      { $set: { status: 'accepted' } }
    );
    
    // Criar a amizade em ambas as direções
    const friendship = {
      user1: friendRequest.sender,
      user2: new ObjectId(userId),
      createdAt: new Date()
    };
    
    await db.collection('friends').insertOne(friendship);
    
    return NextResponse.json({
      status: 'success',
      message: 'Solicitação de amizade aceita com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao aceitar solicitação de amizade:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao aceitar solicitação de amizade'
    }, { status: 500 });
  }
}

// DELETE: Rejeitar solicitação de amizade
export async function DELETE(request: Request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    
    if (!requestId) {
      return NextResponse.json({
        status: 'error',
        error: 'ID da solicitação não fornecido'
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se temos uma conexão válida
    if (!db) {
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 500 });
    }
    
    // Atualizar a solicitação para rejeitada
    const result = await db.collection('friendrequests').updateOne(
      { 
        _id: new ObjectId(requestId), 
        recipient: new ObjectId(userId) 
      },
      { $set: { status: 'rejected' } }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({
        status: 'error',
        error: 'Solicitação não encontrada'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Solicitação de amizade rejeitada com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao rejeitar solicitação de amizade:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao rejeitar solicitação de amizade'
    }, { status: 500 });
  }
} 