import { NextRequest, NextResponse } from 'next/server';
import { getModels } from '@/lib/mongodb/models';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';

// GET - Obter perfil do usuário
export async function GET(req: NextRequest) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult;
  
  try {
    // Obter ID do usuário da requisição autenticada
    const userId = getUserId(authenticatedReq);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não encontrado na requisição' },
        { status: 400 }
      );
    }
    
    // Obter modelos do MongoDB
    const { User } = await getModels();
    
    // Buscar usuário pelo ID
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Retornar dados do usuário
    return NextResponse.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        stats: user.stats,
        wallet: {
          balance: user.wallet?.balance || 0
        },
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao obter perfil do usuário' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar perfil do usuário
export async function PUT(req: NextRequest) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult;
  
  try {
    // Obter ID do usuário da requisição autenticada
    const userId = getUserId(authenticatedReq);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não encontrado na requisição' },
        { status: 400 }
      );
    }
    
    // Obter dados da requisição
    const body = await req.json();
    const { name, bio, location, socialLinks } = body;
    
    // Obter modelos do MongoDB
    const { User } = await getModels();
    
    // Buscar usuário pelo ID
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Atualizar dados do perfil
    user.profile = {
      ...user.profile,
      name: name || user.profile?.name,
      bio: bio !== undefined ? bio : user.profile?.bio,
      location: location !== undefined ? location : user.profile?.location,
      socialLinks: socialLinks ? {
        ...user.profile?.socialLinks,
        ...socialLinks
      } : user.profile?.socialLinks
    };
    
    user.updatedAt = new Date();
    
    // Salvar usuário atualizado
    await user.save();
    
    // Retornar dados atualizados
    return NextResponse.json({
      message: 'Perfil atualizado com sucesso',
      user: {
        id: user._id,
        username: user.username,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil do usuário' },
      { status: 500 }
    );
  }
} 