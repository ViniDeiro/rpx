import { NextResponse } from 'next/server';
import { getModels } from '@/lib/mongodb/models';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';

/**
 * POST - Atualizar o status do usuário
 * Body: { status: 'online' | 'offline' | 'in_game' | 'idle' }
 */
export async function POST(req) {
  try {
    // Autenticar a requisição
    const authenticatedReq = await authMiddleware(req);
    
    // Se authenticatedReq é uma resposta (erro), retorná-la
    if (authenticatedReq instanceof NextResponse) {
      return authenticatedReq;
    }
    
    // Obter ID do usuário dos headers
    const userId = getUserId(authenticatedReq);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 });
    }
    
    // Obter os dados da requisição
    const { status } = await req.json();
    
    // Validar o status
    if (!status || !['online', 'offline', 'in_game', 'idle'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Use "online", "offline", "in_game" ou "idle"' },
        { status: 400 });
    }
    
    // Obter os modelos do MongoDB
    const { User } = await getModels();
    
    // Atualizar o status do usuário
    await User.findByIdAndUpdate(
      userId,
      { lastActivity: new Date() }
    );
    
    // Atualizar o status na propriedade de friends para outros usuários
    await User.updateMany(
      { 'friends.userId': userId },
      { 
        $set: { 
          'friends.$.status': status,
          'friends.$.lastActivity': new Date()
        }
      }
    );
    
    // Retornar sucesso
    return NextResponse.json({
      message: 'Status atualizado com sucesso',
      status
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status' },
      { status: 500 });
  }
}

/**
 * GET - Verificar o status atual do usuário
 */
export async function GET(req) {
  try {
    // Autenticar a requisição
    const authenticatedReq = await authMiddleware(req);
    
    // Se authenticatedReq é uma resposta (erro), retorná-la
    if (authenticatedReq instanceof NextResponse) {
      return authenticatedReq;
    }
    
    // Obter ID do usuário dos headers
    const userId = getUserId(authenticatedReq);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 });
    }
    
    // Obter os modelos do MongoDB
    const { User } = await getModels();
    
    // Obter o usuário
    const user = await User.findById(userId)
      .select('lastActivity')
      .exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 });
    }
    
    // Verificar o status atual baseado na última atividade
    const lastActivity = user.lastActivity || user.lastLogin || user.updatedAt;
    let status = 'offline';
    
    if (lastActivity) {
      // Se a última atividade foi nos últimos 5 minutos, considerar online
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      if (lastActivity > fiveMinutesAgo) {
        status = 'online';
      }
    }
    
    // Encontrar status nas listas de amigos
    // Isso é útil para recuperar o status mais preciso (como "em jogo")
    // que foi definido anteriormente e pode não estar refletido apenas pela última atividade
    const userWithStatus = await User.findOne(
      { 'friends.userId': userId },
      { 'friends.$': 1 });
    
    if (userWithStatus && userWithStatus.friends && userWithStatus.friends.length > 0) {
      status = userWithStatus.friends[0].status || status;
    }
    
    // Retornar o status
    return NextResponse.json({ status });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar status' },
      { status: 500 });
  }
} 