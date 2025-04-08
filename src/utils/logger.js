/**
 * Utilitário de log para o sistema
 */

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, splat } = format;
const fs = require('fs');
const path = require('path');

// Criar diretório de logs se não existir
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Formato de log customizado
const myFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length 
    ? `\n${JSON.stringify(meta, null, 2)}` 
    : '';
  
  return `${timestamp} [${level}]: ${message}${metaStr}`;
});

// Configuração do logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    splat(),
    myFormat
  ),
  defaultMeta: { service: 'rpx-platform' },
  transports: [
    // Log de erros para arquivo
    new transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Log combinado para arquivo
    new transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Adicionar log para console em ambiente de desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'HH:mm:ss' }),
      splat(),
      myFormat
    )
  }));
}

// Funções de log com contexto
const logWithContext = (level) => (message, context = {}) => {
  logger.log(level, message, context);
};

// Exportar funções específicas para cada nível
module.exports = {
  error: logWithContext('error'),
  warn: logWithContext('warn'),
  info: logWithContext('info'),
  http: logWithContext('http'),
  verbose: logWithContext('verbose'),
  debug: logWithContext('debug'),
  silly: logWithContext('silly'),
  // Função para criar logger de contexto específico
  createContextLogger: (defaultContext = {}) => {
    return {
      error: (message, context = {}) => logger.error(message, { ...defaultContext, ...context }),
      warn: (message, context = {}) => logger.warn(message, { ...defaultContext, ...context }),
      info: (message, context = {}) => logger.info(message, { ...defaultContext, ...context }),
      http: (message, context = {}) => logger.http(message, { ...defaultContext, ...context }),
      verbose: (message, context = {}) => logger.verbose(message, { ...defaultContext, ...context }),
      debug: (message, context = {}) => logger.debug(message, { ...defaultContext, ...context }),
      silly: (message, context = {}) => logger.silly(message, { ...defaultContext, ...context })
    };
  }
}; 