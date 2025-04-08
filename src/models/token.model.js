/**
 * Modelo para tokens de atualização
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const refreshTokenSchema = new Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userAgent: {
    type: String,
    required: false
  },
  ip: {
    type: String,
    required: false
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d' // Configurar TTL para remoção automática após 30 dias
  }
});

// Índices
refreshTokenSchema.index({ token: 1 });
refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema); 