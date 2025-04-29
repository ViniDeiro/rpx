import { request, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { isAuthenticated } from '@/lib/auth/verify';
import { ObjectId } from 'mongodb';

// POST a busca por partidas
export async function POST(request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error: 'Não autorizado'
      }, { status: 400 });
    }
    
    // Extrair parâmetros da requisição
    const searchParams = request.nextUrl.searchParams;
    const waitingId = searchParams.get('waitingId');
    
    console.log(`Tentando cancelar matchmaking para usuário ${userId}, waitingId: ${waitingId || 'não fornecido'}`);
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Critérios de busca
    let query = { userId: userId.toString() };
    
    // Se tiver um ID de espera específico, usar ele como critério principal
    if (waitingId) {
      try {
        // Tentar converter para ObjectId (se for válido)
        if (ObjectId.isValid(waitingId)) {
          query = { 
            $or: [
              { _id: new ObjectId(waitingId) },
              { waitingId: waitingId }
            ]
          };
        } else {
          query = { waitingId: waitingId };
        }
      } catch (err) {
        console.error('Erro ao converter waitingId para ObjectId:', err);
        // Manter o critério original por userId
      }
    }
    
    // Verificar se o usuário está na fila
    const queuedPlayer = await db.collection('matchmaking_queue').findOne(query);
    
    if (!queuedPlayer) {
      console.log(`Nenhum registro encontrado para cancelar com a query:`, query);
      return NextResponse.json({
        status: 'error',
        message: 'Você não está na fila de matchmaking'
      }, { status: 400 });
    }
    
    console.log(`Registro encontrado para cancelar:`, {
      id: queuedPlayer._id ? queuedPlayer._id ? queuedPlayer._id.toString() : "" : "",
      userId: queuedPlayer.userId
    });
    
    // Remover o jogador da fila
    const result = await db.collection('matchmaking_queue').deleteOne({ _id: queuedPlayer._id });
    
    console.log(`Resultado da remoção: ${result.deletedCount} registro(s) removido(s)`);
    
    return NextResponse.json({
      status: 'success',
      message: 'Busca por partida cancelada com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao cancelar matchmaking:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro interno ao cancelar matchmaking'
    }, { status: 400 });
  }
} 