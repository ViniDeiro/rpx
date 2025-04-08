const Wallet = require('../models/wallet.model');
const User = require('../models/user.model');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Controlador para gerenciamento de carteira e transações
 */
class WalletController {
  /**
   * Obter saldo da carteira do usuário autenticado
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {Function} next - Função next do Express
   */
  static async getWalletBalance(req, res, next) {
    try {
      const userId = req.user.id;
      
      // Obter ou criar carteira do usuário
      const wallet = await Wallet.findOrCreate(userId);
      
      const walletInfo = {
        balance: wallet.balance,
        bonus_balance: wallet.bonus_balance,
        locked_balance: wallet.locked_balance,
        currency: wallet.currency,
        total_deposited: wallet.total_deposited,
        total_withdrawn: wallet.total_withdrawn,
        total_bet: wallet.total_bet,
        total_won: wallet.total_won,
        profit_loss: wallet.total_won - wallet.total_bet,
        is_locked: wallet.is_locked
      };
      
      res.status(200).json({
        success: true,
        data: walletInfo
      });
    } catch (error) {
      logger.error(`Erro ao obter saldo da carteira: ${error.message}`, { userId: req.user.id, error });
      next(error);
    }
  }
  
  /**
   * Obter histórico de transações do usuário autenticado
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {Function} next - Função next do Express
   */
  static async getTransactionHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 20;
      const skip = parseInt(req.query.skip) || 0;
      
      // Construir filtros a partir dos query params
      const options = {
        limit,
        skip,
        sort: { createdAt: -1 }
      };
      
      if (req.query.type) {
        options.type = req.query.type;
      }
      
      if (req.query.status) {
        options.status = req.query.status;
      }
      
      // Obter ou criar carteira do usuário
      const wallet = await Wallet.findOrCreate(userId);
      
      // Obter histórico de transações
      const transactions = wallet.getTransactionHistory(options);
      
      // Preparar objeto de resposta
      const formattedTransactions = transactions.map(t => ({
        id: t._id,
        amount: t.amount,
        type: t.type,
        status: t.status,
        description: t.description,
        reference: t.reference,
        created_at: t.createdAt,
        completed_at: t.completed_at || null,
        balance_after: t.balance_after || null,
        metadata: {
          payment_method: t.metadata?.payment_method || null,
          bet_id: t.metadata?.bet_id || null,
          match_id: t.metadata?.match_id || null
        }
      }));
      
      res.status(200).json({
        success: true,
        data: formattedTransactions,
        pagination: {
          total: wallet.transactions.length,
          limit,
          skip,
          has_more: wallet.transactions.length > (skip + limit)
        }
      });
    } catch (error) {
      logger.error(`Erro ao obter histórico de transações: ${error.message}`, { userId: req.user.id, error });
      next(error);
    }
  }
  
  /**
   * Solicitar depósito
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {Function} next - Função next do Express
   */
  static async requestDeposit(req, res, next) {
    try {
      const userId = req.user.id;
      const { amount, payment_method, payment_details = {} } = req.body;
      
      if (!amount || amount <= 0) {
        throw new ApiError(400, 'Valor de depósito inválido');
      }
      
      if (!payment_method) {
        throw new ApiError(400, 'Método de pagamento é obrigatório');
      }
      
      // Obter ou criar carteira do usuário
      const wallet = await Wallet.findOrCreate(userId);
      
      // Verificar se a carteira está bloqueada
      if (wallet.is_locked) {
        throw new ApiError(403, `Sua carteira está bloqueada: ${wallet.lock_reason}`);
      }
      
      // Verificar limites de depósito
      const limitCheck = await wallet.checkDepositLimit(amount);
      if (!limitCheck.withinLimits) {
        throw new ApiError(400, 'Este depósito excede seu limite diário, semanal ou mensal');
      }
      
      // Criar transação de depósito pendente
      const transaction = await wallet.createTransaction({
        amount,
        type: 'deposit',
        status: 'pending',
        description: `Depósito via ${payment_method}`,
        metadata: {
          payment_provider: payment_details.provider || payment_method,
          payment_method,
          payment_details,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        }
      });
      
      // Obter a transação criada (última da lista)
      const createdTransaction = wallet.transactions[wallet.transactions.length - 1];
      
      res.status(200).json({
        success: true,
        message: 'Solicitação de depósito recebida',
        data: {
          transaction_id: createdTransaction._id,
          reference: createdTransaction.reference,
          amount,
          status: 'pending',
          // Aqui você incluiria informações de pagamento dependendo do método
          // Por exemplo, para PIX, incluiria o código QR, para cartão de crédito, 
          // incluiria um link para o checkout, etc.
          payment_instructions: {
            method: payment_method,
            // Simulação - em uma implementação real, isso viria de um processador de pagamento
            next_steps: `Siga as instruções para completar seu depósito via ${payment_method}`
          }
        }
      });
    } catch (error) {
      logger.error(`Erro ao solicitar depósito: ${error.message}`, { userId: req.user.id, amount: req.body.amount, error });
      next(error);
    }
  }
  
  /**
   * Confirmar depósito (webhook ou admin)
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {Function} next - Função next do Express
   */
  static async confirmDeposit(req, res, next) {
    try {
      const { user_id, reference, amount, transaction_id } = req.body;
      
      // Verificar permissões - apenas admin ou webhook autenticado
      if (!req.user.isAdmin && !req.isWebhook) {
        throw new ApiError(403, 'Permissão negada');
      }
      
      // Encontrar usuário
      const user = await User.findById(user_id);
      if (!user) {
        throw new ApiError(404, 'Usuário não encontrado');
      }
      
      // Encontrar carteira
      const wallet = await Wallet.findByUser(user_id);
      if (!wallet) {
        throw new ApiError(404, 'Carteira não encontrada');
      }
      
      // Completar a transação
      await wallet.completeTransaction(reference);
      
      logger.info(`Depósito confirmado com sucesso`, { 
        userId: user_id, 
        reference, 
        amount, 
        adminId: req.user.isAdmin ? req.user.id : null 
      });
      
      res.status(200).json({
        success: true,
        message: 'Depósito confirmado com sucesso',
        data: {
          user_id,
          reference,
          new_balance: wallet.balance
        }
      });
    } catch (error) {
      logger.error(`Erro ao confirmar depósito: ${error.message}`, { body: req.body, error });
      next(error);
    }
  }
  
  /**
   * Solicitar saque
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {Function} next - Função next do Express
   */
  static async requestWithdrawal(req, res, next) {
    try {
      const userId = req.user.id;
      const { amount, withdrawal_method, account_details = {} } = req.body;
      
      if (!amount || amount <= 0) {
        throw new ApiError(400, 'Valor de saque inválido');
      }
      
      if (!withdrawal_method) {
        throw new ApiError(400, 'Método de saque é obrigatório');
      }
      
      // Obter carteira do usuário
      const wallet = await Wallet.findByUser(userId);
      if (!wallet) {
        throw new ApiError(404, 'Carteira não encontrada');
      }
      
      // Verificar se a carteira está bloqueada
      if (wallet.is_locked) {
        throw new ApiError(403, `Sua carteira está bloqueada: ${wallet.lock_reason}`);
      }
      
      // Verificar saldo
      if (wallet.balance < amount) {
        throw new ApiError(400, 'Saldo insuficiente para realizar este saque');
      }
      
      // Criar transação de saque pendente
      await wallet.createTransaction({
        amount,
        type: 'withdrawal',
        status: 'pending',
        description: `Saque via ${withdrawal_method}`,
        metadata: {
          payment_method: withdrawal_method,
          payment_details: account_details,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        }
      });
      
      // Obter a transação criada (última da lista)
      const createdTransaction = wallet.transactions[wallet.transactions.length - 1];
      
      // Log da solicitação de saque
      logger.info(`Solicitação de saque recebida`, { 
        userId, 
        amount, 
        method: withdrawal_method,
        transactionId: createdTransaction._id 
      });
      
      res.status(200).json({
        success: true,
        message: 'Solicitação de saque recebida e está em processamento',
        data: {
          transaction_id: createdTransaction._id,
          reference: createdTransaction.reference,
          amount,
          status: 'pending',
          estimated_processing_time: '1-3 dias úteis'
        }
      });
    } catch (error) {
      logger.error(`Erro ao solicitar saque: ${error.message}`, { userId: req.user.id, amount: req.body.amount, error });
      next(error);
    }
  }
  
  /**
   * Processar saque (admin)
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {Function} next - Função next do Express
   */
  static async processWithdrawal(req, res, next) {
    try {
      // Somente admin pode processar saques
      if (!req.user.isAdmin) {
        throw new ApiError(403, 'Permissão negada');
      }
      
      const { user_id, reference, status, reason } = req.body;
      
      // Encontrar carteira
      const wallet = await Wallet.findByUser(user_id);
      if (!wallet) {
        throw new ApiError(404, 'Carteira não encontrada');
      }
      
      // Processar conforme o status
      if (status === 'completed') {
        await wallet.completeTransaction(reference);
        logger.info(`Saque processado com sucesso`, { userId: user_id, reference, adminId: req.user.id });
      } else if (status === 'failed') {
        await wallet.failTransaction(reference, reason || 'Processamento falhou');
        logger.info(`Saque falhou`, { userId: user_id, reference, reason, adminId: req.user.id });
      } else if (status === 'canceled') {
        await wallet.cancelTransaction(reference, reason || 'Cancelado pelo administrador');
        logger.info(`Saque cancelado`, { userId: user_id, reference, reason, adminId: req.user.id });
      } else {
        throw new ApiError(400, 'Status inválido');
      }
      
      res.status(200).json({
        success: true,
        message: `Saque ${status === 'completed' ? 'concluído' : status === 'failed' ? 'falhou' : 'cancelado'} com sucesso`,
        data: {
          user_id,
          reference,
          new_balance: wallet.balance
        }
      });
    } catch (error) {
      logger.error(`Erro ao processar saque: ${error.message}`, { body: req.body, error });
      next(error);
    }
  }
  
  /**
   * Obter métodos de pagamento disponíveis
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {Function} next - Função next do Express
   */
  static async getPaymentMethods(req, res, next) {
    try {
      // Métodos de pagamento disponíveis (simulação)
      const depositMethods = [
        { 
          id: 'pix', 
          name: 'PIX', 
          min_amount: 10, 
          max_amount: 10000,
          fee: 0,
          processing_time: 'Imediato',
          required_fields: ['key_type', 'key']
        },
        { 
          id: 'credit_card', 
          name: 'Cartão de Crédito', 
          min_amount: 20, 
          max_amount: 5000,
          fee: 0.05, // 5%
          processing_time: 'Imediato',
          required_fields: ['card_number', 'expiry', 'cvv', 'holder_name']
        },
        { 
          id: 'bank_transfer', 
          name: 'Transferência Bancária', 
          min_amount: 50, 
          max_amount: 50000,
          fee: 0,
          processing_time: '1 dia útil',
          required_fields: ['bank_code', 'branch', 'account_number']
        }
      ];
      
      const withdrawalMethods = [
        { 
          id: 'pix', 
          name: 'PIX', 
          min_amount: 50, 
          max_amount: 10000,
          fee: 0,
          processing_time: '1-2 dias úteis',
          required_fields: ['key_type', 'key']
        },
        { 
          id: 'bank_transfer', 
          name: 'Transferência Bancária', 
          min_amount: 100, 
          max_amount: 50000,
          fee: 0,
          processing_time: '2-3 dias úteis',
          required_fields: ['bank_code', 'branch', 'account_number', 'account_holder', 'cpf']
        }
      ];
      
      res.status(200).json({
        success: true,
        data: {
          deposit: depositMethods,
          withdrawal: withdrawalMethods
        }
      });
    } catch (error) {
      logger.error(`Erro ao obter métodos de pagamento: ${error.message}`, { error });
      next(error);
    }
  }
  
  /**
   * Adicionar ajuste à carteira (admin)
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {Function} next - Função next do Express
   */
  static async addAdjustment(req, res, next) {
    try {
      // Somente admin pode adicionar ajustes
      if (!req.user.isAdmin) {
        throw new ApiError(403, 'Permissão negada');
      }
      
      const { user_id, amount, reason } = req.body;
      
      if (!amount || amount === 0) {
        throw new ApiError(400, 'Valor do ajuste é obrigatório e não pode ser zero');
      }
      
      if (!reason) {
        throw new ApiError(400, 'Motivo do ajuste é obrigatório');
      }
      
      // Encontrar carteira
      const wallet = await Wallet.findByUser(user_id);
      if (!wallet) {
        throw new ApiError(404, 'Carteira não encontrada');
      }
      
      // Criar transação de ajuste
      await wallet.createTransaction({
        amount,
        type: 'adjustment',
        status: 'completed',
        description: `Ajuste: ${reason}`,
        created_by: 'admin',
        metadata: {
          admin_id: req.user.id,
          reason
        }
      });
      
      logger.info(`Ajuste aplicado à carteira do usuário`, { 
        userId: user_id, 
        amount, 
        reason, 
        adminId: req.user.id 
      });
      
      res.status(200).json({
        success: true,
        message: 'Ajuste aplicado com sucesso',
        data: {
          user_id,
          new_balance: wallet.balance
        }
      });
    } catch (error) {
      logger.error(`Erro ao adicionar ajuste: ${error.message}`, { body: req.body, error });
      next(error);
    }
  }
  
  /**
   * Bloquear ou desbloquear carteira (admin)
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {Function} next - Função next do Express
   */
  static async toggleWalletLock(req, res, next) {
    try {
      // Somente admin pode bloquear/desbloquear carteiras
      if (!req.user.isAdmin) {
        throw new ApiError(403, 'Permissão negada');
      }
      
      const { user_id, locked, reason } = req.body;
      
      // Encontrar carteira
      const wallet = await Wallet.findByUser(user_id);
      if (!wallet) {
        throw new ApiError(404, 'Carteira não encontrada');
      }
      
      if (locked) {
        // Verificar se temos um motivo para o bloqueio
        if (!reason) {
          throw new ApiError(400, 'Motivo do bloqueio é obrigatório');
        }
        
        await wallet.lock(reason);
        logger.info(`Carteira bloqueada`, { userId: user_id, reason, adminId: req.user.id });
      } else {
        await wallet.unlock();
        logger.info(`Carteira desbloqueada`, { userId: user_id, adminId: req.user.id });
      }
      
      res.status(200).json({
        success: true,
        message: locked ? 'Carteira bloqueada com sucesso' : 'Carteira desbloqueada com sucesso',
        data: {
          user_id,
          is_locked: wallet.is_locked,
          lock_reason: wallet.lock_reason
        }
      });
    } catch (error) {
      logger.error(`Erro ao ${req.body.locked ? 'bloquear' : 'desbloquear'} carteira: ${error.message}`, { body: req.body, error });
      next(error);
    }
  }
}

module.exports = WalletController; 