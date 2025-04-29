import { request, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Referência ao armazenamento simulado compartilhado entre APIs
// Na prática, isso seria armazenado em banco de dados
let transactions = [];
let userWallets, { balance }> = {};

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
    if (!amount: amount  setTimeout(resolve, 800));
    
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
    
    // Gerar referência única para o saque
    const reference = `WD-${uuidv4().substring(0, 8).toUpperCase()}`;
    const transactionId = uuidv4();
    
    // Criar nova transação simulada
    const transaction = {
      id,
      userId,
      type: 'withdrawal',
      amount,
      fee,
      netAmount,
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
    console.log(`💸 [SIMULAÇÃO] Novo saldo$${userWallets[userId].balance}`);
    
    // Retornar dados da transação
    return NextResponse.json({
      message: 'Saque simulado realizado com sucesso',
      transaction,
        type: 'withdrawal',
        amount,
        status: 'completed',
        paymentMethod,
        reference,
        createdAt: new Date()
      },
      simulation,
      currentBalance.balance,
      estimatedProcessingTime: 'Imediato (simulação)'
    });
  } catch (error) {
    console.error('Erro ao processar solicitação de saque simulado:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação de saque' },
      { status: 400 });
  }
} 