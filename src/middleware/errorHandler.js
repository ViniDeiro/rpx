const logger = require('../utils/logger');

/**
 * Classe para erros da API
 */
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message) {
    return new ApiError(400, message);
  }

  static unauthorized(message = 'Não autorizado') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Acesso negado') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Recurso não encontrado') {
    return new ApiError(404, message);
  }

  static methodNotAllowed(message = 'Método não permitido') {
    return new ApiError(405, message);
  }

  static conflict(message) {
    return new ApiError(409, message);
  }

  static tooManyRequests(message = 'Muitas requisições, tente novamente mais tarde') {
    return new ApiError(429, message);
  }

  static internal(message = 'Erro interno do servidor') {
    return new ApiError(500, message, false);
  }
}

/**
 * Middleware para converter erros que não são instâncias de ApiError
 */
const errorConverter = (err, req, res, next) => {
  let error = err;
  
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Erro interno do servidor';
    error = new ApiError(statusCode, message, false, err.stack);
  }
  
  next(error);
};

/**
 * Middleware para manipular erros
 */
const errorHandler = (err, req, res, next) => {
  const { statusCode, message, isOperational, stack } = err;
  
  // Registrar erro
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.path} >> StatusCode: ${statusCode}, Message: ${message}\n${stack}`);
  } else {
    logger.warn(`[${req.method}] ${req.path} >> StatusCode: ${statusCode}, Message: ${message}`);
  }
  
  // Construir resposta de erro
  const response = {
    success: false,
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };
  
  // Enviar resposta
  res.status(statusCode).json(response);
};

module.exports = {
  ApiError,
  errorConverter,
  errorHandler
}; 