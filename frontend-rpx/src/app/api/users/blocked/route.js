import { NextResponse } from 'next/server';

import { getModels } from '@/lib/mongodb/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET - Listar todos os usuários bloqueados
 */
export async function GET(req) {
  try {
    // Autenticar o usuário
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 400 });
    }
    
    // Obter o ID do usuário atual
    const currentUserId = session.user.id;
    
    // Obter os modelos do MongoDB
    const { User } = await getModels();
    
    // Buscar o usuário atual com a lista de bloqueados
    const currentUser = await User.findById(currentUserId)
      .select('blockedUsers')
      .exec();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 400 });
    }
    
    // Retornar a lista de usuários bloqueados
    return NextResponse.json({
      blockedUsers.blockedUsers: []
    });
  } catch (error) {
    console.error('Erro ao listar usuários bloqueados:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a listagem de usuários bloqueados' },
      { status: 400 });
  }
} 