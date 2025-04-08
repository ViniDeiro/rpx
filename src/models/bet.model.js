const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  match_id: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [5, 'Valor mínimo de aposta é 5']
  },
  type: {
    type: String,
    enum: ['match_winner', 'special_market'],
    required: true
  },
  selection: {
    team_id: {
      type: String
    },
    market_id: {
      type: String
    },
    option_id: {
      type: String
    }
  },
  odds: {
    type: Number,
    required: true,
    min: [1, 'Odds devem ser pelo menos 1']
  },
  potential_return: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'won', 'lost', 'canceled', 'void'],
    default: 'pending'
  },
  settlement_data: {
    timestamp: {
      type: Date
    },
    result_details: {
      type: mongoose.Schema.Types.Mixed
    },
    payout_amount: {
      type: Number
    },
    payout_status: {
      type: String,
      enum: ['pending', 'processed', 'failed']
    }
  },
  is_live_bet: {
    type: Boolean,
    default: false
  },
  ip_address: {
    type: String
  },
  user_agent: {
    type: String
  },
  bet_slip_id: {
    type: String,
    required: true,
    unique: true
  },
  source: {
    type: String,
    enum: ['web', 'mobile_app', 'api'],
    default: 'web'
  }
}, {
  timestamps: true
});

// Índices para melhorar a performance
betSchema.index({ user: 1 });
betSchema.index({ match: 1 });
betSchema.index({ status: 1 });
betSchema.index({ bet_slip_id: 1 }, { unique: true });
betSchema.index({ 'selection.team_id': 1 });
betSchema.index({ createdAt: -1 });

// Método para calcular potencial retorno
betSchema.methods.calculatePotentialReturn = function() {
  this.potential_return = parseFloat((this.amount * this.odds).toFixed(2));
  return this.potential_return;
};

// Método para liquidar aposta após resultado
betSchema.methods.settle = function(result) {
  let isWinner = false;
  
  // Para apostas no vencedor da partida
  if (this.type === 'match_winner' && this.selection.team_id) {
    isWinner = result.winner_team_id === this.selection.team_id;
  }
  // Para apostas em mercados especiais
  else if (this.type === 'special_market' && this.selection.market_id && this.selection.option_id) {
    const marketResult = result.special_markets_results.find(
      market => market.market_id === this.selection.market_id
    );
    
    if (marketResult) {
      isWinner = marketResult.winning_option_id === this.selection.option_id;
    }
  }
  
  this.status = isWinner ? 'won' : 'lost';
  this.settlement_data = {
    timestamp: new Date(),
    result_details: result,
    payout_amount: isWinner ? this.potential_return : 0,
    payout_status: isWinner ? 'pending' : 'processed'
  };
  
  return this.save();
};

// Método para cancelar aposta
betSchema.methods.cancel = function(reason) {
  this.status = 'canceled';
  this.settlement_data = {
    timestamp: new Date(),
    result_details: { reason },
    payout_amount: this.amount, // Reembolso
    payout_status: 'pending'
  };
  
  return this.save();
};

// Método para verificar se a aposta está pendente
betSchema.methods.isPending = function() {
  return this.status === 'pending';
};

// Método para verificar se a aposta foi ganha
betSchema.methods.isWon = function() {
  return this.status === 'won';
};

// Método para processar pagamento após liquidação
betSchema.methods.processPayout = async function() {
  if (this.status !== 'won') {
    throw new Error('Apenas apostas ganhas podem ser pagas');
  }
  
  if (this.settlement_data.payout_status === 'processed') {
    throw new Error('O pagamento desta aposta já foi processado');
  }
  
  // Atualizar o status do pagamento
  this.settlement_data.payout_status = 'processed';
  this.settlement_data.payout_processed_at = new Date();
  
  return this.save();
};

// Método para atualizar as odds de uma aposta pendente
betSchema.methods.updateOdds = async function(newOdds) {
  if (this.status !== 'pending') {
    throw new Error('Apenas apostas pendentes podem ter suas odds atualizadas');
  }
  
  this.odds = newOdds;
  this.calculatePotentialReturn();
  
  return this.save();
};

// Método para verificar se a aposta está dentro do limite de tempo para edição
betSchema.methods.isEditableTimeframe = async function(match) {
  if (!match) {
    const Match = mongoose.model('Match');
    match = await Match.findById(this.match);
    
    if (!match) {
      throw new Error('Partida não encontrada');
    }
  }
  
  return this.status === 'pending' && 
         match.status === 'upcoming' && 
         match.betting_status === 'open';
};

// Método para anular (void) uma aposta
betSchema.methods.voidBet = async function(reason) {
  if (['won', 'lost', 'canceled'].includes(this.status)) {
    throw new Error('Não é possível anular uma aposta já liquidada ou cancelada');
  }
  
  this.status = 'void';
  this.settlement_data = {
    timestamp: new Date(),
    result_details: { reason },
    payout_amount: this.amount, // Reembolso do valor apostado
    payout_status: 'pending'
  };
  
  return this.save();
};

// Método para criar um objeto com os dados da aposta para uma API
betSchema.methods.toApiResponse = function() {
  return {
    id: this._id,
    match_id: this.match_id,
    amount: this.amount,
    type: this.type,
    selection: this.selection,
    odds: this.odds,
    potential_return: this.potential_return,
    status: this.status,
    created_at: this.createdAt,
    settled_at: this.settlement_data?.timestamp,
    is_live_bet: this.is_live_bet,
    bet_slip_id: this.bet_slip_id,
    payout_amount: this.settlement_data?.payout_amount || 0,
    payout_status: this.settlement_data?.payout_status || 'pending'
  };
};

// Método estático para encontrar apostas de um usuário
betSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.matchId) {
    query.match = options.matchId;
  }
  
  const sort = options.sort || { createdAt: -1 };
  const limit = options.limit || 50;
  const skip = options.skip || 0;
  
  return this.find(query)
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .populate('match', 'title start_time status tournament_name');
};

// Método estático para encontrar apostas de uma partida
betSchema.statics.findByMatch = function(matchId, status = null) {
  const query = { match: matchId };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query);
};

// Método estático para calcular estatísticas de apostas de um usuário
betSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    { $group: {
      _id: '$status',
      count: { $sum: 1 },
      amount: { $sum: '$amount' },
      returns: { $sum: { 
        $cond: [
          { $eq: ['$status', 'won'] }, 
          { $ifNull: ['$settlement_data.payout_amount', 0] }, 
          0
        ]
      }}
    }},
    { $project: {
      status: '$_id',
      count: 1,
      amount: 1,
      returns: 1,
      _id: 0
    }}
  ]);
  
  // Transformar em objeto mais fácil de usar
  const result = {
    totalBets: 0,
    totalAmount: 0,
    totalReturns: 0,
    winCount: 0,
    lossCount: 0,
    pendingCount: 0,
    winRate: 0
  };
  
  stats.forEach(item => {
    result.totalBets += item.count;
    result.totalAmount += item.amount;
    result.totalReturns += item.returns;
    
    if (item.status === 'won') {
      result.winCount = item.count;
    } else if (item.status === 'lost') {
      result.lossCount = item.count;
    } else if (item.status === 'pending') {
      result.pendingCount = item.count;
    }
  });
  
  const settledBets = result.winCount + result.lossCount;
  if (settledBets > 0) {
    result.winRate = parseFloat(((result.winCount / settledBets) * 100).toFixed(2));
  }
  
  // Calcular lucro/prejuízo
  result.profitLoss = result.totalReturns - result.totalAmount;
  
  return result;
};

// Middleware para gerar bet_slip_id se não existir
betSchema.pre('save', async function(next) {
  if (this.isNew && !this.bet_slip_id) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const userPrefix = this.user.toString().substring(0, 4);
    
    this.bet_slip_id = `BET-${userPrefix}-${timestamp.substring(timestamp.length - 6)}-${random}`;
  }
  
  if (this.isNew || this.isModified('amount') || this.isModified('odds')) {
    this.calculatePotentialReturn();
  }
  
  next();
});

betSchema.statics.findAll = async function(options = {}) {
  const { limit = 20, skip = 0, status, matchId } = options;
  
  // Construir filtro
  const filter = {};
  
  if (status) {
    if (Array.isArray(status)) {
      filter.status = { $in: status };
    } else {
      filter.status = status;
    }
  }
  
  if (matchId) {
    filter.match = matchId;
  }
  
  // Buscar apostas
  return this.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'username name')
    .populate('match', 'title start_time status teams');
};

betSchema.statics.getAdminStats = async function() {
  // Estatísticas para admin
  const totalBets = await this.countDocuments();
  const pendingBets = await this.countDocuments({ status: 'pending' });
  const wonBets = await this.countDocuments({ status: 'won' });
  const lostBets = await this.countDocuments({ status: 'lost' });
  
  // Valores totais
  const totalAmountPipeline = [
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ];
  
  const payoutPipeline = [
    { $match: { status: 'won' } },
    { $group: { _id: null, total: { $sum: '$potential_return' } } }
  ];
  
  const totalAmount = await this.aggregate(totalAmountPipeline);
  const totalPayouts = await this.aggregate(payoutPipeline);
  
  // Calcular margem
  const totalBetAmount = totalAmount.length > 0 ? totalAmount[0].total : 0;
  const totalPayout = totalPayouts.length > 0 ? totalPayouts[0].total : 0;
  const margin = totalBetAmount - totalPayout;
  
  return {
    total_bets: totalBets,
    pending_bets: pendingBets,
    won_bets: wonBets,
    lost_bets: lostBets,
    total_bet_amount: totalBetAmount,
    total_payouts: totalPayout,
    margin: margin
  };
};

const Bet = mongoose.model('Bet', betSchema);

module.exports = Bet; 