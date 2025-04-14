import { NextRequest, NextResponse } from 'next/server';
import { getModels } from '@/lib/mongodb/models';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';
import mongoose from 'mongoose';

// GET - Obter histórico de transações do usuário
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
    const type = url.searchParams.get('type'); // deposit, withdrawal, match_win, match_entry, etc.
    const status = url.searchParams.get('status'); // completed, pending, failed
    
    // Calcular o skip para paginação
    const skip = (page - 1) * limit;
    
    // Preparar filtro de consulta
    const filter: any = { userId: userId };
    
    if (type) {
      filter.type = type;
    }
    
    if (status) {
      filter.status = status;
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
    
    // Buscar transações utilizando o modelo Transaction
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      );
    }
    
    const transactions = await db.collection('transactions')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Contar total de transações para paginação
    const total = await db.collection('transactions').countDocuments(filter);
    
    // Retornar dados
    return NextResponse.json({
      transactions: transactions.map((tx: any) => ({
        id: tx._id.toString(),
        type: tx.type,
        amount: tx.amount,
        status: tx.status,
        date: tx.createdAt,
        method: tx.paymentMethod,
        description: tx.description,
        reference: tx.reference
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao obter histórico de transações:', error);
    return NextResponse.json(
      { error: 'Erro ao obter histórico de transações' },
      { status: 500 }
    );
  }
} 