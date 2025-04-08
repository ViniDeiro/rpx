/**
 * Utilitário para gerenciamento de tokens JWT
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('./logger');

// Configurações
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || '15m';
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || '7d';
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_jwt_secreta';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'sua_refresh_chave_secreta';

/**
 * Gera um token de acesso JWT
 * @param {Object} payload - Dados a serem incluídos no token
 * @returns {String} Token JWT assinado
 */
const generateAccessToken = (payload) => {
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
  } catch (error) {
    logger.error('Erro ao gerar access token', { error: error.message });
    throw new Error('Erro ao gerar token de acesso');
  }
};

/**
 * Gera um token de atualização (refresh token)
 * @param {Object} payload - Dados a serem incluídos no token
 * @returns {String} Refresh token assinado
 */
const generateRefreshToken = (payload) => {
  try {
    // Adiciona um identificador único ao refresh token
    const refreshPayload = { 
      ...payload,
      tokenId: crypto.randomBytes(16).toString('hex')
    };
    
    return jwt.sign(refreshPayload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES });
  } catch (error) {
    logger.error('Erro ao gerar refresh token', { error: error.message });
    throw new Error('Erro ao gerar token de atualização');
  }
};

/**
 * Verifica e decodifica um token de acesso
 * @param {String} token - Token JWT a ser verificado
 * @returns {Object} Payload decodificado ou null se inválido
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.info('Token de acesso expirado');
      return { expired: true };
    }
    
    logger.error('Erro ao verificar access token', { error: error.message });
    return null;
  }
};

/**
 * Verifica e decodifica um token de atualização
 * @param {String} token - Refresh token a ser verificado
 * @returns {Object} Payload decodificado ou null se inválido
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.info('Token de atualização expirado');
      return { expired: true };
    }
    
    logger.error('Erro ao verificar refresh token', { error: error.message });
    return null;
  }
};

/**
 * Gera um novo par de tokens a partir de um refresh token válido
 * @param {String} refreshToken - Refresh token atual
 * @returns {Object} Novo par de tokens ou null se o refresh token for inválido
 */
const refreshTokens = (refreshToken) => {
  const decoded = verifyRefreshToken(refreshToken);
  
  if (!decoded || decoded.expired) {
    return null;
  }
  
  // Remove o tokenId para gerar um novo
  const { tokenId, ...payload } = decoded;
  
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshTokens
}; 