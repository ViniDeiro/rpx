import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

// Chave secreta para desenvolvimento
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_key';

// POST: Forçar autenticação (apenas para desenvolvimento)
export async function POST(request) {
  try {
    // Verificar ambiente
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Esta rota só está disponível em ambiente de desenvolvimento' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Verificar se temos um ID de usuário
    const userId = body.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuário é obrigatório' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Buscar o usuário pelo ID
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Criar token JWT
    const token = jwt.sign(
      {
        userId: user._id ? user._id.toString() : "",
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin === true
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    // Criar resposta com cookie
    const response = NextResponse.json({
      userId: user._id ? user._id.toString() : "",
      username: user.username,
      email: user.email,
      token: token
    });
    
    // Adicionar cookie de autenticação
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24, // 1 dia
      sameSite: 'lax'
    });
    
    return response;
  } catch (error) {
    console.error('Erro ao forçar autenticação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar autenticação', details: error.message },
      { status: 500 }
    );
  }
} 