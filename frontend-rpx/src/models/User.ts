import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  username: string;
  birthdate?: Date;
  phone?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  balance: number;
  friends: mongoose.Types.ObjectId[];
  pendingFriendRequests: mongoose.Types.ObjectId[];
  sentFriendRequests: mongoose.Types.ObjectId[];
  lobbyInvites: {
    from: mongoose.Types.ObjectId;
    lobbyId: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

interface UserModel extends mongoose.Model<IUser> {
  hashPassword(password: string): Promise<string>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Nome é obrigatório'],
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Username é obrigatório'],
      unique: true,
      trim: true,
      minlength: [3, 'Username deve ter pelo menos 3 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'Email é obrigatório'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Por favor, forneça um endereço de email válido',
      ],
    },
    password: {
      type: String,
      required: [true, 'Senha é obrigatória'],
      minlength: [8, 'A senha deve ter pelo menos 8 caracteres'],
      select: false, // Não incluir senha nas consultas por padrão
    },
    birthdate: {
      type: Date,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    bannerUrl: {
      type: String,
      default: null,
    },
    balance: {
      type: Number,
      default: 500, // Saldo inicial para novos usuários
    },
    friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    pendingFriendRequests: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    sentFriendRequests: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lobbyInvites: [
      {
        from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        lobbyId: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
  }
);

// Método para criptografar senha antes de salvar
UserSchema.pre('save', async function (next) {
  // Só criptografa se a senha foi modificada (ou é nova)
  if (!this.isModified('password')) return next();

  try {
    // Gera um salt
    const salt = await bcrypt.genSalt(10);
    // Hash a senha com o salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Método para comparar senhas
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    // Compara a senha candidata com a senha armazenada
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Método estático para hashear senhas sem precisar de instância
UserSchema.statics.hashPassword = async function(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Verifica se o modelo já existe para evitar sobreposição
const User = (mongoose.models.User || mongoose.model<IUser, UserModel>('User', UserSchema)) as UserModel;

export default User; 