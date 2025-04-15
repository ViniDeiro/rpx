import { NextResponse, NextRequest } from 'next/server';
import { getModels } from '@/lib/mongodb/models';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';
import { AuthenticatedRequest } from '@/types/auth';

/**
 * API para buscar usuários pelo nome
 * Query params: q (query de busca)
 */
export async function GET(req: NextRequest) {
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
        { status: 401 }
      );
    }
    
    // Extrair parâmetros de busca da URL
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get('q');
    
    if (!searchQuery || searchQuery.trim().length < 2) {
      return NextResponse.json(
        { error: 'A busca deve ter pelo menos 2 caracteres' },
        { status: 400 }
      );
    }

    // Obter os modelos do MongoDB
    const { User } = await getModels();

    // Buscar usuários que correspondam à consulta
    const users = await User.find({
      username: { $regex: searchQuery, $options: 'i' },
      _id: { $ne: userId } // Excluir o próprio usuário dos resultados
    })
    .select('_id username avatarUrl profile stats')
    .limit(10)
    .exec();
    
    // Buscar o usuário atual para verificar amizades e solicitações
    const currentUser = await User.findById(userId)
      .select('friends friendRequests sentFriendRequests')
      .exec();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Mapear resultado para incluir status da amizade
    const usersWithStatus = users.map((user: any) => {
      const userIdStr = user._id.toString();
      
      // Verificar se já são amigos
      const isFriend = currentUser.friends?.some(
        (friend: any) => friend.userId.toString() === userIdStr
      );
      
      // Verificar se existe solicitação enviada
      const hasSentRequest = currentUser.sentFriendRequests?.some(
        (request: any) => request.userId.toString() === userIdStr
      );
      
      // Verificar se existe solicitação recebida
      const hasReceivedRequest = currentUser.friendRequests?.some(
        (request: any) => request.userId.toString() === userIdStr
      );
      
      // Determinar o status da relação
      let status = 'none';
      if (isFriend) status = 'friend';
      else if (hasSentRequest) status = 'sent';
      else if (hasReceivedRequest) status = 'received';
      
      // Retornar dados formatados
      return {
        id: userIdStr,
        username: user.username,
        avatarUrl: user.avatarUrl || '/images/avatars/default.svg',
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
      users: usersWithStatus
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
} 