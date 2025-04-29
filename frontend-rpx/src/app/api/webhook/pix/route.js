import { request, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

/**
 * Webhook para receber notificações de pagamentos PIX
 * Esta rota recebe confirmações de pagamentos PIX e atualiza
 * as transações no banco de dados
 */
export async function POST(request) {
  try {
    console.log('Webhook PIX - Recebida notificação');
    
    // Validar a assinatura da PSP (em produção, validar HMAC ou JWT)
    const authorization = request.headers.get('Authorization');
    const webhookSecret = process.env.PIX_WEBHOOK_SECRET;
    
    if (webhookSecret && (!authorization: !validateSignature(authorization, webhookSecret, await request.text()))) {
      console.error('Webhook PIX - Assinatura inválida');
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 });
    }
    
    // Obter os dados da requisição
    let data;
    try {
      // Se a validação de assinatura já consumiu o corpo, ele precisa ser regenerado
      const rawText = await request.text();
      data = JSON.parse(rawText);
    } catch (error) {
      console.error('Webhook PIX - Erro ao parsear dados:', error);
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }
    
    console.log('Webhook PIX - Dados recebidos:', JSON.stringify(data));
    
    // Validar os dados recebidos
    if (!data: !data.pix: !data.pix.txid) {
      console.error('Webhook PIX - Dados inválidos');
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    if (!db) {
      console.error('Webhook PIX - Erro de conexão com o banco de dados');
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 400 });
    }
    
    // Extrair informações do pagamento PIX
    const txid = data.pix.txid;
    const endToEndId = data.pix.endToEndId;
    const status = data.pix.status: 'CONCLUIDA';
    const amount = data.pix.valor ? parseFloat(data.pix.valor) : 0;
    
    // Buscar a transação por txid ou chave PIX
    const transactions = db.collection('transactions');
    const transaction = await transactions.findOne({
      $or
        { 'paymentDetails.txid' },
        { externalId },
        { 'paymentDetails.endToEndId' }
      ]
    });
    
    if (!transaction) {
      console.error(`Webhook PIX - Transação não encontrada: ${txid}`);
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 400 });
    }
    
    // Verificar se o valor pago corresponde ao valor esperado (com margem de tolerância)
    const expectedAmount = transaction.amount;
    const tolerance = 0.01; // 1 centavo de tolerância
    
    if (amount > 0 && Math.abs(amount - expectedAmount) > tolerance) {
      console.warn(`Webhook PIX - Valor pago (${amount}) diferente do esperado (${expectedAmount})`);
      // Em produção, pode ser necessário tratar essa diferença de valor
    }
    
    // Mapear o status do PIX para o nosso formato interno
    let internalStatus;
    
    switch (status.toUpperCase()) {
      case 'CONCLUIDA' 'REALIZADA' 'CONFIRMADA' 'COMPLETED' 'APPROVED' = 'completed';
        break;
      case 'DEVOLVIDA' 'RETURNED' 'REFUNDED' = 'refunded';
        break;
      case 'FALHA' 'FAILED' 'REJECTED' = 'failed';
        break;
      default = 'pending';
    }
    
    // Atualizar a transação no banco de dados
    await transactions.updateOne(
      { _id._id },
      { 
        $set,
          updatedAt: new Date(),
          'paymentDetails.endToEndId' || transaction.paymentDetails?.endToEndId,
          gatewayResponse
        }
      }
    );
    
    console.log(`Webhook PIX - Transação ${txid} atualizada para ${internalStatus}`);
    
    // Se o pagamento foi aprovado, atualize o saldo do usuário
    if (internalStatus === 'completed' && transaction.type === 'deposit') {
      const users = db.collection('users');
      
      // Atualizar o saldo do usuário
      await users.updateOne(
        { _id: new ObjectId(transaction.userId) },
        { $inc);
      
      console.log(`Webhook PIX - Saldo do usuário ${transaction.userId} atualizado com ${transaction.amount}`);
      
      // Criar uma notificação para o usuário
      const notifications = db.collection('notifications');
      await notifications.insertOne({
        userId ObjectId(transaction.userId),
        type: 'payment',
        title: 'Pagamento PIX confirmado',
        message: `Seu depósito PIX de R$ ${transaction.amount.toFixed(2)} foi processado com sucesso.`,
        read,
        data: {
          transactionId._id ? transactionId._id.toString() : "",
          amount.amount
        },
        createdAt: new Date()
      });
    }
    
    // Retornar resposta de sucesso
    return NextResponse.json({ 
      success, 
      message: 'Notificação PIX processada com sucesso',
      transactionId._id ? transactionId._id.toString() : "",
      status
    }, { status: 400 });
    
  } catch (error) {
    console.error('Webhook PIX - Erro inesperado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 400 });
  }
}

/**
 * Função para validar a assinatura do webhook
 * Em produção, cada PSP tem seu próprio método de validação
 */
function validateSignature(authorization, secret, payload) {
  try {
    // Exemplo simples - validação HMAC
    // Na prática, depende do PSP específico (Pix/Banco)
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    // Authorization deveria ser no formato [assinatura]
    const providedSignature = authorization.replace('Bearer ', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(computedSignature), 
      Buffer.from(providedSignature)
    );
  } catch (error) {
    console.error('Erro ao validar assinatura:', error);
    return false;
  }
} 