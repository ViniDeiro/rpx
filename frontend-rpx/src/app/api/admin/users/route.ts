import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { connectToDatabase } from '@/lib/mongodb/connect';

// GET: Listar todos os usuários para o admin
export async function GET(request: Request) {
  console.log('Acessando endpoint GET /api/admin/users');
  
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated || !authResult.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Buscar todos os usuários
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();
    
    console.log(`Encontrados ${users.length} usuários`);
    
    // Formatar os dados dos usuários para o frontend
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role || 'user',
      verified: user.isVerified || false,
      status: user.status || 'ativo',
      isAdmin: user.role === 'admin' || user.role === 'superadmin',
      createdAt: user.createdAt || new Date(),
      lastLogin: user.lastLogin || null,
      avatarUrl: user.avatarUrl || null
    }));
    
    return NextResponse.json(formattedUsers);
    
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Falha ao carregar usuários', details: String(error) },
      { status: 500 }
    );
  }
} 