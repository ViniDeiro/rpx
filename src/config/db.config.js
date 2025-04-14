/**
 * Configuração do banco de dados - RPX Platform
 * 
 * Este arquivo contém as configurações necessárias para conectar ao MongoDB Atlas.
 * Em ambiente de desenvolvimento, as configurações são carregadas de .env.development
 * Em ambiente de produção, as configurações são carregadas de .env.production ou .env
 */

module.exports = {
  development: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rpx-platform-dev',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      poolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      useCreateIndex: true
    }
  },
  test: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rpx-platform-test',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      poolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      useCreateIndex: true
    }
  },
  production: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      poolSize: 50, // Mais conexões para prod
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      keepAlive: true,
      keepAliveInitialDelay: 300000, // 5 minutos
      useCreateIndex: true,
      retryWrites: true,
      w: 'majority' // Garantir que as escritas são confirmadas pela maioria dos nós
    }
  },
  
  // Para obter a configuração do ambiente atual
  getConfig: function() {
    const env = process.env.NODE_ENV || 'development';
    return this[env];
  },
  
  // Funções auxiliares para trabalhar com o banco de dados
  isValidObjectId: function(id) {
    const mongoose = require('mongoose');
    return mongoose.Types.ObjectId.isValid(id);
  },
  
  toObjectId: function(id) {
    const mongoose = require('mongoose');
    return mongoose.Types.ObjectId(id);
  }
}; 