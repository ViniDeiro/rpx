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
    // Processar os dados da requisição primeiro para validar o formato
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Erro ao processar JSON da requisição:', parseError);
      return NextResponse.json(
        { error: 'Formato de requisição inválido' },
        { status: 400 }
      );
    }
    
    const { email, password } = body;
    
    // Validar dados de entrada antes de tentar conexão com o banco
    if (!email || !password) {
      console.log('Login falhou: Email ou senha não fornecidos');
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }
    
    console.log(`Tentativa de login para o email: ${email}`);
    
    // Estabelecer conexão com o banco de dados com timeout reduzido
    try {
      console.log('Conectando ao MongoDB...');
      const dbConnection = await connectToDatabase();
      console.log('Conexão com MongoDB estabelecida');

    // Obter modelos do MongoDB
    const { User } = await getModels();
    
    console.log('Buscando usuário no banco de dados...');
    // Buscar usuário pelo email
      const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log(`Login falhou: Usuário com email ${email} não encontrado`);
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }
    
      console.log(`Usuário encontrado: ${user.username || user.email}`);

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
      balance: user.wallet?.balance || 0,
      createdAt: user.createdAt,
      avatarUrl: user.avatarUrl || null,
      rank: user.rank || {
        tier: 'unranked',
        division: null,
        points: 0
      }
    };
    
    // Retornar dados do usuário e token
    console.log('Login realizado com sucesso');
    return NextResponse.json({
      message: 'Login realizado com sucesso',
      user: userData,
      token
    });
    } catch (dbError: any) {
      // Tratamento específico para erro de conexão com o MongoDB
      console.error('Erro na conexão/operação do MongoDB:', dbError);
      
      const errorMessage = dbError.message || 'Erro ao processar o login';
      const isConnectionError = 
        errorMessage.includes('MongoServerSelection') || 
        errorMessage.includes('connect') ||
        errorMessage.includes('timeout');
        
      if (isConnectionError) {
        return NextResponse.json(
          { 
            error: 'Erro de conexão com o banco de dados',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
          },
          { status: 503 } // Service Unavailable
        );
      }
      
      return NextResponse.json(
        { error: 'Erro ao processar o login', details: errorMessage },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erro geral no processo de login:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error.message
      },
      { status: 500 }
    );
  }
} 