import { MongoClient } from 'mongodb';

// Para desenvolvimento, podemos usar uma URI padrão caso não esteja definida
let uri: string;

if (!process.env.MONGODB_URI) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ MONGODB_URI não está definida nas variáveis de ambiente. Usando conexão de fallback para desenvolvimento.');
    uri = 'mongodb://localhost:27017/rpx-database';
  } else {
    console.error('❌ Erro crítico: MONGODB_URI não está definida nas variáveis de ambiente.');
    throw new Error('Por favor, defina a variável de ambiente MONGODB_URI');
  }
} else {
  uri = process.env.MONGODB_URI;
  console.log(`🔌 Usando URI do MongoDB: ${uri.substring(0, 15)}...`);
}

// Validar URI básica
if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
  console.error('❌ URI do MongoDB inválida. Deve começar com mongodb:// ou mongodb+srv://');
  throw new Error('URI do MongoDB inválida');
}

const options = {
  maxPoolSize: 10, // Maximum number of connections in the pool
  serverSelectionTimeoutMS: 5000, // How long to wait for server selection
  socketTimeoutMS: 30000, // How long a send/receive on a socket can take before timing out
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // No desenvolvimento, use uma variável global para que a conexão
  // seja mantida entre recarregamentos do servidor
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    console.log('🆕 Criando nova conexão MongoDB para ambiente de desenvolvimento...');
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect()
      .then(client => {
        console.log('✅ Conexão MongoDB estabelecida com sucesso para desenvolvimento');
        return client;
      })
      .catch(err => {
        console.error('❌ Erro ao conectar ao MongoDB:', err);
        throw err;
      });
  } else {
    console.log('♻️ Reusando conexão MongoDB existente para desenvolvimento');
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // Em produção, é melhor não usar uma variável global
  console.log('🔄 Iniciando conexão MongoDB para produção...');
  client = new MongoClient(uri, options);
  clientPromise = client.connect()
    .then(client => {
      console.log('✅ Conexão MongoDB estabelecida com sucesso para produção');
      return client;
    })
    .catch(err => {
      console.error('❌ Erro ao conectar ao MongoDB em produção:', err);
      throw err;
    });
}

// Função para conectar ao banco de dados
export async function connectToDatabase() {
  try {
    console.log('🔄 Tentando conectar ao MongoDB...');
    const client = await clientPromise;
    console.log('✅ Conexão com MongoDB estabelecida com sucesso');
    
    // Obter nome do banco do ambiente ou usar padrão
    const dbName = process.env.MONGODB_DB || 'rpx-database';
    console.log(`📦 Usando banco de dados: ${dbName}`);
    
    const db = client.db(dbName);
    return { client, db };
  } catch (error) {
    console.error('❌ Falha na conexão com MongoDB:', error);
    throw new Error(`Falha ao conectar ao banco de dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

export default clientPromise; 