import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// Pontos ganhos por vitória com base no modo
const POINTS_BY_MODE = {
  casual: 25,
  ranked: 50,
  tournament: 100
};

// Níveis de ranking e pontos necessários
const RANKS = [
  { name: 'Novato', threshold: 0 },
  { name: 'Bronze 1', threshold: 100 },
  { name: 'Bronze 2', threshold: 200 },
  { name: 'Bronze 3', threshold: 300 },
  { name: 'Prata 1', threshold: 400 },
  { name: 'Prata 2', threshold: 500 },
  { name: 'Prata 3', threshold: 600 },
  { name: 'Ouro 1', threshold: 700 },
  { name: 'Ouro 2', threshold: 800 },
  { name: 'Ouro 3', threshold: 900 },
  { name: 'Platina 1', threshold: 1000 },
  { name: 'Platina 2', threshold: 1250 },
  { name: 'Platina 3', threshold: 1500 },
  { name: 'Diamante 1', threshold: 2000 },
  { name: 'Diamante 2', threshold: 2500 },
  { name: 'Diamante 3', threshold: 3000 },
  { name: 'Mestre', threshold: 4000 },
  { name: 'Grão-Mestre', threshold: 5000 },
  { name: 'Desafiante', threshold: 10000 }
];

// POST - Validar resultado da partida
export async function POST(request, { params }) {
  try {
    // Verificar se o usuário é admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { status: 'error', error: 'Apenas administradores podem acessar este recurso' },
        { status: 403 });
    }

    const matchId = params.id;
    if (!matchId) {
      return NextResponse.json(
        { status: 'error', error: 'ID da partida não fornecido' },
        { status: 400 });
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
        { status: 400 });
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
        { status: 404 });
    }

    // Verificar se a partida está aguardando validação
    if (match.status !== 'awaiting_validation') {
      return NextResponse.json(
        { status: 'error', error: `Não é possível validar uma partida com status ${match.status}` },
        { status: 400 });
    }

    // Buscar as apostas para a partida
    const bets = await db.collection('bets').find({
      matchId: matchId,
      status: 'active'
    }).toArray();

    // Determinar os usuários vencedores
    let winnerUserIds = [];
    
    if (winnerType === 'user') {
      winnerUserIds = [winnerId];
    } else if (winnerType === 'lobby') {
      // Buscar todos os membros do lobby vencedor
      const winnerLobby = match.teams.find((team) => team.lobbyId === winnerId);
      if (winnerLobby && winnerLobby.players) {
        winnerUserIds = winnerLobby.players.map((player) => player.userId);
      }
    }

    if (winnerUserIds.length === 0) {
      return NextResponse.json(
        { status: 'error', error: 'Não foi possível determinar os usuários vencedores' },
        { status: 400 });
    }

    // Calcular o valor total das apostas
    const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
    
    // Taxa da plataforma (10%)
    const platformFee = totalBetAmount * 0.1;
    
    // Valor a ser distribuído aos vencedores
    const prizePool = totalBetAmount - platformFee;
    
    // Calcular quanto cada vencedor irá receber
    const winningBets = bets.filter((bet) => winnerUserIds.includes(bet.userId));
    const totalWinningBetsAmount = winningBets.reduce((sum, bet) => sum + bet.amount, 0);
    
    // Array para armazenar todos os IDs de usuários premiados
    const allWinnerIds = [];
    
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
        userId: { $nin: allWinnerIds }
      },
      { 
        $set: { 
          status: 'lost',
          updatedAt: new Date()
        }
      }
    );
    
    // Atualizar ranking dos jogadores participantes
    const rankingUpdates = [];
    
    // Determinar o tipo de partida para atribuição de pontos
    const gameMode = match.gameMode || 'casual';
    const pointsToAward = POINTS_BY_MODE[gameMode] || POINTS_BY_MODE.casual;
    
    // Adicionar pontos de ranking aos vencedores
    for (const winnerId of winnerUserIds) {
      const user = await db.collection('users').findOne({ _id: new ObjectId(winnerId) });
      
      if (!user) continue;
      
      // Calcular novos pontos de ranking
      const currentPoints = user.rankingPoints || 0;
      const newPoints = currentPoints + pointsToAward;
      
      // Determinar o novo ranking com base nos pontos
      let newRank = 'Novato';
      for (let i = RANKS.length - 1; i >= 0; i--) {
        if (newPoints >= RANKS[i].threshold) {
          newRank = RANKS[i].name;
          break;
        }
      }
      
      // Atualizar ranking do usuário
      await db.collection('users').updateOne(
        { _id: new ObjectId(winnerId) },
        { 
          $set: { 
            rankingPoints: newPoints,
            currentRank: newRank,
            updatedAt: new Date()
          },
          $inc: { 
            'stats.wins': 1,
            'stats.matches': 1
          }
        }
      );
      
      // Adicionar ao resultado
      rankingUpdates.push({
        userId: winnerId,
        previousPoints: currentPoints,
        newPoints: newPoints,
        previousRank: user.currentRank || 'Novato',
        newRank: newRank,
        pointsAwarded: pointsToAward
      });
      
      // Criar notificação para o usuário
      await db.collection('notifications').insertOne({
        userId: winnerId,
        type: 'match_result',
        title: 'Vitória na partida!',
        message: `Você ganhou ${pointsToAward} pontos de ranking por vencer a partida.`,
        read: false,
        data: {
          matchId: matchId,
          result: 'win',
          pointsAwarded: pointsToAward
        },
        createdAt: new Date()
      });
    }
    
    // Atualizar estatísticas para os perdedores
    const loserUserIds = match.players
      ? match.players.filter(player => !winnerUserIds.includes(player.userId)).map(player => player.userId)
      : [];
    
    for (const loserId of loserUserIds) {
      // Atualizar estatísticas
      await db.collection('users').updateOne(
        { _id: new ObjectId(loserId) },
        { 
          $inc: { 'stats.matches': 1 },
          $set: { updatedAt: new Date() }
        }
      );
      
      // Criar notificação para o usuário
      await db.collection('notifications').insertOne({
        userId: loserId,
        type: 'match_result',
        title: 'Resultado da partida',
        message: 'Você perdeu a partida. Continue tentando!',
        read: false,
        data: {
          matchId: matchId,
          result: 'loss'
        },
        createdAt: new Date()
      });
    }
    
    // Atualizar status da partida para completed
    await db.collection('matches').updateOne(
      { _id: new ObjectId(matchId) },
      { 
        $set: { 
          status: 'completed', 
          result: {
            winnerId: winnerId,
            winnerType: winnerType,
            validationNotes: validationNotes || '',
            winnerUserIds: winnerUserIds,
            totalBetAmount: totalBetAmount,
            platformFee: platformFee,
            prizePool: prizePool
          },
          validatedAt: new Date(),
          validatedBy: session.user.id,
          updatedAt: new Date()
        }
      }
    );
    
    // Registrar log de auditoria
    await db.collection('admin_logs').insertOne({
      adminId: session.user.id,
      adminEmail: session.user.email,
      action: 'match_validate',
      entity: 'match',
      entityId: matchId,
      details: {
        winnerId: winnerId,
        winnerType: winnerType,
        validationNotes: validationNotes || '',
        paymentResults: paymentResults,
        rankingUpdates: rankingUpdates
      },
      timestamp: new Date()
    });
    
    return NextResponse.json({
      status: 'success',
      message: 'Partida validada com sucesso',
      matchId: matchId,
      paymentResults: paymentResults,
      rankingUpdates: rankingUpdates
    });
    
  } catch (error) {
    console.error('Erro ao validar partida:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao validar partida: ' + (error.message || 'Erro desconhecido') },
      { status: 500 });
  }
} 