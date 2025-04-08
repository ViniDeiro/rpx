const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Schema do usuário
 */
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Nome de usuário é obrigatório'],
    unique: true,
    trim: true,
    minlength: [3, 'Nome de usuário deve ter pelo menos 3 caracteres'],
    maxlength: [20, 'Nome de usuário não pode ter mais de 20 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [8, 'Senha deve ter pelo menos 8 caracteres'],
    select: false
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  cpf: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        // Permite CPF nulo (sparse: true), mas se foi fornecido, verifica se tem 11 dígitos
        return v === null || v === undefined || v.length === 11;
      },
      message: 'CPF inválido. Deve conter 11 dígitos.'
    }
  },
  phone: {
    type: String,
    trim: true
  },
  birthdate: {
    type: Date,
    required: true,
    validate: {
      validator: function(date) {
        // Verificar se a pessoa tem pelo menos 18 anos
        const eighteenYearsAgo = new Date();
        eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
        return date <= eighteenYearsAgo;
      },
      message: 'Você deve ter pelo menos 18 anos para se registrar'
    }
  },
  avatar: {
    type: String,
    default: null
  },
  banner: {
    type: String,
    default: null
  },
  roles: {
    type: [String],
    enum: ['user', 'admin', 'moderator'],
    default: ['user']
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  wallet: {
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    transactions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  refreshTokens: {
    type: [String],
    default: []
  },
  lastLogin: {
    type: Date,
    default: null
  },
  preferences: {
    notifications: {
      email: {
        marketing: {
          type: Boolean,
          default: true
        },
        security: {
          type: Boolean,
          default: true
        },
        transactions: {
          type: Boolean,
          default: true
        }
      },
      push: {
        marketing: {
          type: Boolean,
          default: true
        },
        security: {
          type: Boolean,
          default: true
        },
        transactions: {
          type: Boolean,
          default: true
        }
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    }
  },
  kycStatus: {
    status: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted'
    },
    documents: {
      idCard: {
        submitted: {
          type: Boolean,
          default: false
        },
        verified: {
          type: Boolean,
          default: false
        },
        url: {
          type: String,
          default: null
        }
      },
      addressProof: {
        submitted: {
          type: Boolean,
          default: false
        },
        verified: {
          type: Boolean,
          default: false
        },
        url: {
          type: String,
          default: null
        }
      }
    },
    rejectionReason: {
      type: String,
      default: null
    }
  },
  limits: {
    dailyBet: {
      type: Number,
      default: 1000
    },
    weeklyBet: {
      type: Number,
      default: 5000
    },
    monthlyBet: {
      type: Number,
      default: 15000
    }
  },
  profile: {
    name: {
      type: String,
      trim: true
    },
    avatar: {
      type: String,
      default: 'default-avatar.png'
    },
    level: {
      type: Number,
      default: 1
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  },
  stats: {
    total_bets: {
      type: Number,
      default: 0
    },
    won_bets: {
      type: Number,
      default: 0
    },
    win_rate: {
      type: Number,
      default: 0
    },
    tournaments_joined: {
      type: Number,
      default: 0
    },
    tournaments_won: {
      type: Number,
      default: 0
    }
  },
  is_active: {
    type: Boolean,
    default: true
  },
  last_login: {
    type: Date,
    default: Date.now
  },
  login_attempts: {
    type: Number,
    default: 0
  },
  lock_until: {
    type: Date
  }
}, {
  timestamps: true
});

/**
 * Método para verificar a senha
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Middleware para criptografar a senha antes de salvar
 */
userSchema.pre('save', async function(next) {
  try {
    // Só criptografa a senha se ela foi modificada
    if (!this.isModified('password')) {
      return next();
    }
    
    // Gerar um salt e criptografar a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    
    // Substituir a senha em texto plano pela senha criptografada
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Método para adicionar um refresh token
 * @param {String} token - Refresh token para adicionar
 * @param {Number} maxTokens - Número máximo de tokens por usuário (padrão: 5)
 */
userSchema.methods.addRefreshToken = async function(token, maxTokens = 5) {
  // Adicionar o novo token
  this.refreshTokens.push(token);
  
  // Limitar o número de tokens ativos por usuário (mantém apenas os mais recentes)
  if (this.refreshTokens.length > maxTokens) {
    this.refreshTokens = this.refreshTokens.slice(-maxTokens);
  }
  
  // Atualizar a data do último login
  this.lastLogin = new Date();
  
  return this.save();
};

/**
 * Método para remover um refresh token
 * @param {String} token - Refresh token para remover
 */
userSchema.methods.removeRefreshToken = async function(token) {
  this.refreshTokens = this.refreshTokens.filter(t => t !== token);
  return this.save();
};

/**
 * Método para remover todos os refresh tokens (logout em todos os dispositivos)
 */
userSchema.methods.clearRefreshTokens = async function() {
  this.refreshTokens = [];
  return this.save();
};

/**
 * Método para atualizar estatísticas
 */
userSchema.methods.updateStats = function() {
  if (this.stats.total_bets > 0) {
    this.stats.win_rate = (this.stats.won_bets / this.stats.total_bets) * 100;
  }
  return this.save();
};

/**
 * Método para verificar se a conta está bloqueada
 */
userSchema.methods.isLocked = function() {
  return this.lock_until && this.lock_until > Date.now();
};

/**
 * Método para incrementar tentativas de login
 */
userSchema.methods.incrementLoginAttempts = async function() {
  // Se existe um bloqueio anterior mas já expirou
  if (this.lock_until && this.lock_until < Date.now()) {
    // Resetar tentativas de login e remover bloqueio
    return this.updateOne({
      $set: { login_attempts: 1 },
      $unset: { lock_until: 1 }
    });
  }
  
  // Incrementar tentativas de login
  const updates = { $inc: { login_attempts: 1 } };
  
  // Bloquear conta se atingir 5 tentativas
  if (this.login_attempts + 1 >= 5) {
    updates.$set = { lock_until: Date.now() + 1 * 60 * 60 * 1000 }; // 1 hora
  }
  
  return this.updateOne(updates);
};

/**
 * Modelo de usuário
 */
const User = mongoose.model('User', userSchema);

module.exports = User; 