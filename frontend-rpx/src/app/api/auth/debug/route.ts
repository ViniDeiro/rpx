import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';

export async function GET(request: NextRequest) {
  try {
    // Dados de diagnóstico
    const debug: Record<string, any> = {
      timestamp: new Date().toISOString(),
    };
    
    // Verificar cookies (nomes apenas, sem valores para segurança)
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      debug.cookies = cookieHeader.split(';').map(c => c.trim().split('=')[0]);
    }
    
    // Obter sessão
    try {
      const session = await getServerSession(authOptions);
      debug.session = session ? {
        exists: true,
        user: session.user ? {
          id: session.user.id || null,
          email: session.user.email || null,
          name: session.user.name || null,
          isAdmin: session.user.isAdmin || false,
          hasAdminProperty: 'isAdmin' in (session.user || {})
        } : null
      } : { exists: false };
    } catch (sessionError: any) {
      debug.sessionError = sessionError?.message || 'Erro desconhecido na sessão';
    }
    
    // Verificar banco de dados
    if (debug.session?.user?.email) {
      try {
        const { db } = await connectToDatabase();
        const user = await db.collection('users').findOne(
          { email: debug.session.user.email },
          { projection: { _id: 1, email: 1, isAdmin: 1, name: 1, username: 1 } }
        );
        
        debug.databaseUser = user ? {
          exists: true,
          id: user._id?.toString() || null,
          email: user.email || null,
          isAdmin: user.isAdmin || false,
          name: user.name || user.username || null,
          hasAdminProperty: 'isAdmin' in user,
          isAdminType: typeof user.isAdmin
        } : { exists: false };
      } catch (dbError: any) {
        debug.dbError = dbError?.message || 'Erro desconhecido no banco de dados';
      }
    }
    
    // Retornar todos os detalhes para diagnóstico
    return NextResponse.json(debug);
    
  } catch (error: any) {
    return NextResponse.json({
      error: error?.message || 'Erro desconhecido',
      stack: process.env.NODE_ENV !== 'production' ? error?.stack : undefined
    }, { status: 500 });
  }
} 