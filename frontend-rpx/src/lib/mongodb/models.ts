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

// Cache de modelos
let userModel: any = null;
let lobbyModel: any = null;
let notificationModel: any = null;
let transactionModel: any = null;

// Função para obter modelos MongoDB com tratamento de erros aprimorado
export async function getModels() {
  try {
    // Conectar ao banco de dados (só é estabelecida uma vez graças ao cache)
    await connectToDatabase();
    
    // Definir modelo User se ainda não existir
    if (!userModel) {
      const userSchema = new mongoose.Schema({
        name: String,
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true, select: false },
        username: { type: String, required: true, unique: true },
        role: { type: String, default: 'user' },
        avatarUrl: String,
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        lastLogin: Date,
        wallet: {
          balance: { type: Number, default: 0 },
          transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }]
        },
        // Outros campos do usuário...
      });
      
      // Método para comparar senha (bcrypt)
      userSchema.methods.comparePassword = async function(candidatePassword: string) {
        try {
          // Se estamos em ambiente de teste ou desenvolvimento, permitir credenciais "demo"
          if (process.env.NODE_ENV !== 'production') {
            if (this.email === 'demo@rpx.com' && candidatePassword === 'senha123') {
              return true;
            }
          }
          
          // Usar bcrypt para verificar a senha
          const bcrypt = require('bcryptjs');
          return await bcrypt.compare(candidatePassword, this.password);
        } catch (error) {
          console.error('Erro ao comparar senha:', error);
          return false;
        }
      };
      
      // Registrar o modelo
      try {
        userModel = mongoose.models.User || mongoose.model('User', userSchema);
      } catch (modelError) {
        console.error('Erro ao criar modelo User:', modelError);
        throw modelError;
      }
    }
    
    // Outros modelos podem ser definidos aqui...
    
    // Retornar todos os modelos
    return {
      User: userModel,
      // Outros modelos...
    };
  } catch (error) {
    console.error('Erro ao obter modelos do MongoDB:', error);
    throw error;
  }
}

// Exportar esquemas e modelos para uso em outras partes da aplicação
export { userSchema, userModel }; 