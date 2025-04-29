import { request, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';

export async function POST(request) {
  // Verificar se estamos no ambiente de desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Esta rota só está disponível em ambiente de desenvolvimento' },
      { status: 403 }
    );
  }
  
  try {
    // Obter o email do corpo da requisição
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Buscar o usuário
    const user = await db.collection('users').findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { error: `Usuário com email ${email} não encontrado` },
        { status: 404 }
      );
    }
    
    // Atualizar o usuário para ser administrador
    const result = await db.collection('users').updateOne(
      { email },
      { $set: { isAdmin: true, role: 'admin', updatedAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Falha ao atualizar usuário' },
        { status: 500 }
      );
    }
    
    // Retornar sucesso
    return NextResponse.json({
      success: true,
      message: `Usuário ${email} promovido a administrador`,
      user: {
        id: user._id.toString(),
        email: email,
        name: user.name || user.username
      }
    });
  } catch (error) {
    console.error('Erro ao promover administrador:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

// Para uso com método GET também (mais fácil de testar)
export async function GET(request) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  
  if (!email) {
    return NextResponse.json(
      { error: 'Email é obrigatório como parâmetro de consulta' },
      { status: 400 }
    );
  }
  
  // Implementar a mesma lógica do POST diretamente aqui
  // Verificar se estamos no ambiente de desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Esta rota só está disponível em ambiente de desenvolvimento' },
      { status: 403 }
    );
  }
  
  try {
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Buscar o usuário
    const user = await db.collection('users').findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { error: `Usuário com email ${email} não encontrado` },
        { status: 404 }
      );
    }
    
    // Atualizar o usuário para ser administrador
    const result = await db.collection('users').updateOne(
      { email },
      { $set: { isAdmin: true, role: 'admin', updatedAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Falha ao atualizar usuário' },
        { status: 500 }
      );
    }
    
    // Retornar sucesso
    return NextResponse.json({
      success: true,
      message: `Usuário ${email} promovido a administrador`,
      user: {
        id: user._id.toString(),
        email: email,
        name: user.name || user.username
      }
    });
  } catch (error) {
    console.error('Erro ao promover administrador via GET:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
} 