import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  type: 'verification' | 'payment' | 'system' | 'match';
  title: string;
  message: string;
  read: boolean;
  data?: any;
  createdAt: Date;
  updatedAt?: Date;
}

const NotificationSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['verification', 'payment', 'system', 'match'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  data: {
    type: Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
});

// Adicionar índice para consultas frequentes
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// Método para marcar como lida
NotificationSchema.methods.markAsRead = function(): Promise<INotification> {
  this.read = true;
  this.updatedAt = new Date();
  return this.save();
};

// Método estático para criar notificação
NotificationSchema.statics.createNotification = async function(
  userId: string,
  type: 'verification' | 'payment' | 'system' | 'match',
  title: string,
  message: string,
  data?: any
): Promise<INotification> {
  return this.create({
    userId,
    type,
    title,
    message,
    data,
    read: false,
    createdAt: new Date()
  });
};

// Método estático para obter notificações não lidas
NotificationSchema.statics.getUnreadNotifications = function(userId: string): Promise<INotification[]> {
  return this.find({ userId, read: false })
    .sort({ createdAt: -1 })
    .exec();
};

// Método estático para contar notificações não lidas
NotificationSchema.statics.countUnreadNotifications = function(userId: string): Promise<number> {
  return this.countDocuments({ userId, read: false }).exec();
};

interface INotificationModel extends Model<INotification> {
  createNotification(
    userId: string,
    type: 'verification' | 'payment' | 'system' | 'match',
    title: string,
    message: string,
    data?: any
  ): Promise<INotification>;
  getUnreadNotifications(userId: string): Promise<INotification[]>;
  countUnreadNotifications(userId: string): Promise<number>;
}

// Verifica se o modelo já existe para evitar redefinição
export default (mongoose.models.Notification as INotificationModel) || 
  mongoose.model<INotification, INotificationModel>('Notification', NotificationSchema); 