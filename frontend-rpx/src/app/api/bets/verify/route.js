import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, getUserId, isAdmin } from '@/lib/auth/middleware';
import { getModels } from '@/lib/mongodb/models';

/**
 * PUT - Validar resultado de aposta pelo administrador
 * Permite que um administrador valide o resultado de uma aposta após o término da partida
 */
export async function PUT(req) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult;
  
  // Verificar se o usuário é um administrador
  if (!isAdmin(authenticatedReq)) {
    return NextResponse.json(
      { error: 'Acesso restrito a administradores' },
      { status: 403 }
    );
  }
  
  try {
    // Obter dados da requisição
    const body = await req.json();
    const { betId, outcome, notes } = body;
    
    // Validar entrada
    if (!betId) {
      return NextResponse.json(
        { error: 'ID da aposta é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!outcome || !['won', 'lost'].includes(outcome)) {
      return NextResponse.json(
        { error: 'Resultado deve ser "won" ou "lost"' },
        { status: 400 }
      );
    }
    
    // Conectar ao MongoDB
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      );
    }
    
    // Verificar se a aposta existe
    const bet = await db.collection('bets').findOne(
      { _id: new mongoose.Types.ObjectId(betId) }
    );
    
    if (!bet) {
      return NextResponse.json(
        { error: 'Aposta não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se a aposta já foi validada
    if (bet.status !== 'pending') {
      return NextResponse.json(
        { error: 'Esta aposta já foi validada ou encerrada' },
        { status: 400 }
      );
    }
    
    // Obter modelos do MongoDB
    const { User } = await getModels();
    
    // Iniciar sessão do MongoDB para transação
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Obter o ID do administrador para registro
      const adminId = getUserId(authenticatedReq);
      const now = new Date();
      
      // Preparar dados de atualização
      const updateData = {
        status: outcome,
        settledAt: now,
        updatedAt: now,
        validatedBy: adminId,
        validationNotes: notes || '',
        validatedAt: now
      };
      
      // Atualizar a aposta no banco de dados
      await db.collection('bets').updateOne(
        { _id: new mongoose.Types.ObjectId(betId) },
        { $set: updateData }
      );
      
      // Se a aposta foi ganha, processar o pagamento
      if (outcome === 'won') {
        // Inserir transação de pagamento
        await db.collection('transactions').insertOne({
          userId: bet.userId,
          type: 'bet_won',
          amount: bet.potentialWin,
          relatedId: bet._id,
          description: `Ganho de aposta #${bet._id.toString().substring(0, 6)}`,
          status: 'completed',
          createdAt: now
        }, { session });
        
        // Atualizar saldo do usuário
        await User.findByIdAndUpdate(
          bet.userId,
          { $inc: { 'wallet.balance': bet.potentialWin } },
          { session }
        );
      }
      
      // Registrar a ação do administrador
      await db.collection('admin_logs').insertOne({
        adminId: adminId,
        action: 'validate_bet',
        targetId: betId,
        details: {
          outcome,
          notes: notes || ''
        },
        createdAt: now
      }, { session });
      
      // Confirmar a transação
      await session.commitTransaction();
      
      // Buscar aposta atualizada
      const updatedBet = await db.collection('bets').findOne(
        { _id: new mongoose.Types.ObjectId(betId) }
      );
      
      if (!updatedBet) {
        return NextResponse.json(
          { error: 'Erro ao obter a aposta atualizada' },
          { status: 500 }
        );
      }
      
      // Formatar aposta para resposta
      const formattedBet = {
        id: updatedBet._id.toString(),
        userId: updatedBet.userId,
        matchId: updatedBet.matchId,
        amount: updatedBet.amount,
        odd: updatedBet.odd,
        potentialWin: updatedBet.potentialWin,
        status: updatedBet.status,
        settledAt: updatedBet.settledAt,
        validatedBy: updatedBet.validatedBy,
        validatedAt: updatedBet.validatedAt
      };
      
      // Notificar o usuário sobre o resultado da aposta (implementação básica)
      try {
        await db.collection('notifications').insertOne({
          userId: bet.userId,
          type: outcome === 'won' ? 'bet_won' : 'bet_lost',
          title: outcome === 'won' ? 'Aposta Ganha!' : 'Aposta Perdida',
          message: outcome === 'won' 
            ? `Sua aposta foi validada e você ganhou ${bet.potentialWin.toFixed(2)} moedas!`
            : 'Sua aposta foi validada. Mais sorte na próxima!',
          read: false,
          createdAt: now
        });
      } catch (notifError) {
        console.error('Erro ao enviar notificação:', notifError);
        // Não interromper o fluxo por falha na notificação
      }
      
      // Retornar dados atualizados
      return NextResponse.json({
        message: 'Aposta validada com sucesso',
        bet: formattedBet
      });
    } catch (error) {
      // Reverter a transação em caso de erro
      await session.abortTransaction();
      throw error;
    } finally {
      // Finalizar a sessão
      session.endSession();
    }
  } catch (error) {
    console.error('Erro ao validar aposta:', error);
    return NextResponse.json(
      { error: 'Erro ao validar aposta' },
      { status: 500 }
    );
  }
}

/**
 * GET - Listar apostas pendentes de validação
 * Permite que administradores vejam apostas que precisam de validação
 */
export async function GET(req) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult;
  
  // Verificar se o usuário é um administrador
  if (!isAdmin(authenticatedReq)) {
    return NextResponse.json(
      { error: 'Acesso restrito a administradores' },
      { status: 403 }
    );
  }
  
  try {
    // Obter parâmetros de consulta
    const url = new URL(authenticatedReq.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const matchId = url.searchParams.get('matchId');
    
    // Calcular o skip para paginação
    const skip = (page - 1) * limit;
    
    // Preparar filtro de consulta
    const filter = { status: 'pending' };
    
    if (matchId) {
      filter.matchId = matchId;
    }
    
    // Conectar ao MongoDB
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      );
    }
    
    // Buscar apostas pendentes
    const bets = await db.collection('bets')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Contar total para paginação
    const total = await db.collection('bets').countDocuments(filter);
    
    // Buscar detalhes adicionais das partidas e usuários
    const matchIds = [...new Set(bets.map(bet => bet.matchId))];
    const userIds = [...new Set(bets.map(bet => bet.userId))];
    
    // Buscar partidas em paralelo
    const matches = await db.collection('matches')
      .find({ _id: { $in: matchIds.map(id => new mongoose.Types.ObjectId(id)) } })
      .toArray();
    
    // Buscar usuários em paralelo
    const users = await db.collection('users')
      .find({ _id: { $in: userIds.map(id => new mongoose.Types.ObjectId(id)) } })
      .project({ _id: 1, username: 1, email: 1 })
      .toArray();
    
    // Mapear IDs para objetos para facilitar a busca
    const matchesMap = {};
    const usersMap = {};
    
    matches.forEach(match => {
      matchesMap[match._id.toString()] = match;
    });
    
    users.forEach(user => {
      usersMap[user._id.toString()] = user;
    });
    
    // Processar apostas para resposta
    const formattedBets = bets.map(bet => {
      const matchDetails = matchesMap[bet.matchId] || null;
      const userDetails = usersMap[bet.userId] || null;
      
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
        match: matchDetails ? {
          id: matchDetails._id.toString(),
          title: matchDetails.title || '',
          status: matchDetails.status || '',
          startTime: matchDetails.startTime || null
        } : null,
        user: userDetails ? {
          id: userDetails._id.toString(),
          username: userDetails.username || '',
          email: userDetails.email || ''
        } : null
      };
    });
    
    // Retornar dados
    return NextResponse.json({
      bets: formattedBets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar apostas pendentes:', error);
    return NextResponse.json(
      { error: 'Erro ao listar apostas pendentes' },
      { status: 500 }
    );
  }
} 