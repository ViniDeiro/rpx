import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getModels } from '@/lib/mongodb/models';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { cookies } from 'next/headers';

// Segredo para o JWT (idealmente deve vir de variáveis de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  console.log('Requisição de login recebida');
  
  try {
    // Estabelecer conexão com o banco de dados
    console.log('Conectando ao MongoDB...');
    await connectToDatabase();
    console.log('Conexão com MongoDB estabelecida');
    
    const body = await request.json();
    const { email, password } = body;
    
    console.log(`Tentativa de login para o email: ${email}`);

    // Validar dados de entrada
    if (!email || !password) {
      console.log('Login falhou: Email ou senha não fornecidos');
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Obter modelos do MongoDB
    const { User } = await getModels();
    
    console.log('Buscando usuário no banco de dados...');
    // Buscar usuário pelo email
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`Login falhou: Usuário com email ${email} não encontrado`);
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }
    
    console.log(`Usuário encontrado: ${user.username}`);

    // Verificar senha
    console.log('Verificando senha...');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('Login falhou: Senha incorreta');
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }
    
    console.log('Senha verificada com sucesso');

    // Atualizar último login
    user.lastLogin = new Date();
    await user.save();
    console.log('Data de último login atualizada');

    // Criar token JWT
    const tokenPayload = {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    console.log('Criando token JWT...');
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
    console.log('Token JWT criado');

    // Definir cookie de autenticação
    cookies().set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/'
    });
    console.log('Cookie de autenticação definido');

    // Preparar dados do usuário para resposta
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      profile: user.profile || {},
      balance: user.wallet?.balance || 0
    };
    
    // Retornar dados do usuário e token
    console.log('Login realizado com sucesso');
    return NextResponse.json({
      message: 'Login realizado com sucesso',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro ao processar o login' },
      { status: 500 }
    );
  }
} 