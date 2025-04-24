import { NextRequest, NextResponse } from 'next/server';
import { getModels } from '@/lib/mongodb/models';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Inicializar SDK do MercadoPago
const initMercadoPago = () => {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('Token do Mercado Pago não configurado');
  }
  
  return new MercadoPagoConfig({ 
    accessToken: accessToken 
  });
};

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
    const transactionId = result.insertedId.toString();
    
    // Adicionar transação à carteira do usuário
    if (!user.wallet) {
      user.wallet = { balance: 0, transactions: [] };
    }
    
    if (!user.wallet.transactions) {
      user.wallet.transactions = [];
    }
    
    user.wallet.transactions.push(result.insertedId);
    await user.save();
    
    // Preparar resposta padrão
    let paymentInstructions = {};
    let mercadoPagoRedirectUrl = '';
    
    try {
      // Inicializar o Mercado Pago
      const client = initMercadoPago();
      const preferenceClient = new Preference(client);
      
      // URL do webhook para receber notificações
      const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/webhook/mercadopago`;
      
      // URL de retorno após o pagamento
      const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile/wallet/deposit/success`;
      const failureUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile/wallet/deposit/failure`;
      
      // Obter nome do usuário
      const userName = user.name || user.username || 'Usuário';
      
      // Criar preferência no Mercado Pago
      const preferenceData = {
        items: [
          {
            id: transactionId,
            title: `Depósito na Carteira RPX`,
            description: `Depósito para ${userName}`,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: amount
          }
        ],
        external_reference: transactionId,
        notification_url: webhookUrl,
        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: successUrl
        },
        auto_return: 'approved'
      };
      
      // Adicionar configurações específicas para PIX ou cartão, se necessário
      if (paymentMethod === 'pix') {
        // Na versão atual do SDK, as configurações de métodos de pagamento podem ser diferentes
        // Consulte a documentação atualizada do Mercado Pago
      }
      
      // Criar a preferência
      const response = await preferenceClient.create({ body: preferenceData });
      
      // Obter URL de pagamento
      mercadoPagoRedirectUrl = response.init_point || '';
      
      // Atualizar a transação com o ID da preferência
      await db.collection('transactions').updateOne(
        { _id: result.insertedId },
        { 
          $set: { 
            'mercadoPago.preferenceId': response.id,
            'mercadoPago.initPoint': response.init_point
          }
        }
      );
      
      // Criar instruções de pagamento
      if (paymentMethod === 'pix') {
        paymentInstructions = {
          redirectUrl: mercadoPagoRedirectUrl,
          message: 'Você será redirecionado para o Mercado Pago para efetuar o pagamento via PIX'
        };
      } else {
        paymentInstructions = {
          redirectUrl: mercadoPagoRedirectUrl,
          message: 'Você será redirecionado para o Mercado Pago para efetuar o pagamento'
        };
      }
      
    } catch (mpError) {
      console.error('Erro ao criar preferência no Mercado Pago:', mpError);
      
      // Atualizar status da transação para erro
      await db.collection('transactions').updateOne(
        { _id: result.insertedId },
        { $set: { status: 'failed', error: 'Erro ao criar pagamento' } }
      );
      
      // Se falhar a integração com MercadoPago, retornamos erro
      return NextResponse.json(
        { error: 'Erro ao configurar gateway de pagamento. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
    
    // Retornar dados da transação
    return NextResponse.json({
      message: 'Solicitação de depósito registrada com sucesso',
      transaction: {
        id: transactionId,
        type: 'deposit',
        amount: amount,
        status: 'pending',
        paymentMethod: paymentMethod,
        reference: reference,
        createdAt: new Date()
      },
      paymentInstructions,
      redirectUrl: mercadoPagoRedirectUrl
    });
  } catch (error) {
    console.error('Erro ao processar solicitação de depósito:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação de depósito' },
      { status: 500 }
    );
  }
} 