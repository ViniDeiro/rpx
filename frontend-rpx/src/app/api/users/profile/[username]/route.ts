import { NextResponse, NextRequest } from 'next/server';
import { getModels } from '@/lib/mongodb/models';
import { authMiddleware } from '@/lib/auth/middleware';
import { AuthenticatedRequest } from '@/types/auth';

/**
 * GET - Obter perfil de um usuário específico pelo username
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult as AuthenticatedRequest;
  const currentUserId = authenticatedReq.user.id;
  const username = params.username;
  
  try {
    // Obter os modelos do MongoDB
    const { User } = await getModels();
    
    // Buscar o usuário pelo username
    const user = await User.findOne({ username })
      .select('_id username email avatarUrl profile stats createdAt friends recentMatches achievements rank')
      .exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário está visualizando o próprio perfil
    const isSelf = user._id.toString() === currentUserId;
    
    // Buscar o usuário atual para verificar se são amigos
    const currentUser = await User.findById(currentUserId)
      .select('friends')
      .exec();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuário atual não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se os usuários são amigos
    const isFriend = currentUser.friends?.some(
      (friend: any) => friend.userId.toString() === user._id.toString()
    );
    
    // Preparar dados do usuário para resposta
    // Se não for o próprio usuário ou um amigo, limitar as informações visíveis
    const userData = {
      id: user._id,
      username: user.username,
      avatarUrl: user.avatarUrl || '/images/avatars/default.svg',
      profile: {
        bio: user.profile?.bio || '',
        level: user.profile?.level || 1,
        xp: isSelf || isFriend ? (user.profile?.xp || 0) : undefined
      },
      stats: {
        matches: user.stats?.matches || 0,
        wins: user.stats?.wins || 0
      },
      rank: user.rank || { tier: 'unranked', division: null, points: 0 },
      createdAt: user.createdAt,
      achievements: isSelf || isFriend ? user.achievements || [] : [],
      recentMatches: isSelf || isFriend ? user.recentMatches || [] : []
    };
    
    // Retornar os dados do perfil
    return NextResponse.json({
      user: userData
    });
    
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar perfil do usuário' },
      { status: 500 }
    );
  }
} 