import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';

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

/**
 * API de debug para testar notificações push
 * GET /api/debug/push - Listar todos os tokens
 * POST /api/debug/push - Enviar notificação push para teste
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    // Conectar ao MongoDB
    const { db } = await connectToDatabase();
    
    // Critério de busca
    const criteria = userId ? { userId } : {};
    
    // Obter todos os tokens ou filtrados por userId
    const tokens = await db.collection('pushTokens').find(criteria).toArray();
    
    return NextResponse.json({
      success: true,
      count: tokens.length,
      tokens: tokens
    });
  } catch (error) {
    console.error('Erro ao listar tokens push:', error);
    return NextResponse.json(
      { error: 'Erro ao listar tokens push', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, title, body: messageBody, userId, sendToAll = false } = body;

    if (!sendToAll && !token && !userId) {
      return NextResponse.json(
        { error: 'Necessário fornecer token, userId ou sendToAll=true' },
        { status: 400 }
      );
    }

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'Título e corpo da mensagem são obrigatórios' },
        { status: 400 }
      );
    }

    // Conectar ao MongoDB para buscar tokens
    const { db } = await connectToDatabase();
    
    let tokens: string[] = [];
    
    // Determinar quais tokens usar
    if (sendToAll) {
      // Enviar para todos os tokens
      const allTokens = await db.collection('pushTokens').find({}).toArray();
      tokens = allTokens.map(t => t.token);
    } else if (userId) {
      // Enviar para todos os tokens de um usuário específico
      const userTokens = await db.collection('pushTokens').find({ userId }).toArray();
      tokens = userTokens.map(t => t.token);
    } else if (token) {
      // Enviar para um token específico
      tokens = [token];
    }

    if (tokens.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum token encontrado para enviar notificação' },
        { status: 404 }
      );
    }

    // Preparar a mensagem
    const message = {
      notification: {
        title,
        body: messageBody,
      },
      data: {
        type: 'debug',
        title,
        body: messageBody,
        timestamp: Date.now().toString(),
      },
    };

    // Resultados do envio
    const results = [];
    
    // Enviar para cada token
    for (const deviceToken of tokens) {
      try {
        const result = await admin.messaging().send({
          token: deviceToken,
          ...message,
        });
        
        results.push({
          token: deviceToken,
          success: true,
          messageId: result
        });
      } catch (err) {
        // Se o erro for um token inválido, remover do banco
        const firebaseError = err as { code?: string };
        if (firebaseError.code === 'messaging/invalid-registration-token' || 
            firebaseError.code === 'messaging/registration-token-not-registered') {
          await db.collection('pushTokens').deleteOne({ token: deviceToken });
          
          // Também remover do Firestore
          try {
            await admin.firestore().collection('pushTokens').doc(deviceToken).delete();
          } catch (firestoreErr) {
            console.error('Erro ao remover token do Firestore:', firestoreErr);
          }
        }
        
        results.push({
          token: deviceToken,
          success: false,
          error: firebaseError.code || String(err)
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notificação push enviada',
      sentTo: tokens.length,
      results
    });
  } catch (error) {
    console.error('Erro ao enviar notificação push:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar notificação push', details: String(error) },
      { status: 500 }
    );
  }
} 