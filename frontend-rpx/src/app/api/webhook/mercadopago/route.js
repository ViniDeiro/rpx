import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

/**
 * Webhook para receber notificações do MercadoPago
 * Esta rota recebe atualizações de status de pagamento
 * e atualiza as transações no banco de dados
 */
export async function POST(request) {
  try {
    console.log('Webhook MercadoPago - Recebida notificação');
    
    // Verifica se a requisição vem do MercadoPago (idealmente com validação de assinatura)
    const mercadoPagoSignature = request.headers.get('x-signature');
    // Implementação real exigiria validação da assinatura com o secret do MercadoPago
    
    // Obter os dados da requisição
    const data = await request.json();
    console.log('Webhook MercadoPago - Dados recebidos:', JSON.stringify(data));
    
    // Validar os dados recebidos
    if (!data || !data.data || !data.data.id) {
      console.error('Webhook MercadoPago - Dados inválidos');
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    if (!db) {
      console.error('Webhook MercadoPago - Erro de conexão com o banco de dados');
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
    
    // Extrair o ID da transação e o tipo de notificação
    const paymentId = data.data.id;
    const type = data.type || 'payment';
    
    // Verifique se é uma notificação de pagamento
    if (type !== 'payment' && type !== 'payment.updated' && type !== 'payment.created') {
      console.log(`Webhook MercadoPago - Tipo de notificação ignorado: ${type}`);
      return NextResponse.json({ message: 'Notificação recebida, mas ignorada' }, { status: 200 });
    }
    
    // Verificar o status do pagamento usando a API do MercadoPago
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpAccessToken) {
      console.error('Webhook MercadoPago - Token de acesso não configurado');
      return NextResponse.json({ error: 'Configuração incompleta' }, { status: 500 });
    }
    
    // Buscar detalhes do pagamento na API do MercadoPago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`
      }
    });
    
    if (!response.ok) {
      console.error(`Webhook MercadoPago - Erro ao verificar pagamento: ${response.status}`);
      return NextResponse.json({ error: 'Erro ao verificar pagamento' }, { status: 500 });
    }
    
    // Obter detalhes do pagamento
    const paymentData = await response.json();
    console.log('Webhook MercadoPago - Detalhes do pagamento:', JSON.stringify(paymentData));
    
    // Verificar se há um external_reference, que deve ser o ID da nossa transação
    const transactionId = paymentData.external_reference;
    if (!transactionId) {
      console.error('Webhook MercadoPago - Referência externa não encontrada');
      return NextResponse.json({ error: 'Referência externa não encontrada' }, { status: 400 });
    }
    
    // Mapear o status do MercadoPago para o nosso formato interno
    const statusMapping = {
      'approved': 'completed',
      'authorized': 'pending',
      'in_process': 'pending',
      'in_mediation': 'pending',
      'rejected': 'failed',
      'cancelled': 'failed',
      'refunded': 'refunded',
      'charged_back': 'refunded'
    };
    
    // Obter o novo status
    const mpStatus = paymentData.status;
    const internalStatus = statusMapping[mpStatus] || 'pending';
    
    // Atualizar a transação no banco de dados
    const transactions = db.collection('transactions');
    
    // Tentar encontrar a transação por ID
    let objectId;
    try {
      objectId = new ObjectId(transactionId);
    } catch (error) {
      // Não é um ObjectId válido, vamos usar como string
      console.log(`Webhook MercadoPago - ID não é um ObjectId válido: ${transactionId}`);
    }
    
    const transaction = await transactions.findOne({ 
      $or: [
        { _id: objectId },
        { externalId: transactionId }
      ]
    });
    
    if (!transaction) {
      console.error(`Webhook MercadoPago - Transação não encontrada: ${transactionId}`);
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
    }
    
    // Atualizar o status da transação
    await transactions.updateOne(
      { _id: transaction._id },
      { 
        $set: { 
          status: internalStatus,
          updatedAt: new Date(),
          gatewayResponse: paymentData
        }
      }
    );
    
    console.log(`Webhook MercadoPago - Transação ${transactionId} atualizada para ${internalStatus}`);
    
    // Se o pagamento foi aprovado, atualize o saldo do usuário
    if (internalStatus === 'completed' && transaction.type === 'deposit') {
      const users = db.collection('users');
      
      // Atualizar o saldo do usuário
      await users.updateOne(
        { _id: new ObjectId(transaction.userId) },
        { $inc: { balance: transaction.amount } }
      );
      
      console.log(`Webhook MercadoPago - Saldo do usuário ${transaction.userId} atualizado com ${transaction.amount}`);
      
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
    
    // Retornar resposta de sucesso
    return NextResponse.json({ 
      success: true,
      message: 'Notificação processada com sucesso',
      transactionId: transaction._id.toString(),
      status: internalStatus
    }, { status: 200 });
    
  } catch (error) {
    console.error('Webhook MercadoPago - Erro inesperado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 