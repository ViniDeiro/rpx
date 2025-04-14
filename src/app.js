/**
 * Arquivo principal da aplicação
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const { connectDB } = require('./config/database');
const { errorMiddleware } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { setupSwagger } = require('./utils/swagger');
const { apiVersion } = require('./middleware/apiVersion');

// Rotas
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const matchRoutes = require('./routes/match.routes');
const betRoutes = require('./routes/bet.routes');
const walletRoutes = require('./routes/wallet.routes');
const teamRoutes = require('./routes/team.routes');
const tournamentRoutes = require('./routes/tournament.routes');
const rankingRoutes = require('./routes/rankings.routes');
const notificationRoutes = require('./routes/notification.routes');
// Rotas de teste (apenas em desenvolvimento)
const testRoutes = require('./routes/test.routes');

// Inicializar aplicação Express
const app = express();

// Conectar ao banco de dados
connectDB();

// Configurar middlewares
app.use(helmet()); // Segurança
app.use(cors()); // CORS
app.use(express.json({ limit: '1mb' })); // Parser JSON
app.use(express.urlencoded({ extended: true, limit: '1mb' })); // Parser URL encoded
app.use(compression()); // Compressão

// Servir arquivos estáticos de uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logging de requisições HTTP
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.http(message.trim())
    }
  }));
}

// Limitar taxa de requisições
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite por IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Taxa de requisições excedida por ${req.ip}`);
    res.status(429).json({
      success: false, 
      message: 'Muitas requisições, tente novamente mais tarde'
    });
  }
});

// Aplicar middleware de versionamento apenas para rotas da API
app.use('/api', apiVersion);

// Rota básica
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'online',
    message: 'API RPX Platform - v1.0.0',
    docs: '/api/docs'
  });
});

// Verificação de saúde
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Aplicar limitador de taxa apenas para rotas API
app.use('/api', apiLimiter);

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/bets', betRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/notifications', notificationRoutes);

// Rotas de teste (apenas em ambiente de desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  logger.info('Rotas de teste habilitadas - APENAS PARA DESENVOLVIMENTO');
  app.use('/api/test', testRoutes);
}

// Após a definição das rotas e antes do handler de erros
// Configurar documentação da API com Swagger
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DOCS === 'true') {
  setupSwagger(app);
}

// Rota 404 para rotas não existentes
app.use('*', (req, res) => {
  logger.warn(`Tentativa de acesso a rota inexistente: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Recurso não encontrado'
  });
});

// Middleware de tratamento de erros
app.use(errorMiddleware);

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error('Erro não tratado:', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promessa rejeitada não tratada:', { reason: reason?.message || reason, stack: reason?.stack });
});

// Exportar aplicação
module.exports = app; 