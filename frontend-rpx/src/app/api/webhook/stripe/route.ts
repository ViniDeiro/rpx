import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import Stripe from 'stripe';

/**
 * Webhook para receber notificações do Stripe
 * Esta rota processa eventos do Stripe como pagamentos bem-sucedidos,
 * falhas, reembolsos, etc.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Webhook Stripe - Recebida notificação');
    
    // Obter os cabeçalhos necessários do Stripe
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      console.error('Webhook Stripe - Assinatura não encontrada');
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 400 });
    }
    
    // Obter o corpo da requisição como texto
    const rawBody = await request.text();
    
    // Inicializar o cliente Stripe
    const stripeApiKey = process.env.STRIPE_SECRET_KEY;
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!stripeApiKey || !stripeWebhookSecret) {
      console.error('Webhook Stripe - Credenciais não configuradas');
      return NextResponse.json({ error: 'Configuração incompleta' }, { status: 500 });
    }
    
    const stripe = new Stripe(stripeApiKey, {
      apiVersion: '2023-10-16' // Usando a versão mais recente da API
    });
    
    // Verificar a assinatura do webhook
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        stripeWebhookSecret
      );
    } catch (err: any) {
      console.error(`Webhook Stripe - Erro de assinatura: ${err.message}`);
      return NextResponse.json({ error: `Erro de assinatura: ${err.message}` }, { status: 400 });
    }
    
    console.log(`Webhook Stripe - Evento recebido: ${event.type}`);
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    if (!db) {
      console.error('Webhook Stripe - Erro de conexão com o banco de dados');
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
    
    // Processar eventos específicos
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object, db);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object, db);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object, db);
        break;
      default:
        console.log(`Webhook Stripe - Evento não processado: ${event.type}`);
    }
    
    // Retornar resposta de sucesso
    return NextResponse.json({ received: true }, { status: 200 });
    
  } catch (error) {
    console.error('Webhook Stripe - Erro inesperado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * Processa pagamentos bem-sucedidos
 */
async function handlePaymentIntentSucceeded(paymentIntent: any, db: any) {
  try {
    // Extrair metadados relevantes, incluindo o ID da transação
    const { transactionId } = paymentIntent.metadata || {};
    
    if (!transactionId) {
      console.error('Webhook Stripe - ID de transação não encontrado nos metadados');
      return;
    }
    
    // Buscar a transação no banco de dados
    const transactions = db.collection('transactions');
    const transaction = await transactions.findOne({
      $or: [
        { _id: new ObjectId(transactionId) },
        { externalId: transactionId },
        { 'paymentDetails.stripeId': paymentIntent.id }
      ]
    });
    
    if (!transaction) {
      console.error(`Webhook Stripe - Transação não encontrada: ${transactionId}`);
      return;
    }
    
    // Atualizar o status da transação
    await transactions.updateOne(
      { _id: transaction._id },
      { 
        $set: { 
          status: 'completed',
          updatedAt: new Date(),
          'paymentDetails.stripePaymentIntentId': paymentIntent.id,
          'paymentDetails.stripeChargeId': paymentIntent.latest_charge,
          gatewayResponse: paymentIntent
        }
      }
    );
    
    console.log(`Webhook Stripe - Transação ${transactionId} marcada como completa`);
    
    // Se for um depósito, atualizar o saldo do usuário
    if (transaction.type === 'deposit') {
      const users = db.collection('users');
      
      // Atualizar o saldo do usuário
      await users.updateOne(
        { _id: new ObjectId(transaction.userId) },
        { $inc: { balance: transaction.amount } }
      );
      
      console.log(`Webhook Stripe - Saldo do usuário ${transaction.userId} atualizado com ${transaction.amount}`);
      
      // Criar uma notificação para o usuário
      const notifications = db.collection('notifications');
      await notifications.insertOne({
        userId: new ObjectId(transaction.userId),
        type: 'payment',
        title: 'Pagamento confirmado',
        message: `Seu depósito de R$ ${transaction.amount.toFixed(2)} foi processado com sucesso.`,
        read: false,
        data: {
          transactionId: transaction._id.toString(),
          amount: transaction.amount
        },
        createdAt: new Date()
      });
    }
  } catch (error) {
    console.error('Webhook Stripe - Erro ao processar pagamento bem-sucedido:', error);
  }
}

/**
 * Processa falhas de pagamento
 */
async function handlePaymentIntentFailed(paymentIntent: any, db: any) {
  try {
    // Extrair metadados relevantes, incluindo o ID da transação
    const { transactionId } = paymentIntent.metadata || {};
    
    if (!transactionId) {
      console.error('Webhook Stripe - ID de transação não encontrado nos metadados');
      return;
    }
    
    // Buscar a transação no banco de dados
    const transactions = db.collection('transactions');
    const transaction = await transactions.findOne({
      $or: [
        { _id: new ObjectId(transactionId) },
        { externalId: transactionId },
        { 'paymentDetails.stripeId': paymentIntent.id }
      ]
    });
    
    if (!transaction) {
      console.error(`Webhook Stripe - Transação não encontrada: ${transactionId}`);
      return;
    }
    
    // Obter o motivo da falha
    const error = paymentIntent.last_payment_error;
    const failureMessage = error ? error.message : 'Falha no processamento do pagamento';
    
    // Atualizar o status da transação
    await transactions.updateOne(
      { _id: transaction._id },
      { 
        $set: { 
          status: 'failed',
          updatedAt: new Date(),
          'paymentDetails.failureReason': failureMessage,
          gatewayResponse: paymentIntent
        }
      }
    );
    
    console.log(`Webhook Stripe - Transação ${transactionId} marcada como falha`);
    
    // Criar uma notificação para o usuário
    const notifications = db.collection('notifications');
    await notifications.insertOne({
      userId: new ObjectId(transaction.userId),
      type: 'payment',
      title: 'Falha no pagamento',
      message: `Houve uma falha no processamento do seu pagamento: ${failureMessage}`,
      read: false,
      data: {
        transactionId: transaction._id.toString(),
        errorMessage: failureMessage
      },
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Webhook Stripe - Erro ao processar falha de pagamento:', error);
  }
}

/**
 * Processa reembolsos
 */
async function handleChargeRefunded(charge: any, db: any) {
  try {
    // Buscar a transação pela ID da cobrança
    const transactions = db.collection('transactions');
    const transaction = await transactions.findOne({
      $or: [
        { 'paymentDetails.stripeChargeId': charge.id },
        { 'gatewayResponse.latest_charge': charge.id }
      ]
    });
    
    if (!transaction) {
      console.error(`Webhook Stripe - Transação não encontrada para a cobrança: ${charge.id}`);
      return;
    }
    
    // Atualizar o status da transação
    await transactions.updateOne(
      { _id: transaction._id },
      { 
        $set: { 
          status: 'refunded',
          updatedAt: new Date(),
          'paymentDetails.refundedAt': new Date(),
          'paymentDetails.refundAmount': charge.amount_refunded / 100, // Stripe usa centavos
          gatewayResponse: charge
        }
      }
    );
    
    console.log(`Webhook Stripe - Transação ${transaction._id} marcada como reembolsada`);
    
    // Se foi um depósito já processado, reverter o saldo do usuário
    if (transaction.type === 'deposit' && transaction.status === 'completed') {
      const users = db.collection('users');
      
      // Atualizar o saldo do usuário (deduzir o valor reembolsado)
      await users.updateOne(
        { _id: new ObjectId(transaction.userId) },
        { $inc: { balance: -transaction.amount } }
      );
      
      console.log(`Webhook Stripe - Saldo do usuário ${transaction.userId} reduzido em ${transaction.amount} após reembolso`);
      
      // Criar uma notificação para o usuário
      const notifications = db.collection('notifications');
      await notifications.insertOne({
        userId: new ObjectId(transaction.userId),
        type: 'payment',
        title: 'Pagamento reembolsado',
        message: `Seu depósito de R$ ${transaction.amount.toFixed(2)} foi reembolsado.`,
        read: false,
        data: {
          transactionId: transaction._id.toString(),
          amount: transaction.amount
        },
        createdAt: new Date()
      });
    }
  } catch (error) {
    console.error('Webhook Stripe - Erro ao processar reembolso:', error);
  }
} 