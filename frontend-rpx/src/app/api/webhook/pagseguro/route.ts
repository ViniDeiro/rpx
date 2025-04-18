import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

/**
 * Webhook para receber notificações do PagSeguro
 * Esta rota recebe atualizações de status de pagamento
 * e atualiza as transações no banco de dados
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Webhook PagSeguro - Recebida notificação');
    
    // Verificar cabeçalhos
    const contentType = request.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Webhook PagSeguro - Content-Type inválido');
      return NextResponse.json({ error: 'Content-Type inválido' }, { status: 400 });
    }
    
    // Obter os dados da requisição
    const data = await request.json();
    console.log('Webhook PagSeguro - Dados recebidos:', JSON.stringify(data));
    
    // Validar os dados recebidos (formato esperado do PagSeguro)
    if (!data || !data.notificationCode) {
      console.error('Webhook PagSeguro - Dados inválidos');
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    if (!db) {
      console.error('Webhook PagSeguro - Erro de conexão com o banco de dados');
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
    
    // Obter o código da notificação e o tipo
    const notificationCode = data.notificationCode;
    const notificationType = data.notificationType || 'transaction';
    
    // Verificar se é uma notificação de transação
    if (notificationType !== 'transaction') {
      console.log(`Webhook PagSeguro - Tipo de notificação ignorado: ${notificationType}`);
      return NextResponse.json({ message: 'Notificação recebida, mas ignorada' }, { status: 200 });
    }
    
    // Consultar detalhes da transação na API do PagSeguro
    const pagseguroEmail = process.env.PAGSEGURO_EMAIL;
    const pagseguroToken = process.env.PAGSEGURO_TOKEN;
    
    if (!pagseguroEmail || !pagseguroToken) {
      console.error('Webhook PagSeguro - Credenciais não configuradas');
      return NextResponse.json({ error: 'Configuração incompleta' }, { status: 500 });
    }
    
    // Construir URL da API de consulta do PagSeguro
    // URL de produção
    let apiUrl = `https://ws.pagseguro.uol.com.br/v3/transactions/notifications/${notificationCode}`;
    
    // URL de sandbox (se ambiente for desenvolvimento)
    if (process.env.NODE_ENV !== 'production') {
      apiUrl = `https://ws.sandbox.pagseguro.uol.com.br/v3/transactions/notifications/${notificationCode}`;
    }
    
    // Adicionar parâmetros de autenticação
    apiUrl += `?email=${encodeURIComponent(pagseguroEmail)}&token=${encodeURIComponent(pagseguroToken)}`;
    
    // Fazer a requisição para a API do PagSeguro
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml'
      }
    });
    
    if (!response.ok) {
      console.error(`Webhook PagSeguro - Erro ao consultar transação: ${response.status}`);
      return NextResponse.json({ error: 'Erro ao consultar transação' }, { status: 500 });
    }
    
    // Processar resposta XML
    const responseXml = await response.text();
    
    // Extrair informações necessárias do XML (em produção, usar biblioteca XML)
    // Método simples para extração, em produção usar um parser XML adequado
    const reference = extractFromXml(responseXml, 'reference');
    const status = extractFromXml(responseXml, 'status');
    const transactionId = extractFromXml(responseXml, 'code');
    
    if (!reference || !status) {
      console.error('Webhook PagSeguro - Dados incompletos na resposta XML');
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }
    
    // Mapear o status do PagSeguro para o nosso formato interno
    // 1: Aguardando pagamento, 2: Em análise, 3: Paga, 4: Disponível, 5: Em disputa
    // 6: Devolvida, 7: Cancelada, 8: Debitado, 9: Retenção temporária
    const statusMapping: Record<string, string> = {
      '1': 'pending',
      '2': 'pending',
      '3': 'completed',
      '4': 'completed',
      '5': 'pending',
      '6': 'refunded',
      '7': 'failed',
      '8': 'pending',
      '9': 'pending'
    };
    
    const internalStatus = statusMapping[status] || 'pending';
    
    // Buscar a transação no banco de dados pela referência
    const transactions = db.collection('transactions');
    const transaction = await transactions.findOne({
      $or: [
        { _id: new ObjectId(reference) },
        { externalId: reference },
        { 'paymentDetails.reference': reference }
      ]
    });
    
    if (!transaction) {
      console.error(`Webhook PagSeguro - Transação não encontrada: ${reference}`);
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
    }
    
    // Atualizar a transação no banco de dados
    await transactions.updateOne(
      { _id: transaction._id },
      { 
        $set: { 
          status: internalStatus,
          updatedAt: new Date(),
          'paymentDetails.pagseguroId': transactionId,
          gatewayResponse: {
            notificationCode,
            status,
            transactionId,
            responseXml
          }
        }
      }
    );
    
    console.log(`Webhook PagSeguro - Transação ${reference} atualizada para ${internalStatus}`);
    
    // Se o pagamento foi aprovado (status 3 ou 4), atualize o saldo do usuário
    if ((status === '3' || status === '4') && transaction.type === 'deposit') {
      const users = db.collection('users');
      
      // Atualizar o saldo do usuário
      await users.updateOne(
        { _id: new ObjectId(transaction.userId) },
        { $inc: { balance: transaction.amount } }
      );
      
      console.log(`Webhook PagSeguro - Saldo do usuário ${transaction.userId} atualizado com ${transaction.amount}`);
      
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
    console.error('Webhook PagSeguro - Erro inesperado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * Função simples para extrair dados de XML
 * Em produção, usar uma biblioteca XML adequada
 */
function extractFromXml(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([^<]+)<\/${tag}>`);
  const match = xml.match(regex);
  return match ? match[1] : '';
} 