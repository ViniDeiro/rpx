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
    
    const { db } = await connectToDatabase();
    
    // Verificar se a notificação existe e pertence ao usuário
    const notification = await db.collection('notifications').findOne({
      _id: new ObjectId(notificationId),
      userId: new ObjectId(userId)
    });
    
    if (!notification) {
      return NextResponse.json({
        status: 'error',
        error: 'Notificação não encontrada'
      }, { status: 404 });
    }
    
    // Marcar como lida
    await db.collection('notifications').updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: { read: true } }
    );
    
    return NextResponse.json({
      status: 'success',
      message: 'Notificação marcada como lida'
    });
  } catch (error: any) {
    console.error('Erro ao marcar notificação como lida:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao marcar notificação como lida'
    }, { status: 500 });
  }
} 