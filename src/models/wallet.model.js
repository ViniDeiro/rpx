/**
 * Modelo de Carteira (Wallet)
 */

const mongoose = require('mongoose');

/**
 * Schema para transações
 */
const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'bet_placed', 'bet_won', 'bet_refund', 'bonus', 'adjustment'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'processing', 'canceled'],
    default: 'pending'
  },
  reference: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  metadata: {
    bet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bet'
    },
    match_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match'
    },
    payment_provider: {
      type: String
    },
    payment_method: {
      type: String
    },
    payment_details: {
      type: mongoose.Schema.Types.Mixed
    },
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String
    }
  },
  created_by: {
    type: String,
    enum: ['user', 'system', 'admin'],
    default: 'user'
  },
  completed_at: {
    type: Date
  },
  balance_after: {
    type: Number
  }
}, {
  timestamps: true
});

/**
 * Schema para carteira
 */
const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  locked_balance: {
    type: Number,
    default: 0,
    min: 0
  },
  bonus_balance: {
    type: Number,
    default: 0,
    min: 0
  },
  total_deposited: {
    type: Number,
    default: 0,
    min: 0
  },
  total_withdrawn: {
    type: Number,
    default: 0,
    min: 0
  },
  total_bet: {
    type: Number,
    default: 0,
    min: 0
  },
  total_won: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'BRL'
  },
  is_locked: {
    type: Boolean,
    default: false
  },
  lock_reason: {
    type: String
  },
  last_deposit_at: {
    type: Date
  },
  last_withdrawal_at: {
    type: Date
  },
  last_bet_at: {
    type: Date
  },
  transactions: [transactionSchema],
  settings: {
    daily_deposit_limit: {
      type: Number,
      default: 1000
    },
    weekly_deposit_limit: {
      type: Number,
      default: 5000
    },
    monthly_deposit_limit: {
      type: Number,
      default: 10000
    },
    withdrawal_method: {
      type: String
    },
    auto_withdrawal: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

/**
 * Índices
 */
walletSchema.index({ user: 1 }, { unique: true });
walletSchema.index({ 'transactions.status': 1 });
walletSchema.index({ 'transactions.type': 1 });
walletSchema.index({ 'transactions.reference': 1 }, { unique: true, sparse: true });

/**
 * Métodos
 */

// Criar uma transação
walletSchema.methods.createTransaction = async function(transactionData) {
  if (this.is_locked) {
    throw new Error(`Carteira está bloqueada: ${this.lock_reason}`);
  }
  
  // Gerar referência única se não fornecida
  if (!transactionData.reference) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    transactionData.reference = `TXN-${this.user.toString().substring(0, 4)}-${timestamp.substring(timestamp.length - 6)}-${random}`;
  }
  
  // Impedir transações com valor zero
  if (transactionData.amount === 0) {
    throw new Error('Valor da transação não pode ser zero');
  }
  
  // Verificar se o usuário tem saldo suficiente para retiradas/apostas
  if (['withdrawal', 'bet_placed'].includes(transactionData.type) && transactionData.amount > this.balance) {
    throw new Error('Saldo insuficiente');
  }
  
  // Criar e adicionar transação
  const transaction = {
    ...transactionData
  };
  
  this.transactions.push(transaction);
  
  // Atualizar saldo conforme o tipo e status da transação
  if (transaction.status === 'completed') {
    await this.updateBalanceForTransaction(transaction);
  }
  
  return this.save();
};

// Atualizar saldo com base na transação
walletSchema.methods.updateBalanceForTransaction = async function(transaction) {
  let previousBalance = this.balance;
  
  switch (transaction.type) {
    case 'deposit':
      this.balance += transaction.amount;
      this.total_deposited += transaction.amount;
      this.last_deposit_at = new Date();
      break;
      
    case 'withdrawal':
      this.balance -= transaction.amount;
      this.total_withdrawn += transaction.amount;
      this.last_withdrawal_at = new Date();
      break;
      
    case 'bet_placed':
      this.balance -= transaction.amount;
      this.total_bet += transaction.amount;
      this.last_bet_at = new Date();
      break;
      
    case 'bet_won':
      this.balance += transaction.amount;
      this.total_won += transaction.amount;
      break;
      
    case 'bet_refund':
      this.balance += transaction.amount;
      this.total_bet -= transaction.amount; // Reverter aposta
      break;
      
    case 'bonus':
      this.bonus_balance += transaction.amount;
      break;
      
    case 'adjustment':
      this.balance += transaction.amount; // Pode ser positivo ou negativo
      break;
  }
  
  // Registrar saldo após a transação
  transaction.balance_after = this.balance;
  transaction.completed_at = new Date();
  
  // Verificar se o saldo não se tornou negativo
  if (this.balance < 0) {
    this.balance = previousBalance;
    throw new Error('Saldo não pode ficar negativo');
  }
  
  return this;
};

// Completar uma transação pendente
walletSchema.methods.completeTransaction = async function(reference) {
  const transaction = this.transactions.find(t => t.reference === reference && t.status === 'pending');
  
  if (!transaction) {
    throw new Error('Transação pendente não encontrada');
  }
  
  transaction.status = 'completed';
  await this.updateBalanceForTransaction(transaction);
  
  return this.save();
};

// Falhar uma transação pendente
walletSchema.methods.failTransaction = async function(reference, reason) {
  const transaction = this.transactions.find(t => t.reference === reference && ['pending', 'processing'].includes(t.status));
  
  if (!transaction) {
    throw new Error('Transação não encontrada ou não está pendente/processando');
  }
  
  transaction.status = 'failed';
  transaction.metadata = {
    ...transaction.metadata,
    reason
  };
  
  return this.save();
};

// Cancelar uma transação pendente
walletSchema.methods.cancelTransaction = async function(reference, reason) {
  const transaction = this.transactions.find(t => t.reference === reference && ['pending', 'processing'].includes(t.status));
  
  if (!transaction) {
    throw new Error('Transação não encontrada ou não está pendente/processando');
  }
  
  transaction.status = 'canceled';
  transaction.metadata = {
    ...transaction.metadata,
    reason
  };
  
  return this.save();
};

// Bloquear carteira
walletSchema.methods.lock = async function(reason) {
  this.is_locked = true;
  this.lock_reason = reason;
  return this.save();
};

// Desbloquear carteira
walletSchema.methods.unlock = async function() {
  this.is_locked = false;
  this.lock_reason = null;
  return this.save();
};

// Obter histórico de transações
walletSchema.methods.getTransactionHistory = function(options = {}) {
  let { limit = 50, skip = 0, type, status, sort = { createdAt: -1 } } = options;
  
  // Filtrar transações
  let filteredTransactions = this.transactions;
  
  if (type) {
    filteredTransactions = filteredTransactions.filter(t => t.type === type);
  }
  
  if (status) {
    filteredTransactions = filteredTransactions.filter(t => t.status === status);
  }
  
  // Ordenar
  if (sort.createdAt === -1) {
    filteredTransactions.sort((a, b) => b.createdAt - a.createdAt);
  } else {
    filteredTransactions.sort((a, b) => a.createdAt - b.createdAt);
  }
  
  // Paginar
  return filteredTransactions.slice(skip, skip + limit);
};

// Verificar limite de depósito
walletSchema.methods.checkDepositLimit = async function(amount) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  // Filtrar depósitos completados nos períodos
  const deposits = this.transactions.filter(t => 
    t.type === 'deposit' && 
    t.status === 'completed'
  );
  
  const dailyDeposits = deposits.filter(t => t.completed_at >= today);
  const weeklyDeposits = deposits.filter(t => t.completed_at >= oneWeekAgo);
  const monthlyDeposits = deposits.filter(t => t.completed_at >= oneMonthAgo);
  
  // Calcular totais
  const dailyTotal = dailyDeposits.reduce((sum, t) => sum + t.amount, 0);
  const weeklyTotal = weeklyDeposits.reduce((sum, t) => sum + t.amount, 0);
  const monthlyTotal = monthlyDeposits.reduce((sum, t) => sum + t.amount, 0);
  
  // Verificar limites
  const result = {
    withinLimits: true,
    dailyRemaining: this.settings.daily_deposit_limit - dailyTotal,
    weeklyRemaining: this.settings.weekly_deposit_limit - weeklyTotal,
    monthlyRemaining: this.settings.monthly_deposit_limit - monthlyTotal
  };
  
  if (amount > result.dailyRemaining || 
      amount > result.weeklyRemaining || 
      amount > result.monthlyRemaining) {
    result.withinLimits = false;
  }
  
  return result;
};

/**
 * Métodos estáticos
 */

// Encontrar carteira por usuário
walletSchema.statics.findByUser = function(userId) {
  return this.findOne({ user: userId });
};

// Encontrar ou criar carteira para usuário
walletSchema.statics.findOrCreate = async function(userId) {
  let wallet = await this.findOne({ user: userId });
  
  if (!wallet) {
    wallet = new this({
      user: userId
    });
    await wallet.save();
  }
  
  return wallet;
};

// Middleware para validação
walletSchema.pre('save', function(next) {
  // Garantir que o saldo não seja negativo
  if (this.balance < 0) {
    this.balance = 0;
  }
  
  if (this.locked_balance < 0) {
    this.locked_balance = 0;
  }
  
  if (this.bonus_balance < 0) {
    this.bonus_balance = 0;
  }
  
  next();
});

/**
 * Modelo de Carteira
 */
const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet; 