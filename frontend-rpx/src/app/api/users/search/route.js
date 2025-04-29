import { NextResponse } from 'next/server';
import { getModels } from '@/lib/mongodb/models';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';

/**
 * API para buscar usuários pelo nome
 * Query params (query de busca)
 */
export async function GET(req) {
  try {
    // Autenticar a requisição
    const authResult = await authMiddleware(req);
    
    // Se authResult é uma resposta (erro), retorná-la
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    // Obter ID do usuário dos headers
    const userId = getUserId(authResult);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 });
    }
    
    // Extrair parâmetros de busca da URL
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get('q');
    
    if (!searchQuery || searchQuery.trim().length < 3) {
      return NextResponse.json(
        { error: 'Termo de busca deve ter no mínimo 3 caracteres' },
        { status: 400 });
    }
    
    // Obter os modelos do MongoDB
    const { User } = await getModels();
    
    // Buscar o usuário atual para verificar amigos
    const currentUser = await User.findById(userId)
      .select('friends sentFriendRequests friendRequests')
      .exec();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 });
    }
    
    // Buscar usuários pelo nome ou username
    const foundUsers = await User.find({
      $or: [
        { username: { $regex: searchQuery, $options: 'i' } },
        { 'profile.name': { $regex: searchQuery, $options: 'i' } }
      ],
      _id: { $ne: userId } // Excluir o próprio usuário
    })
    .select('_id username profile.avatar profile.level stats')
    .limit(10)
    .exec();
    
    // Mapear os resultados para incluir status da amizade
    const users = foundUsers.map(user => {
      const userIdStr = user._id.toString();
      
      // Verificar se já são amigos
      const isFriend = currentUser.friends?.some(
        (friend) => friend.userId.toString() === userIdStr
      );
      
      // Verificar se existe solicitação enviada
      const hasSentRequest = currentUser.sentFriendRequests?.some(
        (request) => request.userId.toString() === userIdStr
      );
      
      // Verificar se existe solicitação recebida
      const hasReceivedRequest = currentUser.friendRequests?.some(
        (request) => request.userId.toString() === userIdStr
      );
      
      // Determinar o status da relação
      let status = 'none';
      if (isFriend) status = 'friend';
      else if (hasSentRequest) status = 'sent';
      else if (hasReceivedRequest) status = 'received';
      
      // Retornar dados formatados
      return {
        id: user._id,
        username: user.username,
        avatarUrl: user.profile?.avatar || '/images/avatars/default.svg',
        level: user.profile?.level || 1,
        status,
        stats: user.stats || {
          wins: 0,
          matches: 0,
          winRate: 0
        }
      };
    });
    
    console.log(`Encontrados ${users.length} usuários para a busca: "${searchQuery}"`);
    
    // Retornar resultados
    return NextResponse.json({
      users
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 });
  }
} 