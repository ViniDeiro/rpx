import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Armazenamento simulado (em memória)
// Na prática, isso seria armazenado em banco de dados
let transactions: any[] = [];
let userWallets: Record<string, { balance: number }> = {};

// POST - Solicitar depósito na carteira (versão simulada)
export async function POST(req: NextRequest) {
  try {
    // Simulamos que a requisição já está autenticada
    // Em produção, isso seria feito por um middleware auth
    const headers = req.headers;
    const authorization = headers.get('authorization') || '';
    const userId = authorization.replace('Bearer ', '') || 'user-sim-' + uuidv4().substring(0, 8);
    
    // Obter dados da requisição
    const body = await req.json();
    const { amount, paymentMethod } = body;
    
    // Validar dados
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valor inválido para depósito' },
        { status: 400 }
      );
    }
    
    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Método de pagamento obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar se o método de pagamento é válido
    const validMethods = ['pix', 'credit_card', 'bank_transfer', 'card', 'boleto'];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Método de pagamento inválido' },
        { status: 400 }
      );
    }
    
    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Gerar referência única para o depósito
    const reference = `DEP-${uuidv4().substring(0, 8).toUpperCase()}`;
    const transactionId = uuidv4();
    
    // Criar nova transação simulada
    const transaction = {
      id: transactionId,
      userId: userId,
      type: 'deposit',
      amount: amount,
      status: 'completed', // Na simulação, já aprovamos o depósito automaticamente
      paymentMethod: paymentMethod,
      reference: reference,
      description: `Depósito via ${paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'credit_card' || paymentMethod === 'card' ? 'Cartão de Crédito' : paymentMethod === 'boleto' ? 'Boleto Bancário' : 'Transferência Bancária'}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Salvar transação em memória
    transactions.push(transaction);
    
    // Atualizar saldo do usuário
    if (!userWallets[userId]) {
      userWallets[userId] = { balance: 0 };
    }
    
    userWallets[userId].balance += amount;
    
    // Armazenar o saldo atualizado no localStorage para persistência
    const currentBalance = userWallets[userId].balance;
    
    console.log(`💰 [SIMULAÇÃO] Depósito de R$${amount} para o usuário ${userId} realizado com sucesso`);
    console.log(`💰 [SIMULAÇÃO] Novo saldo: R$${currentBalance}`);
    
    // Simular instruções de pagamento
    const paymentInstructions = {
      redirectUrl: 'https://exemplo.com/pagamento-simulado',
      message: 'Esta é uma simulação. Em um ambiente real, você seria redirecionado para o processador de pagamento.'
    };
    
    // Retornar dados da transação
    return NextResponse.json({
      message: 'Depósito simulado realizado com sucesso',
      transaction: {
        id: transactionId,
        type: 'deposit',
        amount: amount,
        status: 'completed',
        paymentMethod: paymentMethod,
        reference: reference,
        createdAt: new Date()
      },
      paymentInstructions,
      simulation: true,
      currentBalance: currentBalance,
      walletUpdated: true // Indicar que o saldo foi atualizado
    });
  } catch (error) {
    console.error('Erro ao processar solicitação de depósito simulado:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação de depósito' },
      { status: 500 }
    );
  }
} 