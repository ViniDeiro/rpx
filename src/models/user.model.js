const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

/**
 * Schema para informações de contato
 */
const contactInfoSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  whatsapp: {
    type: String,
    trim: true
  },
  discord: {
    type: String,
    trim: true
  },
  telegram: {
    type: String,
    trim: true
  }
});

/**
 * Schema para estatísticas do usuário
 */
const statsSchema = new Schema({
  wins: {
    type: Number,
    default: 0
  },
  losses: {
    type: Number,
    default: 0
  },
  draws: {
    type: Number,
    default: 0
  },
  totalMatches: {
    type: Number,
    default: 0
  },
  winRate: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  }
});

/**
 * Schema para transações financeiras
 */
const transactionSchema = new Schema({
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'match_entry', 'match_winnings', 'refund', 'bonus'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'canceled'],
    default: 'pending'
  },
  reference: {
    type: String
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  matchId: {
    type: Schema.Types.ObjectId,
    ref: 'Match'
  },
  paymentMethod: {
    type: String,
    enum: ['pix', 'credit_card', 'debit_card', 'bank_transfer', 'crypto', 'platform_balance']
  },
  paymentDetails: {
    type: Schema.Types.Mixed
  }
});

/**
 * Schema para métodos de pagamento salvos
 */
const paymentMethodSchema = new Schema({
  type: {
    type: String,
    enum: ['pix', 'credit_card', 'debit_card', 'bank_account'],
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  nickname: {
    type: String
  },
  // PIX
  pixKeyType: {
    type: String,
    enum: ['cpf', 'email', 'phone', 'random', 'cnpj']
  },
  pixKey: {
    type: String
  },
  // Cartão de crédito/débito (apenas metadados, não armazenar números completos)
  cardBrand: {
    type: String
  },
  cardLastFour: {
    type: String
  },
  cardExpiryMonth: {
    type: String
  },
  cardExpiryYear: {
    type: String
  },
  cardHolderName: {
    type: String
  },
  // Dados bancários
  bankCode: {
    type: String
  },
  bankName: {
    type: String
  },
  accountType: {
    type: String,
    enum: ['checking', 'savings']
  },
  accountNumber: {
    type: String
  },
  accountAgency: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Schema para KYC (Know Your Customer)
 */
const kycSchema = new Schema({
  status: {
    type: String,
    enum: ['not_submitted', 'pending', 'verified', 'rejected'],
    default: 'not_submitted'
  },
  fullName: {
    type: String
  },
  birthDate: {
    type: Date
  },
  documentType: {
    type: String,
    enum: ['cpf', 'rg', 'cnh']
  },
  documentNumber: {
    type: String
  },
  documentFrontImage: {
    type: String // URL para a imagem
  },
  documentBackImage: {
    type: String // URL para a imagem
  },
  selfieWithDocument: {
    type: String // URL para a imagem
  },
  address: {
    street: String,
    number: String,
    complement: String,
    neighborhood: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  verificationDate: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  reviewerNotes: {
    type: String
  }
});

/**
 * Schema principal do usuário
 */
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: '/images/avatars/default.png'
  },
  avatarUrl: {
    type: String,
    default: null
  },
  contact: {
    type: contactInfoSchema,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned'],
    default: 'active'
  },
  level: {
    type: Number,
    default: 1
  },
  experience: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    default: 0
  },
  stats: {
    type: statsSchema,
    default: () => ({})
  },
  transactions: [transactionSchema],
  paymentMethods: [paymentMethodSchema],
  kyc: {
    type: kycSchema,
    default: () => ({
      status: 'not_submitted'
    })
  },
  lastLogin: {
    type: Date
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  gameAccounts: [{
    platform: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  }],
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    matchInvites: {
      type: Boolean,
      default: true
    },
    marketingEmails: {
      type: Boolean,
      default: false
    }
  },
  privacySettings: {
    showProfileStats: {
      type: Boolean,
      default: true
    },
    showGameAccounts: {
      type: Boolean,
      default: true
    },
    showOnlineStatus: {
      type: Boolean,
      default: true
    }
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  emailVerificationToken: String,
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Índices para melhorar performance
 */
userSchema.index({ username: 1 });
userSchema.index({ 'contact.email': 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ level: -1 });
userSchema.index({ 'stats.totalEarnings': -1 });

/**
 * Middleware pre-save para criptografar senha e atualizar o updatedAt
 */
userSchema.pre('save', async function(next) {
  const user = this;
  
  // Atualizar timestamp
  user.updatedAt = new Date();
  
  // Criptografar a senha se ela for alterada
  if (user.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  
  // Calcular win rate quando stats for alterado
  if (user.isModified('stats.wins') || user.isModified('stats.totalMatches')) {
    const { wins, totalMatches } = user.stats;
    user.stats.winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
  }
  
  next();
});

/**
 * Método para comparar senha
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

/**
 * Método para atualizar as estatísticas após uma partida
 */
userSchema.methods.updateStats = async function(matchResult) {
  const { winner, isWinner } = matchResult;
  const earnings = matchResult.earnings || 0;
  
  if (isWinner) {
    this.stats.wins += 1;
    this.stats.totalEarnings += earnings;
  } else if (winner === 'draw') {
    this.stats.draws += 1;
  } else {
    this.stats.losses += 1;
  }
  
  this.stats.totalMatches += 1;
  
  // Calcular XP a ganhar (base na complexidade do jogo, resultado, etc)
  const xpGained = isWinner ? 50 : 20;
  this.addExperience(xpGained);
  
  // Adicionar transação se houve ganhos
  if (earnings > 0) {
    this.transactions.push({
      type: 'match_winnings',
      amount: earnings,
      status: 'completed',
      completedAt: new Date(),
      matchId: matchResult.matchId,
      description: `Ganhos da partida #${matchResult.matchId}`
    });
    
    // Atualizar saldo
    this.balance += earnings;
  }
  
  return this.save();
};

/**
 * Método para adicionar experiência e verificar level up
 */
userSchema.methods.addExperience = function(xpAmount) {
  this.experience += xpAmount;
  
  // Verificar se deve subir de nível
  // Fórmula: para subir para o nível n, precisa de 100 * (n-1)^2 XP
  const xpForNextLevel = 100 * Math.pow(this.level, 2);
  
  if (this.experience >= xpForNextLevel) {
    this.level += 1;
    // Se houver bonificação por level up, adicionar aqui
  }
};

/**
 * Método para registrar transação
 */
userSchema.methods.addTransaction = async function(transaction) {
  // Adicionar transação ao array
  this.transactions.push(transaction);
  
  // Se for uma transação completa, atualizar o saldo
  if (transaction.status === 'completed') {
    // Depósitos e prêmios incrementam o saldo
    if (['deposit', 'match_winnings', 'bonus'].includes(transaction.type)) {
      this.balance += transaction.amount;
    } 
    // Saques e pagamentos de entradas decrementam o saldo
    else if (['withdrawal', 'match_entry'].includes(transaction.type)) {
      if (this.balance < transaction.amount) {
        throw new Error('Saldo insuficiente');
      }
      this.balance -= transaction.amount;
    }
  }
  
  return this.save();
};

/**
 * Método para completar uma transação pendente
 */
userSchema.methods.completeTransaction = async function(transactionId) {
  const transaction = this.transactions.id(transactionId);
  
  if (!transaction) {
    throw new Error('Transação não encontrada');
  }
  
  if (transaction.status !== 'pending') {
    throw new Error('Apenas transações pendentes podem ser completadas');
  }
  
  transaction.status = 'completed';
  transaction.completedAt = new Date();
  
  // Atualizar saldo
  if (['deposit', 'match_winnings', 'bonus'].includes(transaction.type)) {
    this.balance += transaction.amount;
  } else if (['withdrawal', 'match_entry'].includes(transaction.type)) {
    if (this.balance < transaction.amount) {
      throw new Error('Saldo insuficiente');
    }
    this.balance -= transaction.amount;
  }
  
  return this.save();
};

/**
 * Método para adicionar método de pagamento
 */
userSchema.methods.addPaymentMethod = async function(paymentMethod) {
  // Se for o método padrão, desmarcar outros como padrão
  if (paymentMethod.isDefault) {
    this.paymentMethods.forEach(pm => {
      if (pm.type === paymentMethod.type) {
        pm.isDefault = false;
      }
    });
  }
  
  this.paymentMethods.push(paymentMethod);
  return this.save();
};

/**
 * Método para submeter KYC
 */
userSchema.methods.submitKyc = async function(kycData) {
  this.kyc = {
    ...this.kyc,
    ...kycData,
    status: 'pending'
  };
  
  return this.save();
};

/**
 * Método estático para encontrar usuário por email
 */
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ 'contact.email': email });
};

/**
 * Método estático para encontrar usuários top por nível
 */
userSchema.statics.findTopByLevel = function(limit = 10) {
  return this.find({})
    .sort({ level: -1, experience: -1 })
    .limit(limit)
    .select('username name avatar level experience stats');
};

/**
 * Método estático para encontrar usuários top por ganhos
 */
userSchema.statics.findTopByEarnings = function(limit = 10) {
  return this.find({})
    .sort({ 'stats.totalEarnings': -1 })
    .limit(limit)
    .select('username name avatar level stats.totalEarnings stats.winRate');
};

/**
 * Método estático para encontrar usuários online
 */
userSchema.statics.findOnlineUsers = function() {
  return this.find({ isOnline: true })
    .select('username name avatar isOnline lastLogin');
};

/**
 * Modelo de usuário
 */
const User = mongoose.model('User', userSchema);


/**
 * Método para adicionar um refresh token
 */
userSchema.methods.addRefreshToken = async function(refreshToken) {
  // Inicializar array de tokens se não existir
  if (!this.refreshTokens) {
    this.refreshTokens = [];
  }
  
  // Limitar o número de tokens por usuário (opcional)
  if (this.refreshTokens.length >= 5) {
    // Remover o token mais antigo
    this.refreshTokens.shift();
  }
  
  // Adicionar o novo token
  this.refreshTokens.push(refreshToken);
  
  // Salvar o usuário
  return this.save();
};

module.exports = User; 