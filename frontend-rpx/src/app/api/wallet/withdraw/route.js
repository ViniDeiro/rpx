import { request, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Referência ao armazenamento simulado compartilhado entre APIs
// Na prática, isso seria armazenado em banco de dados
let transactions = [];
let userWallets = {};

// POST - Solicitar saque da carteira (versão simulada)
export async function POST(req) {
  try {
    // Simulamos que a requisição já está autenticada
    // Em produção, isso seria feito por um middleware auth
    const headers = req.headers;
    const authorization = headers.get('authorization') || '';
    const userId = authorization.replace('Bearer ', '') || 'user-sim-' + uuidv4().substring(0, 8);
    
    // Obter dados da requisição
    const body = await req.json();
    const { amount, paymentMethod, accountInfo } = body;
    
    // Validar dados
    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: 'Valor de saque inválido' },
        { status: 400 });
    }
    
    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Calcular taxa de saque (se aplicável)
    const withdrawalFee = 0; // Sem taxa para o exemplo
    const totalAmount = amount;
    
    // Verificar se o valor mínimo de saque é atendido
    const minWithdrawalAmount = 10; // Valor mínimo de saque
    
    if (amount < minWithdrawalAmount) {
      return NextResponse.json(
        { error: `O valor mínimo para saque é ${minWithdrawalAmount}` },
        { status: 400 });
    }
    
    // Inicializar a carteira se não existir
    if (!userWallets[userId]) {
      userWallets[userId] = { balance: 1000 }; // Inicializar com saldo para simulação
    }
    
    // Verificar saldo
    if (userWallets[userId].balance < totalAmount) {
      return NextResponse.json(
        { error: 'Saldo insuficiente para realizar o saque' },
        { status: 400 });
    }
    
    // Gerar referência única para o saque
    const reference = `WD-${uuidv4().substring(0, 8).toUpperCase()}`;
    const transactionId = uuidv4();
    
    // Criar nova transação simulada
    const transaction = {
      id: transactionId,
      userId: userId,
      type: 'withdrawal',
      amount,
      fee: withdrawalFee,
      netAmount: amount - withdrawalFee,
      status: 'completed', // Na simulação, já aprovamos o saque automaticamente
      paymentMethod,
      accountInfo,
      reference,
      description: `Saque via ${paymentMethod === 'pix' ? 'PIX' : 'Transferência Bancária'}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Salvar transação em memória
    transactions.push(transaction);
    
    // Deduzir o valor imediatamente do saldo
    userWallets[userId].balance -= totalAmount;
    
    console.log(`💸 [SIMULAÇÃO] Saque de R$${amount} para o usuário ${userId} realizado com sucesso`);
    console.log(`💸 [SIMULAÇÃO] Novo saldo: $${userWallets[userId].balance}`);
    
    // Retornar dados da transação
    return NextResponse.json({
      message: 'Saque simulado realizado com sucesso',
      transaction: {
        id: transactionId,
        type: 'withdrawal',
        amount,
        status: 'completed',
        paymentMethod,
        reference,
        createdAt: new Date()
      },
      simulation: true,
      currentBalance: userWallets[userId].balance,
      estimatedProcessingTime: 'Imediato (simulação)'
    });
  } catch (error) {
    console.error('Erro ao processar solicitação de saque simulado:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação de saque' },
      { status: 400 });
  }
} 