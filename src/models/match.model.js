const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  match_id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  },
  tournament_name: {
    type: String,
    required: true
  },
  tournament_round: {
    type: String
  },
  teams: [{
    team_id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    logo: {
      type: String
    },
    players: [{
      player_id: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      nickname: {
        type: String
      },
      avatar: {
        type: String
      }
    }]
  }],
  start_time: {
    type: Date,
    required: true
  },
  end_time: {
    type: Date
  },
  status: {
    type: String,
    enum: ['upcoming', 'in_progress', 'completed', 'canceled', 'postponed'],
    default: 'upcoming'
  },
  betting_status: {
    type: String,
    enum: ['open', 'closed', 'settled'],
    default: 'open'
  },
  odds: {
    teams: [{
      team_id: {
        type: String,
        required: true
      },
      odd: {
        type: Number,
        required: true,
        min: 1
      },
      probability: {
        type: Number,
        min: 0,
        max: 1
      }
    }],
    special_markets: [
      {
        market_id: {
          type: String,
          required: true
        },
        name: {
          type: String,
          required: true
        },
        description: {
          type: String
        },
        options: [{
          option_id: {
            type: String,
            required: true
          },
          name: {
            type: String,
            required: true
          },
          odd: {
            type: Number,
            required: true,
            min: 1
          }
        }]
      }
    ]
  },
  result: {
    winner_team_id: {
      type: String
    },
    scores: [{
      team_id: {
        type: String,
        required: true
      },
      position: {
        type: Number
      },
      kills: {
        type: Number,
        default: 0
      },
      points: {
        type: Number,
        default: 0
      }
    }],
    player_stats: [{
      player_id: {
        type: String,
        required: true
      },
      team_id: {
        type: String,
        required: true
      },
      kills: {
        type: Number,
        default: 0
      },
      damage: {
        type: Number,
        default: 0
      },
      survival_time: {
        type: Number,
        default: 0
      },
      revives: {
        type: Number,
        default: 0
      }
    }],
    special_markets_results: [{
      market_id: {
        type: String,
        required: true
      },
      winning_option_id: {
        type: String
      }
    }]
  },
  live_updates: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    event_type: {
      type: String,
      enum: ['kill', 'team_eliminated', 'circle_closing', 'match_start', 'match_end', 'other']
    },
    description: {
      type: String
    },
    data: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  total_bets: {
    type: Number,
    default: 0
  },
  total_bet_amount: {
    type: Number,
    default: 0
  },
  stream_url: {
    type: String
  },
  source_data: {
    type: mongoose.Schema.Types.Mixed
  },
  is_featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Índices para melhorar performance de queries
matchSchema.index({ start_time: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ tournament: 1 });
matchSchema.index({ 'teams.team_id': 1 });
matchSchema.index({ match_id: 1 }, { unique: true });

// Middleware pre-save para atualizar status com base no tempo
matchSchema.pre('save', function(next) {
  const now = new Date();
  
  // Atualizar status automaticamente com base no tempo
  if (this.status === 'upcoming' && now >= this.start_time) {
    this.status = 'in_progress';
    this.betting_status = 'closed';
  }
  
  if (this.status === 'in_progress' && this.end_time && now >= this.end_time) {
    this.status = 'completed';
  }
  
  next();
});

// Método para finalizar partida e definir resultados
matchSchema.methods.finishMatch = async function(results) {
  if (this.status === 'completed') {
    throw new Error('Esta partida já foi finalizada');
  }
  
  this.status = 'completed';
  this.end_time = new Date();
  this.result = results;
  
  // Se apostas ainda não foram liquidadas, marcar para liquidação
  if (this.betting_status !== 'settled') {
    this.betting_status = 'settled';
  }
  
  return this.save();
};

// Método para adicionar atualização ao vivo
matchSchema.methods.addLiveUpdate = async function(eventType, description, data = {}) {
  if (this.status !== 'in_progress') {
    throw new Error('Só é possível adicionar atualizações em partidas em andamento');
  }
  
  const update = {
    timestamp: new Date(),
    event_type: eventType,
    description,
    data
  };
  
  this.live_updates.push(update);
  return this.save();
};

// Método para atualizar as odds de uma partida
matchSchema.methods.updateOdds = async function(newOdds) {
  if (this.status !== 'upcoming' && this.betting_status !== 'open') {
    throw new Error('Não é possível atualizar odds de partidas que já começaram ou com apostas fechadas');
  }
  
  this.odds = newOdds;
  return this.save();
};

// Método para atrasar/adiar uma partida
matchSchema.methods.postponeMatch = async function(newStartTime) {
  if (this.status !== 'upcoming' && this.status !== 'postponed') {
    throw new Error('Só é possível adiar partidas que ainda não começaram');
  }
  
  this.status = 'postponed';
  this.start_time = newStartTime;
  
  return this.save();
};

// Método para cancelar uma partida
matchSchema.methods.cancelMatch = async function(reason) {
  if (this.status === 'completed') {
    throw new Error('Não é possível cancelar partidas já finalizadas');
  }
  
  this.status = 'canceled';
  this.betting_status = 'closed';
  this.description = this.description + ` [CANCELADA: ${reason}]`;
  
  return this.save();
};

// Método para obter estatísticas agregadas
matchSchema.methods.getAggregatedStats = function() {
  if (!this.result || !this.result.player_stats) {
    return null;
  }
  
  const stats = {
    totalKills: 0,
    topFragger: null,
    teamStats: {}
  };
  
  // Calcular estatísticas
  this.result.player_stats.forEach(player => {
    stats.totalKills += player.kills || 0;
    
    if (!stats.topFragger || (player.kills > stats.topFragger.kills)) {
      stats.topFragger = {
        player_id: player.player_id,
        team_id: player.team_id,
        kills: player.kills
      };
    }
    
    // Estatísticas por equipe
    if (!stats.teamStats[player.team_id]) {
      stats.teamStats[player.team_id] = {
        totalKills: 0,
        totalDamage: 0,
        players: 0
      };
    }
    
    const team = stats.teamStats[player.team_id];
    team.totalKills += player.kills || 0;
    team.totalDamage += player.damage || 0;
    team.players += 1;
  });
  
  return stats;
};

// Método estático para encontrar partidas próximas
matchSchema.statics.findUpcoming = function(limit = 10) {
  return this.find({ 
    status: 'upcoming',
    start_time: { $gt: new Date() }
  })
  .sort({ start_time: 1 })
  .limit(limit);
};

// Método estático para encontrar partidas em destaque
matchSchema.statics.findFeatured = function() {
  return this.find({ is_featured: true })
    .sort({ start_time: 1 });
};

// Método estático para encontrar partidas de um torneio
matchSchema.statics.findByTournament = function(tournamentId) {
  return this.find({ tournament: tournamentId })
    .sort({ start_time: 1 });
};

// Método estático para encontrar partidas de uma equipe
matchSchema.statics.findByTeam = function(teamId) {
  return this.find({ 'teams.team_id': teamId })
    .sort({ start_time: -1 });
};

// Criar modelo
const Match = mongoose.model('Match', matchSchema);

module.exports = Match; 