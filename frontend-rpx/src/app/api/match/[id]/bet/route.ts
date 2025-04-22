import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

// POST - Criar aposta em uma partida
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    if (!isAuth || !userId) {
      return NextResponse.json(
        { status: 'error', error: error || 'Não autorizado' },
        { status: 401 }
      );
    }

    const matchId = params.id;
    if (!matchId) {
      return NextResponse.json(
        { status: 'error', error: 'ID da partida não fornecido' },
        { status: 400 }
      );
    }

    // Obter valor da aposta
    const body = await request.json();
    const { betAmount } = body;

    if (!betAmount || typeof betAmount !== 'number' || betAmount <= 0) {
      return NextResponse.json(
        { status: 'error', error: 'Valor da aposta inválido' },
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

    // Verificar se o usuário é participante da partida
    const isParticipant = match.players.some((player: any) => 
      player.userId === userId
    );

    if (!isParticipant) {
      return NextResponse.json(
        { status: 'error', error: 'Você não é participante desta partida' },
        { status: 403 }
      );
    }

    // Verificar se o usuário já fez uma aposta nesta partida
    const existingBet = await db.collection('bets').findOne({
      matchId: matchId,
      userId: userId
    });

    if (existingBet) {
      return NextResponse.json(
        { status: 'error', error: 'Você já fez uma aposta nesta partida' },
        { status: 400 }
      );
    }

    // Obter saldo do usuário
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { balance: 1, username: 1 } }
    );

    if (!user) {
      return NextResponse.json(
        { status: 'error', error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const userBalance = user.balance || 0;

    // Verificar se o usuário tem saldo suficiente
    if (userBalance < betAmount) {
      return NextResponse.json(
        { status: 'error', error: 'Saldo insuficiente para realizar esta aposta' },
        { status: 400 }
      );
    }

    // Debitar o valor da aposta
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $inc: { balance: -betAmount },
        $set: { updatedAt: new Date() }
      }
    );

    // Registrar transação
    await db.collection('transactions').insertOne({
      userId: userId,
      type: 'bet',
      amount: -betAmount,
      status: 'completed',
      description: `Aposta na partida #${matchId}`,
      reference: {
        type: 'match',
        id: matchId
      },
      createdAt: new Date()
    });

    // Registrar aposta
    const bet = {
      userId: userId,
      username: user.username,
      matchId: matchId,
      amount: betAmount,
      status: 'active', // active, won, lost, refunded
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('bets').insertOne(bet);

    // Verificar se todos os jogadores já apostaram
    const matchParticipantIds = match.players.map((p: any) => p.userId);
    const betsCount = await db.collection('bets').countDocuments({
      matchId: matchId,
      userId: { $in: matchParticipantIds }
    });

    // Se todos os participantes fizeram apostas, atualizar status da partida
    if (betsCount === matchParticipantIds.length) {
      await db.collection('matches').updateOne(
        { _id: new ObjectId(matchId) },
        { $set: { betsComplete: true, updatedAt: new Date() } }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Aposta realizada com sucesso',
      betId: result.insertedId.toString(),
      remainingBalance: userBalance - betAmount
    });
    
  } catch (error: any) {
    console.error('Erro ao realizar aposta:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao realizar aposta: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
} 