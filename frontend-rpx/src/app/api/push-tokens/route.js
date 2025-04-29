import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import admin, { initializeFirebaseAdmin } from '@/lib/firebase/admin';

// Inicializar o Firebase Admin SDK
const firebaseAdmin = initializeFirebaseAdmin();

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
    const session = await getServerSession(authOptions);
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
        $set: {
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    // Registrar no Firestore também para redundância
    await firebaseAdmin.firestore().collection('pushTokens').doc(token).set({
      token,
      userId: userId,
      updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      createdAt: result.upsertedCount > 0 
        ? firebaseAdmin.firestore.FieldValue.serverTimestamp() 
        : firebaseAdmin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return NextResponse.json({
      success: true,
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
    const session = await getServerSession(authOptions);
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
    await firebaseAdmin.firestore().collection('pushTokens').doc(token).delete();

    return NextResponse.json({
      success: true,
      message: 'Token removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover token push:', error);
    return NextResponse.json(
      { error: 'Erro ao remover token push' },
      { status: 400 });
  }
} 