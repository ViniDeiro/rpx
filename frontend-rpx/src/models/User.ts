import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  userNumber: number; // ID sequencial
  name: string;
  email: string;
  password: string;
  username: string;
  birthdate?: Date;
  phone?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
    twitch?: string;
    discord?: string;
  };
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
  getNextUserNumber(): Promise<number>;
}

// Esquema de contador para gerar IDs sequenciais
const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

// Modelo global para o contador (compatível com Next.js)
let Counter: mongoose.Model<any>;
try {
  Counter = mongoose.model('Counter');
} catch (e) {
  Counter = mongoose.model('Counter', counterSchema);
}

const UserSchema = new Schema<IUser>(
  {
    userNumber: {
      type: Number,
      unique: true,
      required: true
    },
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
    bio: {
      type: String,
      default: '',
      maxlength: [500, 'A biografia deve ter no máximo 500 caracteres']
    },
    socialLinks: {
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      facebook: { type: String, default: '' },
      youtube: { type: String, default: '' },
      twitch: { type: String, default: '' },
      discord: { type: String, default: '' }
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

// Método estático para buscar o próximo número na sequência
UserSchema.statics.getNextUserNumber = async function(): Promise<number> {
  const counter = await Counter.findByIdAndUpdate(
    { _id: 'userNumber' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

// Método para criptografar senha antes de salvar
UserSchema.pre('save', async function (next) {
  // Se for um novo usuário, obter o próximo número de usuário
  if (this.isNew) {
    try {
      this.userNumber = await (this.constructor as UserModel).getNextUserNumber();
    } catch (error: any) {
      return next(error);
    }
  }

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