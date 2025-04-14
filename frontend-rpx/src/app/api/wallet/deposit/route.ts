import { NextRequest, NextResponse } from 'next/server';
import { getModels } from '@/lib/mongodb/models';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// POST - Solicitar depósito na carteira
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
    const validMethods = ['pix', 'credit_card', 'bank_transfer'];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Método de pagamento inválido' },
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
    
    // Gerar referência única para o depósito
    const reference = `DEP-${uuidv4().substring(0, 8).toUpperCase()}`;
    
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
      type: 'deposit',
      amount: amount,
      status: 'pending',
      paymentMethod: paymentMethod,
      reference: reference,
      description: `Depósito via ${paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 'Transferência Bancária'}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Salvar transação no banco de dados
    const result = await db.collection('transactions').insertOne(transaction);
    
    // Adicionar transação à carteira do usuário
    if (!user.wallet) {
      user.wallet = { balance: 0, transactions: [] };
    }
    
    if (!user.wallet.transactions) {
      user.wallet.transactions = [];
    }
    
    user.wallet.transactions.push(result.insertedId);
    await user.save();
    
    // Gerar instruções de pagamento (simulado)
    let paymentInstructions = {};
    
    if (paymentMethod === 'pix') {
      paymentInstructions = {
        pixKey: 'rpx-platform@exemplo.com',
        qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=rpx-platform-payment',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      };
    } else if (paymentMethod === 'bank_transfer') {
      paymentInstructions = {
        bank: 'Banco RPX',
        agency: '0001',
        account: '123456-7',
        name: 'RPX Platform Tecnologia Ltda',
        document: '12.345.678/0001-90'
      };
    }
    
    // Retornar dados da transação
    return NextResponse.json({
      message: 'Solicitação de depósito registrada com sucesso',
      transaction: {
        id: result.insertedId.toString(),
        type: 'deposit',
        amount: amount,
        status: 'pending',
        paymentMethod: paymentMethod,
        reference: reference,
        createdAt: new Date()
      },
      paymentInstructions
    });
  } catch (error) {
    console.error('Erro ao processar solicitação de depósito:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação de depósito' },
      { status: 500 }
    );
  }
} 