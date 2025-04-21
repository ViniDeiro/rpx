import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Este middleware será executado em todas as requisições para rotas /admin
export function middleware(request: NextRequest) {
  // Obter o caminho atual da URL
  const path = request.nextUrl.pathname;
  
  // Verificar se estamos acessando uma rota administrativa
  const isAdminRoute = path.startsWith('/admin');
  
  // Verificar se estamos na página de login administrativo
  const isAdminLoginRoute = path === '/admin/login';
  
  // Verificar se o usuário está autenticado como admin
  const isAdminAuth = request.cookies.get('rpx-admin-auth')?.value === 'authenticated';
  
  // Se estiver na página de login e já estiver autenticado como admin, redirecionar para o dashboard
  if (isAdminLoginRoute && isAdminAuth) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  
  // Em todos os outros casos, permitir a requisição
  // O layout de admin já vai lidar com usuários não autenticados
  return NextResponse.next();
}

// Configurar em quais caminhos o middleware será executado
export const config = {
  matcher: [
    // Rotas administrativas
    '/admin/:path*'
  ],
}; 