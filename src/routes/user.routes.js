const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { ApiError } = require('../middleware/errorHandler');
const User = require('../models/user.model');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

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
 * @route   POST /api/users/avatar
 * @desc    Fazer upload de avatar personalizado (usando data URL)
 * @access  Private
 */
router.post('/avatar', authenticate, async (req, res, next) => {
  try {
    // Verificar se a base64 da imagem foi enviada
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Dados da imagem não fornecidos'
      });
    }
    
    // Extrair o tipo de imagem e dados base64
    const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'Formato de dados de imagem inválido'
      });
    }
    
    // Verificar se é uma imagem
    const mimeType = matches[1];
    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'O arquivo enviado não é uma imagem'
      });
    }
    
    // Decodificar base64
    const imageBuffer = Buffer.from(matches[2], 'base64');
    
    // Verificar tamanho (máximo 2MB)
    if (imageBuffer.length > 2 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Imagem muito grande. O tamanho máximo permitido é 2MB'
      });
    }
    
    // Criar diretório de uploads se não existir
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Definir extensão baseada no MIME type
    let fileExt = '.jpg';
    if (mimeType === 'image/png') fileExt = '.png';
    if (mimeType === 'image/gif') fileExt = '.gif';
    if (mimeType === 'image/webp') fileExt = '.webp';
    
    // Gerar nome de arquivo único
    const fileName = `${req.user._id}-${Date.now()}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Salvar o arquivo
    fs.writeFileSync(filePath, imageBuffer);
    
    // URL relativa para acesso do frontend
    const avatarUrl = `/uploads/avatars/${fileName}`;
    
    // Atualizar o usuário com a URL do avatar
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    // Atualizar o avatar do usuário com a URL da imagem
    user.avatarUrl = avatarUrl;
    await user.save();
    
    // Preparar dados de usuário para resposta
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar, // Avatar de item/colecionável (mantido para compatibilidade)
      avatarUrl: user.avatarUrl, // URL do avatar personalizado
      banner: user.banner,
      balance: user.wallet ? user.wallet.balance : 0,
      roles: user.roles,
      level: user.level || 1,
      createdAt: user.createdAt
    };
    
    logger.info(`Upload de avatar realizado para o usuário: ${req.user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Avatar enviado com sucesso',
      avatarUrl: avatarUrl,
      user: userData
    });
  } catch (error) {
    logger.error(`Erro ao processar upload de avatar: ${error.message}`);
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
      avatarUrl: user.avatarUrl, // Incluir URL do avatar personalizado
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