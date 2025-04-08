/**
 * Utilitário para padronizar respostas da API
 */

const logger = require('./logger');

/**
 * Envia uma resposta de sucesso
 * @param {object} res - Objeto de resposta do Express
 * @param {object|array} data - Dados a serem enviados na resposta
 * @param {string} message - Mensagem descritiva da operação
 * @param {number} statusCode - Código HTTP (padrão: 200)
 */
const success = (res, data = null, message = 'Operação realizada com sucesso', statusCode = 200) => {
  logger.debug('Enviando resposta de sucesso', { statusCode, message });
  
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Envia uma resposta de erro
 * @param {object} res - Objeto de resposta do Express
 * @param {string} message - Mensagem de erro
 * @param {number} statusCode - Código HTTP (padrão: 400)
 * @param {object} errors - Objeto detalhando os erros
 */
const error = (res, message = 'Ocorreu um erro', statusCode = 400, errors = null) => {
  // Loga o erro para análise interna
  logger.error('Erro da API', { statusCode, message, errors });
  
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

/**
 * Resposta para recurso não encontrado
 * @param {object} res - Objeto de resposta do Express
 * @param {string} message - Mensagem personalizada
 */
const notFound = (res, message = 'Recurso não encontrado') => {
  return error(res, message, 404);
};

/**
 * Resposta para erro de validação
 * @param {object} res - Objeto de resposta do Express
 * @param {object} errors - Objeto com erros de validação
 * @param {string} message - Mensagem personalizada
 */
const validationError = (res, errors, message = 'Dados inválidos') => {
  return error(res, message, 422, errors);
};

/**
 * Resposta para erro de autenticação
 * @param {object} res - Objeto de resposta do Express
 * @param {string} message - Mensagem personalizada
 */
const unauthorized = (res, message = 'Não autorizado') => {
  return error(res, message, 401);
};

/**
 * Resposta para erro de permissão
 * @param {object} res - Objeto de resposta do Express
 * @param {string} message - Mensagem personalizada
 */
const forbidden = (res, message = 'Acesso negado') => {
  return error(res, message, 403);
};

/**
 * Resposta para erros internos do servidor
 * @param {object} res - Objeto de resposta do Express
 * @param {string} message - Mensagem personalizada
 * @param {Error} err - Objeto de erro para logging
 */
const serverError = (res, message = 'Erro interno do servidor', err = null) => {
  if (err) {
    logger.error('Erro interno do servidor', { 
      message: err.message, 
      stack: err.stack,
      code: err.code
    });
  }
  
  return error(res, message, 500);
};

module.exports = {
  success,
  error,
  notFound,
  validationError,
  unauthorized,
  forbidden,
  serverError
}; 