import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, getUserId, isAdmin } from '@/lib/auth/middleware';
import { ObjectId } from 'mongodb';

/**
 * PUT - Validar resultado de aposta pelo administrador
 * Permite que um administrador valide o resultado de uma aposta após o término da partida
 */
export async function PUT(req) {
  try {
    // Autenticar e verificar permissões de administrador
    const authResult = await authMiddleware(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    if (!isAdmin(authResult)) {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      );
    }
    
    // Obter dados da requisição
    const body = await req.json();
    const { betId, outcome } = body;
    
    if (!betId || !['won', 'lost'].includes(outcome)) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Validar se a aposta existe
    let betObjectId;
    try {
      betObjectId = new ObjectId(betId);
    } catch (error) {
      return NextResponse.json(
        { error: 'ID de aposta inválido' },
        { status: 400 }
      );
    }
    
    // Buscar a aposta
    const bet = await db.collection('bets').findOne({ _id: betObjectId });
    
    if (!bet) {
      return NextResponse.json(
        { error: 'Aposta não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se a aposta já foi validada
    if (bet.status !== 'pending') {
      return NextResponse.json(
        { error: 'Esta aposta já foi validada anteriormente' },
        { status: 400 }
      );
    }
    
    // Atualizar o status da aposta
    await db.collection('bets').updateOne(
      { _id: betObjectId },
      { 
        $set: { 
          status: outcome,
          validatedAt: new Date(),
          validatedBy: authResult.id || authResult.userId
        } 
      }
    );
    
    // Se a aposta foi vencedora, processar o pagamento
    if (outcome === 'won') {
      const user = await db.collection('users').findOne({ _id: new ObjectId(bet.userId) });
      
      if (user) {
        const winAmount = bet.potentialWin || bet.amount * 2; // Valor que o usuário ganhou
        
        // Atualizar o saldo do usuário
        await db.collection('users').updateOne(
          { _id: new ObjectId(bet.userId) },
          { $inc: { balance: winAmount } }
        );
        
        // Registrar transação
        await db.collection('transactions').insertOne({
          userId: new ObjectId(bet.userId),
          type: 'bet_win',
          amount: winAmount,
          betId: betObjectId,
          createdAt: new Date()
        });
      }
    }
    
    return NextResponse.json({
      message: 'Aposta validada com sucesso',
      bet: {
        id: betId,
        status: outcome
      }
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET - Listar apostas pendentes de validação
 * Permite que administradores vejam apostas que precisam de validação
 */
export async function GET(req) {
  try {
    // Autenticar e verificar permissões de administrador
    const authResult = await authMiddleware(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    if (!isAdmin(authResult)) {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      );
    }
    
    // Parâmetros de paginação
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Buscar apostas pendentes
    const pendingBets = await db.collection('bets')
      .find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Contar total de apostas pendentes
    const total = await db.collection('bets').countDocuments({ status: 'pending' });
    
    // Buscar detalhes dos usuários e partidas relacionadas
    const betsWithDetails = await Promise.all(pendingBets.map(async (bet) => {
      // Buscar informações do usuário
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(bet.userId) },
        { projection: { username: 1, email: 1 } }
      );
      
      // Buscar informações da partida
      const match = await db.collection('matches').findOne(
        { _id: new ObjectId(bet.matchId) },
        { projection: { title: 1, status: 1, startTime: 1 } }
      );
      
      return {
        id: bet._id.toString(),
        userId: bet.userId,
        matchId: bet.matchId,
        amount: bet.amount,
        odd: bet.odd,
        potentialWin: bet.potentialWin,
        type: bet.type,
        selection: bet.selection,
        status: bet.status,
        createdAt: bet.createdAt,
        match: match ? {
          id: match._id.toString(),
          title: match.title,
          status: match.status,
          startTime: match.startTime
        } : null,
        user: user ? {
          id: user._id.toString(),
          username: user.username,
          email: user.email
        } : null
      };
    }));
    
    return NextResponse.json({
      bets: betsWithDetails,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page
      }
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 