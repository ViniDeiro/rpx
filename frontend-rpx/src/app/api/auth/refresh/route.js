import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { getJwtSecret } from '@/lib/environment';
import mongoose from 'mongoose';

/**
 * POST - Renovar token JWT
 * Endpoint que recebe um token válido e emite um novo com prazo de validade estendido
 */
export async function POST(request) {
  try {
    // Obter o token do cabeçalho de autorização
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Obter a chave secreta JWT
    const jwtSecret = getJwtSecret();
    
    // Verificar e decodificar o token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, jwtSecret);
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }
    
    // Extrair informações do usuário do token
    const { userId, email, username, role } = decodedToken;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Token inválido (sem ID de usuário)' },
        { status: 401 }
      );
    }
    
    // Conectar ao banco de dados para confirmar que o usuário ainda existe
    const { db } = await connectToDatabase();
    
    // Verificar se o usuário existe
    const user = await db.collection('users').findOne({ 
      _id: { $in: [userId, new mongoose.Types.ObjectId(userId)] }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Gerar um novo token com prazo de expiração atualizado
    const newToken = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role || 'user'
      },
      jwtSecret,
      { expiresIn: '30d' } // Aumentar o tempo de expiração para 30 dias
    );
    
    // Atualizar a data do último login
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date() } }
    );
    
    console.log(`Token renovado com sucesso para ${username}`);
    
    // Retornar o novo token
    return NextResponse.json({
      message: 'Token renovado com sucesso',
      token: newToken
    });
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    return NextResponse.json(
      { error: 'Erro interno ao renovar token' },
      { status: 500 }
    );
  }
} 