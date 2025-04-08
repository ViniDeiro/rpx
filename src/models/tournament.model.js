/**
 * Modelo de Torneio
 */

const mongoose = require('mongoose');

/**
 * Schema para prêmios do torneio
 */
const prizeSchema = new mongoose.Schema({
  position: {
    type: Number,
    required: true,
    min: 1
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    default: null
  }
}, { _id: false });

/**
 * Schema para equipes participantes do torneio
 */
const teamSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  logo: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'eliminated', 'champion', 'runner_up'],
    default: 'active'
  },
  group: {
    type: String,
    default: null
  },
  stats: {
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
    points: {
      type: Number,
      default: 0
    },
    pointDifference: {
      type: Number,
      default: 0
    }
  }
}, { _id: false });

/**
 * Schema para fases do torneio
 */
const stageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['groups', 'single_elimination', 'double_elimination', 'swiss', 'round_robin'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming'
  },
  matches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  }]
}, { _id: false });

/**
 * Schema para documentos de torneio
 */
const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    default: null
  },
  game: {
    type: String,
    required: true,
    enum: ['free_fire', 'league_of_legends', 'valorant', 'counter_strike', 'dota2', 'pubg_mobile', 'fifa', 'rocket_league'],
    index: true
  },
  organizer: {
    type: String,
    required: true
  },
  location: {
    type: String,
    default: 'Online'
  },
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true
  },
  registrationEndDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'registration_open', 'registration_closed', 'active', 'completed', 'canceled'],
    default: 'upcoming',
    index: true
  },
  format: {
    type: String,
    enum: ['single_elimination', 'double_elimination', 'group_stage', 'swiss', 'league'],
    required: true
  },
  teamSize: {
    type: Number,
    required: true,
    min: 1
  },
  maxTeams: {
    type: Number,
    required: true,
    min: 2
  },
  registeredTeamsCount: {
    type: Number,
    default: 0
  },
  prizePool: {
    type: Number,
    default: 0
  },
  entryFee: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'BRL'
  },
  prizes: [prizeSchema],
  teams: [teamSchema],
  stages: [stageSchema],
  coverImage: {
    type: String,
    default: null
  },
  logo: {
    type: String,
    default: null
  },
  sponsorLogos: [{
    type: String
  }],
  streamUrl: {
    type: String,
    default: null
  },
  rules: {
    type: String,
    default: null
  },
  tags: [{
    type: String
  }],
  featured: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  allowSpectators: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

/**
 * Métodos
 */

// Adicionar equipe ao torneio
tournamentSchema.methods.addTeam = async function(team) {
  // Verificar se o torneio ainda aceita inscrições
  if (this.status !== 'registration_open') {
    throw new Error('O torneio não está aceitando inscrições no momento');
  }
  
  // Verificar se o torneio já atingiu o número máximo de equipes
  if (this.registeredTeamsCount >= this.maxTeams) {
    throw new Error('O torneio já atingiu o número máximo de equipes');
  }
  
  // Verificar se a equipe já está inscrita
  const teamExists = this.teams.some(t => t.teamId.toString() === team.teamId.toString());
  if (teamExists) {
    throw new Error('A equipe já está inscrita neste torneio');
  }
  
  // Adicionar equipe
  this.teams.push(team);
  this.registeredTeamsCount = this.teams.length;
  
  // Atualizar status se atingiu o número máximo de equipes
  if (this.registeredTeamsCount >= this.maxTeams) {
    this.status = 'registration_closed';
  }
  
  return this.save();
};

// Remover equipe do torneio
tournamentSchema.methods.removeTeam = async function(teamId) {
  // Verificar se o torneio ainda aceita alterações nas inscrições
  if (!['registration_open', 'registration_closed', 'upcoming'].includes(this.status)) {
    throw new Error('Não é possível remover equipes neste estágio do torneio');
  }
  
  // Verificar se a equipe está inscrita
  const teamIndex = this.teams.findIndex(t => t.teamId.toString() === teamId.toString());
  if (teamIndex === -1) {
    throw new Error('A equipe não está inscrita neste torneio');
  }
  
  // Remover equipe
  this.teams.splice(teamIndex, 1);
  this.registeredTeamsCount = this.teams.length;
  
  // Atualizar status se estava fechado e agora tem vagas
  if (this.status === 'registration_closed' && this.registeredTeamsCount < this.maxTeams) {
    this.status = 'registration_open';
  }
  
  return this.save();
};

// Gerar próximas partidas (implementação básica)
tournamentSchema.methods.generateNextMatches = async function() {
  // Lógica para gerar próximas partidas
  // Depende do formato do torneio e estágio atual
  
  // Stub para ser implementado
  return this;
};

// Atualizar estatísticas do torneio após uma partida
tournamentSchema.methods.updateStatsAfterMatch = async function(matchId, result) {
  // Lógica para atualizar estatísticas do torneio após uma partida
  // Depende do formato do torneio e estágio atual
  
  // Stub para ser implementado
  return this;
};

/**
 * Middleware pre-save para gerar slug se não existir
 */
tournamentSchema.pre('save', function(next) {
  if (!this.isModified('name')) {
    return next();
  }
  
  this.slug = this.name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  next();
});

/**
 * Modelo de Torneio
 */
const Tournament = mongoose.model('Tournament', tournamentSchema);

module.exports = Tournament; 