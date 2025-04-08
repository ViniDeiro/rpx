const { v4: uuidv4 } = require('uuid');
const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Serviço de carteira - gerencia todas as operações financeiras dos usuários
 */
class WalletService {
  /**
   * Creditar valor na carteira do usuário
   * @param {string} userId - ID do usuário
   * @param {number} amount - Valor a ser creditado
   * @param {string} type - Tipo da transação (deposit, bet_win, promotion, etc)
   * @param {Object} metadata - Informações adicionais sobre a transação
   * @returns {Promise<Object>} - Dados da transação
   */
  static async creditToWallet(userId, amount, type, metadata = {}) {
    try {
      // Validações
      if (!userId) throw new ApiError(400, 'ID do usuário é obrigatório');
      if (!amount || amount <= 0) throw new ApiError(400, 'Valor inválido');
      if (!type) throw new ApiError(400, 'Tipo de transação é obrigatório');
      
      // Arredondar para 2 casas decimais
      amount = parseFloat(amount.toFixed(2));
      
      // Buscar usuário
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, 'Usuário não encontrado');
      }
      
      // Criar objeto de transação
      const transaction = new Transaction({
        user: userId,
        type,
        amount,
        operation: 'credit',
        status: 'completed',
        metadata,
        transaction_id: uuidv4(),
        balance_before: user.wallet.balance,
        balance_after: user.wallet.balance + amount
      });
      
      // Atualizar saldo da carteira
      user.wallet.balance += amount;
      user.wallet.last_transaction = {
        amount,
        type,
        operation: 'credit',
        timestamp: new Date()
      };
      user.wallet.updated_at = new Date();
      
      // Salvar transação e usuário
      await transaction.save();
      await user.save();
      
      logger.info(`Crédito de ${amount} para usuário ${userId}, tipo: ${type}`);
      
      return transaction;
    } catch (error) {
      logger.error(`Erro ao creditar valor na carteira: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Debitar valor da carteira do usuário
   * @param {string} userId - ID do usuário
   * @param {number} amount - Valor a ser debitado
   * @param {string} type - Tipo da transação (bet, withdrawal, etc)
   * @param {Object} metadata - Informações adicionais sobre a transação
   * @returns {Promise<Object>} - Dados da transação
   */
  static async debitFromWallet(userId, amount, type, metadata = {}) {
    try {
      // Validações
      if (!userId) throw new ApiError(400, 'ID do usuário é obrigatório');
      if (!amount || amount <= 0) throw new ApiError(400, 'Valor inválido');
      if (!type) throw new ApiError(400, 'Tipo de transação é obrigatório');
      
      // Arredondar para 2 casas decimais
      amount = parseFloat(amount.toFixed(2));
      
      // Buscar usuário
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, 'Usuário não encontrado');
      }
      
      // Verificar se o usuário tem saldo suficiente
      if (user.wallet.balance < amount) {
        throw new ApiError(400, 'Saldo insuficiente');
      }
      
      // Criar objeto de transação
      const transaction = new Transaction({
        user: userId,
        type,
        amount,
        operation: 'debit',
        status: 'completed',
        metadata,
        transaction_id: uuidv4(),
        balance_before: user.wallet.balance,
        balance_after: user.wallet.balance - amount
      });
      
      // Atualizar saldo da carteira
      user.wallet.balance -= amount;
      user.wallet.last_transaction = {
        amount,
        type,
        operation: 'debit',
        timestamp: new Date()
      };
      user.wallet.updated_at = new Date();
      
      // Salvar transação e usuário
      await transaction.save();
      await user.save();
      
      logger.info(`Débito de ${amount} do usuário ${userId}, tipo: ${type}`);
      
      return transaction;
    } catch (error) {
      logger.error(`Erro ao debitar valor da carteira: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Obter saldo da carteira do usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} - Informações da carteira
   */
  static async getWalletBalance(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, 'Usuário não encontrado');
      }
      
      return {
        balance: user.wallet.balance,
        currency: user.wallet.currency,
        last_transaction: user.wallet.last_transaction,
        updated_at: user.wallet.updated_at
      };
    } catch (error) {
      logger.error(`Erro ao obter saldo da carteira: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Obter histórico de transações do usuário
   * @param {string} userId - ID do usuário
   * @param {Object} filters - Filtros para a busca
   * @param {number} page - Página atual para paginação
   * @param {number} limit - Limite de itens por página
   * @returns {Promise<Object>} - Lista de transações paginadas
   */
  static async getTransactionHistory(userId, filters = {}, page = 1, limit = 10) {
    try {
      const query = { user: userId };
      
      // Aplicar filtros adicionais
      if (filters.type) {
        query.type = filters.type;
      }
      
      if (filters.operation) {
        query.operation = filters.operation;
      }
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        
        if (filters.dateFrom) {
          query.createdAt.$gte = new Date(filters.dateFrom);
        }
        
        if (filters.dateTo) {
          query.createdAt.$lte = new Date(filters.dateTo);
        }
      }
      
      if (filters.minAmount) {
        query.amount = { $gte: parseFloat(filters.minAmount) };
      }
      
      if (filters.maxAmount) {
        if (query.amount) {
          query.amount.$lte = parseFloat(filters.maxAmount);
        } else {
          query.amount = { $lte: parseFloat(filters.maxAmount) };
        }
      }
      
      // Contar total para paginação
      const total = await Transaction.countDocuments(query);
      
      // Calcular skip para paginação
      const skip = (page - 1) * limit;
      
      // Buscar transações com paginação
      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      return {
        transactions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`Erro ao obter histórico de transações: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Iniciar processo de saque
   * @param {string} userId - ID do usuário
   * @param {number} amount - Valor a ser sacado
   * @param {Object} paymentDetails - Detalhes do método de pagamento
   * @returns {Promise<Object>} - Dados do saque
   */
  static async requestWithdrawal(userId, amount, paymentDetails) {
    try {
      // Validações
      if (!userId) throw new ApiError(400, 'ID do usuário é obrigatório');
      if (!amount || amount <= 0) throw new ApiError(400, 'Valor inválido');
      if (!paymentDetails) throw new ApiError(400, 'Detalhes do pagamento são obrigatórios');
      
      // Verificar valor mínimo de saque
      const minWithdrawal = parseFloat(process.env.MIN_WITHDRAWAL_AMOUNT) || 20;
      if (amount < minWithdrawal) {
        throw new ApiError(400, `Valor mínimo para saque é ${minWithdrawal}`);
      }
      
      // Arredondar para 2 casas decimais
      amount = parseFloat(amount.toFixed(2));
      
      // Buscar usuário
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, 'Usuário não encontrado');
      }
      
      // Verificar se o usuário tem saldo suficiente
      if (user.wallet.balance < amount) {
        throw new ApiError(400, 'Saldo insuficiente');
      }
      
      // Verificar se o usuário completou as verificações necessárias
      if (!user.verification.identity_verified) {
        throw new ApiError(403, 'Verificação de identidade necessária para realizar saques');
      }
      
      // Criar transação de saque pendente
      const transaction = new Transaction({
        user: userId,
        type: 'withdrawal',
        amount,
        operation: 'debit',
        status: 'pending',
        metadata: {
          payment_method: paymentDetails.method,
          payment_details: paymentDetails,
          request_ip: paymentDetails.ip_address,
          notes: 'Saque solicitado pelo usuário'
        },
        transaction_id: uuidv4(),
        balance_before: user.wallet.balance,
        balance_after: user.wallet.balance - amount
      });
      
      // Reservar valor na carteira do usuário (debitando imediatamente)
      user.wallet.balance -= amount;
      user.wallet.pending_withdrawals = (user.wallet.pending_withdrawals || 0) + amount;
      user.wallet.last_transaction = {
        amount,
        type: 'withdrawal',
        operation: 'debit',
        timestamp: new Date()
      };
      user.wallet.updated_at = new Date();
      
      // Salvar transação e usuário
      await transaction.save();
      await user.save();
      
      logger.info(`Solicitação de saque de ${amount} para usuário ${userId}`);
      
      return {
        transaction_id: transaction.transaction_id,
        amount,
        status: 'pending',
        created_at: transaction.createdAt,
        estimated_completion: new Date(Date.now() + 86400000) // 24 horas
      };
    } catch (error) {
      logger.error(`Erro ao solicitar saque: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Processar transação de saque (aprovação/rejeição)
   * @param {string} transactionId - ID da transação
   * @param {string} action - Ação a ser executada (approve/reject)
   * @param {string} adminComment - Comentário do administrador
   * @returns {Promise<Object>} - Dados da transação atualizada
   */
  static async processWithdrawal(transactionId, action, adminComment = '') {
    try {
      // Buscar transação
      const transaction = await Transaction.findOne({ transaction_id: transactionId });
      if (!transaction) {
        throw new ApiError(404, 'Transação não encontrada');
      }
      
      // Verificar se é uma transação de saque pendente
      if (transaction.type !== 'withdrawal' || transaction.status !== 'pending') {
        throw new ApiError(400, 'Transação não é um saque pendente');
      }
      
      // Buscar usuário
      const user = await User.findById(transaction.user);
      if (!user) {
        throw new ApiError(404, 'Usuário não encontrado');
      }
      
      // Processar ação
      if (action === 'approve') {
        // Aprovar saque
        transaction.status = 'completed';
        transaction.metadata.admin_comment = adminComment || 'Saque aprovado';
        transaction.metadata.completed_at = new Date();
        
        // Atualizar carteira do usuário
        user.wallet.pending_withdrawals -= transaction.amount;
        
        logger.info(`Saque aprovado: ${transactionId} para usuário ${transaction.user}`);
      } else if (action === 'reject') {
        // Rejeitar saque
        transaction.status = 'rejected';
        transaction.metadata.admin_comment = adminComment || 'Saque rejeitado';
        transaction.metadata.rejected_at = new Date();
        
        // Devolver valor para a carteira do usuário
        user.wallet.balance += transaction.amount;
        user.wallet.pending_withdrawals -= transaction.amount;
        
        // Criar transação de estorno
        const refundTransaction = new Transaction({
          user: transaction.user,
          type: 'withdrawal_refund',
          amount: transaction.amount,
          operation: 'credit',
          status: 'completed',
          metadata: {
            original_transaction: transactionId,
            reason: adminComment || 'Saque rejeitado',
            refund_type: 'withdrawal_rejection'
          },
          transaction_id: uuidv4(),
          balance_before: user.wallet.balance - transaction.amount,
          balance_after: user.wallet.balance
        });
        
        await refundTransaction.save();
        
        logger.info(`Saque rejeitado: ${transactionId} para usuário ${transaction.user}, valor devolvido`);
      } else {
        throw new ApiError(400, 'Ação inválida');
      }
      
      // Salvar alterações
      await transaction.save();
      await user.save();
      
      return transaction;
    } catch (error) {
      logger.error(`Erro ao processar saque: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Adicionar saldo promocional a um usuário
   * @param {string} userId - ID do usuário
   * @param {number} amount - Valor a ser creditado
   * @param {string} promotionType - Tipo da promoção
   * @param {Object} promotionDetails - Detalhes da promoção
   * @returns {Promise<Object>} - Dados da transação
   */
  static async addPromotionalCredit(userId, amount, promotionType, promotionDetails = {}) {
    try {
      // Validações
      if (!userId) throw new ApiError(400, 'ID do usuário é obrigatório');
      if (!amount || amount <= 0) throw new ApiError(400, 'Valor inválido');
      if (!promotionType) throw new ApiError(400, 'Tipo de promoção é obrigatório');
      
      // Arredondar para 2 casas decimais
      amount = parseFloat(amount.toFixed(2));
      
      // Buscar usuário
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, 'Usuário não encontrado');
      }
      
      // Criar transação promocional
      const transaction = new Transaction({
        user: userId,
        type: 'promotion',
        amount,
        operation: 'credit',
        status: 'completed',
        metadata: {
          promotion_type: promotionType,
          promotion_details: promotionDetails,
          is_bonus: true
        },
        transaction_id: uuidv4(),
        balance_before: user.wallet.balance,
        balance_after: user.wallet.balance + amount
      });
      
      // Atualizar saldo promocional da carteira
      user.wallet.balance += amount;
      user.wallet.bonus_balance = (user.wallet.bonus_balance || 0) + amount;
      user.wallet.last_transaction = {
        amount,
        type: 'promotion',
        operation: 'credit',
        timestamp: new Date()
      };
      user.wallet.updated_at = new Date();
      
      // Salvar transação e usuário
      await transaction.save();
      await user.save();
      
      logger.info(`Crédito promocional de ${amount} para usuário ${userId}, tipo: ${promotionType}`);
      
      return transaction;
    } catch (error) {
      logger.error(`Erro ao adicionar crédito promocional: ${error.message}`);
      throw error;
    }
  }
}

module.exports = WalletService; 