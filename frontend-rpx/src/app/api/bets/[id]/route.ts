import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, getUserId, isAdmin } from '@/lib/auth/middleware';
import { getModels } from '@/lib/mongodb/models';

// GET - Obter detalhes de uma aposta específica
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      let updateData: any = {};
      let transactionData: any = {};
      
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
          userId: bet.userId,
          type: 'bet_cashout',
          amount: cashoutAmount,
          relatedId: bet._id,
          description: `Cashout de aposta #${bet._id.toString().substring(0, 6)}`,
          status: 'completed',
          createdAt: new Date()
        };
      } else if (action === 'cancel') {
        // Verificar se é possível cancelar (por exemplo, partida ainda não começou)
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
        
        // Só permitir cancelamento se a partida ainda não começou
        if (match.status !== 'waiting') {
          await session.abortTransaction();
          return NextResponse.json(
            { error: 'Não é possível cancelar apostas em partidas que já começaram' },
            { status: 400 }
          );
        }
        
        // Atualizar aposta para status cancelado
        updateData = {
          status: 'canceled',
          settledAt: new Date(),
          updatedAt: new Date()
        };
        
        // Preparar dados da transação (devolução do valor apostado)
        transactionData = {
          userId: bet.userId,
          type: 'bet_canceled',
          amount: bet.amount, // Devolve o valor original da aposta
          relatedId: bet._id,
          description: `Cancelamento de aposta #${bet._id.toString().substring(0, 6)}`,
          status: 'completed',
          createdAt: new Date()
        };
      }
      
      // Atualizar a aposta no banco de dados
      await db.collection('bets').updateOne(
        { _id: new mongoose.Types.ObjectId(betId) },
        { $set: updateData }
      );
      
      // Inserir transação e atualizar saldo do usuário
      await db.collection('transactions').insertOne(transactionData, { session });
      
      // Atualizar saldo do usuário
      await User.findByIdAndUpdate(
        userId,
        { $inc: { 'wallet.balance': transactionData.amount } },
        { session }
      );
      
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
        cashoutAmount: updatedBet.cashoutAmount,
        settledAt: updatedBet.settledAt
      };
      
      // Retornar dados atualizados
      return NextResponse.json({
        message: action === 'cashout' 
          ? 'Cashout realizado com sucesso' 
          : 'Aposta cancelada com sucesso',
        bet: formattedBet,
        amount: transactionData.amount
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
    console.error(`Erro ao realizar operação na aposta:`, error);
    return NextResponse.json(
      { error: `Erro ao processar a solicitação` },
      { status: 500 }
    );
  }
} 