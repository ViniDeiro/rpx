import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// Middleware para autenticação
async function isAuthenticated() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.id) {
    return { isAuth: false, error: 'Não autorizado', userId: null };
  }
  
  return { isAuth: true, error: null, userId: session.user.id };
}

// POST: Marcar notificação como lida
export async function POST(request: Request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 401 });
    }
    
    const body = await request.json();
    const { notificationId } = body;
    
    if (!notificationId) {
      return NextResponse.json({
        status: 'error',
        error: 'ID da notificação não fornecido'
      }, { status: 400 });
    }
    
    console.log(`API Mark-Read - Marcando notificação ${notificationId} como lida`);
    
    const { db } = await connectToDatabase();
    
    // Verificar se é uma notificação normal
    let notification = await db.collection('notifications').findOne({
      _id: new ObjectId(notificationId)
    });
    
    if (notification) {
      console.log('API Mark-Read - Notificação regular encontrada, marcando como lida');
      
      // Verificar se pertence ao usuário
      if (notification.userId.toString() !== userId.toString()) {
        console.warn('API Mark-Read - Tentativa de marcar notificação de outro usuário como lida');
        return NextResponse.json({
          status: 'error',
          error: 'Não autorizado a marcar esta notificação como lida'
        }, { status: 403 });
      }
      
      // Marcar como lida
      await db.collection('notifications').updateOne(
        { _id: new ObjectId(notificationId) },
        { 
          $set: { 
            read: true,
            readAt: new Date()
          } 
        }
      );
      
      console.log('API Mark-Read - Notificação marcada como lida com sucesso');
      
      return NextResponse.json({
        status: 'success',
        message: 'Notificação marcada como lida'
      });
    }
    
    // Se não for uma notificação normal, verificar se é um convite de lobby
    console.log('API Mark-Read - Verificando se é convite de lobby');
    
    let lobbyInvite = await db.collection('lobbyinvites').findOne({
      _id: new ObjectId(notificationId)
    });
    
    if (lobbyInvite) {
      console.log('API Mark-Read - Convite de lobby encontrado');
      
      // Verificar se é o destinatário do convite
      if (lobbyInvite.recipient.toString() !== userId.toString()) {
        console.warn('API Mark-Read - Tentativa de marcar convite de outro usuário como lido');
        return NextResponse.json({
          status: 'error',
          error: 'Não autorizado a marcar este convite como lido'
        }, { status: 403 });
      }
      
      // Marcar convite como visualizado (mas não alterar o status)
      await db.collection('lobbyinvites').updateOne(
        { _id: new ObjectId(notificationId) },
        { 
          $set: { 
            viewed: true,
            viewedAt: new Date()
          } 
        }
      );
      
      console.log('API Mark-Read - Convite de lobby marcado como visualizado');
      
      return NextResponse.json({
        status: 'success',
        message: 'Convite marcado como visualizado'
      });
    }
    
    // Se chegou aqui, a notificação não foi encontrada
    console.warn(`API Mark-Read - Notificação ${notificationId} não encontrada`);
    
    return NextResponse.json({
      status: 'error',
      error: 'Notificação não encontrada'
    }, { status: 404 });
  } catch (error: any) {
    console.error('Erro ao marcar notificação como lida:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao marcar notificação como lida'
    }, { status: 500 });
  }
} 