/**
 * Controlador de Notificações
 * Responsável por gerenciar a criação, recuperação e gerenciamento de notificações dos usuários
 */

const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const apiResponse = require('../utils/apiResponses');

class NotificationController {
  /**
   * Obter todas as notificações do usuário autenticado
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async getNotifications(req, res, next) {
    try {
      const userId = req.user._id;
      const { limit = 20, offset = 0, read, type } = req.query;
      
      logger.info(`Buscando notificações para o usuário: ${userId}`);
      
      // Construir o filtro base
      const filter = { user: userId };
      
      // Adicionar filtro opcional para status de leitura
      if (read !== undefined) {
        filter.read = read === 'true';
      }
      
      // Adicionar filtro opcional por tipo
      if (type) {
        filter.type = type;
      }
      
      // Buscar notificações com paginação
      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .lean();
      
      // Contar total de notificações
      const total = await Notification.countDocuments(filter);
      
      // Contagem de não lidas
      const unreadCount = await Notification.countDocuments({ 
        user: userId, 
        read: false 
      });
      
      return res.status(200).json({
        success: true,
        message: 'Notificações recuperadas com sucesso',
        data: {
          notifications,
          pagination: {
            total,
            unreadCount,
            limit: parseInt(limit),
            offset: parseInt(offset)
          }
        }
      });
    } catch (error) {
      logger.error(`Erro ao buscar notificações: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obter detalhes de uma notificação específica
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async getNotificationById(req, res, next) {
    try {
      const userId = req.user._id;
      const { notificationId } = req.params;
      
      logger.info(`Buscando detalhes da notificação ${notificationId} para o usuário: ${userId}`);
      
      // Buscar a notificação
      const notification = await Notification.findOne({
        _id: notificationId,
        user: userId
      });
      
      if (!notification) {
        return next(ApiError.notFound('Notificação não encontrada'));
      }
      
      // Se a notificação não estiver marcada como lida, marcar agora
      if (!notification.read) {
        notification.read = true;
        await notification.save();
        logger.info(`Notificação ${notificationId} marcada como lida`);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Detalhes da notificação recuperados com sucesso',
        data: notification
      });
    } catch (error) {
      logger.error(`Erro ao buscar detalhes da notificação: ${error.message}`);
      next(error);
    }
  }

  /**
   * Marcar uma notificação como lida
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async markAsRead(req, res, next) {
    try {
      const userId = req.user._id;
      const { notificationId } = req.params;
      
      logger.info(`Marcando notificação ${notificationId} como lida para o usuário: ${userId}`);
      
      // Buscar e atualizar a notificação
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { read: true },
        { new: true }
      );
      
      if (!notification) {
        return next(ApiError.notFound('Notificação não encontrada'));
      }
      
      return res.status(200).json({
        success: true,
        message: 'Notificação marcada como lida com sucesso',
        data: notification
      });
    } catch (error) {
      logger.error(`Erro ao marcar notificação como lida: ${error.message}`);
      next(error);
    }
  }

  /**
   * Marcar todas as notificações do usuário como lidas
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user._id;
      const { type } = req.query;
      
      logger.info(`Marcando todas as notificações como lidas para o usuário: ${userId}`);
      
      // Construir o filtro base
      const filter = { user: userId, read: false };
      
      // Adicionar filtro opcional por tipo
      if (type) {
        filter.type = type;
      }
      
      // Atualizar todas as notificações
      const result = await Notification.updateMany(
        filter,
        { $set: { read: true } }
      );
      
      return res.status(200).json({
        success: true,
        message: 'Notificações marcadas como lidas com sucesso',
        data: { 
          updatedCount: result.nModified || result.modifiedCount
        }
      });
    } catch (error) {
      logger.error(`Erro ao marcar todas notificações como lidas: ${error.message}`);
      next(error);
    }
  }

  /**
   * Excluir uma notificação
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async deleteNotification(req, res, next) {
    try {
      const userId = req.user._id;
      const { notificationId } = req.params;
      
      logger.info(`Excluindo notificação ${notificationId} para o usuário: ${userId}`);
      
      // Buscar e excluir a notificação
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        user: userId
      });
      
      if (!notification) {
        return next(ApiError.notFound('Notificação não encontrada'));
      }
      
      return res.status(200).json({
        success: true,
        message: 'Notificação excluída com sucesso'
      });
    } catch (error) {
      logger.error(`Erro ao excluir notificação: ${error.message}`);
      next(error);
    }
  }

  /**
   * Excluir todas as notificações do usuário
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async deleteAllNotifications(req, res, next) {
    try {
      const userId = req.user._id;
      const { type, read } = req.query;
      
      logger.info(`Excluindo todas as notificações para o usuário: ${userId}`);
      
      // Construir o filtro base
      const filter = { user: userId };
      
      // Adicionar filtro opcional por tipo
      if (type) {
        filter.type = type;
      }
      
      // Adicionar filtro opcional por status de leitura
      if (read !== undefined) {
        filter.read = read === 'true';
      }
      
      // Excluir as notificações
      const result = await Notification.deleteMany(filter);
      
      return res.status(200).json({
        success: true,
        message: 'Notificações excluídas com sucesso',
        data: { 
          deletedCount: result.deletedCount 
        }
      });
    } catch (error) {
      logger.error(`Erro ao excluir todas notificações: ${error.message}`);
      next(error);
    }
  }

  /**
   * Criar uma notificação para um usuário específico (rota administrativa)
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async createNotification(req, res, next) {
    try {
      // Esta rota deve ser protegida por middleware de autorização para admins/moderadores
      const { userId, type, title, message, priority, action, expiresAt, references } = req.body;
      
      logger.info(`Criando notificação para o usuário: ${userId}`);
      
      // Verificar se o usuário existe
      const userExists = await User.exists({ _id: userId });
      if (!userExists) {
        return next(ApiError.notFound('Usuário não encontrado'));
      }
      
      // Criar a notificação
      const notification = new Notification({
        user: userId,
        type,
        title,
        message,
        priority: priority || 'normal',
        action,
        expiresAt,
        references
      });
      
      await notification.save();
      
      return res.status(201).json({
        success: true,
        message: 'Notificação criada com sucesso',
        data: notification
      });
    } catch (error) {
      logger.error(`Erro ao criar notificação: ${error.message}`);
      next(error);
    }
  }

  /**
   * Criar uma notificação para vários usuários (rota administrativa)
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async createBulkNotifications(req, res, next) {
    try {
      // Esta rota deve ser protegida por middleware de autorização para admins/moderadores
      const { userIds, type, title, message, priority, action, expiresAt, references } = req.body;
      
      logger.info(`Criando notificações em massa para ${userIds.length} usuários`);
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return next(ApiError.badRequest('Lista de usuários inválida'));
      }
      
      // Verificar usuários existentes
      const existingUsers = await User.find({ _id: { $in: userIds } }).select('_id');
      const validUserIds = existingUsers.map(user => user._id);
      
      if (validUserIds.length === 0) {
        return next(ApiError.badRequest('Nenhum usuário válido encontrado'));
      }
      
      // Preparar documentos para inserção em massa
      const notifications = validUserIds.map(userId => ({
        user: userId,
        type,
        title,
        message,
        priority: priority || 'normal',
        action,
        expiresAt,
        references,
        createdAt: new Date()
      }));
      
      // Inserir notificações em massa
      const result = await Notification.insertMany(notifications);
      
      return res.status(201).json({
        success: true,
        message: 'Notificações criadas com sucesso',
        data: {
          totalCreated: result.length,
          totalRequested: userIds.length
        }
      });
    } catch (error) {
      logger.error(`Erro ao criar notificações em massa: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obter estatísticas de notificações (rota administrativa)
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async getNotificationStats(req, res, next) {
    try {
      // Esta rota deve ser protegida por middleware de autorização para admins
      logger.info('Buscando estatísticas de notificações');
      
      // Pipeline de agregação para estatísticas
      const stats = await Notification.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            readCount: {
              $sum: { $cond: ["$read", 1, 0] }
            },
            unreadCount: {
              $sum: { $cond: ["$read", 0, 1] }
            }
          }
        },
        {
          $project: {
            _id: 0,
            type: '$_id',
            count: 1,
            readCount: 1,
            unreadCount: 1,
            readPercentage: {
              $multiply: [
                { $divide: ["$readCount", "$count"] },
                100
              ]
            }
          }
        }
      ]);
      
      // Total por prioridade
      const priorityStats = await Notification.aggregate([
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            priority: '$_id',
            count: 1
          }
        }
      ]);
      
      // Total geral
      const totalStats = await Notification.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            readTotal: {
              $sum: { $cond: ["$read", 1, 0] }
            },
            unreadTotal: {
              $sum: { $cond: ["$read", 0, 1] }
            }
          }
        },
        {
          $project: {
            _id: 0,
            total: 1,
            readTotal: 1,
            unreadTotal: 1,
            readPercentage: {
              $multiply: [
                { $divide: ["$readTotal", "$total"] },
                100
              ]
            }
          }
        }
      ]);
      
      return res.status(200).json({
        success: true,
        message: 'Estatísticas de notificações recuperadas com sucesso',
        data: {
          byType: stats,
          byPriority: priorityStats,
          totals: totalStats[0] || { total: 0, readTotal: 0, unreadTotal: 0, readPercentage: 0 }
        }
      });
    } catch (error) {
      logger.error(`Erro ao buscar estatísticas de notificações: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new NotificationController(); 