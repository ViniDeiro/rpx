import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Verificar permissão de administrador
async function isAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.id) {
    return false;
  }
  
  const { db } = await connectToDatabase();
  
  const user = await db.collection('users').findOne({
    _id: new ObjectId(session.user.id)
  });
  
  return user && user.isAdmin === true;
}

export async function GET(request) {
  try {
    // Verificar permissão
    if (!await isAdmin()) {
      return NextResponse.json(
        { error: 'Acesso negado. É necessário ser administrador.' },
        { status: 403 }
      );
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Obter parâmetros de consulta
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Criar filtro de pesquisa
    const filter = {};
    if (query) {
      filter.$or = [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ];
    }
    
    // Contar total de usuários
    const total = await db.collection('users').countDocuments(filter);
    
    // Obter usuários com paginação
    const users = await db.collection('users')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
    
    // Formatar resposta
    const formattedUsers = users.map(user => ({
      id: user._id ? user._id.toString() : "",
      username: user.username,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin || false,
      isActive: user.isActive || true,
      createdAt: user.createdAt,
      balance: user.balance || 0,
      currentRank: user.currentRank || 'Novato'
    }));
    
    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao listar usuários', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Verificar permissão
    if (!await isAdmin()) {
      return NextResponse.json(
        { error: 'Acesso negado. É necessário ser administrador.' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Validar dados
    if (!body.username || !body.email) {
      return NextResponse.json(
        { error: 'Nome de usuário e e-mail são obrigatórios.' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Verificar se já existe usuário com este email ou username
    const existingUser = await db.collection('users').findOne({
      $or: [
        { email: body.email },
        { username: body.username }
      ]
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este e-mail ou nome de usuário já está em uso.' },
        { status: 409 }
      );
    }
    
    // Criar objeto do usuário
    const newUser = {
      username: body.username,
      email: body.email,
      name: body.name || body.username,
      isAdmin: body.isAdmin === true,
      isActive: body.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
      balance: body.balance || 0,
      currentRank: 'Novato',
      rankingPoints: 0
    };
    
    // Inserir usuário
    const result = await db.collection('users').insertOne(newUser);
    
    return NextResponse.json({
      message: 'Usuário criado com sucesso',
      userId: result.insertedId ? result.insertedId.toString() : ""
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário', details: error.message },
      { status: 500 }
    );
  }
} 