import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import mongoose from 'mongoose';

// Este é um handler de API que lidará com operações financeiras
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar autenticação do administrador
  const session = await getSession({ req });
  if (!session || !session.user || (session.user as any).role !== 'admin') {
    return res.status(401).json({ success: false, message: 'Não autorizado' });
  }

  // Conexão com o MongoDB
  if (!mongoose.connections[0].readyState) {
    try {
      await mongoose.connect(process.env.MONGODB_URI as string);
    } catch (error) {
      console.error('Erro ao conectar com o MongoDB:', error);
      return res.status(500).json({ success: false, message: 'Erro ao conectar com o banco de dados' });
    }
  }

  // Roteamento baseado no método HTTP
  switch (req.method) {
    case 'GET':
      return getTransactions(req, res);
    case 'PUT':
      return updateTransaction(req, res);
    case 'POST':
      if (req.query.action === 'approve-all') {
        return approveAllPending(req, res);
      }
      if (req.query.action === 'export') {
        return exportTransactions(req, res);
      }
      return res.status(400).json({ success: false, message: 'Ação não especificada' });
    default:
      return res.status(405).json({ success: false, message: 'Método não permitido' });
  }
}

// Obter transações (com filtros opcionais)
async function getTransactions(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { status, type, username, startDate, endDate } = req.query;
    
    // Construir filtro baseado nos parâmetros de consulta
    const filter: any = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    if (username) {
      filter.username = { $regex: username, $options: 'i' };
    }
    
    // Filtro de data
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const endDateTime = new Date(endDate as string);
        endDateTime.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDateTime;
      }
    }
    
    // Em produção, usaríamos um modelo Mongoose para acessar o banco de dados
    // const transactions = await TransactionModel.find(filter).sort({ createdAt: -1 });
    
    // Simular dados para desenvolvimento
    const transactions = Array.from({ length: 20 }).map((_, i) => {
      const types = ['deposit', 'withdrawal', 'match_win', 'match_entry', 'refund'];
      const statuses = ['pending', 'completed', 'failed', 'processing'];
      const paymentMethods = ['pix', 'credit_card', 'bank_transfer'];
      
      // Alterna entre tipos diferentes para simular dados variados
      const type = types[i % types.length];
      // Match_win e refund são sempre completed; metade dos match_entry são pending
      const status = type === 'match_win' || type === 'refund' 
        ? 'completed' 
        : type === 'match_entry' && i % 2 === 0 
          ? 'pending' 
          : statuses[i % statuses.length];
      
      const date = new Date();
      date.setDate(date.getDate() - i);
    
      return {
        id: `tx-${1000 + i}`,
        userId: `user-${200 + (i % 5)}`,
        username: `usuario${200 + (i % 5)}`,
        amount: type === 'match_entry' ? 5 * (i % 3 + 1) : type === 'match_win' ? 9 * (i % 3 + 1) : 10 * (i % 10 + 1),
        type,
        status,
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
        paymentMethod: ['deposit', 'withdrawal'].includes(type) ? paymentMethods[i % paymentMethods.length] : undefined,
        reference: `REF-${9000 + i}`,
        description: type === 'match_win' 
          ? `Premiação: Partida #${500 + i}`
          : type === 'match_entry'
          ? `Inscrição: Partida #${500 + i}`
          : type === 'deposit'
          ? `Depósito via ${paymentMethods[i % paymentMethods.length].toUpperCase()}`
          : type === 'withdrawal'
          ? `Saque via ${paymentMethods[i % paymentMethods.length].toUpperCase()}`
          : `Reembolso: Partida cancelada #${500 + i}`,
        matchId: ['match_win', 'match_entry', 'refund'].includes(type) ? `match-${500 + i}` : undefined
      };
    });
    
    // Aplicar filtros simulados para desenvolvimento
    let filteredTransactions = transactions;
    
    if (status && status !== 'all') {
      filteredTransactions = filteredTransactions.filter(tx => tx.status === status);
    }
    
    if (type && type !== 'all') {
      filteredTransactions = filteredTransactions.filter(tx => tx.type === type);
    }
    
    if (username) {
      filteredTransactions = filteredTransactions.filter(tx => 
        tx.username.toLowerCase().includes((username as string).toLowerCase())
      );
    }
    
    // Estatísticas
    const stats = {
      totalTransactions: filteredTransactions.length,
      totalDeposits: filteredTransactions.filter(tx => tx.type === 'deposit' && tx.status === 'completed')
        .reduce((sum, tx) => sum + tx.amount, 0),
      totalWithdrawals: filteredTransactions.filter(tx => tx.type === 'withdrawal' && tx.status === 'completed')
        .reduce((sum, tx) => sum + tx.amount, 0),
      totalPrizes: filteredTransactions.filter(tx => tx.type === 'match_win' && tx.status === 'completed')
        .reduce((sum, tx) => sum + tx.amount, 0),
      pendingCount: filteredTransactions.filter(tx => tx.status === 'pending').length
    };
    
    return res.status(200).json({ 
      success: true, 
      data: filteredTransactions,
      stats
    });
  } catch (error) {
    console.error('Erro ao obter transações:', error);
    return res.status(500).json({ success: false, message: 'Erro ao processar requisição' });
  }
}

// Atualizar transação (aprovar/rejeitar)
async function updateTransaction(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const { status } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    
    if (!status || !['completed', 'failed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status inválido' });
    }
    
    // Em produção, usaríamos um modelo Mongoose para atualizar o registro
    /*
    const transaction = await TransactionModel.findById(id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transação não encontrada' });
    }
    
    // Verificar se a transação ainda pode ser atualizada
    if (transaction.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Apenas transações pendentes podem ser atualizadas' });
    }
    
    transaction.status = status;
    transaction.updatedAt = new Date();
    transaction.processedBy = session.user.id;
    
    await transaction.save();
    
    // Se for uma aprovação, processar o pagamento
    if (status === 'completed') {
      if (transaction.type === 'match_win') {
        // Creditar na carteira do usuário
        const wallet = await WalletModel.findOne({ userId: transaction.userId });
        if (wallet) {
          wallet.balance += transaction.amount;
          await wallet.save();
          
          // Registrar na tabela de movimentações da carteira
          await WalletTransactionModel.create({
            walletId: wallet._id,
            amount: transaction.amount,
            type: 'credit',
            reference: transaction.reference,
            description: `Crédito: ${transaction.description}`,
            createdAt: new Date()
          });
          
          // Enviar notificação ao usuário
          await NotificationModel.create({
            userId: transaction.userId,
            type: 'payment',
            title: 'Pagamento Recebido',
            message: `Você recebeu ${transaction.amount.toFixed(2)} referente a ${transaction.description}`,
            read: false,
            createdAt: new Date()
          });
        }
      }
    }
    */
    
    // Simulação de resposta para desenvolvimento
    return res.status(200).json({ 
      success: true, 
      message: status === 'completed' ? 'Transação aprovada com sucesso' : 'Transação rejeitada',
      data: {
        id,
        status,
        updatedAt: new Date().toISOString(),
        processedBy: 'admin-user'
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    return res.status(500).json({ success: false, message: 'Erro ao processar requisição' });
  }
}

// Aprovar todas as transações pendentes
async function approveAllPending(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { type } = req.query;
    
    // Construir filtro
    const filter: any = { status: 'pending' };
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    // Em produção, usaríamos um modelo Mongoose para atualizar múltiplos registros
    /*
    const pendingTransactions = await TransactionModel.find(filter);
    
    // Iniciar transação para garantir atomicidade
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      for (const transaction of pendingTransactions) {
        transaction.status = 'completed';
        transaction.updatedAt = new Date();
        transaction.processedBy = session.user.id;
        await transaction.save({ session });
        
        // Se for pagamento de premiação, processar
        if (transaction.type === 'match_win') {
          // Creditar na carteira do usuário
          const wallet = await WalletModel.findOne({ userId: transaction.userId }).session(session);
          if (wallet) {
            wallet.balance += transaction.amount;
            await wallet.save({ session });
            
            // Registrar na tabela de movimentações da carteira
            await WalletTransactionModel.create({
              walletId: wallet._id,
              amount: transaction.amount,
              type: 'credit',
              reference: transaction.reference,
              description: `Crédito: ${transaction.description}`,
              createdAt: new Date()
            }, { session });
            
            // Enviar notificação ao usuário
            await NotificationModel.create({
              userId: transaction.userId,
              type: 'payment',
              title: 'Pagamento Recebido',
              message: `Você recebeu ${transaction.amount.toFixed(2)} referente a ${transaction.description}`,
              read: false,
              createdAt: new Date()
            }, { session });
          }
        }
      }
      
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
    */
    
    // Simulação de resposta para desenvolvimento
    return res.status(200).json({ 
      success: true, 
      message: 'Todas as transações pendentes foram aprovadas',
      count: 8 // Número simulado de transações aprovadas
    });
  } catch (error) {
    console.error('Erro ao aprovar transações pendentes:', error);
    return res.status(500).json({ success: false, message: 'Erro ao processar requisição' });
  }
}

// Exportar transações para CSV
async function exportTransactions(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { startDate, endDate, type, status } = req.body;
    
    // Construir filtro
    const filter: any = {};
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDateTime;
      }
    }
    
    // Em produção, usaríamos um modelo Mongoose para obter os registros
    // const transactions = await TransactionModel.find(filter).sort({ createdAt: -1 });
    
    // Simulação de resposta para desenvolvimento - gerar URL simulada
    const exportUrl = `https://rpx-platform.com/api/export/financeiro-${Date.now()}.csv`;
    
    return res.status(200).json({ 
      success: true, 
      message: 'Relatório gerado com sucesso',
      data: {
        url: exportUrl,
        expiresAt: new Date(Date.now() + 86400000).toISOString() // Expira em 24h
      }
    });
  } catch (error) {
    console.error('Erro ao exportar transações:', error);
    return res.status(500).json({ success: false, message: 'Erro ao processar requisição' });
  }
} 