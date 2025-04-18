import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// POST: Iniciar a busca por partidas
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter dados da requisição
    const {
      userId,
      mode,
      type,
      platform,
      platformMode,
      gameplayMode,
      teamSize,
    } = await req.json();

    // Validar dados
    if (!userId || !mode || !type) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Verificar se o usuário já está em uma fila
    const existingQueue = await db.collection('matchmaking_queue').findOne({
      userId: userId,
    });

    if (existingQueue) {
      // Se já estiver em uma fila, retornar o ID de espera
      return NextResponse.json({
        matchFound: false,
        waitingId: existingQueue._id.toString(),
        message: 'Usuário já está na fila de matchmaking'
      });
    }

    // Verificar se o usuário já está em uma partida ativa
    const existingMatch = await db.collection('matches').findOne({
      $or: [
        { 'team1.players': { $elemMatch: { id: userId } } },
        { 'team2.players': { $elemMatch: { id: userId } } },
      ],
      status: { $in: ['waiting', 'in_progress'] }
    });

    if (existingMatch) {
      // Se já estiver em uma partida, retornar a partida
      return NextResponse.json({
        matchFound: true,
        match: {
          ...existingMatch,
          id: existingMatch._id.toString()
        },
        message: 'Usuário já está em uma partida'
      });
    }

    // Adicionar usuário à fila de matchmaking
    const result = await db.collection('matchmaking_queue').insertOne({
      userId,
      mode,
      type,
      platform,
      platformMode,
      gameplayMode,
      teamSize,
      createdAt: new Date(),
      status: 'waiting'
    });

    // Retornar ID de espera
    return NextResponse.json({
      matchFound: false,
      waitingId: result.insertedId.toString(),
      message: 'Adicionado à fila de matchmaking com sucesso'
    });
  } catch (error) {
    console.error('Erro no matchmaking:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 