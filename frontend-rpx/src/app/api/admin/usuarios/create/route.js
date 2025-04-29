import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

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

// POST - Criar novo usuário
export async function POST(request) {
  try {
    // Verificar permissão
    if (!await isAdmin()) {
      return NextResponse.json(
        { error: 'Acesso negado. É necessário ser administrador.' },
        { status: 403 }
      );
    }
    
    // Obter dados do corpo da requisição
    const body = await request.json();
    const { username, email, password, name, role } = body;
    
    // Validar dados
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Dados incompletos. Nome de usuário, e-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Verificar se já existe usuário com este email
    const existingEmail = await db.collection('users').findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Este e-mail já está em uso.' },
        { status: 409 }
      );
    }
    
    // Verificar se já existe usuário com este username
    const existingUsername = await db.collection('users').findOne({ username });
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Este nome de usuário já está em uso.' },
        { status: 409 }
      );
    }
    
    // Criar hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Criar objeto do usuário
    const newUser = {
      username,
      email,
      password: hashedPassword,
      name: name || username,
      role: role || 'user',
      isAdmin: role === 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      balance: 0,
      stats: {
        wins: 0,
        losses: 0,
        matches: 0
      },
      currentRank: 'Novato',
      rankingPoints: 0
    };
    
    // Inserir usuário no banco
    const result = await db.collection('users').insertOne(newUser);
    
    // Registrar ação do admin
    const session = await getServerSession(authOptions);
    await db.collection('admin_logs').insertOne({
      action: 'create_user',
      adminId: session.user.id,
      userId: result.insertedId.toString(),
      details: {
        username,
        email,
        isAdmin: role === 'admin'
      },
      timestamp: new Date()
    });
    
    return NextResponse.json({
      message: 'Usuário criado com sucesso',
      userId: result.insertedId.toString()
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário', details: error.message },
      { status: 500 }
    );
  }
} 