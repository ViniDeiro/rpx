import mongoose from 'mongoose';
import { connectToDatabase } from './connect';

// Esquemas do MongoDB
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  cpf: { type: String },
  birthdate: { type: String },
  role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
  isHidden: { type: Boolean, default: false }, // Para ocultar usuários na listagem admin
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  avatarUrl: { type: String },
  profile: {
    name: String,
    avatar: String,
    bio: String,
    location: String,
    socialLinks: {
      twitter: String,
      instagram: String,
      twitch: String,
      youtube: String,
      discord: String,
      tiktok: String
    }
  },
  stats: {
    matches: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    rankPoints: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 }
  },
  wallet: {
    balance: { type: Number, default: 0 },
    transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }]
  },
  // Sistema de amizade
  friends: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    avatar: String,
    status: { type: String, enum: ['online', 'offline', 'in_game', 'idle'], default: 'offline' },
    since: { type: Date, default: Date.now },
    isFavorite: { type: Boolean, default: false },
    lastActivity: Date
  }],
  friendRequests: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    avatar: String,
    requestDate: { type: Date, default: Date.now }
  }],
  sentFriendRequests: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    requestDate: { type: Date, default: Date.now }
  }],
  // Usuários bloqueados
  blockedUsers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    blockedAt: { type: Date, default: Date.now }
  }],
  isVerified: { type: Boolean, default: false },
  lastLogin: Date,
  lastActivity: Date,
  status: { type: String, enum: ['active', 'inactive', 'banned'], default: 'active' }
});

// Declaração do modelo User
let User: mongoose.Model<any>;

// Função para obter modelos com verificação de conexão
export async function getModels() {
  await connectToDatabase();
  
  // Verificar se os modelos já existem antes de redefini-los
  User = mongoose.models.User || mongoose.model('User', userSchema);
  
  // Retornar os modelos para uso nas APIs
  return {
    User
  };
}

// Exportar esquemas e modelos para uso em outras partes da aplicação
export { userSchema, User }; 