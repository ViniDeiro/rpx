import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
  players: mongoose.Types.ObjectId[];
  lobbyId: string;
  betAmount: number;
  gameMode: string;
  status: 'waiting' | 'ready' | 'ongoing' | 'finished' | 'cancelled';
  roomId?: string;
  roomPassword?: string;
  winner?: mongoose.Types.ObjectId;
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  timerExpiresAt?: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    players: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    }],
    lobbyId: {
      type: String,
      required: true
    },
    betAmount: {
      type: Number,
      required: true,
      min: 0
    },
    gameMode: {
      type: String,
      required: true,
      enum: ['solo', 'duo', 'squad', 'custom']
    },
    status: {
      type: String,
      required: true,
      enum: ['waiting', 'ready', 'ongoing', 'finished', 'cancelled'],
      default: 'waiting'
    },
    roomId: {
      type: String
    },
    roomPassword: {
      type: String
    },
    winner: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    startedAt: {
      type: Date
    },
    finishedAt: {
      type: Date
    },
    timerExpiresAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Verifica se o modelo já existe para evitar sobreposição
const Match = (mongoose.models.Match || mongoose.model<IMatch>('Match', MatchSchema));

export default Match; 