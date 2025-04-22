import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { isAuthenticated } from '@/lib/auth/verify';
import { ObjectId } from 'mongodb';

// GET - Listar apostas do usuário
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    if (!isAuth || !userId) {
      return NextResponse.json(
        { status: 'error', error: error || 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // active, won, lost, all
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Construir o filtro de consulta
    const query: any = { userId: userId };
    
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
    const betsWithMatchInfo = await Promise.all(bets.map(async (bet: any) => {
      // Buscar informações da partida
      const match = await db.collection('matches').findOne(
        { _id: new ObjectId(bet.matchId) },
        { projection: {
          status: 1,
          type: 1,
          winner: 1,
          roomId: 1,
          roomPassword: 1,
          createdAt: 1,
          startTime: 1,
          completedAt: 1,
          teams: 1
        }}
      );

      // Formatar resposta
      return {
        _id: bet._id.toString(),
        matchId: bet.matchId,
        amount: bet.amount,
        status: bet.status,
        winAmount: bet.winAmount || 0,
        createdAt: bet.createdAt,
        updatedAt: bet.updatedAt,
        match: match ? {
          status: match.status,
          type: match.type,
          roomId: match.roomId,
          roomPassword: match.roomPassword,
          createdAt: match.createdAt,
          startTime: match.startTime,
          completedAt: match.completedAt,
          winner: match.winner,
          teams: match.teams?.map((team: any) => ({
            lobbyId: team.lobbyId,
            playerCount: team.players?.length || 0
          }))
        } : null,
        // Informações formatadas para exibição
        displayInfo: {
          statusText: getStatusText(bet.status),
          result: bet.status === 'won' ? `+${bet.winAmount}` : (bet.status === 'lost' ? `-${bet.amount}` : 'Pendente'),
          matchStatus: match ? formatMatchStatus(match.status) : 'Desconhecido',
          betDate: bet.createdAt.toISOString(),
          isActive: ['active', 'won', 'lost'].includes(bet.status)
        }
      };
    }));

    return NextResponse.json({
      status: 'success',
      data: {
        bets: betsWithMatchInfo,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Erro ao listar apostas:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao listar apostas: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
}

// Função auxiliar para formatar o status da aposta
function getStatusText(status: string): string {
  switch (status) {
    case 'active': return 'Em andamento';
    case 'won': return 'Ganhou';
    case 'lost': return 'Perdeu';
    case 'refunded': return 'Reembolsado';
    default: return 'Desconhecido';
  }
}

// Função auxiliar para formatar o status da partida
function formatMatchStatus(status: string): string {
  switch (status) {
    case 'pending': return 'Aguardando jogadores';
    case 'active': return 'Em andamento';
    case 'match_found': return 'Partida encontrada';
    case 'awaiting_validation': return 'Aguardando validação';
    case 'completed': return 'Concluída';
    case 'canceled': return 'Cancelada';
    default: return 'Desconhecido';
  }
} 