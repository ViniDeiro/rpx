import { NextRequest, NextResponse } from 'next/server';
import { getModels } from '@/lib/mongodb/models';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// POST - Solicitar saque da carteira
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
    
    // Verificar se a carteira do usuário está bloqueada
    if (user.wallet?.isLocked) {
      return NextResponse.json(
        { error: 'Sua carteira está bloqueada. Entre em contato com o suporte.' },
        { status: 403 }
      );
    }
    
    // Verificar se o usuário tem saldo suficiente
    const balance = user.wallet?.balance || 0;
    
    if (balance < amount) {
      return NextResponse.json(
        { error: 'Saldo insuficiente para realizar o saque' },
        { status: 400 }
      );
    }
    
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
    
    // Criar nova transação
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      );
    }
    
    const transaction = {
      userId: userId,
      type: 'withdrawal',
      amount: amount,
      fee: withdrawalFee,
      netAmount: totalAmount,
      status: 'pending',
      paymentMethod: paymentMethod,
      accountInfo: accountInfo,
      reference: reference,
      description: `Saque via ${paymentMethod === 'pix' ? 'PIX' : 'Transferência Bancária'}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Salvar transação no banco de dados
    const result = await db.collection('transactions').insertOne(transaction);
    
    // Deduzir o valor imediatamente do saldo (ou aguardar confirmação, dependendo da política)
    user.wallet.balance -= totalAmount;
    
    // Adicionar transação à carteira do usuário
    if (!user.wallet.transactions) {
      user.wallet.transactions = [];
    }
    
    user.wallet.transactions.push(result.insertedId);
    user.updatedAt = new Date();
    await user.save();
    
    // Retornar dados da transação
    return NextResponse.json({
      message: 'Solicitação de saque registrada com sucesso',
      transaction: {
        id: result.insertedId.toString(),
        type: 'withdrawal',
        amount: amount,
        status: 'pending',
        paymentMethod: paymentMethod,
        reference: reference,
        createdAt: new Date()
      },
      estimatedProcessingTime: '1-3 dias úteis'
    });
  } catch (error) {
    console.error('Erro ao processar solicitação de saque:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação de saque' },
      { status: 500 }
    );
  }
} 