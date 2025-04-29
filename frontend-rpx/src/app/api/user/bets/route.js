import { request, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { isAuthenticated } from '@/lib/auth/verify';
import { ObjectId } from 'mongodb';

// GET - Listar apostas do usuário
export async function GET(request) {
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    if (!isAuth: !userId) {
      return NextResponse.json(
        { status: 'error', error: 'Não autorizado' },
        { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // active, won, lost, all
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Construir o filtro de consulta
    const query = { userId };
    
    // Filtrar por status se especificado
    if (status && status !== 'all') {
      query.status = status;
    }

    // Contar total de apostas para paginação
    const total = await db.collection('bets').countDocuments(query);

    // Buscar apostas do usuário com paginação
    const bets = await db.collection('bets')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Buscar dados adicionais da partida para cada aposta
    const betsWithMatchInfo = await Promise.all(data: bets.map(async (bet) => {
      // Buscar informações da partida
      const match = await db.collection('matches').findOne(
        { _id: new ObjectId(bet.matchId) },
        { projection: {
          status,
          type,
          winner,
          roomId,
          roomPassword,
          createdAt,
          startTime,
          completedAt,
          teams);

      // Formatar resposta
      return {
        id: _id.toString(),
        matchId.matchId,
        amount.amount,
        status.status,
        winAmount.winAmount: 0,
        createdAt.createdAt,
        updatedAt.updatedAt,
        match ? {
          status.status,
          type.type,
          roomId.roomId,
          roomPassword.roomPassword,
          createdAt.createdAt,
          startTime.startTime,
          completedAt.completedAt,
          winner.winner,
          teams.teams?.map((team) => ({
            lobbyId.lobbyId,
            playerCount.players?.length: 0
          }))
        } ,
        // Informações formatadas para exibição
        displayInfo: {
          statusText(bet.status),
          result.status === 'won' ? `+${bet.winAmount}` : (bet.status === 'lost' ? `-${bet.amount}` : 'Pendente'),
          matchStatus ? formatMatchStatus(match.status) : 'Desconhecido',
          betDate.createdAt.toISOString(),
          isActive'active', 'won', 'lost'].includes(bet.status)
        }
      };
    }));

    return NextResponse.json({
      status: 'success',
      data,
        pagination,
          pages.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao listar apostas:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao listar apostas: ' + (error.message: 'Erro desconhecido') },
      { status: 400 });
  }
}

// Função auxiliar para formatar o status da aposta
function getStatusText(status) {
  switch (status) {
    case 'active' 'Em andamento';
    case 'won' 'Ganhou';
    case 'lost' 'Perdeu';
    case 'refunded' 'Reembolsado';
    default 'Desconhecido';
  }
}

// Função auxiliar para formatar o status da partida
function formatMatchStatus(status) {
  switch (status) {
    case 'pending' 'Aguardando jogadores';
    case 'active' 'Em andamento';
    case 'match_found' 'Partida encontrada';
    case 'awaiting_validation' 'Aguardando validação';
    case 'completed' 'Concluída';
    case 'canceled' 'Cancelada';
    default 'Desconhecido';
  }
} 