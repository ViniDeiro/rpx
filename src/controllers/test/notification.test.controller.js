/**
 * Controlador para rotas de teste de notificações 
 * Disponível apenas em ambiente de desenvolvimento
 */

const Notification = require('../../models/notification.model');
const User = require('../../models/user.model');
const { ApiError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');

class NotificationTestController {
  /**
   * Gerar uma notificação de teste para um usuário específico
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async generateSingleNotification(req, res, next) {
    try {
      const { userId, type = 'system_announcement', title, message, priority = 'normal' } = req.body;
      
      if (!userId) {
        return next(ApiError.badRequest('ID do usuário é obrigatório'));
      }
      
      // Verificar se o usuário existe
      const userExists = await User.exists({ _id: userId });
      if (!userExists) {
        return next(ApiError.notFound('Usuário não encontrado'));
      }
      
      const notificationData = {
        user: userId,
        type: type,
        title: title || 'Notificação de teste',
        message: message || `Esta é uma notificação de teste gerada às ${new Date().toLocaleTimeString()}`,
        priority,
        createdAt: new Date()
      };
      
      const notification = await Notification.create(notificationData);
      
      logger.info(`Notificação de teste gerada para o usuário ${userId}`);
      
      return res.status(201).json({
        success: true,
        message: 'Notificação de teste criada com sucesso',
        data: notification
      });
    } catch (error) {
      logger.error(`Erro ao gerar notificação de teste: ${error.message}`);
      next(error);
    }
  }
  
  /**
   * Gerar uma notificação de sistema para todos os usuários
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async generateSystemNotification(req, res, next) {
    try {
      const { title, message, priority = 'normal' } = req.body;
      
      if (!title || !message) {
        return next(ApiError.badRequest('Título e mensagem são obrigatórios'));
      }
      
      // Buscar todos os usuários
      const users = await User.find().select('_id');
      
      if (users.length === 0) {
        return next(ApiError.notFound('Nenhum usuário encontrado no sistema'));
      }
      
      // Preparar documentos para inserção em massa
      const notifications = users.map(user => ({
        user: user._id,
        type: 'system_announcement',
        title,
        message,
        priority,
        createdAt: new Date()
      }));
      
      // Inserir notificações em massa
      const result = await Notification.insertMany(notifications);
      
      logger.info(`Notificação de sistema de teste enviada para ${result.length} usuários`);
      
      return res.status(201).json({
        success: true,
        message: 'Notificação de sistema enviada com sucesso',
        data: {
          totalNotificationsSent: result.length,
          notificationType: 'system_announcement',
          title,
          priority
        }
      });
    } catch (error) {
      logger.error(`Erro ao gerar notificação de sistema: ${error.message}`);
      next(error);
    }
  }
  
  /**
   * Gerar múltiplas notificações de teste para um usuário
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async generateMultipleNotifications(req, res, next) {
    try {
      const { userId, count = 5, types } = req.body;
      
      if (!userId) {
        return next(ApiError.badRequest('ID do usuário é obrigatório'));
      }
      
      // Verificar se o usuário existe
      const userExists = await User.exists({ _id: userId });
      if (!userExists) {
        return next(ApiError.notFound('Usuário não encontrado'));
      }
      
      // Lista de possíveis tipos de notificação se não especificado
      const availableTypes = [
        'welcome', 'system_announcement', 'email_verified', 
        'match_invitation', 'match_accepted', 'match_rejected',
        'transaction_completed', 'deposit_received', 'withdrawal_processed'
      ];
      
      // Usar tipos fornecidos ou os disponíveis
      const notificationTypes = types || availableTypes;
      
      // Gerar notificações
      const notifications = [];
      
      for (let i = 0; i < count; i++) {
        // Escolher um tipo aleatório
        const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
        
        // Definir prioridade aleatória
        const priorities = ['low', 'normal', 'high', 'urgent'];
        const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
        
        notifications.push({
          user: userId,
          type: randomType,
          title: `Notificação de teste ${i+1} - ${randomType}`,
          message: `Esta é uma notificação de teste do tipo "${randomType}" gerada às ${new Date().toLocaleTimeString()}`,
          priority: randomPriority,
          createdAt: new Date()
        });
      }
      
      // Inserir notificações em massa
      const result = await Notification.insertMany(notifications);
      
      logger.info(`${result.length} notificações de teste geradas para o usuário ${userId}`);
      
      return res.status(201).json({
        success: true,
        message: `${result.length} notificações de teste geradas com sucesso`,
        data: {
          totalNotificationsCreated: result.length,
          userId,
          notificationTypes: notificationTypes
        }
      });
    } catch (error) {
      logger.error(`Erro ao gerar múltiplas notificações de teste: ${error.message}`);
      next(error);
    }
  }
  
  /**
   * Limpar todas as notificações de teste de um usuário específico
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async cleanUserNotifications(req, res, next) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return next(ApiError.badRequest('ID do usuário é obrigatório'));
      }
      
      // Verificar se o usuário existe
      const userExists = await User.exists({ _id: userId });
      if (!userExists) {
        return next(ApiError.notFound('Usuário não encontrado'));
      }
      
      // Excluir todas as notificações do usuário
      const result = await Notification.deleteMany({ user: userId });
      
      logger.info(`${result.deletedCount} notificações excluídas para o usuário ${userId}`);
      
      return res.status(200).json({
        success: true,
        message: 'Notificações de teste excluídas com sucesso',
        data: {
          deletedCount: result.deletedCount,
          userId
        }
      });
    } catch (error) {
      logger.error(`Erro ao limpar notificações de teste: ${error.message}`);
      next(error);
    }
  }
  
  /**
   * Limpar todas as notificações de teste do sistema
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async cleanAllNotifications(req, res, next) {
    try {
      // Excluir todas as notificações
      const result = await Notification.deleteMany({});
      
      logger.info(`${result.deletedCount} notificações excluídas do sistema`);
      
      return res.status(200).json({
        success: true,
        message: 'Todas as notificações excluídas com sucesso',
        data: {
          deletedCount: result.deletedCount
        }
      });
    } catch (error) {
      logger.error(`Erro ao limpar todas as notificações: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new NotificationTestController(); 