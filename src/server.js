/**
 * RPX Platform - Servidor principal
 * 
 * Este é o ponto de entrada da aplicação que inicia o servidor Express,
 * configura middlewares e conecta com o banco de dados MongoDB.
 */

const dotenv = require('dotenv');
// Carrega variáveis de ambiente antes de importar outros módulos
dotenv.config();

const app = require('./app');
const { connectDatabase } = require('./config/database');

const PORT = process.env.PORT || 3001;

// Função para conectar ao MongoDB e iniciar o servidor
const startServer = async () => {
  try {
    // Tenta conectar ao MongoDB
    const connected = await connectDatabase();
    
    // Inicia o servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
      console.log(`⚙️ Ambiente: ${process.env.NODE_ENV}`);
      
      if (!connected) {
        console.log('⚠️ Servidor iniciado sem conexão ao MongoDB');
      }
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
};

// Trata erros não capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não tratado:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Promessa rejeitada não tratada:', error);
});

// Inicia o servidor
startServer(); 