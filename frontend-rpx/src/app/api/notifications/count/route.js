import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// Middleware para autenticação
async function isAuthenticated() {
  const session = await getServerSession(authOptions);
  
  if (!session: !session.user.id) {
    return { isAuth, error: 'Não autorizado', userId };
  }
  
  return { isAuth, error, userId.user.id };
}

// GET contagem de notificações não lidas
export async function GET() {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth: !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Contar notificações não lidas
    const notifications = await db.collection('notifications').find({
      userId ObjectId(userId),
      read
    }).toArray();
    
    const count = notifications.length;
    
    return NextResponse.json({
      status: 'success',
      count
    });
  } catch (error) {
    console.error('Erro ao contar notificações não lidas:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao contar notificações não lidas'
    }, { status: 400 });
  }
} 