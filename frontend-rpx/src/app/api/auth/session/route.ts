import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';
import { encode, decode } from 'next-auth/jwt';
import { getJwtSecret } from '@/lib/environment';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { userId, email, name, image } = data;
    
    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Dados de usuário insuficientes' },
        { status: 400 }
      );
    }
    
    // Criar um token JWT com os dados do usuário
    const secret = getJwtSecret();
    const token = await encode({
      token: {
        sub: userId,
        email,
        name,
        picture: image || null,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 dias
      },
      secret,
    });
    
    // Configurar o cookie de sessão
    const cookieStore = cookies();
    cookieStore.set({
      name: 'next-auth.session-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60, // 30 dias
      path: '/',
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao sincronizar sessão:', error);
    return NextResponse.json(
      { error: 'Erro interno ao sincronizar sessão' },
      { status: 500 }
    );
  }
} 