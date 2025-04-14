import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Interface para o payload do token JWT
interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Middleware para verificar a autenticação
export async function authMiddleware(req: NextRequest) {
  try {
    // Obter o token do cabeçalho Authorization ou do cookie
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 401 }
      );
    }

    // Verificar e decodificar o token JWT
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Adicionar o usuário decodificado à requisição (usando o campo de cabeçalho personalizado)
    const headers = new Headers(req.headers);
    headers.set('x-user-id', decoded.userId);
    headers.set('x-user-role', decoded.role);

    // Criar uma nova requisição com os headers atualizados
    const newRequest = new NextRequest(req.url, {
      method: req.method,
      headers,
      body: req.body,
      cache: req.cache,
      credentials: req.credentials,
      integrity: req.integrity,
      keepalive: req.keepalive,
      mode: req.mode,
      redirect: req.redirect,
      referrer: req.referrer,
      referrerPolicy: req.referrerPolicy,
    });

    return newRequest;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json(
        { error: 'Token expirado' },
        { status: 401 }
      );
    }

    console.error('Erro na autenticação:', error);
    return NextResponse.json(
      { error: 'Erro na autenticação' },
      { status: 500 }
    );
  }
}

// Verificar se o usuário é administrador
export function isAdmin(req: NextRequest): boolean {
  const role = req.headers.get('x-user-role');
  return role === 'admin';
}

// Obter o ID do usuário da requisição
export function getUserId(req: NextRequest): string | null {
  return req.headers.get('x-user-id');
} 