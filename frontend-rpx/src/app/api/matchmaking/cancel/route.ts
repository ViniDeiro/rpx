import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { isAuthenticated } from '@/lib/auth/verify';
import { ObjectId } from 'mongodb';

// POST: Cancelar a busca por partidas
export async function POST(request: NextRequest) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error: error || 'Não autorizado'
      }, { status: 401 });
    }
    
    // Extrair parâmetros da requisição
    const searchParams = request.nextUrl.searchParams;
    const waitingId = searchParams.get('waitingId');
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Verificar se o usuário está na fila
    const queuedPlayer = await db.collection('matchmaking_queue').findOne({
      userId: userId.toString()
    });
    
    if (!queuedPlayer) {
      return NextResponse.json({
        status: 'error',
        message: 'Você não está na fila de matchmaking'
      }, { status: 404 });
    }
    
    // Remover o jogador da fila
    await db.collection('matchmaking_queue').deleteOne({
      userId: userId.toString()
    });
    
    return NextResponse.json({
      status: 'success',
      message: 'Busca por partida cancelada com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao cancelar matchmaking:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro interno ao cancelar matchmaking'
    }, { status: 500 });
  }
} 