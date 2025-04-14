/**
 * Middleware de autenticação e autorização com JWT e refresh tokens
 */

const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');
const User = require('../models/user.model');

// Configurações de JWT
const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-aqui';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-token-chave-secreta';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

/**
 * Middleware para verificar se o usuário está autenticado usando JWT
 */
const authenticate = async (req, res, next) => {
  try {
    // Verificar se o token está no header de autorização
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(ApiError.unauthorized('Token de autenticação não fornecido'));
    }
    
    // Extrair o token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next(ApiError.unauthorized('Token de autenticação inválido'));
    }
    
    try {
      // Verificar e decodificar o token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Buscar usuário pelo ID decodificado do token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(ApiError.unauthorized('Usuário não encontrado'));
      }
      
      // Adicionar usuário ao request para uso posterior
      req.user = user;
      
      next();
    } catch (error) {
      // Verificar se o erro é de expiração do token
      if (error.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Token expirado. Por favor, faça login novamente'));
      }
      
      return next(ApiError.unauthorized('Token inválido. Por favor, faça login novamente'));
    }
  } catch (error) {
    return next(ApiError.internal('Erro ao autenticar usuário'));
  }
};

/**
 * Middleware para gerar um novo token de acesso usando refresh token
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return next(ApiError.badRequest('Refresh token não fornecido'));
    }
    
    try {
      // Verificar e decodificar o refresh token
      const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
      
      // Buscar usuário pelo ID decodificado do token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(ApiError.unauthorized('Usuário não encontrado'));
      }
      
      // Verificar se o refresh token está na lista de tokens válidos do usuário
      const isValidToken = user.refreshTokens && user.refreshTokens.includes(refreshToken);
      
      if (!isValidToken) {
        return next(ApiError.unauthorized('Refresh token inválido ou revogado'));
      }
      
      // Gerar novo token de acesso
      const newAccessToken = jwt.sign({ id: user._id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
      });
      
      // Retornar novo token de acesso
      return res.status(200).json({
        success: true,
        accessToken: newAccessToken
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Refresh token expirado. Por favor, faça login novamente'));
      }
      
      return next(ApiError.unauthorized('Refresh token inválido. Por favor, faça login novamente'));
    }
  } catch (error) {
    return next(ApiError.internal('Erro ao gerar novo token de acesso'));
  }
};

/**
 * Middleware para verificar se o usuário tem as permissões necessárias
 * @param {Array} allowedRoles - Array com os papéis permitidos
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    // Se não há usuário no request, não está autenticado
    if (!req.user) {
      return next(ApiError.unauthorized('Usuário não autenticado'));
    }
    
    // Se não há papéis requeridos, permite acesso
    if (allowedRoles.length === 0) {
      return next();
    }
    
    // Verifica se o usuário tem pelo menos um dos papéis permitidos
    const hasRole = req.user.roles && req.user.roles.some(role => allowedRoles.includes(role));
    
    if (!hasRole) {
      return next(ApiError.forbidden('Acesso negado. Permissões insuficientes.'));
    }
    
    next();
  };
};

/**
 * Middleware para verificar se o usuário é administrador
 */
const isAdmin = (req, res, next) => {
  // Primeiro verificar se o usuário está autenticado
  authenticate(req, res, (err) => {
    if (err) {
      return next(err);
    }
    
    // Verificar se o usuário tem o papel de administrador (verificando tanto roles quanto role)
    const isAdminUser = 
      (req.user?.roles && Array.isArray(req.user.roles) && req.user.roles.includes('admin')) || // Verificar pelo array roles
      req.user?.role === 'admin'; // Verificar pelo campo role
    
    if (!isAdminUser) {
      console.log('Autorização negada. Dados do usuário:', {
        id: req.user?._id,
        roles: req.user?.roles,
        role: req.user?.role
      });
      return next(ApiError.forbidden('Acesso negado. É necessário ser administrador.'));
    }
    
    next();
  });
};

/**
 * Utilitário para gerar token JWT
 * @param {Object} user - Objeto do usuário
 * @returns {Object} Objeto com token e refresh token
 */
const generateTokens = (user) => {
  // Gerar token JWT
  const token = jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
  
  // Gerar refresh token
  const refreshToken = jwt.sign({ id: user._id }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  });
  
  return { token, refreshToken };
};

/**
 * Middleware para revogar refresh token
 */
const revokeRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return next(ApiError.badRequest('Refresh token não fornecido'));
    }
    
    try {
      // Verificar e decodificar o refresh token
      const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
      
      // Buscar usuário pelo ID decodificado do token
      const user = await User.findById(decoded.id);
      
      if (!user || !user.refreshTokens) {
        return next(ApiError.unauthorized('Usuário não encontrado ou sem tokens válidos'));
      }
      
      // Remover o refresh token da lista
      user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
      
      // Salvar o usuário atualizado
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      // Mesmo com erro no token, consideramos o logout bem-sucedido
      return res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    }
  } catch (error) {
    return next(ApiError.internal('Erro ao processar logout'));
  }
};

module.exports = {
  authenticate,
  authorize,
  refreshToken,
  generateTokens,
  revokeRefreshToken,
  isAdmin,
  JWT_SECRET,
  REFRESH_TOKEN_SECRET,
  JWT_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN
}; 