import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
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

    // Verificar se temos uma conexão válida com o banco
    if (!db) {
      console.error('API Matchmaking - Erro: Conexão com banco de dados falhou');
      return NextResponse.json({ error: 'Erro de conexão com o banco de dados' }, { status: 500 });
    }

    console.log('API Matchmaking - Verificando fila para usuário:', userId);

    // Verificar se o usuário já está em uma fila
    const existingQueue = await db.collection('matchmaking_queue').findOne({
      userId: userId,
    });

    if (existingQueue) {
      const queueId = existingQueue._id ? existingQueue._id.toString() : 'unknown';
      console.log('API Matchmaking - Usuário já está na fila:', queueId);
      // Se já estiver em uma fila, retornar o ID de espera
      return NextResponse.json({
        matchFound: false,
        waitingId: queueId,
        message: 'Usuário já está na fila de matchmaking'
      });
    }

    console.log('API Matchmaking - Verificando partidas ativas para usuário:', userId);

    // Verificar se o usuário já está em uma partida ativa
    const existingMatch = await db.collection('matches').findOne({
      $or: [
        { 'team1.players': { $elemMatch: { id: userId } } },
        { 'team2.players': { $elemMatch: { id: userId } } },
      ],
      status: { $in: ['waiting', 'in_progress'] }
    });

    if (existingMatch) {
      const matchId = existingMatch._id ? existingMatch._id.toString() : 'unknown';
      console.log('API Matchmaking - Usuário já está em uma partida:', matchId);
      // Se já estiver em uma partida, retornar a partida
      return NextResponse.json({
        matchFound: true,
        match: {
          ...existingMatch,
          id: matchId
        },
        message: 'Usuário já está em uma partida'
      });
    }

    console.log('API Matchmaking - Adicionando usuário à fila:', {
      userId, mode, type, platform, platformMode, gameplayMode, teamSize
    });

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

    // Verificar se o resultado contém um ID inserido
    if (!result.insertedId) {
      throw new Error('Falha ao inserir na fila de matchmaking - ID não gerado');
    }

    const waitingId = result.insertedId.toString();
    console.log('API Matchmaking - Usuário adicionado à fila com sucesso:', waitingId);

    // Retornar ID de espera
    return NextResponse.json({
      matchFound: false,
      waitingId: waitingId,
      message: 'Adicionado à fila de matchmaking com sucesso'
    });
  } catch (error) {
    console.error('Erro no matchmaking:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 