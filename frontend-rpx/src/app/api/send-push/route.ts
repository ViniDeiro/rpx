import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    console.log('Firebase Admin inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin:', error);
  }
}

/**
 * API para envio de notificações push
 * POST /api/send-push
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação do usuário (apenas usuários autenticados ou servidor)
    const session = await getServerSession(authOptions);
    const isServer = req.headers.get('x-api-key') === process.env.API_SECRET_KEY;
    
    if (!session && !isServer) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter dados da requisição
    const body = await req.json();
    const { token, notification, userId, topic } = body;

    // Validar dados
    if (!notification || (!token && !userId && !topic)) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    let result;

    // Enviar para um token específico
    if (token) {
      result = await admin.messaging().send({
        token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        webpush: {
          notification: {
            icon: notification.icon || '/icons/logo192.png',
            badge: '/icons/badge.png',
            vibrate: [100, 50, 100],
            actions: notification.actions || [],
            data: notification.data || {},
            requireInteraction: true,
          },
        },
        data: notification.data || {},
      });
    } 
    // Enviar para um usuário específico (buscar tokens no banco)
    else if (userId) {
      // Buscar tokens no banco
      const userTokens = await admin.firestore().collection('pushTokens')
        .where('userId', '==', userId)
        .get();
      
      if (userTokens.empty) {
        return NextResponse.json(
          { error: 'Usuário não possui tokens registrados' },
          { status: 404 }
        );
      }

      const tokens = userTokens.docs.map(doc => doc.data().token);
      
      // Enviar para múltiplos tokens
      result = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        webpush: {
          notification: {
            icon: notification.icon || '/icons/logo192.png',
            badge: '/icons/badge.png',
            vibrate: [100, 50, 100],
            actions: notification.actions || [],
            data: notification.data || {},
            requireInteraction: true,
          },
        },
        data: notification.data || {},
      });
    }
    // Enviar para um tópico
    else if (topic) {
      result = await admin.messaging().sendToTopic(topic, {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        webpush: {
          notification: {
            icon: notification.icon || '/icons/logo192.png',
            badge: '/icons/badge.png',
            vibrate: [100, 50, 100],
            actions: notification.actions || [],
            data: notification.data || {},
            requireInteraction: true,
          },
        },
        data: notification.data || {},
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Notificação enviada com sucesso',
      result
    });
  } catch (error) {
    console.error('Erro ao enviar notificação push:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar notificação push' },
      { status: 500 }
    );
  }
} 