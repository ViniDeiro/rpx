import mongoose from 'mongoose';
import { connectToDatabase } from './connect';

// Esquemas do MongoDB
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  profile: {
    name: String,
    avatar: String,
    bio: String,
    location: String,
    socialLinks: {
      twitter: String,
      instagram: String,
      twitch: String
    }
  },
  stats: {
    matches: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 }
  },
  wallet: {
    balance: { type: Number, default: 0 },
    transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }]
  },
  isVerified: { type: Boolean, default: false },
  lastLogin: Date,
  status: { type: String, enum: ['active', 'inactive', 'banned'], default: 'active' }
});

// Função para obter modelos com verificação de conexão
export async function getModels() {
  await connectToDatabase();
  
  // Verificar se os modelos já existem antes de redefini-los
  const User = mongoose.models.User || mongoose.model('User', userSchema);
  
  // Retornar os modelos para uso nas APIs
  return {
    User
  };
}

// Exportar esquemas para uso em outras partes da aplicação
export { userSchema }; 