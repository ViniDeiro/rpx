import { request, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Valores padrão para preferências
const defaultPreferences = {
  email: {
    matches: true,
    payments: true,
    tournaments: true,
    friends: true,
    updates: true
  },
  push: {
    matches: true,
    payments: true,
    tournaments: true,
    friends: true,
    updates: true
  }
};

/**
 * GET - Obter preferências de notificação do usuário
 */
export async function GET(req) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 400 });
    }

    // Conectar ao banco de dados
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Erro de conexão com o banco de dados' },
        { status: 400 });
    }

    // Buscar preferências do usuário
    const userId = session.user.id;
    const userPreferences = await db.collection('userPreferences').findOne({
      userId: userId,
      type: 'notifications'
    });

    // Se não existir, retornar valores padrão
    if (!userPreferences) {
      return NextResponse.json({
        success: true,
        preferences: defaultPreferences
      });
    }

    // Retornar preferências encontradas
    return NextResponse.json({
      success: true,
      preferences: userPreferences.preferences || defaultPreferences
    });
  } catch (error) {
    console.error('Erro ao buscar preferências de notificação:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar requisição' },
      { status: 400 });
  }
}

/**
 * POST - Salvar preferências de notificação do usuário
 */
export async function POST(req) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 400 });
    }

    // Obter dados da requisição
    const body = await req.json();
    const { preferences } = body;

    // Validar dados
    if (!preferences || !preferences.email || !preferences.push) {
      return NextResponse.json(
        { success: false, error: 'Preferências inválidas' },
        { status: 400 });
    }

    // Conectar ao banco de dados
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Erro de conexão com o banco de dados' },
        { status: 400 });
    }

    // Salvar preferências do usuário
    const userId = session.user.id;
    
    // Usar upsert para criar ou atualizar
    const result = await db.collection('userPreferences').updateOne(
      { userId: userId, type: 'notifications' },
      { 
        $set: {
          preferences: preferences,
          updatedAt: new Date()
        },
        $setOnInsert: { 
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    // Registrar evento de atualização
    await db.collection('userActivity').insertOne({
      userId: userId,
      action: 'update_notification_preferences',
      timestamp: new Date(),
      data: preferences
    });

    return NextResponse.json({
      success: true,
      message: 'Preferências de notificação salvas com sucesso',
      updated: result.modifiedCount > 0,
      created: result.upsertedCount > 0
    });
  } catch (error) {
    console.error('Erro ao salvar preferências de notificação:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar requisição' },
      { status: 400 });
  }
} 