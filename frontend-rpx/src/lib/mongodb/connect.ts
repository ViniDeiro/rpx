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
  stats: () => Promise<any>;
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
      console.log('⚙️ Usando conexão MongoDB existente');
        return { 
          db: mongoose.connection.db as unknown as Db
        };
    }

    console.log('🔄 Estabelecendo nova conexão com MongoDB');
    
    // Remover parâmetros adicionais que podem estar causando problemas
    // e adicionar parâmetros para lidar com problemas de ReplicaSetNoPrimary
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vinideirolopess:c7MVBr6XpIkQwGaZ@cluster0.vocou4s.mongodb.net/?retryWrites=true&w=majority';
    
    // Modificar a URI para incluir opções que aumentam a tolerância a falhas de ReplicaSet
    const modifiedUri = MONGODB_URI.includes('?') 
      ? `${MONGODB_URI}&readPreference=primaryPreferred&directConnection=false&retryReads=true&maxIdleTimeMS=150000&serverSelectionTimeoutMS=15000`
      : `${MONGODB_URI}?readPreference=primaryPreferred&directConnection=false&retryReads=true&maxIdleTimeMS=150000&serverSelectionTimeoutMS=15000`;
    
    if (!modifiedUri) {
      throw new Error('A URI do MongoDB não está definida no ambiente');
    }
    
    // Log seguro da URI (ocultando senha)
    const sanitizedUri = modifiedUri.replace(/\/\/(.*):(.*)@/, '//***:***@');
    console.log(`📡 Conectando ao MongoDB com preferência de leitura primaryPreferred: ${sanitizedUri}`);
    
    // Limpar conexões anteriores
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      console.log('🧹 Limpando conexões anteriores...');
      try {
        await mongoose.disconnect();
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (disconnectError) {
        console.warn('⚠️ Erro ao desconectar, prosseguindo mesmo assim:', disconnectError);
      }
    }
    
    // Configurar opções do mongoose
    mongoose.set('strictQuery', false);
    
    // Configurações otimizadas para lidar com problemas de ReplicaSetNoPrimary
    const options = {
      serverSelectionTimeoutMS: 15000,  // Aumentado para 15 segundos
      connectTimeoutMS: 10000,          // Mantido em 10 segundos
      socketTimeoutMS: 45000,           // Aumentado para 45 segundos
      maxPoolSize: 10,                  // Mantido em 10 conexões
      minPoolSize: 1,                   // Começar com 1 conexão
      retryWrites: true,                // Tentar reescrever operações que falharam
      retryReads: true,                 // Tentar reler operações que falharam
      heartbeatFrequencyMS: 10000,      // Verificar a saúde do cluster a cada 10 segundos
      family: 4,                        // Forçar IPv4
      readPreference: 'primaryPreferred' as const // Especificar como ReadPreferenceMode
    };
    
    console.log('🚀 Iniciando conexão com MongoDB...');
    
    // Adicionar manipuladores de eventos para monitorar a conexão
    mongoose.connection.on('connecting', () => {
      console.log('🔄 Conectando ao MongoDB...');
    });

    mongoose.connection.on('connected', () => {
      console.log('✅ Conectado ao MongoDB!');
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Desconectado do MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Erro na conexão MongoDB:', err);
      
      // Verificar se é um erro de ReplicaSetNoPrimary e logar informações adicionais
      if (err.message && err.message.includes('ReplicaSetNoPrimary')) {
        console.error('⚠️ Erro de ReplicaSetNoPrimary detectado. Tentando novamente com preferência de leitura secundária...');
      }
    });
    
    // Tente conectar com retry manual
    let connected = false;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!connected && attempts < maxAttempts) {
      attempts++;
      try {
        console.log(`🔄 Tentativa de conexão ${attempts}/${maxAttempts}...`);
        await mongoose.connect(modifiedUri, options);
        console.log('✅ Conectado ao MongoDB!');
        connected = true;
      } catch (connError: any) {
        console.error(`❌ Falha na tentativa ${attempts}:`, connError.message);
        
        // Verificar se é um erro de ReplicaSetNoPrimary
        if (connError.message && connError.message.includes('ReplicaSetNoPrimary')) {
          console.log('⚠️ Problema de ReplicaSetNoPrimary detectado, aguardando e tentando novamente...');
        }
        
        if (attempts === maxAttempts) {
          console.error('❌ Todas as tentativas falharam');
          throw connError;
        }
        
        // Esperar antes da próxima tentativa
        const delayMs = 2000 * attempts; // Aumentar o tempo de espera a cada tentativa
        console.log(`⏱️ Aguardando ${delayMs}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    // Cache da conexão
    cachedConnection = mongoose.connection;
    isConnected = true;
    
    // Retornar a conexão
    return {
      db: mongoose.connection.db as unknown as Db
    };
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    
    // Redefinir flags de conexão em caso de erro
    isConnected = false;
    cachedConnection = null;
    
    throw error; // Propagar o erro para ser tratado pelo chamador
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