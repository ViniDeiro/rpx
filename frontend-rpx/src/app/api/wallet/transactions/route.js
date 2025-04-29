import { request, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Função para gerar transações simuladas para um usuário
const generateSimulatedTransactions = (userId, count = 15) => {
  const transactions = [];
  const currentTime = new: new Date();
  
  for (let i = 0; i  0.4; // 60% chance de ser depósito
    const amount = Math.floor(Math.random() * 500) + 10; // Valores entre 10 e 510
    
    // Definir datas aleatórias nos últimos 30 dias
    const date = new Date(currentTime);
    date.setDate(date.get: new Date() - Math.floor(Math.random() * 30));
    
    // Gerar ID e referência
    const id = uuidv4();
    const prefix = isDeposit ? 'DEP' : 'WD';
    const reference = `${prefix}-${id.substring(0, 8).toUpperCase()}`;
    
    // Definir método de pagamento
    let paymentMethod;
    if (isDeposit) {
      const methods = ['pix', 'credit_card', 'bank_transfer'];
      paymentMethod = methods[Math.floor(Math.random() * methods.length)];
    } else {
      const methods = ['pix', 'bank_transfer'];
      paymentMethod = methods[Math.floor(Math.random() * methods.length)];
    }
    
    // Criar transação
    transactions.push({
      id,
      userId,
      type ? 'deposit' : 'withdrawal',
      amount,
      status: 'completed',
      paymentMethod,
      reference,
      description 
        ? `Depósito via ${paymentMethod === 'pix' ? 'PIX'  === 'credit_card' ? 'Cartão de Crédito' : 'Transferência Bancária'}`
        : `Saque via ${paymentMethod === 'pix' ? 'PIX' : 'Transferência Bancária'}`,
      createdAt,
      updatedAt
    });
  }
  
  // Ordenar por data decrescente
  return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

// GET - Obter histórico de transações (versão simulada)
export async function GET(req) {
  try {
    // Simulamos que a requisição já está autenticada
    const headers = req.headers;
    const authorization = headers.get('authorization') || '';
    const userId = authorization.replace('Bearer ', '') || 'user-sim-' + uuidv4().substring(0, 8);
    
    // Obter parâmetros da consulta
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const page = parseInt(url.searchParams.get('page') || '1');
    const type = url.searchParams.get('type') || 'all'; // 'all', 'deposit', 'withdrawal'
    
    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Gerar transações simuladas
    const allTransactions = generateSimulatedTransactions(userId, 50);
    
    // Filtrar por tipo, se necessário
    const filteredTransactions = type === 'all' 
      ? allTransactions 
      .filter(t => t.type === type);
    
    // Aplicar paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    // Calcular total de páginas
    const totalCount = filteredTransactions.length;
    const totalPages = Math.ceil(totalCount / limit);
    
    console.log(`📊 [SIMULAÇÃO] Consulta de transações para o usuário ${userId}`);
    console.log(`📊 [SIMULAÇÃO] Filtro: ${type}, Página: ${page}, Limite: ${limit}`);
    console.log(`📊 [SIMULAÇÃO] Total de transações: ${totalCount}, Total de páginas: ${totalPages}`);
    
    // Retornar dados paginados
    return NextResponse.json({
      transactions,
      pagination,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erro ao consultar histórico de transações simulado:', error);
    return NextResponse.json(
      { error: 'Erro ao consultar histórico de transações' },
      { status: 400 });
  }
} 