/**
 * Configuração para testes automatizados
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../app');

// Variáveis globais para testes
let mongoServer;

// Configuração antes de todos os testes
beforeAll(async () => {
  // Iniciar MongoDB em memória para testes
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Conectar ao MongoDB em memória
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  console.log(`Conectado ao MongoDB em memória em: ${mongoUri}`);
});

// Limpar coleções após cada teste
afterEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Fechar conexões após todos os testes
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
  
  console.log('Conexão com MongoDB em memória fechada');
});

// Função auxiliar para criar usuário de teste
const createTestUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Usuário Teste',
    email: 'teste@example.com',
    password: 'Senha123@',
    username: 'usuarioteste',
    role: 'user'
  };
  
  const user = { ...defaultUser, ...userData };
  
  const response = await request(app)
    .post('/api/auth/register')
    .send(user);
  
  return response.body.data;
};

// Função auxiliar para login
const loginUser = async (credentials) => {
  const response = await request(app)
    .post('/api/auth/login')
    .send(credentials);
  
  return response.body.data;
};

// Exportar funções auxiliares
module.exports = {
  createTestUser,
  loginUser,
  app
}; 