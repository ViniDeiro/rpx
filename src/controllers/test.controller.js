/**
 * Controlador de testes para a plataforma RPX
 * Usado apenas em ambiente de desenvolvimento para testar recursos específicos
 * NÃO DEVE ser utilizado em produção
 */

const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const NotificationService = require('../utils/notificationService');
const logger = require('../utils/logger');
const { isValidObjectId } = require('mongoose');

// Verificar ambiente para garantir que essas rotas só funcionem em desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Gera uma notificação de teste para um usuário específico
 * @param {*} req 
 * @param {*} res 
 */
exports.generateTestNotification = async (req, res) => {
  // Bloquear em ambiente de produção
  if (!isDevelopment) {
    return res.status(403).json({
      success: false,
      message: 'Este endpoint está disponível apenas em ambiente de desenvolvimento'
    });
  }

  try {
    const { userId, type, title, message, priority, actions } = req.body;

    // Validar campos obrigatórios
    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: userId, type, title, message'
      });
    }

    // Validar ID do usuário
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuário inválido'
      });
    }

    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Criar notificação
    const notification = await NotificationService.sendToUser({
      userId,
      type,
      title,
      message,
      priority: priority || 'normal',
      actions
    });

    return res.status(201).json({
      success: true,
      message: 'Notificação de teste gerada com sucesso',
      data: { notification }
    });
  } catch (error) {
    logger.error('Erro ao gerar notificação de teste:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar notificação de teste',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Gera uma notificação de sistema para todos os usuários
 * @param {*} req 
 * @param {*} res 
 */
exports.generateSystemNotification = async (req, res) => {
  // Bloquear em ambiente de produção
  if (!isDevelopment) {
    return res.status(403).json({
      success: false,
      message: 'Este endpoint está disponível apenas em ambiente de desenvolvimento'
    });
  }

  try {
    const { title, message, priority, role, excludeIds } = req.body;

    // Validar campos obrigatórios
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: title, message'
      });
    }

    // Validar IDs de exclusão, se fornecidos
    if (excludeIds && !Array.isArray(excludeIds)) {
      return res.status(400).json({
        success: false,
        message: 'excludeIds deve ser um array'
      });
    }

    // Enviar notificação do sistema
    const result = await NotificationService.broadcastSystemNotification({
      title,
      message,
      priority: priority || 'normal',
      role: role || 'user',
      excludeIds: excludeIds || []
    });

    return res.status(201).json({
      success: true,
      message: 'Notificação do sistema enviada com sucesso',
      data: { 
        usersNotified: result.count,
        notificationId: result.notificationId 
      }
    });
  } catch (error) {
    logger.error('Erro ao enviar notificação do sistema:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao enviar notificação do sistema',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Gera múltiplas notificações de teste para um usuário
 * @param {*} req 
 * @param {*} res 
 */
exports.generateMultipleTestNotifications = async (req, res) => {
  // Bloquear em ambiente de produção
  if (!isDevelopment) {
    return res.status(403).json({
      success: false,
      message: 'Este endpoint está disponível apenas em ambiente de desenvolvimento'
    });
  }

  try {
    const { userId, count = 5 } = req.body;

    // Validar campos obrigatórios
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Campo obrigatório: userId'
      });
    }

    // Validar ID do usuário
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuário inválido'
      });
    }

    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Limitar número máximo de notificações
    const notificationCount = Math.min(count, 20);

    // Tipos possíveis de notificação para testes
    const notificationTypes = [
      'system_announcement',
      'match_invitation',
      'match_result',
      'match_dispute',
      'deposit_received',
      'withdrawal_processed',
      'email_verified',
      'account_update'
    ];

    // Criar notificações
    const notifications = [];
    for (let i = 0; i < notificationCount; i++) {
      const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const priority = Math.random() > 0.8 ? 'high' : Math.random() > 0.5 ? 'normal' : 'low';
      
      let title, message, actions;
      
      switch (type) {
        case 'system_announcement':
          title = 'Anúncio do sistema';
          message = `Este é um anúncio de teste #${i + 1} para desenvolvimento`;
          break;
        case 'match_invitation':
          title = 'Convite para partida';
          message = `Você foi convidado para uma partida de teste #${i + 1}`;
          actions = [
            { type: 'navigate', target: '/matches/test-match-id', label: 'Ver partida' }
          ];
          break;
        case 'match_result':
          title = 'Resultado da partida';
          message = `O resultado da sua partida de teste #${i + 1} foi registrado`;
          actions = [
            { type: 'navigate', target: '/matches/results/test-match-id', label: 'Ver resultado' }
          ];
          break;
        case 'match_dispute':
          title = 'Disputa aberta';
          message = `Uma disputa foi aberta para sua partida de teste #${i + 1}`;
          priority = 'high';
          break;
        case 'deposit_received':
          title = 'Depósito recebido';
          message = `Seu depósito de teste #${i + 1} de R$ ${(Math.random() * 100).toFixed(2)} foi processado`;
          actions = [
            { type: 'navigate', target: '/wallet', label: 'Ver carteira' }
          ];
          break;
        case 'withdrawal_processed':
          title = 'Saque processado';
          message = `Seu saque de teste #${i + 1} de R$ ${(Math.random() * 100).toFixed(2)} foi processado`;
          break;
        case 'email_verified':
          title = 'Email verificado';
          message = 'Parabéns! Seu email foi verificado com sucesso';
          break;
        case 'account_update':
          title = 'Conta atualizada';
          message = `Sua conta foi atualizada: teste #${i + 1}`;
          break;
      }
      
      // Criar com atraso para ter timestamps diferentes
      const delay = i * 50;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const notification = await NotificationService.sendToUser({
        userId,
        type,
        title,
        message,
        priority,
        actions
      });
      
      notifications.push(notification);
    }

    return res.status(201).json({
      success: true,
      message: `${notificationCount} notificações de teste geradas com sucesso`,
      data: { notifications }
    });
  } catch (error) {
    logger.error('Erro ao gerar múltiplas notificações de teste:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar múltiplas notificações de teste',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Limpa todas as notificações de teste de um usuário
 * @param {*} req 
 * @param {*} res 
 */
exports.cleanTestNotifications = async (req, res) => {
  // Bloquear em ambiente de produção
  if (!isDevelopment) {
    return res.status(403).json({
      success: false,
      message: 'Este endpoint está disponível apenas em ambiente de desenvolvimento'
    });
  }

  try {
    const { userId } = req.params;

    // Validar ID do usuário
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuário inválido'
      });
    }

    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Excluir todas as notificações do usuário
    const result = await Notification.deleteMany({ userId });

    return res.status(200).json({
      success: true,
      message: 'Notificações de teste excluídas com sucesso',
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    logger.error('Erro ao limpar notificações de teste:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao limpar notificações de teste',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Limpa todas as notificações de teste do sistema
 * @param {*} req 
 * @param {*} res 
 */
exports.cleanAllTestNotifications = async (req, res) => {
  // Bloquear em ambiente de produção
  if (!isDevelopment) {
    return res.status(403).json({
      success: false,
      message: 'Este endpoint está disponível apenas em ambiente de desenvolvimento'
    });
  }

  try {
    // Excluir todas as notificações
    const result = await Notification.deleteMany({});

    return res.status(200).json({
      success: true,
      message: 'Todas as notificações de teste excluídas com sucesso',
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    logger.error('Erro ao limpar todas as notificações de teste:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao limpar todas as notificações de teste',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 