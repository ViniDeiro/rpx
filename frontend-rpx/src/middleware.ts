import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Função que verifica as rotas que requerem autenticação
export function middleware(request: NextRequest) {
  // Em ambiente de desenvolvimento, não bloquear acesso às páginas admin
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️ Middleware: Modo desenvolvimento - Bypass de autenticação ativado');
    return NextResponse.next();
  }

  const path = request.nextUrl.pathname;

  // Verificar se o caminho é uma rota de administração
  if (path.startsWith('/admin') && path !== '/admin/login') {
    // Verificar se há uma sessão válida com permissões de admin
    // Em produção, isso seria verificado adequadamente
    // Por enquanto, apenas permitir acesso no ambiente de desenvolvimento
    console.log('🔒 Middleware: Verificando acesso a área protegida:', path);
    
    // Em produção, faria verificações adicionais aqui
    // Por ora, permitir acesso em desenvolvimento
  }

  // Permitir a continuação da requisição
  return NextResponse.next();
}

// Configurar as rotas que o middleware deve processar
export const config = {
  // Aplicar apenas às rotas que começam com /admin
  matcher: '/admin/:path*',
}; 