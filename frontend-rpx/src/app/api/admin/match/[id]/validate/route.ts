import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// Pontos ganhos por vitória com base no modo
const POINTS_BY_MODE = {
  casual: 50,
  ranked: 75,
  tournament: 100
};

// Níveis de ranking e pontos necessários
const RANKS = [
  { name: 'Novato', threshold: 0 },
  { name: 'Bronze 1', threshold: 50 },
  { name: 'Bronze 2', threshold: 100 },
  { name: 'Bronze 3', threshold: 200 },
  { name: 'Prata 1', threshold: 350 },
  { name: 'Prata 2', threshold: 500 },
  { name: 'Prata 3', threshold: 700 },
  { name: 'Ouro 1', threshold: 950 },
  { name: 'Ouro 2', threshold: 1250 },
  { name: 'Ouro 3', threshold: 1600 },
  { name: 'Platina 1', threshold: 2000 },
  { name: 'Platina 2', threshold: 2500 },
  { name: 'Platina 3', threshold: 3100 },
  { name: 'Diamante 1', threshold: 3800 },
  { name: 'Diamante 2', threshold: 4600 },
  { name: 'Diamante 3', threshold: 5500 },
  { name: 'Mestre', threshold: 6500 },
  { name: 'Grão-Mestre', threshold: 8000 },
  { name: 'Desafiante', threshold: 10000 }
];

// POST - Validar resultado da partida
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se o usuário é admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { status: 'error', error: 'Apenas administradores podem acessar este recurso' },
        { status: 403 }
      );
    }

    const matchId = params.id;
    if (!matchId) {
      return NextResponse.json(
        { status: 'error', error: 'ID da partida não fornecido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      winnerId,       // ID do usuário ou lobby vencedor
      winnerType,     // 'user' ou 'lobby'
      validationNotes // Notas sobre a validação
    } = body;

    if (!winnerId || !winnerType) {
      return NextResponse.json(
        { status: 'error', error: 'Dados do vencedor não fornecidos' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Verificar se a partida existe
    const match = await db.collection('matches').findOne({
      _id: new ObjectId(matchId)
    });

    if (!match) {
      return NextResponse.json(
        { status: 'error', error: 'Partida não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se a partida está aguardando validação
    if (match.status !== 'awaiting_validation') {
      return NextResponse.json(
        { status: 'error', error: `Não é possível validar uma partida com status ${match.status}` },
        { status: 400 }
      );
    }

    // Buscar as apostas para a partida
    const bets = await db.collection('bets').find({
      matchId: matchId,
      status: 'active'
    }).toArray();

    // Determinar os usuários vencedores
    let winnerUserIds: string[] = [];
    
    if (winnerType === 'user') {
      winnerUserIds = [winnerId];
    } else if (winnerType === 'lobby') {
      // Buscar todos os membros do lobby vencedor
      const winnerLobby = match.teams.find((team: any) => team.lobbyId === winnerId);
      if (winnerLobby && winnerLobby.players) {
        winnerUserIds = winnerLobby.players.map((player: any) => player.userId);
      }
    }

    if (winnerUserIds.length === 0) {
      return NextResponse.json(
        { status: 'error', error: 'Não foi possível determinar os usuários vencedores' },
        { status: 400 }
      );
    }

    // Calcular o valor total das apostas
    const totalBetAmount = bets.reduce((sum: number, bet: any) => sum + bet.amount, 0);
    
    // Taxa da plataforma (10%)
    const platformFee = totalBetAmount * 0.1;
    
    // Valor a ser distribuído aos vencedores
    const prizePool = totalBetAmount - platformFee;
    
    // Calcular quanto cada vencedor irá receber
    const winningBets = bets.filter((bet: any) => winnerUserIds.includes(bet.userId));
    const totalWinningBetsAmount = winningBets.reduce((sum: number, bet: any) => sum + bet.amount, 0);
    
    // Array para armazenar todos os IDs de usuários premiados
    const allWinnerIds: string[] = [];
    
    // Processar pagamentos e atualizar apostas
    const paymentResults = [];
    
    // Se houver apostas vencedoras
    if (winningBets.length > 0) {
      for (const bet of winningBets) {
        // Calcular prêmio proporcional ao valor apostado
        const winningRatio = bet.amount / totalWinningBetsAmount;
        const winAmount = Math.floor(prizePool * winningRatio);
        
        // Creditar o valor ao usuário
        await db.collection('users').updateOne(
          { _id: new ObjectId(bet.userId) },
          { 
            $inc: { balance: winAmount },
            $set: { updatedAt: new Date() }
          }
        );
        
        // Registrar transação
        await db.collection('transactions').insertOne({
          userId: bet.userId,
          type: 'win',
          amount: winAmount,
          status: 'completed',
          description: `Vitória na partida #${matchId}`,
          reference: {
            type: 'match',
            id: matchId
          },
          createdAt: new Date()
        });
        
        // Atualizar status da aposta
        await db.collection('bets').updateOne(
          { _id: bet._id },
          { 
            $set: { 
              status: 'won',
              winAmount: winAmount,
              updatedAt: new Date()
            }
          }
        );
        
        // Adicionar ao array de vencedores
        if (!allWinnerIds.includes(bet.userId)) {
          allWinnerIds.push(bet.userId);
        }
        
        // Adicionar ao resultado
        paymentResults.push({
          userId: bet.userId,
          betAmount: bet.amount,
          winAmount: winAmount
        });
      }
    }
    
    // Marcar apostas perdedoras
    await db.collection('bets').updateMany(
      { 
        matchId: matchId, 
        status: 'active',
        userId: { $nin: winnerUserIds }
      },
      { 
        $set: { 
          status: 'lost',
          updatedAt: new Date()
        }
      }
    );

    // Registrar taxa da plataforma
    await db.collection('platform_revenue').insertOne({
      source: 'match_fee',
      matchId: matchId,
      amount: platformFee,
      createdAt: new Date()
    });

    // Atualizar pontos de ranking para os vencedores
    const gameMode = match.gameMode || 'casual';
    const pointsEarned = POINTS_BY_MODE[gameMode as keyof typeof POINTS_BY_MODE] || POINTS_BY_MODE.casual;
    
    const rankUpdates = [];
    
    for (const userId of winnerUserIds) {
      // Buscar usuário e seu ranking atual
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { rankPoints: 1, rank: 1 } }
      );
      
      if (!user) continue;
      
      const currentPoints = user.rankPoints || 0;
      const newPoints = currentPoints + pointsEarned;
      
      // Determinar o novo ranking
      let newRank = 'Novato';
      
      for (let i = RANKS.length - 1; i >= 0; i--) {
        if (newPoints >= RANKS[i].threshold) {
          newRank = RANKS[i].name;
          break;
        }
      }
      
      // Atualizar pontos e rank do usuário
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            rankPoints: newPoints,
            rank: newRank,
            updatedAt: new Date()
          }
        }
      );
      
      // Registrar atualização de ranking
      rankUpdates.push({
        userId: userId,
        previousPoints: currentPoints,
        pointsEarned: pointsEarned,
        newPoints: newPoints,
        newRank: newRank
      });
      
      // Notificar usuário sobre a vitória
      await db.collection('notifications').insertOne({
        userId: userId,
        type: 'system',
        title: 'Vitória!',
        message: `Você venceu a partida e ganhou ${pointsEarned} pontos de ranking!`,
        read: false,
        data: {
          type: 'match_result',
          matchId: matchId,
          pointsEarned: pointsEarned
        },
        createdAt: new Date()
      });
    }
    
    // Notificar perdedores
    const loserUserIds = match.players
      .map((p: any) => p.userId)
      .filter((id: string) => !winnerUserIds.includes(id));
    
    for (const userId of loserUserIds) {
      await db.collection('notifications').insertOne({
        userId: userId,
        type: 'system',
        title: 'Resultado da Partida',
        message: 'Sua partida foi concluída. Infelizmente você não venceu desta vez.',
        read: false,
        data: {
          type: 'match_result',
          matchId: matchId
        },
        createdAt: new Date()
      });
    }

    // Atualizar status da partida
    await db.collection('matches').updateOne(
      { _id: new ObjectId(matchId) },
      { 
        $set: { 
          status: 'completed',
          winner: {
            type: winnerType,
            id: winnerId,
            userIds: winnerUserIds
          },
          validationNotes: validationNotes,
          completedAt: new Date(),
          validatedBy: {
            adminId: session.user.id || session.user.email,
            timestamp: new Date()
          },
          prizePool: prizePool,
          platformFee: platformFee,
          totalBetAmount: totalBetAmount,
          updatedAt: new Date()
        }
      }
    );

    // Registrar log de auditoria
    await db.collection('admin_logs').insertOne({
      adminId: session.user.id || session.user.email,
      adminEmail: session.user.email,
      action: 'match_validate',
      entity: 'match',
      entityId: matchId,
      details: {
        winner: {
          type: winnerType,
          id: winnerId,
          userIds: winnerUserIds
        },
        validationNotes: validationNotes,
        prizePool: prizePool,
        platformFee: platformFee,
        totalBetAmount: totalBetAmount
      },
      timestamp: new Date()
    });

    return NextResponse.json({
      status: 'success',
      message: 'Partida validada com sucesso',
      matchId: matchId,
      winner: {
        type: winnerType,
        id: winnerId,
        userIds: winnerUserIds
      },
      bets: {
        total: bets.length,
        totalAmount: totalBetAmount,
        platformFee: platformFee,
        prizePool: prizePool
      },
      payments: paymentResults,
      ranking: rankUpdates
    });
    
  } catch (error: any) {
    console.error('Erro ao validar partida:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao validar partida: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
} 