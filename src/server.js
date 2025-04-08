/**
 * Arquivo principal para iniciar o servidor
 */

require('dotenv').config();
console.log('Iniciando servidor RPX...');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { connectToDatabase } = require('./config/database');

console.log('Módulos carregados com sucesso.');

// Importar rotas
console.log('Carregando módulos de rotas...');
let authRoutes, matchesRoutes, betRoutes, tournamentRoutes, rankingsRoutes, storeRoutes, walletRoutes;
try {
  authRoutes = require('./routes/auth.routes');
  matchesRoutes = require('./routes/matches.routes');
  betRoutes = require('./routes/bet.routes');
  tournamentRoutes = require('./routes/tournaments.routes');
  rankingsRoutes = require('./routes/rankings.routes');
  storeRoutes = require('./routes/store.routes');
  walletRoutes = require('./routes/wallet.routes');
  console.log('Módulos de rotas carregados com sucesso.');
} catch (error) {
  console.error('Erro ao carregar módulos de rotas:', error);
}

// Importar serviços
console.log('Carregando serviços...');
let initCronJobs, setupSocketListeners;
try {
  const cronService = require('./services/cron.service');
  const socketService = require('./services/socket.service');
  initCronJobs = cronService.initCronJobs;
  setupSocketListeners = socketService.setupSocketListeners;
  console.log('Serviços carregados com sucesso.');
} catch (error) {
  console.error('Erro ao carregar serviços:', error);
  // Criar funções mock para evitar erros
  initCronJobs = () => console.log('Mock de initCronJobs chamado');
  setupSocketListeners = () => console.log('Mock de setupSocketListeners chamado');
}

// Configurações
const PORT = process.env.PORT || 3001;
console.log(`Porta configurada: ${PORT}`);
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
console.log('Express e Socket.IO configurados.');

// Configurar middlewares
app.use(helmet()); // Segurança
app.use(compression()); // Compressão de resposta
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002'], // Adicionar todas as portas possíveis do frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json()); // Parse JSON
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded
app.use(morgan('dev')); // Logging
console.log('Middlewares configurados.');

// Rate Limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW * 60 * 1000 || 15 * 60 * 1000, // 15 minutos por padrão
  max: process.env.RATE_LIMIT_MAX || 100, // limite de 100 requisições por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições, tente novamente mais tarde' }
});
app.use('/api/', limiter); // Aplicar rate limiting às rotas da API
console.log('Rate limiting configurado.');

// Servir arquivos estáticos do frontend em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend-rpx/out')));
}

// Rota básica para verificar se o servidor está rodando
app.get('/', (req, res) => {
  console.log('Requisição recebida na rota raiz!');
  res.send('RPX API está rodando!');
});
console.log('Rota raiz configurada.');

// Configurar rotas somente se elas foram carregadas corretamente
if (authRoutes) app.use('/api/auth', authRoutes);
if (matchesRoutes) app.use('/api/matches', matchesRoutes);
if (betRoutes) app.use('/api/bets', betRoutes);
if (tournamentRoutes) app.use('/api/tournaments', tournamentRoutes);
if (rankingsRoutes) app.use('/api/rankings', rankingsRoutes);
if (storeRoutes) app.use('/api/store', storeRoutes);
if (walletRoutes) app.use('/api/wallet', walletRoutes);
console.log('Rotas da API configuradas.');

// Rota para todas as outras requisições - serve o frontend
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend-rpx/out/index.html'));
  });
}

// Middleware de tratamento de erros
app.use(errorHandler);
console.log('Middleware de tratamento de erros configurado.');

// Configurar socket.io
try {
  console.log('Configurando Socket.IO...');
  setupSocketListeners(io);
  console.log('Socket.IO configurado com sucesso.');
} catch (error) {
  console.warn('Não foi possível inicializar o Socket.IO:', error.message);
}

// Lidar com sinais de encerramento
const shutdownGracefully = (signal) => {
  logger.info(`Recebido sinal ${signal}. Encerrando servidor...`);
  
  server.close(() => {
    logger.info('Servidor encerrado com sucesso');
    process.exit(0);
  });
  
  // Se demorar muito para fechar, forçar encerramento
  setTimeout(() => {
    logger.error('Não foi possível encerrar conexões a tempo, forçando saída');
    process.exit(1);
  }, 10000);
};

// Capturar sinais de encerramento
process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
process.on('SIGINT', () => shutdownGracefully('SIGINT'));

// Função para iniciar o servidor sem depender do MongoDB
const startServerWithoutMongoDB = () => {
  console.log('Iniciando servidor sem MongoDB...');
  server.listen(PORT, () => {
    logger.info(`🚀 Servidor rodando na porta ${PORT} (sem conexão com MongoDB)`);
    logger.warn('⚠️ O servidor está rodando sem conexão com o MongoDB. Algumas funcionalidades podem não estar disponíveis.');
    
    // Tentar iniciar tarefas agendadas
    try {
      console.log('Tentando iniciar tarefas agendadas...');
      initCronJobs();
      console.log('Tarefas agendadas iniciadas com sucesso.');
    } catch (error) {
      console.warn('Não foi possível iniciar tarefas agendadas:', error.message);
    }
  });
};

// Tentar conectar ao MongoDB, mas iniciar o servidor de qualquer forma
try {
  // Função autoexecutável assíncrona
  (async () => {
    try {
      await connectToDatabase();
      
      // Iniciar servidor
      server.listen(PORT, () => {
        logger.info(`🚀 Servidor rodando na porta ${PORT}`);
        logger.info(`API disponível em http://localhost:${PORT}`);
        
        // Iniciar tarefas agendadas
        console.log('Iniciando tarefas agendadas...');
        try {
          initCronJobs();
          console.log('Tarefas agendadas iniciadas com sucesso.');
        } catch (error) {
          console.warn('Não foi possível iniciar tarefas agendadas:', error.message);
        }
      });
    } catch (error) {
      console.error('❌ Erro ao conectar ao MongoDB:', error.message);
      console.log('Iniciando servidor sem MongoDB...');
      startServerWithoutMongoDB();
    }
  })();
} catch (error) {
  console.error('Erro ao iniciar o servidor:', error);
  startServerWithoutMongoDB();
}

// Tratar erros não tratados
process.on('unhandledRejection', (err) => {
  console.error('Erro não tratado:', err);
  // Não encerrar o servidor em ambiente de desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    server.close(() => process.exit(1));
  }
});

console.log('Configuração do servidor concluída.');
module.exports = server; 