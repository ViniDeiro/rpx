const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/notifications
 * @desc    Obter todas as notificações do usuário
 * @access  Private
 */
router.get('/', authenticate, notificationController.getNotifications);

/**
 * @route   GET /api/notifications/:notificationId
 * @desc    Obter uma notificação específica
 * @access  Private
 */
router.get('/:notificationId', authenticate, notificationController.getNotificationById);

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    Marcar uma notificação como lida
 * @access  Private
 */
router.put('/:notificationId/read', authenticate, notificationController.markAsRead);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Marcar todas as notificações como lidas
 * @access  Private
 */
router.put('/read-all', authenticate, notificationController.markAllAsRead);

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Excluir uma notificação
 * @access  Private
 */
router.delete('/:notificationId', authenticate, notificationController.deleteNotification);

/**
 * @route   DELETE /api/notifications
 * @desc    Excluir todas as notificações do usuário
 * @access  Private
 */
router.delete('/', authenticate, notificationController.deleteAllNotifications);

/**
 * Rotas administrativas
 */

/**
 * @route   POST /api/notifications/admin/create
 * @desc    Criar uma notificação para um usuário específico
 * @access  Private (Admin/Moderator)
 */
router.post(
  '/admin/create',
  authenticate,
  authorize(['admin', 'moderator']),
  notificationController.createNotification
);

/**
 * @route   POST /api/notifications/admin/bulk
 * @desc    Criar notificações para vários usuários
 * @access  Private (Admin/Moderator)
 */
router.post(
  '/admin/bulk',
  authenticate,
  authorize(['admin', 'moderator']),
  notificationController.createBulkNotifications
);

/**
 * @route   GET /api/notifications/admin/stats
 * @desc    Obter estatísticas de notificações
 * @access  Private (Admin)
 */
router.get(
  '/admin/stats',
  authenticate,
  authorize(['admin']),
  notificationController.getNotificationStats
);

module.exports = router; 