/**
 * Serviço de WebSockets
 * Responsável por gerenciar conexões WebSocket e enviar notificações em tempo real
 */

const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const logger = require('../utils/logger');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

// Armazenar referências de sockets ativos
const activeConnections = new Map();

// Armazenar referência do servidor Socket.IO
let io;

/**
 * Inicializar o servidor Socket.IO
 * @param {Object} server - Servidor HTTP
 */
function initialize(server) {
  if (io) {
    logger.warn('Servidor Socket.IO já inicializado');
    return io;
  }

  io = socketIO(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Middleware de autenticação
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Autenticação necessária'));
      }

      // Verificar token JWT
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (!decoded || !decoded.id) {
        return next(new Error('Token inválido'));
      }

      // Buscar usuário
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('Usuário não encontrado'));
      }

      // Adicionar usuário ao socket
      socket.user = {
        id: user._id.toString(),
        username: user.username,
        roles: user.roles || ['user']
      };

      // Avançar para conectar
      next();
    } catch (error) {
      logger.error(`Erro na autenticação do WebSocket: ${error.message}`);
      next(new Error('Erro na autenticação'));
    }
  });

  // Evento de conexão
  io.on('connection', handleConnection);

  logger.info('Servidor Socket.IO inicializado');
  
  return io;
}

/**
 * Lidar com nova conexão de socket
 * @param {Object} socket - Objeto socket
 */
function handleConnection(socket) {
  const userId = socket.user.id;
  
  logger.info(`Nova conexão WebSocket: ${userId}, ID Socket: ${socket.id}`);
  
  // Adicionar à sala do usuário
  socket.join(`user:${userId}`);

  // Armazenar referência da conexão
  if (!activeConnections.has(userId)) {
    activeConnections.set(userId, new Set());
  }
  activeConnections.get(userId).add(socket.id);

  // Atualizar status online do usuário
  updateUserOnlineStatus(userId, true);

  // Enviar contagem de notificações não lidas
  sendUnreadNotificationsCount(socket);

  // Eventos do socket
  setupSocketEvents(socket);

  // Evento de desconexão
  socket.on('disconnect', () => {
    logger.info(`Desconexão WebSocket: ${userId}, ID Socket: ${socket.id}`);
    
    // Remover referência da conexão
    if (activeConnections.has(userId)) {
      activeConnections.get(userId).delete(socket.id);
      
      // Se não houver mais conexões ativas, remover usuário do mapa e atualizar status
      if (activeConnections.get(userId).size === 0) {
        activeConnections.delete(userId);
        updateUserOnlineStatus(userId, false);
      }
    }
  });
}

/**
 * Configurar eventos do socket
 * @param {Object} socket - Objeto socket
 */
function setupSocketEvents(socket) {
  const userId = socket.user.id;

  // Evento para marcar notificação como lida
  socket.on('markNotificationRead', async (notificationId) => {
    try {
      await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { read: true }
      );
      
      // Enviar contagem atualizada de notificações não lidas
      sendUnreadNotificationsCount(socket);
    } catch (error) {
      logger.error(`Erro ao marcar notificação como lida: ${error.message}`, { 
        userId, 
        notificationId 
      });
    }
  });

  // Evento para marcar todas as notificações como lidas
  socket.on('markAllNotificationsRead', async () => {
    try {
      await Notification.updateMany(
        { user: userId, read: false },
        { $set: { read: true } }
      );
      
      // Enviar contagem atualizada de notificações não lidas
      sendUnreadNotificationsCount(socket);
    } catch (error) {
      logger.error(`Erro ao marcar todas notificações como lidas: ${error.message}`, { userId });
    }
  });

  // Evento para solicitar notificações recentes
  socket.on('getRecentNotifications', async (limit) => {
    try {
      sendRecentNotifications(socket, limit || 10);
    } catch (error) {
      logger.error(`Erro ao buscar notificações recentes: ${error.message}`, { userId });
    }
  });
}

/**
 * Atualizar status online do usuário
 * @param {string} userId - ID do usuário
 * @param {boolean} isOnline - Status online
 */
async function updateUserOnlineStatus(userId, isOnline) {
  try {
    await User.findByIdAndUpdate(userId, { 
      isOnline,
      lastSeen: new Date()
    });
  } catch (error) {
    logger.error(`Erro ao atualizar status online do usuário: ${error.message}`, { userId });
  }
}

/**
 * Enviar contagem de notificações não lidas
 * @param {Object} socket - Objeto socket
 */
async function sendUnreadNotificationsCount(socket) {
  try {
    const userId = socket.user.id;
    const count = await Notification.countDocuments({ user: userId, read: false });
    
    socket.emit('unreadNotificationsCount', { count });
  } catch (error) {
    logger.error(`Erro ao buscar contagem de notificações não lidas: ${error.message}`, { 
      userId: socket.user.id 
    });
  }
}

/**
 * Enviar notificações recentes
 * @param {Object} socket - Objeto socket
 * @param {number} limit - Limite de notificações
 */
async function sendRecentNotifications(socket, limit = 10) {
  try {
    const userId = socket.user.id;
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit);
    
    socket.emit('recentNotifications', { notifications });
  } catch (error) {
    logger.error(`Erro ao buscar notificações recentes: ${error.message}`, { 
      userId: socket.user.id 
    });
  }
}

/**
 * Enviar notificação em tempo real para um usuário
 * @param {string} userId - ID do usuário
 * @param {Object} notification - Objeto de notificação
 */
function sendNotification(userId, notification) {
  try {
    if (!io) {
      logger.warn('Tentativa de enviar notificação sem servidor Socket.IO inicializado');
      return false;
    }

    logger.info(`Enviando notificação em tempo real para ${userId}`);
    io.to(`user:${userId}`).emit('notification', notification);
    
    return true;
  } catch (error) {
    logger.error(`Erro ao enviar notificação em tempo real: ${error.message}`, { userId });
    return false;
  }
}

/**
 * Enviar notificação em tempo real para múltiplos usuários
 * @param {Array} userIds - Array de IDs de usuários
 * @param {Object} notification - Objeto de notificação
 */
function sendBulkNotifications(userIds, notification) {
  try {
    if (!io || !userIds || userIds.length === 0) {
      return false;
    }

    // Enviar para cada usuário individualmente
    for (const userId of userIds) {
      io.to(`user:${userId}`).emit('notification', notification);
    }
    
    logger.info(`Notificação em massa enviada para ${userIds.length} usuários`);
    return true;
  } catch (error) {
    logger.error(`Erro ao enviar notificações em massa: ${error.message}`);
    return false;
  }
}

/**
 * Enviar notificação de sistema para todos os usuários ou um grupo específico
 * @param {Object} notification - Objeto de notificação
 * @param {Array} roles - Array de papéis para filtrar destinatários (opcional)
 */
function broadcastSystemNotification(notification, roles = null) {
  try {
    if (!io) {
      return false;
    }

    // Se roles for fornecido, enviar apenas para usuários com esses papéis
    if (roles && Array.isArray(roles)) {
      for (const [userId, socketIds] of activeConnections.entries()) {
        const socket = io.sockets.sockets.get([...socketIds][0]); // Obter primeiro socket
        
        if (socket && socket.user && socket.user.roles) {
          const hasRole = socket.user.roles.some(role => roles.includes(role));
          
          if (hasRole) {
            io.to(`user:${userId}`).emit('systemNotification', notification);
          }
        }
      }
    } else {
      // Enviar para todos os usuários conectados
      io.emit('systemNotification', notification);
    }
    
    logger.info('Notificação de sistema transmitida');
    return true;
  } catch (error) {
    logger.error(`Erro ao transmitir notificação de sistema: ${error.message}`);
    return false;
  }
}

/**
 * Verificar se um usuário está online
 * @param {string} userId - ID do usuário
 * @returns {boolean} - Se o usuário está online
 */
function isUserOnline(userId) {
  return activeConnections.has(userId) && activeConnections.get(userId).size > 0;
}

/**
 * Obter contagem de usuários online
 * @returns {number} - Número de usuários online
 */
function getOnlineUsersCount() {
  return activeConnections.size;
}

/**
 * Obter lista de usuários online
 * @returns {Array} - Array de IDs de usuários online
 */
function getOnlineUsers() {
  return Array.from(activeConnections.keys());
}

module.exports = {
  initialize,
  sendNotification,
  sendBulkNotifications,
  broadcastSystemNotification,
  isUserOnline,
  getOnlineUsersCount,
  getOnlineUsers
}; 