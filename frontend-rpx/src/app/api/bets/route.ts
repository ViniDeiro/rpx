import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';
import { getModels } from '@/lib/mongodb/models';

// Interface para apostas
interface Bet {
  id: string;
  userId: string;
  matchId: string;
  amount: number;
  odd: number;
  potentialWin: number;
  type: string;
  selection: string | number | boolean;
  status: 'pending' | 'won' | 'lost' | 'canceled' | 'cashout';
  createdAt: Date;
  settledAt?: Date;
  cashoutAmount?: number;
}

// GET - Listar apostas do usuário
export async function GET(req: NextRequest) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult;
  
  try {
    // Obter ID do usuário da requisição autenticada
    const userId = getUserId(authenticatedReq);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não encontrado na requisição' },
        { status: 400 }
      );
    }
    
    // Obter parâmetros de consulta
    const url = new URL(authenticatedReq.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status'); // pending, won, lost, etc.
    const matchId = url.searchParams.get('matchId'); // filtrar por partida específica
    
    // Calcular o skip para paginação
    const skip = (page - 1) * limit;
    
    // Preparar filtro de consulta
    const filter: any = { userId: userId };
    
    if (status) {
      filter.status = status;
    }
    
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
    
    // Buscar apostas do usuário
    const bets = await db.collection('bets')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Contar total de apostas para paginação
    const total = await db.collection('bets').countDocuments(filter);
    
    // Processar apostas para resposta
    const formattedBets: Bet[] = bets.map((bet: any) => ({
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
      cashoutAmount: bet.cashoutAmount
    }));
    
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
    console.error('Erro ao listar apostas:', error);
    return NextResponse.json(
      { error: 'Erro ao listar apostas' },
      { status: 500 }
    );
  }
}

// POST - Criar nova aposta
export async function POST(req: NextRequest) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult;
  
  try {
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
    const { matchId, amount, odd, type, selection } = body;
    
    // Validar dados da aposta
    if (!matchId) {
      return NextResponse.json(
        { error: 'ID da partida é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valor da aposta deve ser maior que zero' },
        { status: 400 }
      );
    }
    
    if (!odd || odd <= 1) {
      return NextResponse.json(
        { error: 'Odd deve ser maior que 1' },
        { status: 400 }
      );
    }
    
    if (!type) {
      return NextResponse.json(
        { error: 'Tipo de aposta é obrigatório' },
        { status: 400 }
      );
    }
    
    if (selection === undefined) {
      return NextResponse.json(
        { error: 'Seleção da aposta é obrigatória' },
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
    
    // Verificar se a partida existe
    const match = await db.collection('matches').findOne(
      { _id: new mongoose.Types.ObjectId(matchId) }
    );
    
    if (!match) {
      return NextResponse.json(
        { error: 'Partida não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se a partida está disponível para apostas
    if (match.status !== 'waiting' && match.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Esta partida não está disponível para apostas' },
        { status: 400 }
      );
    }
    
    // Obter modelos do MongoDB
    const { User } = await getModels();
    
    // Verificar se o usuário existe
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário tem saldo suficiente
    if (user.wallet?.balance < amount) {
      return NextResponse.json(
        { error: 'Saldo insuficiente para realizar esta aposta' },
        { status: 400 }
      );
    }
    
    // Calcular potencial ganho
    const potentialWin = amount * odd;
    
    // Criar objeto da aposta
    const bet = {
      userId,
      matchId,
      amount,
      odd,
      potentialWin,
      type,
      selection,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Iniciar sessão do MongoDB para transação
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Inserir a aposta no banco de dados
      const betResult = await db.collection('bets').insertOne(bet);
      
      // Deduzir o valor da aposta do saldo do usuário
      await User.findByIdAndUpdate(
        userId,
        { $inc: { 'wallet.balance': -amount } },
        { session }
      );
      
      // Registrar a transação
      await db.collection('transactions').insertOne({
        userId,
        type: 'bet_placed',
        amount: -amount,
        relatedId: betResult.insertedId,
        description: `Aposta em ${match.title || matchId}`,
        status: 'completed',
        createdAt: new Date()
      }, { session });
      
      // Confirmar a transação
      await session.commitTransaction();
      
      // Formatar aposta para resposta
      const formattedBet = {
        id: betResult.insertedId.toString(),
        userId,
        matchId,
        amount,
        odd,
        potentialWin,
        type,
        selection,
        status: 'pending',
        createdAt: new Date()
      };
      
      // Retornar dados da aposta criada
      return NextResponse.json({
        message: 'Aposta realizada com sucesso',
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
    console.error('Erro ao criar aposta:', error);
    return NextResponse.json(
      { error: 'Erro ao criar aposta' },
      { status: 500 }
    );
  }
} 