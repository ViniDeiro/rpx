/**
 * Rotas de teste para a plataforma RPX
 * Apenas disponíveis em ambiente de desenvolvimento
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const notificationTestController = require('../controllers/test/notification.test.controller');

// Middleware para verificar se o ambiente é de desenvolvimento
const devOnlyMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      success: false,
      message: 'Estas rotas estão disponíveis apenas em ambiente de desenvolvimento'
    });
  }
  next();
};

// Aplicar middleware de ambiente de desenvolvimento em todas as rotas
router.use(devOnlyMiddleware);

// Aplicar middleware de autenticação para algumas rotas
// Para outras rotas de teste, deixamos sem autenticação para facilitar testes

// Rotas para testes de notificação
router.post('/notifications/single', authenticate, notificationTestController.generateSingleNotification);
router.post('/notifications/system', authenticate, authorize(['admin', 'developer']), notificationTestController.generateSystemNotification);
router.post('/notifications/multiple', authenticate, notificationTestController.generateMultipleNotifications);
router.delete('/notifications/user/:userId', authenticate, notificationTestController.cleanUserNotifications);
router.delete('/notifications/all', authenticate, authorize(['admin', 'developer']), notificationTestController.cleanAllNotifications);

module.exports = router; 