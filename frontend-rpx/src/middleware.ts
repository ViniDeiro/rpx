import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que não precisam de autenticação
const publicRoutes = ['/login', '/cadastro', '/recuperar-senha'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');
  const pathname = request.nextUrl.pathname;

  // Se for uma rota pública, permitir acesso
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Se não tiver token e não for rota pública, redirecionar para login
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 