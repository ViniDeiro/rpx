import mongoose, { Schema, Document } from 'mongoose';

export interface IProfileComment extends Document {
  userId: mongoose.Types.ObjectId;    // ID do usuário que recebe o comentário
  authorId: mongoose.Types.ObjectId;  // ID do usuário que fez o comentário
  authorName: string;                 // Nome do autor
  authorAvatar?: string;              // Avatar do autor
  content: string;                    // Conteúdo do comentário
  createdAt: Date;                    // Data de criação
  updatedAt: Date;                    // Data de atualização
  isHidden: boolean;                  // Se o comentário está oculto
}

const ProfileCommentSchema = new Schema<IProfileComment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ID do usuário é obrigatório'],
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ID do autor é obrigatório'],
    },
    authorName: {
      type: String,
      required: [true, 'Nome do autor é obrigatório'],
    },
    authorAvatar: {
      type: String,
      default: null,
    },
    content: {
      type: String,
      required: [true, 'Conteúdo é obrigatório'],
      maxlength: [500, 'Comentário não pode ter mais de 500 caracteres'],
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
  }
);

// Verifica se o modelo já existe para evitar sobreposição
const ProfileComment = (mongoose.models.ProfileComment ||
  mongoose.model<IProfileComment>('ProfileComment', ProfileCommentSchema));

export default ProfileComment; 