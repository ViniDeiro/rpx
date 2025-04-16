import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getModels } from '@/lib/mongodb/models';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, isAdmin } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e permissão de admin
    const req = await authMiddleware(request);
    if (req instanceof NextResponse) return req; // Erro de autenticação
    
    if (!isAdmin(req)) {
      return NextResponse.json(
        { error: 'Acesso negado. É necessário ser administrador.' },
        { status: 403 }
      );
    }
    
    // Obter dados do corpo da requisição
    const body = await request.json();
    const { username, email, password, nome, permissao = 'admin' } = body;
    
    // Validações básicas
    if (!username || !email || !password || !nome) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }
    
    // Validar senha (mínimo 6 caracteres)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    await connectToDatabase();
    const { User } = await getModels();
    
    // Verificar se o usuário já existe
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });
    
    if (existingUser) {
      if (existingUser.email.toLowerCase() === email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Este email já está em uso' },
          { status: 400 }
        );
      }
      if (existingUser.username.toLowerCase() === username.toLowerCase()) {
        return NextResponse.json(
          { error: 'Este nome de usuário já está em uso' },
          { status: 400 }
        );
      }
    }
    
    // Limitar que apenas superadmins possam criar outros superadmins
    const currentUserRole = req.headers.get('x-user-role');
    if (permissao === 'superadmin' && currentUserRole !== 'superadmin') {
      return NextResponse.json(
        { error: 'Apenas superadministradores podem criar outros superadministradores' },
        { status: 403 }
      );
    }
    
    // Criar hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Criar novo admin
    const novoAdmin = new User({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: permissao === 'superadmin' ? 'superadmin' : 'admin',
      isHidden: false,
      isVerified: true,
      status: 'active',
      profile: {
        name: nome
      },
      wallet: {
        balance: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await novoAdmin.save();
    
    // Retornar sucesso
    return NextResponse.json({
      message: 'Administrador criado com sucesso',
      admin: {
        id: novoAdmin._id,
        username: novoAdmin.username,
        email: novoAdmin.email,
        role: novoAdmin.role
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar administrador:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a criação do administrador' },
      { status: 500 }
    );
  }
} 