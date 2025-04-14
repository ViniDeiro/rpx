import { NextRequest, NextResponse } from 'next/server';
import { getModels } from '@/lib/mongodb/models';
import { authMiddleware } from '@/lib/auth/middleware';

// Definir tipos para o usuário autenticado
interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    name: string;
    email: string;
    username?: string;
  };
}

/**
 * GET - Buscar usuários por nome de usuário
 * Query params: q (query de busca)
 */
export async function GET(req: NextRequest) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult as AuthenticatedRequest;
  const userId = authenticatedReq.user.id;
  
  try {
    // Extrair parâmetros de busca da URL
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get('q');
    
    if (!searchQuery || searchQuery.trim().length < 3) {
      return NextResponse.json(
        { error: 'A busca deve ter pelo menos 3 caracteres' },
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
    .select('_id username profile.avatar')
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
    const usersWithStatus = users.map(user => {
      const userId = user._id.toString();
      
      // Verificar se já são amigos
      const isFriend = currentUser.friends?.some(
        (friend: any) => friend.userId.toString() === userId
      );
      
      // Verificar se existe solicitação enviada
      const hasSentRequest = currentUser.sentFriendRequests?.some(
        (request: any) => request.userId.toString() === userId
      );
      
      // Verificar se existe solicitação recebida
      const hasReceivedRequest = currentUser.friendRequests?.some(
        (request: any) => request.userId.toString() === userId
      );
      
      // Determinar o status da relação
      let status = 'none';
      if (isFriend) status = 'friend';
      else if (hasSentRequest) status = 'sent';
      else if (hasReceivedRequest) status = 'received';
      
      // Retornar dados formatados
      return {
        id: userId,
        username: user.username,
        avatar: user.profile?.avatar || '/images/avatars/default.svg',
        status
      };
    });
    
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