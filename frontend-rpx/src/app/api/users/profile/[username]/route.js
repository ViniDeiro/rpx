import { NextResponse, request } from 'next/server';
import { getModels } from '@/lib/mongodb/models';
import { authMiddleware } from '@/lib/auth/middleware';

/**
 * GET - Obter perfil de um usuário específico pelo username
 */
export async function GET(
  req,
  { params }) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult;
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
        { status: 400 });
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
        { status: 400 });
    }
    
    // Verificar se os usuários são amigos
    const isFriend = currentUser.friends?.some(
      (friend) => friend.userId && friend.userId.toString() === user._id.toString()
    );
    
    // Preparar dados do usuário para resposta
    // Se não for o próprio usuário ou um amigo, limitar as informações visíveis
    const userData = {
      id: user._id.toString(),
      username: user.username,
      avatarUrl: user.avatarUrl || '/images/avatars/default.svg',
      profile: {
        bio: user.profile?.bio || '',
        level: user.profile?.level || 1,
        xp: isFriend ? (user.profile?.xp || 0) : 0
      },
      stats: user.stats || {},
      rank: user.rank || { tier: 'unranked', division: 0, points: 0 },
      recentMatches: isFriend ? (user.recentMatches || []) : []
    };
    
    // Retornar os dados do perfil
    return NextResponse.json({
      user: userData
    });
    
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar perfil do usuário' },
      { status: 400 });
  }
} 