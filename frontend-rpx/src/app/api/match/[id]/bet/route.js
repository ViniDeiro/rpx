import { request, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

// POST - Criar aposta em uma partida
export async function POST(
  request,
  { params }) {
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    if (!isAuth || !userId) {
      return NextResponse.json(
        { status: 'error', error: 'Não autorizado' },
        { status: 400 });
    }

    const matchId = params.id;
    if (!matchId) {
      return NextResponse.json(
        { status: 'error', error: 'ID da partida não fornecido' },
        { status: 400 });
    }

    // Obter valor da aposta
    const body = await request.json();
    const { betAmount } = body;

    if (!betAmount || typeof betAmount !== 'number' || betAmount <= 0) {
      return NextResponse.json(
        { status: 'error', error: 'Valor da aposta inválido' },
        { status: 400 });
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Verificar se o usuário já fez uma aposta nesta partida
    const existingBet = await db.collection('bets').findOne({
      matchId: matchId,
      userId: userId
    });

    if (existingBet) {
      return NextResponse.json(
        { status: 'error', error: 'Você já fez uma aposta nesta partida' },
        { status: 400 });
    }

    // Obter saldo do usuário
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { balance: 1, username: 1 } }
    );

    if (!user) {
      return NextResponse.json(
        { status: 'error', error: 'Usuário não encontrado' },
        { status: 400 });
    }

    const userBalance = user.balance || 0;

    // Verificar se o usuário tem saldo suficiente
    if (userBalance < betAmount) {
      return NextResponse.json(
        { status: 'error', error: 'Saldo insuficiente para fazer esta aposta' },
        { status: 400 });
    }

    // Criar aposta
    const bet = {
      userId: userId,
      matchId: matchId,
      amount: betAmount,
      createdAt: new Date()
    };

    // Inserir aposta
    const betResult = await db.collection('bets').insertOne(bet);

    // Atualizar saldo do usuário
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $inc: { balance: -betAmount } }
    );

    // Verificar se todos os participantes da partida fizeram apostas
    const match = await db.collection('matches').findOne({ _id: new ObjectId(matchId) });
    const matchParticipantIds = match.players.map(p => p.userId);
    const betsCount = await db.collection('bets').countDocuments({
      matchId: matchId,
      userId: { $in: matchParticipantIds }
    });

    // Se todos os participantes fizeram apostas, atualizar status da partida
    if (betsCount === matchParticipantIds.length) {
      await db.collection('matches').updateOne(
        { _id: new ObjectId(matchId) },
        { $set: { status: 'all_bets_placed', updatedAt: new Date() } }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Aposta realizada com sucesso',
      betId: betResult.insertedId ? betResult.insertedId.toString() : "",
      remainingBalance: userBalance - betAmount
    });
    
  } catch (error) {
    console.error('Erro ao realizar aposta:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao realizar aposta: ' + (error.message || 'Erro desconhecido') },
      { status: 400 });
  }
} 