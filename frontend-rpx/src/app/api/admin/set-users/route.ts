import { NextRequest, NextResponse } from 'next/server';

// Armazenamento em memória para os usuários
let cachedUsers: any[] = [];

export async function POST(request: NextRequest) {
  try {
    // Verificar ambiente
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Esta rota só está disponível em ambiente de desenvolvimento' },
        { status: 403 }
      );
    }
    
    // Obter os usuários do corpo da requisição
    const body = await request.json();
    const { users } = body;
    
    if (!Array.isArray(users)) {
      return NextResponse.json(
        { error: 'A propriedade "users" deve ser um array' },
        { status: 400 }
      );
    }
    
    console.log(`🔄 Definindo ${users.length} usuários manualmente...`);
    
    // Armazenar os usuários em memória
    cachedUsers = users.map(user => ({
      ...user,
      _id: user._id || user.id,
      id: user.id || user._id
    }));
    
    return NextResponse.json({
      success: true,
      message: `${users.length} usuários definidos com sucesso`,
      count: users.length
    });
  } catch (error: any) {
    console.error('❌ Erro ao definir usuários:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao definir usuários' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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
  } catch (error: any) {
    console.error('❌ Erro ao obter usuários do cache:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao obter usuários do cache' },
      { status: 500 }
    );
  }
} 