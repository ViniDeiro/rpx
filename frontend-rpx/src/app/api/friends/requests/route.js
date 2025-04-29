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

// GET solicitações de amizade
export async function GET() {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se temos uma conexão válida
    if (!db) {
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 400 });
    }
    
    // Obter solicitações pendentes para o usuário
    const requests = await db.collection('friendrequests').find({
      recipient: ObjectId(userId),
      status: 'pending'
    }).toArray();
    
    // Buscar dados dos usuários que enviaram as solicitações
    const userIds = requests.map((request) => request.sender);
    const users = await db.collection('users').find({
      _id: { $in: userIds }
    }).toArray();
    
    // Juntar dados da solicitação com dados do usuário
    const requestsWithUserData = requests.map((request) => {
      const sender = users.find((user) => 
        user._id ? user._id.toString() : "" === request.sender ? request.sender.toString() : ""
      );
      return {
        ...request,
        sender: sender || { username: 'Usuário desconhecido' }
      };
    });
    
    return NextResponse.json({
      status: 'success',
      requests
    });
  } catch (error) {
    console.error('Erro ao obter solicitações de amizade:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao obter solicitações de amizade'
    }, { status: 400 });
  }
}

// POST solicitação de amizade
export async function POST(request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 400 });
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
      }, { status: 400 });
    }
    
    // Verificar se o usuário existe
    const recipient = await db.collection('users').findOne({
      _id: new ObjectId(recipientId)
    });
    
    if (!recipient) {
      return NextResponse.json({
        status: 'error',
        error: 'Usuário não encontrado'
      }, { status: 400 });
    }
    
    // Verificar se já são amigos
    const existingFriendship = await db.collection('friends').findOne({
      $or: [
        { user1: ObjectId(userId), user2: ObjectId(recipientId) },
        { user1: ObjectId(recipientId), user2: ObjectId(userId) }
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
      sender: ObjectId(userId),
      recipient: ObjectId(recipientId),
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
      sender: ObjectId(recipientId),
      recipient: ObjectId(userId),
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
      sender: ObjectId(userId),
      recipient: ObjectId(recipientId),
      status: 'pending',
      createdAt: new Date()
    };
    
    const result = await db.collection('friendrequests').insertOne(newRequest);
    
    return NextResponse.json({
      status: 'success',
      request: result
    });
  } catch (error) {
    console.error('Erro ao criar solicitação de amizade:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao criar solicitação de amizade'
    }, { status: 400 });
  }
}

// PUT solicitação de amizade
export async function PUT(request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 400 });
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
      }, { status: 400 });
    }
    
    // Buscar a solicitação
    const friendRequest = await db.collection('friendrequests').findOne({
      _id: new ObjectId(requestId),
      recipient: ObjectId(userId),
      status: 'pending'
    });
    
    if (!friendRequest) {
      return NextResponse.json({
        status: 'error',
        error: 'Solicitação não encontrada'
      }, { status: 400 });
    }
    
    // Atualizar a solicitação para aceita
    await db.collection('friendrequests').updateOne(
      { _id: new ObjectId(requestId) },
      { $set: { status: 'accepted' } }
    );
    
    // Criar a amizade em ambas as direções
    const friendship = {
      user1: friendRequest.sender,
      user2: ObjectId(userId),
      createdAt: new Date()
    };
    
    await db.collection('friends').insertOne(friendship);
    
    return NextResponse.json({
      status: 'success',
      message: 'Solicitação de amizade aceita com sucesso'
    });
  } catch (error) {
    console.error('Erro ao aceitar solicitação de amizade:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao aceitar solicitação de amizade'
    }, { status: 400 });
  }
}

// DELETE solicitação de amizade
export async function DELETE(request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 400 });
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
      }, { status: 400 });
    }
    
    // Atualizar a solicitação para rejeitada
    const result = await db.collection('friendrequests').updateOne(
      { 
        _id: new ObjectId(requestId), 
        recipient: ObjectId(userId) 
      },
      { $set: { status: 'rejected' } }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({
        status: 'error',
        error: 'Solicitação não encontrada'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Solicitação de amizade rejeitada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao rejeitar solicitação de amizade:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao rejeitar solicitação de amizade'
    }, { status: 400 });
  }
} 