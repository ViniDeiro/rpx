import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Endpoint para configurar usuários de teste (apenas para desenvolvimento)
export async function POST(request) {
  try {
    // Esta rota só está disponível em ambiente de desenvolvimento
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Esta rota só está disponível em ambiente de desenvolvimento' },
        { status: 403 }
      );
    }
    
    // Obter os usuários do corpo da requisição
    const body = await request.json();
    const { users } = body;
    
    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: 'Array de usuários vazio ou inválido' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Limpar coleção de usuários atual (apenas para desenvolvimento)
    await db.collection('users').deleteMany({});
    
    // Inserir novos usuários
    const result = await db.collection('users').insertMany(users);
    
    return NextResponse.json({
      success: true,
      message: `${users.length} usuários inseridos com sucesso`,
      count: users.length
    });
    
  } catch (error) {
    console.error('Erro ao definir usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao definir usuários', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Verificar ambiente
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Esta rota só está disponível em ambiente de desenvolvimento' },
        { status: 403 }
      );
    }
    
    // Verificar se temos usuários em cache
    if (cachedUsers.length === 0) {
      return NextResponse.json(
        { message: 'Nenhum usuário disponível no cache' },
        { status: 404 }
      );
    }
    
    // Retornar os usuários em cache
    return NextResponse.json(cachedUsers);
  } catch (error) {
    console.error('❌ Erro ao obter usuários do cache:', error);
    return NextResponse.json(
      { error: 'Erro ao obter usuários do cache', details: error.message },
      { status: 500 }
    );
  }
} 