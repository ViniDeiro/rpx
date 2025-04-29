import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Endpoint rápido que apenas verifica se o usuário atual tem permissões de administrador
 * Otimizado para desempenho, não faz consultas ao banco de dados além das necessárias
 */
export async function GET(request) {
  try {
    const startTime = Date.now();
    
    // Em ambiente de desenvolvimento, sempre permitir acesso admin
    // ISSO É APENAS PARA DESENVOLVIMENTO! REMOVER EM PRODUÇÃO!
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ MODO DESENVOLVIMENTO admin liberado automaticamente');
      return NextResponse.json(
        { 
          authorized,
          user: {
            email: 'dev@example.com',
            name: 'Dev Mode',
            id: 'dev-user-id'
          },
          warning: 'Modo de desenvolvimento - acesso admin automático'
        }, 
        { 
          status,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }
    
    // Obter a sessão do usuário
    const session = await getServerSession(authOptions);
    
    // Verificar se o usuário está autenticado
    if (!session || !session.user) {
      console.log(`Verificação admin (${Date.now() - startTime}ms)`);
      return NextResponse.json(
        { 
          authorized: false,
          message: 'Usuário não autenticado'
        },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }
    
    let isAdmin = false;
    let user = null;
    
    // Verificar no banco de dados
    try {
      const { db } = await connectToDatabase();
      
      // Buscar usuário no banco
      const dbUser = await db.collection('users').findOne(
        { _id: new ObjectId(session.user.id) },
        { projection: { _id: 1, username: 1, email: 1, isAdmin: 1, name: 1 } }
      );
      
      if (dbUser) {
        isAdmin = dbUser.isAdmin === true;
        user = {
          id: dbUser._id.toString(),
          username: dbUser.username || '',
          email: dbUser.email,
          name: dbUser.name || dbUser.username || '',
          isAdmin
        };
      }
    } catch (dbError) {
      console.error('Erro ao verificar administrador no banco:', dbError);
      // Continuar com o que temos da sessão
    }
    
    // Se não encontrou no banco, usar dados da sessão
    if (!user) {
      user = {
        id: session.user.id,
        username: session.user.username || '',
        email: session.user.email,
        name: session.user.name || '',
        isAdmin: session.user.isAdmin === true
      };
    }
    
    console.log(`Verificação admin para ${session.user.email || 'usuário desconhecido'} (${Date.now() - startTime}ms)`);
    
    // Resposta final
    return NextResponse.json(
      {
        authorized: isAdmin,
        user,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('Erro ao verificar status de administrador:', error);
    return NextResponse.json(
      {
        authorized: false,
        error: 'Erro ao verificar permissões'
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
} 