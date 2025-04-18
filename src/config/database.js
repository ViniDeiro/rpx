/**
 * Configuração do banco de dados MongoDB
 */

const mongoose = require('mongoose');

// Opções de conexão do MongoDB
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// Função para conectar ao MongoDB
const connectDatabase = async () => {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rpx-platform';
    await mongoose.connect(dbUri, mongoOptions);
    console.log('🍃 Conectado ao MongoDB com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    return false;
  }
};

module.exports = {
  connectDatabase,
}; 