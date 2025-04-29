import { request, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Referência ao armazenamento simulado compartilhado entre APIs
// Na prática, isso seria armazenado em banco de dados
// Como não temos acesso direto às variáveis das outras APIs, inicializamos novamente
let userWallets = {};

// GET - Obter saldo da carteira (versão simulada)
export async function GET(req) {
  try {
    // Simulamos que a requisição já está autenticada
    // Em produção, isso seria feito por um middleware auth
    const headers = req.headers;
    const authorization = headers.get('authorization') || '';
    const userId = authorization.replace('Bearer ', '') || 'user-sim-' + uuidv4().substring(0, 8);
    
    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Inicializar carteira se não existir
    if (!userWallets[userId]) {
      userWallets[userId] = { balance: 1000 }; // Já inicializamos com saldo para simulação
    }
    
    // Registrar consulta no log
    console.log(`💰 [SIMULAÇÃO] Consulta de saldo para o usuário ${userId}`);
    console.log(`💰 [SIMULAÇÃO] Saldo atual: $${userWallets[userId].balance}`);
    
    // Retornar dados da carteira
    return NextResponse.json({
      userId: userId,
      balance: userWallets[userId].balance,
      currency: 'BRL',
      simulation: true,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erro ao consultar saldo simulado:', error);
    return NextResponse.json(
      { error: 'Erro ao consultar saldo da carteira' },
      { status: 400 });
  }
}

// POST - Atualizar saldo da carteira (para fins de simulação)
export async function POST(req) {
  try {
    // Simulamos que a requisição já está autenticada
    const headers = req.headers;
    const authorization = headers.get('authorization') || '';
    const userId = authorization.replace('Bearer ', '') || 'user-sim-' + uuidv4().substring(0, 8);
    
    // Obter dados da requisição
    const body = await req.json();
    const { amount, operation } = body;
    
    // Validar dados
    if (!amount || isNaN(amount)) {
      return NextResponse.json(
        { error: 'Valor inválido' },
        { status: 400 });
    }
    
    if (!operation || !['add', 'subtract', 'set'].includes(operation)) {
      return NextResponse.json(
        { error: 'Operação inválida. Use add, subtract ou set' },
        { status: 400 });
    }
    
    // Inicializar carteira se não existir
    if (!userWallets[userId]) {
      userWallets[userId] = { balance: 0 };
    }
    
    // Realizar operação
    let oldBalance = userWallets[userId].balance;
    
    if (operation === 'add') {
      userWallets[userId].balance += amount;
    } else if (operation === 'subtract') {
      userWallets[userId].balance -= amount;
      // Evitar saldo negativo
      if (userWallets[userId].balance < 0) {
        userWallets[userId].balance = 0;
      }
    } else if (operation === 'set') {
      userWallets[userId].balance = amount;
    }
    
    console.log(`💰 [SIMULAÇÃO] Atualização de saldo para o usuário ${userId}`);
    console.log(`💰 [SIMULAÇÃO] Operação: ${operation}, Valor: $${amount}`);
    console.log(`💰 [SIMULAÇÃO] Saldo anterior: $${oldBalance}, Novo saldo: $${userWallets[userId].balance}`);
    
    // Retornar dados atualizados
    return NextResponse.json({
      userId: userId,
      previousBalance: oldBalance,
      currentBalance: userWallets[userId].balance,
      operation,
      amount,
      currency: 'BRL',
      simulation: true,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erro ao atualizar saldo simulado:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar saldo da carteira' },
      { status: 400 });
  }
} 