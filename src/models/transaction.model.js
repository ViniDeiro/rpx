const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema de Transação
 * Registra todas as operações financeiras dos usuários
 */
const transactionSchema = new Schema({
  // Referência ao usuário
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // ID único da transação para rastreio
  transaction_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Tipo de transação
  type: {
    type: String,
    required: true,
    enum: [
      'deposit',         // Depósito de dinheiro
      'withdrawal',      // Saque de dinheiro
      'withdrawal_refund', // Reembolso de saque recusado
      'bet',             // Aposta realizada
      'bet_win',         // Ganho de aposta
      'bet_refund',      // Reembolso de aposta anulada
      'bet_cancel',      // Cancelamento de aposta
      'promotion',       // Bônus promocional
      'adjustment',      // Ajuste manual por administrador
      'referral',        // Comissão de indicação
      'purchase',        // Compra na loja
      'subscription'     // Pagamento de assinatura
    ],
    index: true
  },
  
  // Valor da transação
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  
  // Operação (crédito ou débito)
  operation: {
    type: String,
    required: true,
    enum: ['credit', 'debit'],
    index: true
  },
  
  // Status da transação
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'rejected', 'canceled'],
    default: 'pending',
    index: true
  },
  
  // Dados adicionais da transação
  metadata: {
    // Método de pagamento (para depósitos e saques)
    payment_method: {
      type: String,
      enum: ['pix', 'bank_transfer', 'credit_card', 'crypto', 'bonus', 'other']
    },
    
    // Detalhes completos do pagamento
    payment_details: Schema.Types.Mixed,
    
    // ID da aposta relacionada
    bet_slip_id: String,
    
    // ID da partida relacionada
    match_id: String,
    
    // ID de transação externa (gateway de pagamento)
    external_id: String,
    
    // ID da promoção relacionada
    promotion_id: String,
    
    // Endereço IP da requisição
    request_ip: String,
    
    // Comentário do administrador
    admin_comment: String,
    
    // Dados adicionais específicos do tipo de transação
    custom_data: Schema.Types.Mixed
  },
  
  // Saldo antes da transação
  balance_before: {
    type: Number,
    required: true
  },
  
  // Saldo depois da transação
  balance_after: {
    type: Number,
    required: true
  },
  
  // Administrador que processou a transação (se aplicável)
  processed_by: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Índices compostos para consultas frequentes
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ user: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ status: 1, type: 1 });

/**
 * Método para formatar os dados da transação para retorno na API
 */
transactionSchema.methods.toJSON = function() {
  const transaction = this.toObject();
  
  // Remover campos sensíveis ou desnecessários
  delete transaction.__v;
  delete transaction.metadata.payment_details?.cvv;
  delete transaction.metadata.payment_details?.card_number;
  delete transaction.metadata.request_ip;
  
  // Formatar valores para exibição
  transaction.formatted_amount = `${transaction.operation === 'credit' ? '+' : '-'}R$ ${transaction.amount.toFixed(2)}`;
  
  return transaction;
};

/**
 * Método estático para obter o total de depósitos de um usuário
 */
transactionSchema.statics.getTotalDeposits = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        type: 'deposit',
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return result.length > 0 ? result[0] : { total: 0, count: 0 };
};

/**
 * Método estático para obter o total de saques de um usuário
 */
transactionSchema.statics.getTotalWithdrawals = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        type: 'withdrawal',
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return result.length > 0 ? result[0] : { total: 0, count: 0 };
};

/**
 * Método estático para obter estatísticas de apostas de um usuário
 */
transactionSchema.statics.getBetStats = async function(userId) {
  // Total apostado
  const betResult = await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        type: 'bet',
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Total ganho em apostas
  const winResult = await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        type: 'bet_win',
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return {
    bets: {
      total: betResult.length > 0 ? betResult[0].total : 0,
      count: betResult.length > 0 ? betResult[0].count : 0
    },
    wins: {
      total: winResult.length > 0 ? winResult[0].total : 0,
      count: winResult.length > 0 ? winResult[0].count : 0
    },
    profit: (winResult.length > 0 ? winResult[0].total : 0) - (betResult.length > 0 ? betResult[0].total : 0)
  };
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; 