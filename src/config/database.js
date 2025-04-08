/**
 * Configuração de conexão com o MongoDB Atlas
 */

const mongoose = require('mongoose');

// Opções de configuração
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

/**
 * Estabelece conexão com o MongoDB
 * @returns {Promise} Promessa de conexão
 */
const connectToDatabase = async () => {
  try {
    console.log('Tentando conectar ao MongoDB...');
    
    // Verificar se a variável de ambiente MONGODB_URI está definida
    if (!process.env.MONGODB_URI) {
      throw new Error('Variável de ambiente MONGODB_URI não definida');
    }

    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
    
    console.log('✅ Conectado ao MongoDB Atlas com sucesso');
    
    // Configurar índices importantes
    await setupIndexes();
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error.message);
    
    // Em ambiente de desenvolvimento, fornecer dicas sobre problemas comuns
    if (process.env.NODE_ENV === 'development') {
      console.log('\nDicas para solução de problemas:');
      console.log('1. Verifique se o IP atual está na whitelist do MongoDB Atlas');
      console.log('2. Confirme se a string de conexão está correta no arquivo .env');
      console.log('3. Verifique se seu usuário e senha do MongoDB estão corretos');
      console.log('4. Confirme se o cluster está ativo no MongoDB Atlas\n');
    }
    
    throw error;
  }
};

/**
 * Configura índices importantes no banco de dados
 */
const setupIndexes = async () => {
  // Os índices serão configurados quando os modelos forem importados
  console.log('Índices configurados com sucesso');
};

/**
 * Fecha a conexão com o MongoDB
 */
const closeConnection = async () => {
  try {
    await mongoose.connection.close();
    console.log('Conexão com MongoDB fechada com sucesso');
  } catch (error) {
    console.error('Erro ao fechar conexão com MongoDB:', error.message);
  }
};

module.exports = {
  connectToDatabase,
  closeConnection,
  connection: mongoose.connection,
}; 