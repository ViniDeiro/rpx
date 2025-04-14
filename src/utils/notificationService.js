/**
 * Serviço de Notificações
 * 
 * Este serviço facilita o envio de notificações para usuários
 * a partir de diferentes partes do sistema
 */

const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const logger = require('./logger');
const socketService = require('../services/socket.service');

class NotificationService {
  /**
   * Envia uma notificação para um usuário
   * 
   * @param {Object} params - Parâmetros da notificação
   * @param {string} params.userId - ID do usuário que receberá a notificação
   * @param {string} params.type - Tipo da notificação
   * @param {string} params.title - Título da notificação
   * @param {string} params.message - Mensagem da notificação
   * @param {string} [params.priority='normal'] - Prioridade da notificação
   * @param {Object} [params.action] - Ação que pode ser executada com a notificação
   * @param {Date} [params.expiresAt] - Data de expiração da notificação
   * @param {Object} [params.references] - Referências para outros documentos
   * @returns {Promise<Object>} - A notificação criada
   */
  static async sendToUser({
    userId,
    type,
    title,
    message,
    priority = 'normal',
    action = null,
    expiresAt = null,
    references = {}
  }) {
    try {
      // Verificar se o usuário existe
      const userExists = await User.exists({ _id: userId });
      if (!userExists) {
        logger.warn(`Tentativa de enviar notificação para usuário inexistente: ${userId}`);
        throw new Error('Usuário não encontrado');
      }

      // Criar nova notificação
      const notification = new Notification({
        user: userId,
        type,
        title,
        message,
        priority,
        action,
        expiresAt,
        references
      });

      await notification.save();
      logger.info(`Notificação enviada para usuário ${userId} do tipo ${type}`);
      
      // Enviar notificação em tempo real via WebSocket
      try {
        const isOnline = socketService.isUserOnline(userId);
        
        if (isOnline) {
          socketService.sendNotification(userId, {
            _id: notification._id,
            type,
            title,
            message,
            priority,
            action,
            createdAt: notification.createdAt
          });
          
          logger.info(`Notificação enviada em tempo real para usuário ${userId}`);
        } else {
          logger.info(`Usuário ${userId} não está online, notificação será entregue quando conectar`);
        }
      } catch (socketError) {
        // Registrar erro, mas não interromper o fluxo
        logger.error(`Erro ao enviar notificação por WebSocket: ${socketError.message}`);
      }
      
      return notification;
    } catch (error) {
      logger.error(`Erro ao enviar notificação: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envia uma notificação para múltiplos usuários
   * 
   * @param {Object} params - Parâmetros da notificação
   * @param {Array<string>} params.userIds - IDs dos usuários que receberão a notificação
   * @param {string} params.type - Tipo da notificação
   * @param {string} params.title - Título da notificação
   * @param {string} params.message - Mensagem da notificação
   * @param {string} [params.priority='normal'] - Prioridade da notificação
   * @param {Object} [params.action] - Ação que pode ser executada com a notificação
   * @param {Date} [params.expiresAt] - Data de expiração da notificação
   * @param {Object} [params.references] - Referências para outros documentos
   * @returns {Promise<Object>} - Resultado da operação
   */
  static async sendToMany({
    userIds,
    type,
    title,
    message,
    priority = 'normal',
    action = null,
    expiresAt = null,
    references = {}
  }) {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        logger.warn('Tentativa de enviar notificação em massa com lista de usuários vazia');
        throw new Error('Lista de usuários inválida');
      }

      // Verificar usuários existentes
      const existingUsers = await User.find({ _id: { $in: userIds } }).select('_id');
      const validUserIds = existingUsers.map(user => user._id.toString());
      
      if (validUserIds.length === 0) {
        logger.warn('Nenhum usuário válido encontrado para enviar notificações');
        throw new Error('Nenhum usuário válido encontrado');
      }

      // Preparar documentos para inserção em massa
      const notifications = validUserIds.map(userId => ({
        user: userId,
        type,
        title,
        message,
        priority,
        action,
        expiresAt,
        references,
        createdAt: new Date()
      }));

      // Inserir notificações em massa
      const result = await Notification.insertMany(notifications);
      logger.info(`Notificações enviadas para ${result.length} usuários do tipo ${type}`);
      
      // Enviar notificações em tempo real via WebSocket
      try {
        const baseNotification = {
          type,
          title,
          message,
          priority,
          action,
          createdAt: new Date()
        };
        
        socketService.sendBulkNotifications(validUserIds, baseNotification);
      } catch (socketError) {
        logger.error(`Erro ao enviar notificações em massa via WebSocket: ${socketError.message}`);
      }
      
      return {
        success: true,
        totalSent: result.length,
        totalRequested: userIds.length
      };
    } catch (error) {
      logger.error(`Erro ao enviar notificações em massa: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envia uma notificação para todos os usuários
   * 
   * @param {Object} params - Parâmetros da notificação
   * @param {string} params.type - Tipo da notificação
   * @param {string} params.title - Título da notificação
   * @param {string} params.message - Mensagem da notificação
   * @param {string} [params.priority='normal'] - Prioridade da notificação
   * @param {Object} [params.action] - Ação que pode ser executada com a notificação
   * @param {Date} [params.expiresAt] - Data de expiração da notificação
   * @param {Object} [params.references] - Referências para outros documentos
   * @param {Object} [params.filter={}] - Filtro para selecionar usuários
   * @returns {Promise<Object>} - Resultado da operação
   */
  static async sendToAll({
    type,
    title,
    message,
    priority = 'normal',
    action = null,
    expiresAt = null,
    references = {},
    filter = {}
  }) {
    try {
      // Obter IDs de todos os usuários que correspondem ao filtro
      const users = await User.find(filter).select('_id');
      const userIds = users.map(user => user._id.toString());
      
      if (userIds.length === 0) {
        logger.warn('Nenhum usuário encontrado para enviar notificações');
        return {
          success: false,
          totalSent: 0,
          totalRequested: 0,
          message: 'Nenhum usuário encontrado'
        };
      }
      
      // Utilizar o método sendToMany para enviar as notificações
      return await this.sendToMany({
        userIds,
        type,
        title,
        message,
        priority,
        action,
        expiresAt,
        references
      });
    } catch (error) {
      logger.error(`Erro ao enviar notificações para todos usuários: ${error.message}`);
      throw error;
    }
  }

  /**
   * Notificação de boas-vindas para um novo usuário
   * 
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} - A notificação criada
   */
  static async sendWelcomeNotification(userId) {
    try {
      const user = await User.findById(userId).select('username');
      if (!user) {
        logger.warn(`Usuário não encontrado para enviar notificação de boas-vindas: ${userId}`);
        throw new Error('Usuário não encontrado');
      }

      return await this.sendToUser({
        userId,
        type: 'welcome',
        title: 'Bem-vindo à Plataforma RPX',
        message: `Olá ${user.username}! Estamos felizes em tê-lo conosco. Explore a plataforma e comece a participar de partidas competitivas. Se precisar de ajuda, visite nossa seção de suporte.`,
        priority: 'normal',
        action: {
          type: 'navigate',
          target: '/help'
        }
      });
    } catch (error) {
      logger.error(`Erro ao enviar notificação de boas-vindas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Notificação de convite para partida
   * 
   * @param {string} userId - ID do usuário convidado
   * @param {string} matchId - ID da partida
   * @param {string} inviterId - ID do usuário que convidou
   * @returns {Promise<Object>} - A notificação criada
   */
  static async sendMatchInvitation(userId, matchId, inviterId) {
    try {
      const [user, inviter] = await Promise.all([
        User.findById(userId).select('username'),
        User.findById(inviterId).select('username')
      ]);
      
      if (!user || !inviter) {
        logger.warn(`Usuário ou convidador não encontrado para enviar convite: ${userId}, ${inviterId}`);
        throw new Error('Usuário ou convidador não encontrado');
      }

      return await this.sendToUser({
        userId,
        type: 'match_invitation',
        title: 'Convite para Partida',
        message: `${inviter.username} convidou você para uma partida. Verifique os detalhes e aceite o convite para participar.`,
        priority: 'high',
        action: {
          type: 'navigate',
          target: `/matches/${matchId}`
        },
        references: {
          match: matchId,
          user: inviterId
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      });
    } catch (error) {
      logger.error(`Erro ao enviar notificação de convite para partida: ${error.message}`);
      throw error;
    }
  }

  /**
   * Notificação de transação concluída
   * 
   * @param {string} userId - ID do usuário
   * @param {string} transactionId - ID da transação
   * @param {string} type - Tipo de transação ('deposit', 'withdrawal', etc.)
   * @param {number} amount - Valor da transação
   * @returns {Promise<Object>} - A notificação criada
   */
  static async sendTransactionNotification(userId, transactionId, type, amount) {
    try {
      let title, message;
      
      switch (type) {
        case 'deposit':
          title = 'Depósito Concluído';
          message = `Seu depósito de R$ ${amount.toFixed(2)} foi confirmado e adicionado à sua carteira.`;
          break;
        case 'withdrawal':
          title = 'Saque Processado';
          message = `Seu saque de R$ ${amount.toFixed(2)} foi processado e está a caminho da sua conta.`;
          break;
        case 'match_winnings':
          title = 'Premiação Recebida';
          message = `Você recebeu R$ ${amount.toFixed(2)} em premiação por uma partida.`;
          break;
        case 'refund':
          title = 'Reembolso Processado';
          message = `Um reembolso de R$ ${amount.toFixed(2)} foi processado para sua carteira.`;
          break;
        default:
          title = 'Transação Concluída';
          message = `Uma transação de R$ ${amount.toFixed(2)} foi processada em sua conta.`;
      }

      return await this.sendToUser({
        userId,
        type: 'transaction_completed',
        title,
        message,
        priority: 'normal',
        action: {
          type: 'navigate',
          target: '/wallet/transactions'
        },
        references: {
          transaction: transactionId
        }
      });
    } catch (error) {
      logger.error(`Erro ao enviar notificação de transação: ${error.message}`);
      throw error;
    }
  }

  /**
   * Limpa notificações expiradas do sistema
   * 
   * @returns {Promise<Object>} - Resultado da operação
   */
  static async cleanExpiredNotifications() {
    try {
      const now = new Date();
      const result = await Notification.deleteMany({ 
        expiresAt: { $lt: now } 
      });
      
      logger.info(`Limpeza de notificações expiradas: ${result.deletedCount} removidas`);
      
      return {
        success: true,
        deletedCount: result.deletedCount
      };
    } catch (error) {
      logger.error(`Erro ao limpar notificações expiradas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envia uma notificação de sistema para todos os usuários conectados
   * 
   * @param {Object} params - Parâmetros da notificação
   * @param {string} params.title - Título da notificação
   * @param {string} params.message - Mensagem da notificação
   * @param {string} [params.priority='high'] - Prioridade da notificação
   * @param {Object} [params.action] - Ação que pode ser executada com a notificação
   * @param {Array} [params.roles=null] - Papéis dos usuários que receberão a notificação
   * @returns {Promise<boolean>} - Se a notificação foi enviada com sucesso
   */
  static async broadcastSystemNotification({
    title,
    message,
    priority = 'high',
    action = null,
    roles = null
  }) {
    try {
      // Enviar notificação via WebSocket
      socketService.broadcastSystemNotification({
        type: 'system_announcement',
        title,
        message,
        priority,
        action,
        createdAt: new Date()
      }, roles);
      
      // Se tivermos papéis específicos, persistir apenas para esses usuários
      if (roles && Array.isArray(roles) && roles.length > 0) {
        // Encontrar usuários com os papéis especificados
        const users = await User.find({ 
          roles: { $in: roles } 
        }).select('_id');
        
        if (users.length > 0) {
          const userIds = users.map(user => user._id.toString());
          
          // Usar o método sendToMany para persistir as notificações
          await this.sendToMany({
            userIds,
            type: 'system_announcement',
            title,
            message,
            priority,
            action
          });
        }
      } else {
        // Caso contrário, persistir para todos os usuários ativos
        const users = await User.find({ 
          active: true 
        }).select('_id');
        
        if (users.length > 0) {
          const userIds = users.map(user => user._id.toString());
          
          // Usar o método sendToMany para persistir as notificações
          await this.sendToMany({
            userIds,
            type: 'system_announcement',
            title,
            message,
            priority,
            action
          });
        }
      }
      
      logger.info('Notificação de sistema transmitida com sucesso');
      return true;
    } catch (error) {
      logger.error(`Erro ao transmitir notificação de sistema: ${error.message}`);
      return false;
    }
  }
}

module.exports = NotificationService; 