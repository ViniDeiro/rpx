import { request, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Inicializar Firebase Admin se ainda não estiver inicializado
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential.credential.cert({
        projectId.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin:', error);
  }
}

// Definindo interface para o usuário com role




/**
 * API para registrar tokens de dispositivos para notificações push
 * POST /api/push-tokens - Registrar um novo token
 * DELETE /api/push-tokens - Remover um token
 */

// Registrar token
export async function POST(req) {
  try {
    // Verificar autenticação do usuário
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 400 });
    }

    // Obter dados da requisição
    const body = await req.json();
    const { token, userId } = body;

    // Validar que o userId na requisição corresponde ao usuário autenticado ou é admin
    if (userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Não autorizado a registrar tokens para outro usuário' },
        { status: 400 });
    }

    // Validar dados
    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 400 });
    }

    // Conectar ao MongoDB
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 400 });
    }

    // Criar documento para o token se não existir
    const result = await db.collection('pushTokens').updateOne(
      { token, userId },
      { 
        $set, 
          updatedAt: new Date() 
        },
        $setOnInsert: { 
          createdAt: new Date() 
        }
      },
      { upsert }
    );

    // Registrar no Firestore também para redundância
    await admin.firestore().collection('pushTokens').doc(token).set({
      token,
      userId,
      updatedAt.firestore.FieldValue.serverTimestamp(),
      createdAt.upsertedCount > 0 
        ? admin.firestore.FieldValue.serverTimestamp() 
        .firestore.FieldValue.serverTimestamp()
    }, { merge });

    return NextResponse.json({
      success,
      message: 'Token registrado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao registrar token push:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar token push' },
      { status: 400 });
  }
}

// Remover token
export async function DELETE(req) {
  try {
    // Verificar autenticação do usuário
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 400 });
    }

    // Obter dados da requisição
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const userId = searchParams.get('userId') || session.user.id;

    // Validar que o userId na requisição corresponde ao usuário autenticado ou é admin
    if (userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Não autorizado a remover tokens de outro usuário' },
        { status: 400 });
    }

    // Validar dados
    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 400 });
    }

    // Conectar ao MongoDB
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 400 });
    }

    // Remover token do MongoDB
    await db.collection('pushTokens').deleteOne({ token, userId });

    // Remover token do Firestore
    await admin.firestore().collection('pushTokens').doc(token).delete();

    return NextResponse.json({
      success,
      message: 'Token removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover token push:', error);
    return NextResponse.json(
      { error: 'Erro ao remover token push' },
      { status: 400 });
  }
} 