import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Inicializar Firebase Admin se ainda não estiver inicializado
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin:', error);
  }
}

// Definindo interface para o usuário com role
interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string;
  role?: string;
}

interface Session {
  user: User;
}

/**
 * API para registrar tokens de dispositivos para notificações push
 * POST /api/push-tokens - Registrar um novo token
 * DELETE /api/push-tokens - Remover um token
 */

// Registrar token
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter dados da requisição
    const body = await req.json();
    const { token, userId } = body;

    // Validar que o userId na requisição corresponde ao usuário autenticado ou é admin
    if (userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Não autorizado a registrar tokens para outro usuário' },
        { status: 403 }
      );
    }

    // Validar dados
    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 400 }
      );
    }

    // Conectar ao MongoDB
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      );
    }

    // Criar documento para o token se não existir
    const result = await db.collection('pushTokens').updateOne(
      { token, userId },
      { 
        $set: { 
          token,
          userId, 
          updatedAt: new Date() 
        },
        $setOnInsert: { 
          createdAt: new Date() 
        }
      },
      { upsert: true }
    );

    // Registrar no Firestore também para redundância
    await admin.firestore().collection('pushTokens').doc(token).set({
      token,
      userId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: result.upsertedCount > 0 
        ? admin.firestore.FieldValue.serverTimestamp() 
        : admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'Token registrado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao registrar token push:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar token push' },
      { status: 500 }
    );
  }
}

// Remover token
export async function DELETE(req: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter dados da requisição
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const userId = searchParams.get('userId') || session.user.id;

    // Validar que o userId na requisição corresponde ao usuário autenticado ou é admin
    if (userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Não autorizado a remover tokens de outro usuário' },
        { status: 403 }
      );
    }

    // Validar dados
    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 400 }
      );
    }

    // Conectar ao MongoDB
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      );
    }

    // Remover token do MongoDB
    await db.collection('pushTokens').deleteOne({ token, userId });

    // Remover token do Firestore
    await admin.firestore().collection('pushTokens').doc(token).delete();

    return NextResponse.json({
      success: true,
      message: 'Token removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover token push:', error);
    return NextResponse.json(
      { error: 'Erro ao remover token push' },
      { status: 500 }
    );
  }
} 