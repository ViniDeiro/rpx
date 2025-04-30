import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// POST: Fazer login
export async function POST(request) {
  try {
    console.log('Recebida requisição de login');
    
    // Obter dados do corpo da requisição
    const body = await request.json();
    
    // Validar dados
    const { email, password } = body;
    if (!email || !password) {
      console.log('Requisição inválida: email ou senha não fornecidos');
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }
    
    console.log(`Tentativa de login para o email: ${email}`);
    
    // Conectar ao banco de dados
    let db;
    try {
      console.log('Tentando conectar ao MongoDB via Mongoose...');
      const conn = await connectToDatabase();
      db = conn.db;
      
      // Verificar se a conexão está funcionando
      const collections = await db.listCollections().toArray();
      console.log(`Conexão MongoDB estabelecida. ${collections.length} coleções encontradas.`);
      console.log('Coleções disponíveis:', collections.map(c => c.name).join(', '));
    } catch (dbError) {
      console.error('Erro detalhado ao conectar ao MongoDB:', dbError);
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados. Verifique se o MongoDB está em execução.' },
        { status: 500 }
      );
    }
    
    // Verificar se a coleção de usuários existe
    try {
      const collections = await db.listCollections({name: 'users'}).toArray();
      if (collections.length === 0) {
        console.error('Coleção de usuários não existe no banco de dados!');
        return NextResponse.json(
          { error: 'Configuração do banco de dados incompleta. Entre em contato com o administrador.' },
          { status: 500 }
        );
      }
    } catch (collError) {
      console.error('Erro ao verificar coleções:', collError);
    }
    
    // Buscar usuário pelo email com tratamento de erro detalhado
    let user;
    try {
      console.log(`Buscando usuário com email: ${email}`);
      user = await db.collection('users').findOne({ email });
      if (user) {
        console.log(`Usuário encontrado. ID: ${user._id}`);
      } else {
        console.log('Usuário não encontrado na base de dados');
      }
    } catch (findError) {
      console.error('Erro detalhado ao buscar usuário:', findError);
      return NextResponse.json(
        { error: 'Erro ao verificar credenciais. Por favor, tente novamente.' },
        { status: 500 }
      );
    }
    
    // Verificar se o usuário existe
    if (!user) {
      console.log('Usuário não encontrado - retornando credenciais inválidas');
      // Criar usuário de teste em desenvolvimento para facilitar o login
      if (process.env.NODE_ENV === 'development') {
        console.log('Ambiente de desenvolvimento detectado. Criando usuário de teste...');
        try {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash('teste123', salt);
          
          const testUser = {
            username: 'usuarioteste',
            email: 'teste@rpx.com',
            password: hashedPassword,
            name: 'Usuário Teste',
            role: 'user',
            createdAt: new Date(),
            wallet: { balance: 100 },
            stats: { matches: 0, wins: 0, losses: 0 }
          };
          
          await db.collection('users').insertOne(testUser);
          console.log('Usuário de teste criado com sucesso!');
          console.log('Você pode fazer login com:');
          console.log('Email: teste@rpx.com');
          console.log('Senha: teste123');
        } catch (createError) {
          console.error('Não foi possível criar usuário de teste:', createError);
        }
      }
      
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }
    
    // Verificar se a senha está correta
    let isPasswordValid;
    try {
      console.log('Verificando senha...');
      isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('Resultado da verificação de senha:', isPasswordValid ? 'válida' : 'inválida');
    } catch (bcryptError) {
      console.error('Erro ao verificar senha com bcrypt:', bcryptError);
      // Verificar se a senha está armazenada de forma compatível com bcrypt
      console.log('Formato da senha armazenada:', user.password ? user.password.substring(0, 10) + '...' : 'indefinida');
      return NextResponse.json(
        { error: 'Erro ao verificar credenciais' },
        { status: 500 }
      );
    }
    
    if (!isPasswordValid) {
      console.log('Senha incorreta');
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }
    
    // Gerar token JWT
    const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
    if (!process.env.JWT_SECRET) {
      console.warn('JWT_SECRET não está definido. Usando valor padrão (não recomendado para produção)');
    }
    
    try {
      console.log('Gerando token JWT...');
      const token = jwt.sign(
        {
          userId: user._id ? user._id.toString() : "",
          email: user.email,
          username: user.username,
          role: user.role || 'user'
        },
        jwtSecret,
        { expiresIn: '30d' }
      );
      
      // Atualizar último login
      try {
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: { lastLoginAt: new Date() } }
        );
      } catch (updateError) {
        console.warn('Erro ao atualizar lastLoginAt:', updateError);
        // Continuar mesmo se falhar (não é crítico)
      }
      
      console.log('Login bem-sucedido para o usuário:', user.username);
      
      // Criar resposta com dados do usuário
      const userData = {
        id: user._id ? user._id.toString() : "",
        username: user.username,
        email: user.email,
        name: user.name || user.username,
        role: user.role || 'user',
        isAdmin: user.role === 'admin' || user.isAdmin || false,
        balance: user.wallet?.balance || user.balance || 0,
        avatarUrl: user.avatarUrl || null,
        wallet: user.wallet || { balance: 0 },
        stats: user.stats || {},
        rank: user.rank || { tier: 'bronze', division: null, points: 0 }
      };
      
      // Criar resposta com cookie
      const response = NextResponse.json({
        user: userData,
        token
      });
      
      // Definir cookie de autenticação
      response.cookies.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        sameSite: 'lax'
      });
      
      return response;
    } catch (jwtError) {
      console.error('Erro ao gerar token JWT:', jwtError);
      return NextResponse.json(
        { error: 'Erro ao processar autenticação' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro não tratado ao fazer login:', error);
    return NextResponse.json(
      { error: 'Erro ao processar login. Por favor, tente novamente mais tarde.' },
      { status: 500 }
    );
  }
} 