const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { ApiError } = require('../middleware/errorHandler');
const User = require('../models/user.model');
const logger = require('../utils/logger');

/**
 * @route   PUT /api/users/customization
 * @desc    Atualizar customizações do usuário (avatar ou banner)
 * @access  Private
 */
router.put('/customization', authenticate, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { type, itemId } = req.body;

    // Validar tipo de customização
    if (!type || !['avatar', 'banner'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de customização inválido'
      });
    }

    // Validar ID do item
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'ID do item é obrigatório'
      });
    }

    logger.info(`Atualizando ${type} do usuário: ${userId} para ${itemId}`);

    // Buscar o usuário
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Atualizar o campo apropriado
    if (type === 'avatar') {
      user.avatar = itemId;
    } else if (type === 'banner') {
      // Adicionar o campo banner ao usuário se não existir
      user.banner = itemId;
    }

    // Salvar as alterações
    await user.save();

    // Retornar dados atualizados do usuário
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      banner: user.banner,
      balance: user.wallet ? user.wallet.balance : 0,
      roles: user.roles,
      level: user.level || 1,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      message: `${type === 'avatar' ? 'Avatar' : 'Banner'} atualizado com sucesso`,
      user: userData
    });
  } catch (error) {
    logger.error(`Erro ao atualizar customização: ${error.message}`);
    next(error);
  }
});

/**
 * @route   GET /api/users/profile
 * @desc    Obter perfil do usuário
 * @access  Private
 */
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Buscar o usuário
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Retornar dados do usuário
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      banner: user.banner,
      balance: user.wallet ? user.wallet.balance : 0,
      roles: user.roles,
      level: user.level || 1,
      createdAt: user.createdAt
    };
    
    res.status(200).json({
      success: true,
      data: {
        user: userData
      }
    });
  } catch (error) {
    logger.error(`Erro ao obter perfil: ${error.message}`);
    next(error);
  }
});

module.exports = router; 