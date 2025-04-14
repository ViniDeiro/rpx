import { NextRequest, NextResponse } from 'next/server';
import { getModels } from '@/lib/mongodb/models';
import { authMiddleware, isAdmin } from '@/lib/auth/middleware';

// GET - Listar usuários (apenas para administradores)
export async function GET(req: NextRequest) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult;
  
  // Verificar se o usuário é administrador
  if (!isAdmin(authenticatedReq)) {
    return NextResponse.json(
      { error: 'Acesso não autorizado. Apenas administradores podem acessar esta rota.' },
      { status: 403 }
    );
  }
  
  try {
    // Obter parâmetros de consulta
    const url = new URL(authenticatedReq.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    
    // Calcular o skip para paginação
    const skip = (page - 1) * limit;
    
    // Obter os modelos do MongoDB
    const { User } = await getModels();
    
    // Construir a consulta de filtro
    const filter = search 
      ? {
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { 'profile.name': { $regex: search, $options: 'i' } }
          ]
        } 
      : {};
    
    // Executar a consulta com paginação
    const users = await User.find(filter)
      .select('-password') // Excluir o campo de senha
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Ordenar por data de criação (mais recente primeiro)
    
    // Contar o total de usuários para a paginação
    const total = await User.countDocuments(filter);
    
    // Retornar os usuários e informações de paginação
    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao listar usuários' },
      { status: 500 }
    );
  }
} 