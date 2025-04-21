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
      
      // Verificação adicional para garantir que a conexão ainda é válida
      try {
        // Tentar uma operação leve para verificar se a conexão está realmente ativa
        if (mongoose.connection.db) {
          await mongoose.connection.db.admin().ping();
          console.log('✅ Conexão MongoDB verificada e funcionando');
        } else {
          throw new Error('connection.db não está disponível');
        }
      } catch (pingError) {
        console.warn('⚠️ Conexão existente falhou no ping, reconectando...', pingError);
        // Forçar reconexão
        isConnected = false;
        await mongoose.disconnect();
        cachedConnection = null;
      }
      
      if (isConnected) {
        return { 
          db: mongoose.connection.db as unknown as Db
        };
      }
    }

    console.log('Estabelecendo nova conexão com MongoDB');
    
    // String de conexão Atlas
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vinideirolopess:c7MVBr6XpIkQwGaZ@cluster0.vocou4s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    if (!MONGODB_URI) {
      throw new Error('A URI do MongoDB não está definida no ambiente');
    }
    
    // Log seguro da URI (ocultando senha)
    const sanitizedUri = MONGODB_URI.replace(/\/\/(.*):(.*)@/, '//***:***@');
    console.log(`📡 Conectando ao MongoDB: ${sanitizedUri}`);
    
    // Obter o nome do banco de dados da URI
    const dbName = process.env.MONGODB_DB || 'rpx-database';
    console.log(`📂 Banco de dados: ${dbName}`);
    
    // Limpar conexões anteriores se estiverem em estado problemático
    if (mongoose.connection && mongoose.connection.readyState !== 1) {
      console.log('Limpando conexões anteriores...');
      await mongoose.disconnect();
    }
    
    // Configurar opções do mongoose
    mongoose.set('strictQuery', false);
    
    // Configurações mais robustas para conexão
    const options = {
      serverSelectionTimeoutMS: 15000, // 15 segundos para seleção do servidor
      connectTimeoutMS: 15000,         // 15 segundos para estabelecer conexão
      socketTimeoutMS: 45000,          // 45 segundos para timeout de socket
      maxPoolSize: 10,                 // Máximo de conexões no pool
      minPoolSize: 2,                  // Mínimo de conexões no pool
      retryWrites: true,               // Tentar reescrever operações que falharam
      retryReads: true,                // Tentar reler operações que falharam
    };
    
    console.log('Iniciando conexão com MongoDB...');
    
    // Monitorar progresso da conexão com eventos
    mongoose.connection.on('connecting', () => {
      console.log('Conectando ao MongoDB...');
    });

    mongoose.connection.on('connected', () => {
      console.log('Conectado ao MongoDB!');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Erro na conexão MongoDB:', err);
    });
    
    // Tentar conexão com retry automático (3 tentativas)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Tentativa de conexão ${attempt} de 3...`);
        await mongoose.connect(MONGODB_URI, options);
        break; // Se a conexão for bem-sucedida, saímos do loop
      } catch (connError) {
        console.error(`Falha na tentativa ${attempt}:`, connError);
        
        if (attempt === 3) {
          throw connError; // Propagar o erro na última tentativa
        }
        
        // Esperar antes da próxima tentativa (crescimento exponencial do tempo de espera)
        const delayMs = Math.pow(2, attempt) * 1000;
        console.log(`Aguardando ${delayMs}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
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
    console.log(`MongoDB conectado com sucesso ao banco ${dbName}`);
    
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
    
    // Redefinir flags de conexão em caso de erro
    isConnected = false;
    cachedConnection = null;
    
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