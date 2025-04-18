import mongoose from 'mongoose';
import { Db } from 'mongodb';

// Interface para simular uma Collection do MongoDB
interface MongoDBCollectionCompat {
  find: (query: any) => { toArray: () => Promise<any[]> };
  findOne: (query: any, options?: any) => Promise<any>;
  insertOne: (doc: any) => Promise<any>;
  updateOne: (filter: any, update: any) => Promise<any>;
  deleteOne: (filter: any) => Promise<any>;
  updateMany: (filter: any, update: any) => Promise<any>;
}

// Interface para simular o cliente MongoDB tradicional
interface MongoDBCompat {
  collection: (name: string) => MongoDBCollectionCompat;
}

// Interface para o retorno da função de conexão com o banco
interface DatabaseConnection {
  db: Db;
}

// Cache da conexão
let cachedConnection: mongoose.Connection | null = null;
let isConnected = false;

export async function connectToDatabase(): Promise<DatabaseConnection> {
  try {
    // Se já estamos conectados, retornar a conexão existente
    if (isConnected && mongoose.connection && mongoose.connection.readyState === 1) {
      console.log('Usando conexão MongoDB existente');
      return { 
        db: mongoose.connection.db as unknown as Db
      };
    }

    console.log('Estabelecendo nova conexão com MongoDB');
    
    // String de conexão Atlas
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vinideirolopess:c7MVBr6XpIkQwGaZ@cluster0.vocou4s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    if (!MONGODB_URI) {
      throw new Error('A URI do MongoDB não está definida no ambiente');
    }
    
    // Limpar conexões anteriores se estiverem em estado problemático
    if (mongoose.connection && mongoose.connection.readyState !== 1) {
      await mongoose.disconnect();
    }
    
    // Configurar opções do mongoose
    mongoose.set('strictQuery', false);
    
    // Conectar ao MongoDB com timeout de 10 segundos
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 segundos de timeout
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
    };
    
    // Tentar conexão
    await mongoose.connect(MONGODB_URI, options);
    
    // Verificar se a conexão está disponível
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      throw new Error('Falha ao conectar ao MongoDB: conexão não estabelecida');
    }
    
    if (!mongoose.connection.db) {
      throw new Error('Falha ao conectar ao MongoDB: db não disponível');
    }
    
    // Cache da conexão
    cachedConnection = mongoose.connection;
    isConnected = true;
    console.log('MongoDB conectado com sucesso');
    
    // Retornar a conexão real
    return {
      db: mongoose.connection.db as unknown as Db
    };
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    // Registrar o erro detalhado para troubleshooting
    if (error instanceof Error) {
      console.error('Detalhes do erro:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    // Importante: propagar o erro para que o chamador possa lidar com ele
    throw error;
  }
}

// Função para desconectar
export async function disconnectFromDatabase() {
  try {
    if (mongoose.connection) {
      await mongoose.disconnect();
      isConnected = false;
      cachedConnection = null;
      console.log('Desconectado do MongoDB');
    }
  } catch (error) {
    console.error('Erro ao desconectar do MongoDB:', error);
  }
}

// Função para verificar o status da conexão
export function getConnectionStatus() {
  return {
    isConnected,
    readyState: mongoose.connection ? mongoose.connection.readyState : 0,
    // 0: desconectado, 1: conectado, 2: conectando, 3: desconectando
  };
}

// Exportar funções para uso direto
export const db = { 
  connect: connectToDatabase, 
  disconnect: disconnectFromDatabase,
  status: getConnectionStatus
}; 