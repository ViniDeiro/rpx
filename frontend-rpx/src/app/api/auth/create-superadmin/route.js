import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

// Código secreto para configuração inicial
const SETUP_SECRET = process.env.SETUP_SECRET || 'dev_setup_123456';

// POST: Criar um superadmin inicial
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, username, secretCode } = body;
    
    // Verificar o código secreto
    if (secretCode !== SETUP_SECRET) {
      console.log('Tentativa de criar superadmin com código secreto inválido');
      // Retornar 404 como se a rota não existisse para evitar ataques
      return new NextResponse(null, { status: 404 });
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Verificar se já existe algum superadmin
    const existingAdmin = await db.collection('users').findOne({ isAdmin: true });
    
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Já existe um administrador no sistema' },
        { status: 400 }
      );
    }
    
    // Verificar se o email já está em uso
    const existingEmail = await db.collection('users').findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 400 }
      );
    }
    
    // Verificar se o nome de usuário já está em uso
    const existingUsername = await db.collection('users').findOne({ username });
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Este nome de usuário já está em uso' },
        { status: 400 }
      );
    }
    
    // Criar hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Criar o superadmin
    const newAdmin = {
      email,
      username,
      password: hashedPassword,
      name: username,
      isAdmin: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: 'admin'
    };
    
    const result = await db.collection('users').insertOne(newAdmin);
    
    return NextResponse.json({
      message: 'Administrador criado com sucesso',
      userId: result.insertedId.toString()
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar superadmin:', error);
    return NextResponse.json(
      { error: 'Erro ao criar administrador' },
      { status: 500 }
    );
  }
} 