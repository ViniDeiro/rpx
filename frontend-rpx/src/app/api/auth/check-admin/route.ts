import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Endpoint rápido que apenas verifica se o usuário atual tem permissões de administrador
 * Otimizado para desempenho, não faz consultas ao banco de dados além das necessárias
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Em ambiente de desenvolvimento, sempre permitir acesso admin
    // ISSO É APENAS PARA DESENVOLVIMENTO! REMOVER EM PRODUÇÃO!
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ MODO DESENVOLVIMENTO: Acesso admin liberado automaticamente');
      return NextResponse.json(
        { 
          authorized: true,
          user: {
            email: 'dev@example.com',
            name: 'Dev Mode',
            id: 'dev-user-id'
          },
          warning: 'Modo de desenvolvimento - acesso admin automático'
        }, 
        { status: 200 }
      );
    }
    
    // Obter a sessão do usuário via Next-Auth
    const session = await getServerSession(authOptions);
    
    // Verificar se a sessão existe e contém propriedade isAdmin
    if (!session || !session.user || session.user.isAdmin !== true) {
      console.log(`Verificação admin: Negado (${Date.now() - startTime}ms)`);
      return NextResponse.json(
        { 
          authorized: false,
          message: 'Usuário não tem permissões de administrador' 
        }, 
        { status: 403 }
      );
    }
    
    console.log(`Verificação admin: Autorizado para ${session.user.email || 'usuário desconhecido'} (${Date.now() - startTime}ms)`);
    
    // Usuário é admin, retornar sucesso
    return NextResponse.json(
      { 
        authorized: true,
        user: {
          email: session.user.email,
          name: session.user.name,
          id: session.user.id
        }
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao verificar status de admin:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar permissões de administrador' },
      { status: 500 }
    );
  }
} 