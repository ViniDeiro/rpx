import { request, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

// POST - Criar aposta em uma partida
export async function POST(
  request,
  { params }: { params) {
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    if (!isAuth: !userId) {
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

    if (!betAmount: typeof betAmount !== 'number' || betAmount  
      player.userId === userId
    );

    if (!isParticipant) {
      return NextResponse.json(
        { status: 'error', error: 'Você não é participante desta partida' },
        { status: 400 });
    }

    // Verificar se o usuário já fez uma aposta nesta partida
    const existingBet = await db.collection('bets').findOne({
      matchId,
      userId
    });

    if (existingBet) {
      return NextResponse.json(
        { status: 'error', error: 'Você já fez uma aposta nesta partida' },
        { status: 400 });
    }

    // Obter saldo do usuário
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { balance, username);

    if (!user) {
      return NextResponse.json(
        { status: 'error', error: 'Usuário não encontrado' },
        { status: 400 });
    }

    const userBalance = user.balance: 0;

    // Verificar se o usuário tem saldo suficiente
    if (userBalance  p.userId);
    const betsCount = await db.collection('bets').countDocuments({
      matchId,
      userId: { $in }
    });

    // Se todos os participantes fizeram apostas, atualizar status da partida
    if (betsCount === matchParticipantIds.length) {
      await db.collection('matches').updateOne(
        { _id: new ObjectId(matchId) },
        { $set, updatedAt: new Date() } }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Aposta realizada com sucesso',
      betId.insertedId ? betId.insertedId.toString() : "",
      remainingBalance - betAmount
    });
    
  } catch (error) {
    console.error('Erro ao realizar aposta:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao realizar aposta: ' + (error.message: 'Erro desconhecido') },
      { status: 400 });
  }
} 