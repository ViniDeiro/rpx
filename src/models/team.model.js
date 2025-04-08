/**
 * Modelo de Equipe (Team)
 */

const mongoose = require('mongoose');

/**
 * Schema para membros da equipe
 */
const memberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'captain', 'player', 'coach', 'substitute', 'manager', 'analyst'],
    default: 'player'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  gamerTag: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  position: {
    type: String,
    default: null
  }
}, { _id: false });

/**
 * Schema para conquistas da equipe
 */
const achievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  date: {
    type: Date,
    required: true
  },
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  },
  placement: {
    type: Number
  },
  prize: {
    type: Number
  },
  imageUrl: {
    type: String
  }
}, { _id: true });

/**
 * Schema para estatísticas por jogo
 */
const gameStatSchema = new mongoose.Schema({
  game: {
    type: String,
    required: true,
    enum: ['free_fire', 'league_of_legends', 'valorant', 'counter_strike', 'dota2', 'pubg_mobile', 'fifa', 'rocket_league']
  },
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
  tournamentWins: {
    type: Number,
    default: 0
  },
  tournamentParticipations: {
    type: Number,
    default: 0
  },
  ranking: {
    type: Number
  },
  winRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, { _id: false });

/**
 * Schema para time
 */
const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  tag: {
    type: String,
    trim: true,
    maxlength: 6
  },
  description: {
    type: String,
    default: null
  },
  logoUrl: {
    type: String,
    default: null
  },
  bannerUrl: {
    type: String,
    default: null
  },
  primaryColor: {
    type: String,
    default: '#000000'
  },
  secondaryColor: {
    type: String,
    default: '#FFFFFF'
  },
  website: {
    type: String,
    default: null
  },
  socialMedia: {
    twitter: {
      type: String,
      default: null
    },
    instagram: {
      type: String,
      default: null
    },
    facebook: {
      type: String,
      default: null
    },
    youtube: {
      type: String,
      default: null
    },
    twitch: {
      type: String,
      default: null
    }
  },
  members: [memberSchema],
  achievements: [achievementSchema],
  games: [{
    type: String,
    enum: ['free_fire', 'league_of_legends', 'valorant', 'counter_strike', 'dota2', 'pubg_mobile', 'fifa', 'rocket_league']
  }],
  primaryGame: {
    type: String,
    enum: ['free_fire', 'league_of_legends', 'valorant', 'counter_strike', 'dota2', 'pubg_mobile', 'fifa', 'rocket_league'],
    required: true
  },
  region: {
    type: String,
    default: 'BR'
  },
  country: {
    type: String,
    default: 'Brasil'
  },
  city: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stats: [gameStatSchema],
  inviteCode: {
    type: String,
    default: function() {
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    }
  },
  inviteCodeExpiry: {
    type: Date,
    default: function() {
      const now = new Date();
      return new Date(now.setMonth(now.getMonth() + 1));
    }
  },
  maxMembers: {
    type: Number,
    default: 15
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

/**
 * Índices
 */
teamSchema.index({ name: 'text', description: 'text' });
teamSchema.index({ primaryGame: 1 });
teamSchema.index({ region: 1 });
teamSchema.index({ isVerified: 1, isPublic: 1 });
teamSchema.index({ 'members.userId': 1 });

/**
 * Métodos
 */

// Adicionar membro à equipe
teamSchema.methods.addMember = async function(member) {
  // Verificar se usuário já é membro
  const memberExists = this.members.some(m => 
    m.userId.toString() === member.userId.toString()
  );
  
  if (memberExists) {
    throw new Error('O usuário já é membro desta equipe');
  }
  
  // Verificar limite de membros
  if (this.members.length >= this.maxMembers) {
    throw new Error(`Limite máximo de ${this.maxMembers} membros atingido`);
  }
  
  this.members.push(member);
  return this.save();
};

// Remover membro da equipe
teamSchema.methods.removeMember = async function(userId) {
  const memberIndex = this.members.findIndex(m => 
    m.userId.toString() === userId.toString()
  );
  
  if (memberIndex === -1) {
    throw new Error('Membro não encontrado');
  }
  
  // Não permitir remover o dono da equipe
  if (this.members[memberIndex].role === 'owner') {
    throw new Error('Não é possível remover o dono da equipe');
  }
  
  this.members.splice(memberIndex, 1);
  return this.save();
};

// Atualizar função de um membro
teamSchema.methods.updateMemberRole = async function(userId, newRole) {
  const member = this.members.find(m => 
    m.userId.toString() === userId.toString()
  );
  
  if (!member) {
    throw new Error('Membro não encontrado');
  }
  
  // Não permitir alterar função do dono
  if (member.role === 'owner' && newRole !== 'owner') {
    throw new Error('Não é possível alterar a função do dono da equipe');
  }
  
  // Se estiver definindo um novo dono, remover o dono atual
  if (newRole === 'owner') {
    const currentOwner = this.members.find(m => m.role === 'owner');
    if (currentOwner && currentOwner.userId.toString() !== userId.toString()) {
      currentOwner.role = 'captain';
    }
  }
  
  member.role = newRole;
  return this.save();
};

// Atualizar código de convite
teamSchema.methods.refreshInviteCode = function() {
  this.inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  const now = new Date();
  this.inviteCodeExpiry = new Date(now.setMonth(now.getMonth() + 1));
  return this.save();
};

// Verificar se código de convite é válido
teamSchema.methods.isInviteCodeValid = function(code) {
  return this.inviteCode === code && this.inviteCodeExpiry > Date.now();
};

// Adicionar conquista
teamSchema.methods.addAchievement = function(achievement) {
  this.achievements.push(achievement);
  return this.save();
};

// Atualizar estatísticas
teamSchema.methods.updateStats = function(game, statsUpdate) {
  let gameStat = this.stats.find(s => s.game === game);
  
  if (!gameStat) {
    gameStat = { game };
    this.stats.push(gameStat);
  }
  
  Object.assign(gameStat, statsUpdate);
  
  // Atualizar taxa de vitórias
  const totalMatches = gameStat.wins + gameStat.losses + gameStat.draws;
  if (totalMatches > 0) {
    gameStat.winRate = parseFloat(((gameStat.wins / totalMatches) * 100).toFixed(2));
  }
  
  return this.save();
};

/**
 * Middleware pre-save
 */
teamSchema.pre('save', function(next) {
  // Gerar slug se nome for modificado
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  next();
});

/**
 * Métodos estáticos
 */
teamSchema.statics.findByMember = function(userId) {
  return this.find({ 'members.userId': userId });
};

teamSchema.statics.findByGame = function(game) {
  return this.find({ games: game });
};

/**
 * Modelo de Equipe
 */
const Team = mongoose.model('Team', teamSchema);

module.exports = Team; 