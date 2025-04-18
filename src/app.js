/**
 * Configuração do Express
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

// Importar rotas
const authRoutes = require('./routes/auth.routes');

// Criar aplicação Express
const app = express();

// Configurar middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(compression());

// Configurar logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Configurar rotas
app.use('/api/auth', authRoutes);

// Rota de verificação de saúde
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Middleware para tratamento de erro 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Middleware para tratamento de erros globais
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app; 