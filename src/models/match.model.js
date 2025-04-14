/**
 * Modelo de Partida (Match) para o MongoDB
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema para jogador em um time
const playerSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  is_ready: {
    type: Boolean,
    default: false
  },
  is_captain: {
    type: Boolean,
    default: false
  },
  joined_at: {
    type: Date,
    default: Date.now
  }
});

// Schema para time
const teamSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  players: [playerSchema],
  score: {
    type: Number,
    default: 0
  }
});

// Schema para resultado
const resultSchema = new Schema({
  winner: {
    type: String,
    enum: ['team1', 'team2', 'draw'],
    required: true
  },
  team1_score: {
    type: Number,
    default: 0
  },
  team2_score: {
    type: Number,
    default: 0
  },
  screenshots: [{
    type: String
  }],
  verified_by: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  verified_at: {
    type: Date
  },
  dispute_status: {
    type: String,
    enum: ['none', 'pending', 'resolved'],
    default: 'none'
  }
});

// Schema para partida
const matchSchema = new Schema({
  title: {
    type: String
  },
  mode: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['solo', 'duo', 'squad', 'tournament'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['waiting', 'in_progress', 'completed', 'canceled'],
    default: 'waiting',
    index: true
  },
  team_size: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  platform: {
    type: String,
    enum: ['emulator', 'mobile', 'mixed', 'tactical'],
    default: 'mixed',
    index: true
  },
  entry_fee: {
    type: Number,
    required: true,
    min: 0,
    index: true
  },
  prize: {
    type: Number,
    required: true,
    min: 0
  },
  teams: {
    team1: {
      type: teamSchema,
      required: true
    },
    team2: {
      type: teamSchema,
      required: true
    }
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  started_at: {
    type: Date
  },
  completed_at: {
    type: Date
  },
  result: {
    type: resultSchema
  },
  room_id: {
    type: String
  },
  room_password: {
    type: String
  },
  payment_option: {
    type: String,
    enum: ['captain', 'split'],
    default: 'split'
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Índices compostos
matchSchema.index({ status: 1, entry_fee: 1 });
matchSchema.index({ type: 1, team_size: 1, platform: 1 });

// Middleware pre-save para atualizar o updated_at
matchSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Método para cancelar uma partida
matchSchema.methods.cancelMatch = async function(reason) {
  if (this.status === 'completed') {
    throw new Error('Não é possível cancelar partidas já finalizadas');
  }
  
  this.status = 'canceled';
  return this.save();
};

// Método para iniciar uma partida
matchSchema.methods.startMatch = async function() {
  if (this.status !== 'waiting') {
    throw new Error('Esta partida não está em estado de espera');
  }
  
  // Verificar se há jogadores suficientes
  if (this.teams.team1.players.length < this.team_size || 
      this.teams.team2.players.length < this.team_size) {
    throw new Error('Não há jogadores suficientes para iniciar a partida');
  }
  
  // Verificar se todos os jogadores estão prontos
  const allReady = [...this.teams.team1.players, ...this.teams.team2.players]
    .every(player => player.is_ready);
  
  if (!allReady) {
    throw new Error('Nem todos os jogadores estão prontos');
  }
  
  this.status = 'in_progress';
  this.started_at = new Date();
  
  return this.save();
};

// Método para finalizar uma partida
matchSchema.methods.completeMatch = async function(result) {
  if (this.status !== 'in_progress') {
    throw new Error('Esta partida não está em andamento');
  }
  
  this.status = 'completed';
  this.completed_at = new Date();
  this.result = result;
  
  return this.save();
};

// Método para adicionar um jogador
matchSchema.methods.addPlayer = async function(teamId, player) {
  if (this.status !== 'waiting') {
    throw new Error('Não é possível adicionar jogadores a partidas já iniciadas');
  }
  
  const team = teamId === 'team1' ? this.teams.team1 : this.teams.team2;
  
  if (team.players.length >= this.team_size) {
    throw new Error('Time está completo');
  }
  
  // Verificar se o jogador já está em algum time
  const isAlreadyInTeam1 = this.teams.team1.players.some(p => 
    p.user_id.toString() === player.user_id.toString());
  
  const isAlreadyInTeam2 = this.teams.team2.players.some(p => 
    p.user_id.toString() === player.user_id.toString());
  
  if (isAlreadyInTeam1 || isAlreadyInTeam2) {
    throw new Error('Jogador já está nesta partida');
  }
  
  // Definir como capitão se for o primeiro jogador do time
  if (team.players.length === 0) {
    player.is_captain = true;
  }
  
  team.players.push(player);
  
  return this.save();
};

// Método para remover um jogador
matchSchema.methods.removePlayer = async function(userId) {
  if (this.status !== 'waiting') {
    throw new Error('Não é possível remover jogadores de partidas já iniciadas');
  }
  
  let removed = false;
  let team = null;
  
  // Verificar se o jogador está no time 1
  const team1PlayerIndex = this.teams.team1.players.findIndex(p => 
    p.user_id.toString() === userId.toString());
  
  if (team1PlayerIndex >= 0) {
    const wasCapitain = this.teams.team1.players[team1PlayerIndex].is_captain;
    this.teams.team1.players.splice(team1PlayerIndex, 1);
    removed = true;
    team = this.teams.team1;
    
    // Se era capitão, nomear outro jogador como capitão se houver
    if (wasCapitain && team.players.length > 0) {
      team.players[0].is_captain = true;
    }
  }
  
  // Se não estava no time 1, verificar no time 2
  if (!removed) {
    const team2PlayerIndex = this.teams.team2.players.findIndex(p => 
      p.user_id.toString() === userId.toString());
    
    if (team2PlayerIndex >= 0) {
      const wasCapitain = this.teams.team2.players[team2PlayerIndex].is_captain;
      this.teams.team2.players.splice(team2PlayerIndex, 1);
      removed = true;
      team = this.teams.team2;
      
      // Se era capitão, nomear outro jogador como capitão se houver
      if (wasCapitain && team.players.length > 0) {
        team.players[0].is_captain = true;
      }
    }
  }
  
  if (!removed) {
    throw new Error('Jogador não encontrado nesta partida');
  }
  
  return this.save();
};

// Método estático para encontrar partidas com vagas
matchSchema.statics.findAvailableMatches = function(filters = {}) {
  const query = { 
    status: 'waiting',
    ...filters
  };
  
  return this.find(query)
    .sort({ created_at: -1 });
};

// Método estático para encontrar partidas em andamento
matchSchema.statics.findActiveMatches = function() {
  return this.find({ status: 'in_progress' })
    .sort({ started_at: -1 });
};

// Método estático para encontrar partidas de um jogador
matchSchema.statics.findUserMatches = function(userId) {
  return this.find({
    $or: [
      { 'teams.team1.players.user_id': userId },
      { 'teams.team2.players.user_id': userId }
    ]
  })
  .sort({ created_at: -1 });
};

// Método estático para encontrar partidas com status específico
matchSchema.statics.findByStatus = function(status) {
  return this.find({ status })
    .sort({ created_at: -1 });
};

// Método estático para encontrar partidas por faixa de preço
matchSchema.statics.findByPriceRange = function(minPrice, maxPrice) {
  const query = {};
  
  if (minPrice !== undefined) {
    query.entry_fee = { $gte: minPrice };
  }
  
  if (maxPrice !== undefined) {
    query.entry_fee = { ...query.entry_fee, $lte: maxPrice };
  }
  
  return this.find(query)
    .sort({ entry_fee: 1 });
};

// Criar o modelo
const Match = mongoose.model('Match', matchSchema);

module.exports = Match; 