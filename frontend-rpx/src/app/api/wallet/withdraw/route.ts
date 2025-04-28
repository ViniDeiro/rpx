import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Referência ao armazenamento simulado compartilhado entre APIs
// Na prática, isso seria armazenado em banco de dados
let transactions: any[] = [];
let userWallets: Record<string, { balance: number }> = {};

// POST - Solicitar saque da carteira (versão simulada)
export async function POST(req: NextRequest) {
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
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valor inválido para saque' },
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
    const validMethods = ['pix', 'bank_transfer'];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Método de pagamento inválido' },
        { status: 400 }
      );
    }
    
    // Verificar se as informações da conta foram fornecidas
    if (!accountInfo) {
      return NextResponse.json(
        { error: 'Informações da conta são obrigatórias' },
        { status: 400 }
      );
    }
    
    if (paymentMethod === 'pix' && !accountInfo.pixKey) {
      return NextResponse.json(
        { error: 'Chave PIX é obrigatória' },
        { status: 400 }
      );
    }
    
    if (paymentMethod === 'bank_transfer' && (!accountInfo.bank || !accountInfo.agency || !accountInfo.account || !accountInfo.document)) {
      return NextResponse.json(
        { error: 'Dados bancários incompletos' },
        { status: 400 }
      );
    }
    
    // Verificar se o usuário tem saldo suficiente
    // Inicializar carteira se não existir
    if (!userWallets[userId]) {
      userWallets[userId] = { balance: 1000 }; // Já inicializamos com saldo para simulação
    }
    
    const balance = userWallets[userId].balance;
    
    if (balance < amount) {
      return NextResponse.json(
        { error: 'Saldo insuficiente para realizar o saque' },
        { status: 400 }
      );
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
        { status: 400 }
      );
    }
    
    // Gerar referência única para o saque
    const reference = `WD-${uuidv4().substring(0, 8).toUpperCase()}`;
    const transactionId = uuidv4();
    
    // Criar nova transação simulada
    const transaction = {
      id: transactionId,
      userId: userId,
      type: 'withdrawal',
      amount: amount,
      fee: withdrawalFee,
      netAmount: totalAmount,
      status: 'completed', // Na simulação, já aprovamos o saque automaticamente
      paymentMethod: paymentMethod,
      accountInfo: accountInfo,
      reference: reference,
      description: `Saque via ${paymentMethod === 'pix' ? 'PIX' : 'Transferência Bancária'}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Salvar transação em memória
    transactions.push(transaction);
    
    // Deduzir o valor imediatamente do saldo
    userWallets[userId].balance -= totalAmount;
    
    console.log(`💸 [SIMULAÇÃO] Saque de R$${amount} para o usuário ${userId} realizado com sucesso`);
    console.log(`💸 [SIMULAÇÃO] Novo saldo: R$${userWallets[userId].balance}`);
    
    // Retornar dados da transação
    return NextResponse.json({
      message: 'Saque simulado realizado com sucesso',
      transaction: {
        id: transactionId,
        type: 'withdrawal',
        amount: amount,
        status: 'completed',
        paymentMethod: paymentMethod,
        reference: reference,
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
      { status: 500 }
    );
  }
} 