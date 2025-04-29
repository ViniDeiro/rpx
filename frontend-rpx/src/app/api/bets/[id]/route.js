import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, getUserId, isAdmin } from '@/lib/auth/middleware';
import { getModels } from '@/lib/mongodb/models';

// GET - Obter detalhes de uma aposta específica
export async function GET(req, { params }) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult;
  
  try {
    // Obter ID da aposta da URL
    const betId = params.id;
    
    if (!betId) {
      return NextResponse.json(
        { error: 'ID da aposta não fornecido' },
        { status: 400 }
      );
    }
    
    // Obter ID do usuário da requisição autenticada
    const userId = getUserId(authenticatedReq);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não encontrado na requisição' },
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
    
    // Buscar aposta pelo ID
    const bet = await db.collection('bets').findOne(
      { _id: new mongoose.Types.ObjectId(betId) }
    );
    
    if (!bet) {
      return NextResponse.json(
        { error: 'Aposta não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se a aposta pertence ao usuário (ou se é admin)
    if (bet.userId !== userId && !isAdmin(authenticatedReq)) {
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar esta aposta' },
        { status: 403 }
      );
    }
    
    // Buscar detalhes adicionais da partida associada
    const match = await db.collection('matches').findOne(
      { _id: new mongoose.Types.ObjectId(bet.matchId) }
    );
    
    // Formatar aposta para resposta
    const formattedBet = {
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
      settledAt: bet.settledAt,
      cashoutAmount: bet.cashoutAmount,
      match: match ? {
        id: match._id.toString(),
        title: match.title,
        status: match.status,
        teams: match.teams
      } : null
    };
    
    // Retornar dados formatados
    return NextResponse.json({ bet: formattedBet });
  } catch (error) {
    console.error('Erro ao obter detalhes da aposta:', error);
    return NextResponse.json(
      { error: 'Erro ao obter detalhes da aposta' },
      { status: 500 }
    );
  }
}

// POST - Realizar cashout de uma aposta
export async function POST(req, { params }) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult;
  
  try {
    // Obter ID da aposta da URL
    const betId = params.id;
    
    if (!betId) {
      return NextResponse.json(
        { error: 'ID da aposta não fornecido' },
        { status: 400 }
      );
    }
    
    // Obter ID do usuário da requisição autenticada
    const userId = getUserId(authenticatedReq);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não encontrado na requisição' },
        { status: 400 }
      );
    }
    
    // Obter dados da requisição
    const body = await req.json();
    const { action } = body;
    
    // Verificar ação solicitada
    if (!action || (action !== 'cashout' && action !== 'cancel')) {
      return NextResponse.json(
        { error: 'Ação inválida. Ações permitidas: cashout, cancel' },
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
    
    // Buscar aposta pelo ID
    const bet = await db.collection('bets').findOne(
      { _id: new mongoose.Types.ObjectId(betId) }
    );
    
    if (!bet) {
      return NextResponse.json(
        { error: 'Aposta não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se a aposta pertence ao usuário
    if (bet.userId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para modificar esta aposta' },
        { status: 403 }
      );
    }
    
    // Verificar se a aposta está em estado pendente
    if (bet.status !== 'pending') {
      return NextResponse.json(
        { error: `Não é possível realizar ${action} em uma aposta que não está pendente` },
        { status: 400 }
      );
    }
    
    // Obter modelos do MongoDB
    const { User } = await getModels();
    
    // Iniciar sessão do MongoDB para transação
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      let updateData = {};
      let transactionData = {};
      
      if (action === 'cashout') {
        // Buscar a partida para verificar se ainda aceita cashout
        const match = await db.collection('matches').findOne(
          { _id: new mongoose.Types.ObjectId(bet.matchId) }
        );
        
        if (!match) {
          await session.abortTransaction();
          return NextResponse.json(
            { error: 'Partida associada não encontrada' },
            { status: 404 }
          );
        }
        
        // Verificar se a partida permite cashout
        if (match.status !== 'in_progress') {
          await session.abortTransaction();
          return NextResponse.json(
            { error: 'Esta partida não permite cashout no momento' },
            { status: 400 }
          );
        }
        
        // Calcular valor do cashout (70% a 95% do valor potencial, dependendo do estágio)
        // Esta lógica pode ser ajustada conforme regras de negócio
        const matchProgress = 0.5; // Exemplo: meio da partida
        const cashoutPercentage = 0.7 + (matchProgress * 0.25); // Entre 70% e 95%
        const cashoutAmount = bet.potentialWin * cashoutPercentage;
        
        // Atualizar aposta para status de cashout
        updateData = {
          status: 'cashout',
          cashoutAmount: cashoutAmount,
          settledAt: new Date(),
          updatedAt: new Date()
        };
        
        // Preparar dados da transação
        transactionData = {
          userId: userId,
          type: 'cashout',
          amount: cashoutAmount,
          status: 'completed',
          description: `Cashout da aposta #${betId}`,
          reference: { type: 'bet', id: betId },
          createdAt: new Date()
        };
        
        // Atualizar saldo do usuário
        await User.findByIdAndUpdate(
          userId,
          { $inc: { balance: cashoutAmount } },
          { session: session, new: true }
        );
      } else if (action === 'cancel') {
        // Atualizar aposta para status de cancelada
        updateData = {
          status: 'cancelled',
          settledAt: new Date(),
          updatedAt: new Date()
        };
        
        // Preparar dados da transação (reembolso do valor apostado)
        transactionData = {
          userId: userId,
          type: 'bet_refund',
          amount: bet.amount,
          status: 'completed',
          description: `Cancelamento da aposta #${betId}`,
          reference: { type: 'bet', id: betId },
          createdAt: new Date()
        };
        
        // Atualizar saldo do usuário (reembolsar o valor apostado)
        await User.findByIdAndUpdate(
          userId,
          { $inc: { balance: bet.amount } },
          { session: session, new: true }
        );
      }
      
      // Atualizar aposta
      await db.collection('bets').updateOne(
        { _id: new mongoose.Types.ObjectId(betId) },
        { $set: updateData },
        { session: session }
      );
      
      // Registrar transação
      await db.collection('transactions').insertOne(
        transactionData,
        { session: session }
      );
      
      // Confirmar transação
      await session.commitTransaction();
      
      // Buscar aposta atualizada
      const updatedBet = await db.collection('bets').findOne(
        { _id: new mongoose.Types.ObjectId(betId) }
      );
      
      // Formatar resposta
      const formattedBet = {
        id: updatedBet._id.toString(),
        userId: updatedBet.userId,
        matchId: updatedBet.matchId,
        amount: updatedBet.amount,
        odd: updatedBet.odd,
        potentialWin: updatedBet.potentialWin,
        type: updatedBet.type,
        selection: updatedBet.selection,
        status: updatedBet.status,
        settledAt: updatedBet.settledAt,
        cashoutAmount: updatedBet.cashoutAmount
      };
      
      // Retornar dados formatados
      return NextResponse.json({
        success: true,
        message: action === 'cashout' ? 'Cashout realizado com sucesso' : 'Aposta cancelada com sucesso',
        bet: formattedBet
      });
      
    } catch (txError) {
      // Reverter transação em caso de erro
      await session.abortTransaction();
      throw txError;
    } finally {
      // Finalizar sessão
      session.endSession();
    }
  } catch (error) {
    console.error(`Erro ao processar ${error}`, error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
}

// DELETE - Permite que o admin exclua uma aposta
export async function DELETE(req, { params }) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult;
  
  // Verificar se o usuário é admin
  if (!isAdmin(authenticatedReq)) {
    return NextResponse.json(
      { error: 'Apenas administradores podem excluir apostas' },
      { status: 403 }
    );
  }
  
  try {
    // Obter ID da aposta da URL
    const betId = params.id;
    
    if (!betId) {
      return NextResponse.json(
        { error: 'ID da aposta não fornecido' },
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
    const bet = await db.collection('bets').findOne({
      _id: new mongoose.Types.ObjectId(betId)
    });
    
    if (!bet) {
      return NextResponse.json(
        { error: 'Aposta não encontrada' },
        { status: 404 }
      );
    }
    
    // Iniciar sessão para transação
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Se a aposta já foi liquidada, não permitir exclusão
      if (['won', 'lost', 'cashout', 'settled'].includes(bet.status)) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: 'Não é possível excluir uma aposta já liquidada' },
          { status: 400 }
        );
      }
      
      // Se a aposta estiver pendente, devolver o valor ao usuário
      if (bet.status === 'pending') {
        const { User } = await getModels();
        
        // Devolver o valor apostado
        await User.findByIdAndUpdate(
          bet.userId,
          { $inc: { balance: bet.amount } },
          { session: session, new: true }
        );
        
        // Registrar transação de reembolso
        await db.collection('transactions').insertOne({
          userId,
          type: 'refund',
          amount: bet.amount,
          status: 'completed',
          description: `Reembolso por exclusão da aposta #${betId}`,
          reference: { type: 'bet', id: betId },
          adminAction: 'exclusão',
          createdAt: new Date()
        }, { session });
      }
      
      // Registrar log de auditoria
      await db.collection('admin_logs').insertOne({
        action: 'delete_bet',
        targetId: betId,
        targetCollection: 'bets',
        adminId: getUserId(authenticatedReq),
        details: {
          betStatus: bet.status,
          betAmount: bet.amount,
          userId: bet.userId,
          matchId: bet.matchId,
          timestamp: new Date()
        }
      }, { session });
      
      // Excluir a aposta
      await db.collection('bets').deleteOne({
        _id: new mongoose.Types.ObjectId(betId)
      }, { session });
      
      // Concluir transação
      await session.commitTransaction();
      
      // Retornar resposta de sucesso
      return NextResponse.json({
        success: true,
        message: 'Aposta excluída com sucesso'
      });
      
    } catch (txError) {
      // Reverter transação em caso de erro
      await session.abortTransaction();
      throw txError;
    } finally {
      // Finalizar sessão
      session.endSession();
    }
    
  } catch (error) {
    console.error('Erro ao excluir aposta:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir aposta' },
      { status: 500 }
    );
  }
} 