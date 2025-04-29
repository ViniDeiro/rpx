import { NextResponse } from 'next/server';

import { getModels } from '@/lib/mongodb/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST - Desbloquear um usuário
 * Body: { userId }
 */
export async function POST(req) {
  try {
    // Autenticar o usuário
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 400 });
    }
    
    // Obter o ID do usuário atual
    const currentUserId = session.user.id;
    
    // Obter o ID do usuário a ser desbloqueado
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário a ser desbloqueado é obrigatório' },
        { status: 400 });
    }
    
    // Obter os modelos do MongoDB
    const { User } = await getModels();
    
    // Buscar o usuário atual
    const currentUser = await User.findById(currentUserId)
      .select('blockedUsers')
      .exec();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuário atual não encontrado' },
        { status: 400 });
    }
    
    // Verificar se o usuário está bloqueado
    const isBlocked = currentUser.blockedUsers?.some(
      (blocked) => blocked.userId ? blocked.userId.toString() : "" === userId
    );
    
    if (!isBlocked) {
      return NextResponse.json(
        { error: 'Este usuário não está bloqueado' },
        { status: 400 });
    }
    
    // Remover da lista de bloqueados
    await User.findByIdAndUpdate(
      currentUserId,
      { $pull: { blockedUsers);
    
    return NextResponse.json({
      message: 'Usuário desbloqueado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao desbloquear usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao processar o desbloqueio de usuário' },
      { status: 400 });
  }
} 