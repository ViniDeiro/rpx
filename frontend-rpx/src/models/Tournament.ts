import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface para os participantes do torneio
export interface ITournamentParticipant {
  userId: Types.ObjectId;
  teamId?: Types.ObjectId;
  registeredAt: Date;
  status: 'pending' | 'confirmed' | 'declined' | 'eliminated';
  paymentStatus: 'pending' | 'completed' | 'refunded';
  seed?: number;
}

// Interface para partidas de torneio
export interface ITournamentMatch {
  roundNumber: number;
  matchNumber: number;
  bracketPosition: string; // ex: "WR1M1" (Winners Round 1 Match 1)
  participant1Id?: Types.ObjectId;
  participant2Id?: Types.ObjectId;
  winnerId?: Types.ObjectId;
  loserId?: Types.ObjectId;
  score1?: number;
  score2?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  nextMatchId?: string;  // Referência para a próxima partida
  nextLoseMatchId?: string; // Para torneios double elimination
  roomId?: string;
  roomPassword?: string;
}

// Interface para prêmios
export interface ITournamentPrize {
  position: number;
  description: string;
  cashAmount?: number;
  coins?: number;
  items?: Array<{
    itemId: Types.ObjectId;
    itemName: string;
    itemQuantity: number;
  }>;
}

// Interface principal do torneio
export interface ITournament extends Document {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  registrationStartDate: Date;
  registrationEndDate: Date;
  format: 'Solo' | 'Duo' | 'Squad' | 'Custom';
  bracketType: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  status: 'draft' | 'published' | 'registration' | 'in_progress' | 'completed' | 'cancelled';
  gameRules: string;
  entryFee: number;
  prizePool: number;
  minParticipants: number;
  maxParticipants: number;
  currentParticipants: number;
  image: string;
  bannerImage?: string;
  featured: boolean;
  color?: string;
  createdBy: Types.ObjectId;
  participants: ITournamentParticipant[];
  matches: ITournamentMatch[];
  prizes: ITournamentPrize[];
  isPublic: boolean;
  streamUrl?: string;
  discordUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TournamentSchema = new Schema<ITournament>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
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
    registrationStartDate: {
      type: Date,
      required: true
    },
    registrationEndDate: {
      type: Date,
      required: true
    },
    format: {
      type: String,
      required: true,
      enum: ['Solo', 'Duo', 'Squad', 'Custom']
    },
    bracketType: {
      type: String,
      required: true,
      enum: ['single_elimination', 'double_elimination', 'round_robin', 'swiss'],
      default: 'single_elimination'
    },
    status: {
      type: String,
      required: true,
      enum: ['draft', 'published', 'registration', 'in_progress', 'completed', 'cancelled'],
      default: 'draft'
    },
    gameRules: {
      type: String,
      required: true
    },
    entryFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    prizePool: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    minParticipants: {
      type: Number,
      required: true,
      min: 2,
      default: 2
    },
    maxParticipants: {
      type: Number,
      required: true,
      min: 2
    },
    currentParticipants: {
      type: Number,
      default: 0
    },
    image: {
      type: String,
      required: true
    },
    bannerImage: {
      type: String
    },
    featured: {
      type: Boolean,
      default: false
    },
    color: {
      type: String
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    participants: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        teamId: {
          type: Schema.Types.ObjectId,
          ref: 'Team'
        },
        registeredAt: {
          type: Date,
          default: Date.now
        },
        status: {
          type: String,
          enum: ['pending', 'confirmed', 'declined', 'eliminated'],
          default: 'pending'
        },
        paymentStatus: {
          type: String,
          enum: ['pending', 'completed', 'refunded'],
          default: 'pending'
        },
        seed: {
          type: Number
        }
      }
    ],
    matches: [
      {
        roundNumber: {
          type: Number,
          required: true
        },
        matchNumber: {
          type: Number,
          required: true
        },
        bracketPosition: {
          type: String,
          required: true
        },
        participant1Id: {
          type: Schema.Types.ObjectId,
          ref: 'User'
        },
        participant2Id: {
          type: Schema.Types.ObjectId,
          ref: 'User'
        },
        winnerId: {
          type: Schema.Types.ObjectId,
          ref: 'User'
        },
        loserId: {
          type: Schema.Types.ObjectId,
          ref: 'User'
        },
        score1: {
          type: Number
        },
        score2: {
          type: Number
        },
        status: {
          type: String,
          enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
          default: 'scheduled'
        },
        startTime: {
          type: Date
        },
        endTime: {
          type: Date
        },
        nextMatchId: {
          type: String
        },
        nextLoseMatchId: {
          type: String
        },
        roomId: {
          type: String
        },
        roomPassword: {
          type: String
        }
      }
    ],
    prizes: [
      {
        position: {
          type: Number,
          required: true
        },
        description: {
          type: String,
          required: true
        },
        cashAmount: {
          type: Number
        },
        coins: {
          type: Number
        },
        items: [
          {
            itemId: {
              type: Schema.Types.ObjectId,
              ref: 'Item'
            },
            itemName: {
              type: String,
              required: true
            },
            itemQuantity: {
              type: Number,
              required: true,
              min: 1,
              default: 1
            }
          }
        ]
      }
    ],
    isPublic: {
      type: Boolean,
      default: true
    },
    streamUrl: {
      type: String
    },
    discordUrl: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Métodos estáticos
TournamentSchema.statics.findFeatured = function() {
  return this.find({ featured: true });
};

TournamentSchema.statics.findUpcoming = function() {
  return this.find({ 
    startDate: { $gt: new Date() },
    status: { $in: ['published', 'registration'] }
  }).sort({ startDate: 1 });
};

TournamentSchema.statics.findActive = function() {
  return this.find({ 
    status: 'in_progress' 
  });
};

// Métodos de instância
TournamentSchema.methods.addParticipant = async function(userId: Types.ObjectId | string, teamId: Types.ObjectId | string | null = null) {
  // Verificar se o torneio ainda está aberto para inscrições
  if (this.status !== 'registration' || this.currentParticipants >= this.maxParticipants) {
    throw new Error('Este torneio não está aceitando inscrições no momento');
  }
  
  // Verificar se o usuário já está inscrito
  const existingParticipant = this.participants.find((p: ITournamentParticipant) => 
    p.userId.toString() === userId.toString()
  );
  
  if (existingParticipant) {
    throw new Error('Usuário já inscrito neste torneio');
  }
  
  // Adicionar o participante
  this.participants.push({
    userId,
    teamId,
    registeredAt: new Date(),
    status: 'pending',
    paymentStatus: this.entryFee > 0 ? 'pending' : 'completed'
  });
  
  this.currentParticipants = this.participants.length;
  return this.save();
};

TournamentSchema.methods.generateBracket = async function() {
  // Este método cria as partidas com base no tipo de bracket e número de participantes
  if (this.status !== 'registration' || this.participants.length < this.minParticipants) {
    throw new Error('Não é possível gerar o bracket neste momento');
  }
  
  // Exemplo para single elimination
  if (this.bracketType === 'single_elimination') {
    const participants = [...this.participants].filter(p => p.status === 'confirmed');
    const numParticipants = participants.length;
    
    // Calcular o número de rodadas necessárias
    const numRounds = Math.ceil(Math.log2(numParticipants));
    const totalMatches = Math.pow(2, numRounds) - 1;
    
    // Criar array de matches vazio
    const matches = [];
    
    // First round matches with participants
    const firstRoundMatches = Math.pow(2, numRounds - 1);
    for (let i = 0; i < firstRoundMatches; i++) {
      const p1Index = i * 2;
      const p2Index = i * 2 + 1;
      
      matches.push({
        roundNumber: 1,
        matchNumber: i + 1,
        bracketPosition: `WR1M${i + 1}`,
        participant1Id: p1Index < numParticipants ? participants[p1Index].userId : undefined,
        participant2Id: p2Index < numParticipants ? participants[p2Index].userId : undefined,
        status: 'scheduled',
        nextMatchId: `WR2M${Math.ceil((i + 1) / 2)}`
      });
    }
    
    // Create remaining matches (without participants yet)
    let currentRound = 2;
    let matchesInRound = firstRoundMatches / 2;
    
    while (matchesInRound >= 1) {
      for (let i = 0; i < matchesInRound; i++) {
        matches.push({
          roundNumber: currentRound,
          matchNumber: i + 1,
          bracketPosition: `WR${currentRound}M${i + 1}`,
          status: 'scheduled',
          nextMatchId: matchesInRound > 1 ? `WR${currentRound + 1}M${Math.ceil((i + 1) / 2)}` : null
        });
      }
      
      currentRound++;
      matchesInRound = matchesInRound / 2;
    }
    
    this.matches = matches;
    this.status = 'in_progress';
    
    return this.save();
  }
  
  throw new Error('Tipo de bracket não suportado');
};

// Verificar se o modelo já existe para evitar sobreposição
const Tournament = (mongoose.models.Tournament || mongoose.model<ITournament>('Tournament', TournamentSchema));

export default Tournament; 