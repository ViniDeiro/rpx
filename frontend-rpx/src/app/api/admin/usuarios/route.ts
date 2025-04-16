import { NextRequest, NextResponse } from 'next/server';
import { getModels } from '@/lib/mongodb/models';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, isAdmin } from '@/lib/auth/middleware';

// Definindo os tipos com base no que esperamos do banco de dados
interface UserDB {
  id: number;
  name: string | null;
  email: string;
  role: string;
  status: string | null;
  createdAt: Date;
  lastLogin: Date | null;
  wallet?: {
    balance: number;
  } | null;
}

export async function GET(request: NextRequest) {
  try {
    // Autenticação e verificação de admin
    const req = await authMiddleware(request);
    if (req instanceof NextResponse) return req; // Erro de autenticação
    
    if (!isAdmin(req)) {
      return NextResponse.json(
        { error: 'Acesso negado. É necessário ser administrador.' },
        { status: 403 }
      );
    }
    
    // Conectar ao banco
    await connectToDatabase();
    const { User } = await getModels();
    
    // Buscar usuários, excluindo superadmins e usuários ocultos
    const usuarios = await User.find({ 
      $and: [
        { role: { $ne: 'superadmin' } },
        { isHidden: { $ne: true } }
      ]
    }).select('-password');

    // Formatar os dados para a resposta
    const formattedUsuarios = usuarios.map(user => ({
      id: user._id,
      nome: user.profile?.name || user.username,
      email: user.email,
      tipoUsuario: user.role,
      status: user.status || 'ativo',
      dataCadastro: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '',
      ultimoLogin: user.lastLogin ? new Date(user.lastLogin).toISOString().split('T')[0] : '',
      saldo: user.wallet?.balance || 0,
    }));

    return NextResponse.json(formattedUsuarios);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar usuários', error: (error as Error).message },
      { status: 500 }
    );
  }
} 