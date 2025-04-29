import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// POST - Cria usuários iniciais para teste, se não existirem.
// Este endpoint deve ser executado apenas uma vez em desenvolvimento.
export async function POST(request) {
  try {
    // Esta rota só está disponível em ambiente de desenvolvimento
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Esta rota só está disponível em ambiente de desenvolvimento' },
        { status: 403 }
      );
    }

    // Usuários de teste para serem criados
    const TEST_USERS = [
      {
        _id: new ObjectId(),
        name: "Administrador Teste",
        email: "admin@exemplo.com",
        username: "admin",
        password: await bcrypt.hash("admin123", 10),
        role: "admin",
        isAdmin: true,
        isActive: true,
        createdAt: new Date(),
        balance: 5000,
        stats: {
          wins: 10,
          losses: 2,
          matches: 12
        }
      },
      {
        _id: new ObjectId(),
        name: "Usuário Teste",
        email: "user@exemplo.com",
        username: "user",
        password: await bcrypt.hash("user123", 10),
        role: "user",
        isAdmin: false,
        isActive: true,
        createdAt: new Date(),
        balance: 1000,
        stats: {
          wins: 5,
          losses: 3,
          matches: 8
        }
      }
    ];

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Verificar se já existem usuários
    const userCount = await db.collection('users').countDocuments();
    
    if (userCount > 0) {
      return NextResponse.json({
        success: false,
        message: "Usuários já existem no banco de dados",
        userCount
      });
    }
    
    // Inserir usuários de teste
    const result = await db.collection('users').insertMany(TEST_USERS);
    
    if (!result.insertedCount && !result.insertedIds) {
      throw new Error("Falha ao inserir usuários de teste");
    }
    
    return NextResponse.json({
      success: true,
      message: `${TEST_USERS.length} usuários de teste criados com sucesso`,
      userIds: TEST_USERS.map(user => user._id.toString())
    });
    
  } catch (error) {
    console.error("Erro ao criar usuários de teste:", error);
    return NextResponse.json(
      { error: "Erro ao criar usuários de teste", details: error.message },
      { status: 500 }
    );
  }
} 