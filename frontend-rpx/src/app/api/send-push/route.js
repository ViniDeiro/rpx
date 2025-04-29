import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import admin, { initializeFirebaseAdmin } from '@/lib/firebase/admin';

/**
 * Opções de mensagem do Firebase
 * @typedef {Object} MessageOptions
 * @property {Object} [data] - Dados adicionais da mensagem
 * @property {Object} [webpush] - Configurações específicas para webpush
 * @property {Object} [webpush.notification] - Configurações da notificação
 * @property {string} [webpush.notification.icon] - Ícone da notificação
 * @property {string} [webpush.notification.badge] - Badge da notificação
 * @property {number[]} [webpush.notification.vibrate] - Padrão de vibração
 * @property {Array} [webpush.notification.actions] - Ações da notificação
 * @property {Object} [webpush.notification.data] - Dados adicionais
 * @property {boolean} [webpush.notification.requireInteraction] - Requer interação
 */

// Inicializar o Firebase Admin SDK
const firebaseAdmin = initializeFirebaseAdmin();

/**
 * API para envio de notificações push
 * POST /api/send-push
 */
export async function POST(req) {
  try {
    // Verificar autenticação do usuário (apenas usuários autenticados ou servidor)
    const session = await getServerSession(authOptions);
    const isServer = req.headers.get('x-api-key') === process.env.API_SECRET_KEY;
    
    if (!session && !isServer) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 400 });
    }

    // Obter dados da requisição
    const body = await req.json();
    const { token, notification, userId, topic } = body;

    // Validar dados
    if (!notification || (!token && !userId && !topic)) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 });
    }

    let result;

    // Enviar para um token específico
    if (token) {
      result = await firebaseAdmin.messaging().send({
        token,
        notification,
        webpush: {
          notification: {
            icon: '/icons/logo192.png',
            badge: '/icons/badge.png',
            vibrate: [100, 50, 100],
            actions: [],
            data: {},
            requireInteraction: true
          },
        },
        data: {}
      });
    } 
    // Enviar para um usuário específico (buscar tokens no banco)
    else if (userId) {
      // Buscar tokens no banco
      const userTokens = await firebaseAdmin.firestore().collection('pushTokens')
        .where('userId', '==', userId)
        .get();
      
      if (userTokens.empty) {
        return NextResponse.json(
          { error: 'Usuário não possui tokens registrados' },
          { status: 400 });
      }

      const tokens = userTokens.docs.map(doc => doc.data().token);
      
      // Enviar para múltiplos tokens
      result = await firebaseAdmin.messaging().sendEachForMulticast({
        tokens,
        notification,
        webpush: {
          notification: {
            icon: '/icons/logo192.png',
            badge: '/icons/badge.png',
            vibrate: [100, 50, 100],
            actions: [],
            data: {},
            requireInteraction: true
          },
        },
        data: {}
      });
    }
    // Enviar para um tópico
    else if (topic) {
      result = await firebaseAdmin.messaging().sendToTopic(topic, {
        notification,
        webpush: {
          notification: {
            icon: '/icons/logo192.png',
            badge: '/icons/badge.png',
            vibrate: [100, 50, 100],
            actions: [],
            data: {},
            requireInteraction: true
          },
        },
        data: {}
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
      { status: 400 });
  }
} 