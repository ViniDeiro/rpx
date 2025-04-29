import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: Retorna informações de diagnóstico sobre a sessão atual
export async function GET(request) {
  try {
    // Dados de diagnóstico
    const debug = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      serverInfo: {
        nodeVersion: process.version,
        platform: process.platform
      }
    };
    
    // Verificar cookies (nomes apenas, sem valores para segurança)
    const cookieHeader = request.headers.get('cookie');
    debug.cookies = {
      count: cookieHeader ? cookieHeader.split(';').length : 0,
      names: cookieHeader ? cookieHeader.split(';').map(c => c.split('=')[0].trim()) : []
    };
    
    // Verificar sessão
    const session = await getServerSession(authOptions);
    debug.session = {
      exists: !!session,
      user: session ? {
        id: session.user?.id || 'missing',
        email: session.user?.email || 'missing',
        name: session.user?.name || 'missing',
        image: session.user?.image ? 'present' : 'missing'
      } : null,
      expires: session?.expires || null
    };
    
    // Incluir headers relevantes (sem informações sensíveis)
    debug.headers = {
      userAgent: request.headers.get('user-agent'),
      accept: request.headers.get('accept'),
      contentType: request.headers.get('content-type'),
      host: request.headers.get('host'),
      referer: request.headers.get('referer')
    };
    
    return NextResponse.json(debug);
  } catch (error) {
    console.error('Erro no diagnóstico:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar diagnóstico', message: error.message },
      { status: 500 }
    );
  }
} 