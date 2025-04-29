import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signOut } from 'next-auth/react';

export async function POST() {
  try {
    const cookieStore = cookies();
    
    // Limpar todos os cookies relacionados à autenticação
    cookieStore.delete('auth_token');
    cookieStore.delete('next-auth.session-token');
    cookieStore.delete('next-auth.callback-url');
    cookieStore.delete('next-auth.csrf-token');
    cookieStore.delete('rpx-admin-auth');
    
    // Definir cookies com expiração imediata como backup
    cookieStore.set({
      name: 'auth_token',
      value: '',
      expires: new Date(0),
      path: '/',
    });
    
    cookieStore.set({
      name: 'next-auth.session-token',
      value: '',
      expires: new Date(0),
      path: '/',
    });
    
    cookieStore.set({
      name: 'rpx-admin-auth',
      value: '',
      expires: new Date(0),
      path: '/',
    });
    
    return NextResponse.json(
      { success: true, message: 'Logout realizado com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao realizar logout:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar logout' },
      { status: 500 }
    );
  }
}

// Rota GET para suportar logout via navegação direta
export async function GET() {
  return POST();
} 