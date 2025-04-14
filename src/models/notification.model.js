const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema de notificação
 * 
 * Este modelo permite persistir e gerenciar notificações para os usuários
 * da plataforma RPX, incluindo notificações do sistema, de partidas e
 * transações.
 */
const notificationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      // Notificações do sistema
      'welcome',
      'system_announcement',
      'email_verified',
      'account_update',
      
      // Notificações de partida
      'match_invitation',
      'match_accepted',
      'match_rejected',
      'match_canceled',
      'match_reminder',
      'match_result',
      'match_dispute',
      
      // Notificações financeiras
      'transaction_completed',
      'deposit_received',
      'withdrawal_processed',
      'refund_processed',
      'bonus_received',
      
      // Notificações sociais
      'friend_request',
      'team_invitation',
      'tournament_invitation'
    ],
    required: true,
    index: true
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
    default: false,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  action: {
    type: {
      type: String,
      enum: ['navigate', 'external_link', 'modal', 'function'],
      required: function() {
        return !!this.action;
      }
    },
    target: {
      type: String,
      required: function() {
        return !!this.action && this.action.type;
      }
    },
    data: Schema.Types.Mixed
  },
  expiresAt: {
    type: Date
  },
  references: {
    match: {
      type: Schema.Types.ObjectId,
      ref: 'Match'
    },
    transaction: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    bet: {
      type: Schema.Types.ObjectId,
      ref: 'Bet'
    },
    tournament: {
      type: Schema.Types.ObjectId,
      ref: 'Tournament'
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: 'Team'
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

/**
 * Índices para melhorar performance de consultas
 */
notificationSchema.index({ 'user': 1, 'read': 1, 'createdAt': -1 });
notificationSchema.index({ 'user': 1, 'type': 1, 'createdAt': -1 });

/**
 * Método para marcar notificação como lida
 */
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  return this.save();
};

/**
 * Método estático para marcar todas as notificações de um usuário como lidas
 */
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { user: userId, read: false },
    { $set: { read: true } }
  );
};

/**
 * Método estático para obter todas as notificações não lidas de um usuário
 */
notificationSchema.statics.getUnreadByUser = function(userId, limit = 10) {
  return this.find({ user: userId, read: false })
    .sort({ createdAt: -1 })
    .limit(limit);
};

/**
 * Método estático para limpar notificações expiradas
 */
notificationSchema.statics.cleanExpired = function() {
  const now = new Date();
  return this.deleteMany({ 
    expiresAt: { $lt: now } 
  });
};

/**
 * Método estático para criar uma notificação de sistema
 */
notificationSchema.statics.createSystemNotification = function({
  userId, 
  title, 
  message, 
  priority = 'normal',
  action = null,
  expiresAt = null
}) {
  return this.create({
    user: userId,
    type: 'system_announcement',
    title,
    message,
    priority,
    action,
    expiresAt
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 