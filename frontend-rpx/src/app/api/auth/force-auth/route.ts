import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getModels } from '@/lib/mongodb/models';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { cookies } from 'next/headers';

// Segredo para o JWT (idealmente deve vir de variáveis de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'rpx-app-secret-key-muito-segura-2024';

export async function POST(request: Request) {
  console.log('🔥 [DEBUG] API FORCE-AUTH - Requisição de sincronização de autenticação recebida');
  
  try {
    // Estabelecer conexão com o banco de dados
    console.log('🔄 [DEBUG] API FORCE-AUTH - Conectando ao MongoDB...');
    await connectToDatabase();
    console.log('✓ [DEBUG] API FORCE-AUTH - Conexão com MongoDB estabelecida');
    
    const body = await request.json();
    
    // Aceitar tanto um token quanto um ID de usuário
    const { token, userId } = body;
    
    if (!token && !userId) {
      console.log('❌ [DEBUG] API FORCE-AUTH - Falha: Token ou ID de usuário não fornecido');
      return NextResponse.json(
        { error: 'Token ou ID de usuário são obrigatórios' },
        { status: 400 }
      );
    }

    // Obter modelos do MongoDB
    const { User } = await getModels();
    
    let userData;
    
    // Se temos um token, verificar e obter o payload
    if (token) {
      try {
        console.log('🔑 [DEBUG] API FORCE-AUTH - Verificando token JWT...');
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✓ [DEBUG] API FORCE-AUTH - Token JWT válido');
        
        if (typeof decoded === 'object' && decoded !== null) {
          // Usar o ID do token para buscar o usuário
          const id = decoded.userId || decoded.id || decoded.sub;
          if (id) {
            console.log(`🔍 [DEBUG] API FORCE-AUTH - Buscando usuário por ID do token: ${id}`);
            userData = await User.findById(id);
          }
        }
      } catch (error) {
        console.error('❌ [DEBUG] API FORCE-AUTH - Token inválido:', error);
        return NextResponse.json(
          { error: 'Token inválido' },
          { status: 401 }
        );
      }
    }
    
    // Se não temos dados do usuário ainda, mas temos um userId, buscar por ID
    if (!userData && userId) {
      console.log(`🔍 [DEBUG] API FORCE-AUTH - Buscando usuário por ID fornecido: ${userId}`);
      userData = await User.findById(userId);
    }
    
    // Se não encontramos o usuário
    if (!userData) {
      console.log('❌ [DEBUG] API FORCE-AUTH - Usuário não encontrado');
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    console.log(`✓ [DEBUG] API FORCE-AUTH - Usuário encontrado: ${userData.username}`);

    // Criar um novo token JWT fresco
    const tokenPayload = {
      id: userData._id,
      userId: userData._id,
      username: userData.username,
      email: userData.email,
      role: userData.role
    };
    
    console.log('🔑 [DEBUG] API FORCE-AUTH - Criando novo token JWT...');
    const newToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
    console.log('✓ [DEBUG] API FORCE-AUTH - Novo token JWT criado');

    // Definir cookie de autenticação
    cookies().set({
      name: 'auth_token',
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/'
    });
    
    // Definir cookie para NextAuth 
    cookies().set({
      name: 'next-auth.session-token',
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/'
    });
    
    console.log('✓ [DEBUG] API FORCE-AUTH - Cookies de autenticação definidos');

    // Preparar dados do usuário para resposta
    const userResponse = {
      id: userData._id,
      username: userData.username,
      email: userData.email,
      role: userData.role,
      profile: userData.profile || {},
      balance: userData.wallet?.balance || 0
    };
    
    // Retornar dados do usuário e token
    console.log('✅ [DEBUG] API FORCE-AUTH - Sincronização realizada com sucesso');
    return NextResponse.json({
      message: 'Autenticação sincronizada com sucesso',
      user: userResponse,
      token: newToken
    });
  } catch (error) {
    console.error('❌ [DEBUG] API FORCE-AUTH - Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a sincronização de autenticação' },
      { status: 500 }
    );
  }
} 