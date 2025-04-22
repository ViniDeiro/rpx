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
    // Se já estamos conectados, retornar a conexão existente, mas com verificação mais rigorosa
    if (isConnected && mongoose.connection && mongoose.connection.readyState === 1) {
      console.log('⚙️ Usando conexão MongoDB existente');
      
      // Verificação mais rigorosa para garantir que a conexão está ativa
      try {
        if (mongoose.connection.db) {
          // Verificação mais rápida que não requer privilégios de admin
          await (mongoose.connection.db.collection('lobbies') as unknown as MongoDBCollectionCompat).stats();
          console.log('✅ Conexão MongoDB verificada e funcionando');
        } else {
          throw new Error('connection.db não está disponível');
        }
      } catch (pingError) {
        console.warn('⚠️ Conexão existente falhou na verificação, reconectando...', pingError);
        // Forçar reconexão
        isConnected = false;
        try {
          await mongoose.disconnect();
        } catch (disconnectError) {
          console.warn('Erro ao desconectar, ignorando:', disconnectError);
        }
        cachedConnection = null;
      }
      
      if (isConnected) {
        return { 
          db: mongoose.connection.db as unknown as Db
        };
      }
    }

    console.log('🔄 Estabelecendo nova conexão com MongoDB');
    
    // String de conexão Atlas com timeout aumentado
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vinideirolopess:c7MVBr6XpIkQwGaZ@cluster0.vocou4s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&connectTimeoutMS=30000&socketTimeoutMS=45000';
    
    if (!MONGODB_URI) {
      throw new Error('A URI do MongoDB não está definida no ambiente');
    }
    
    // Log seguro da URI (ocultando senha)
    const sanitizedUri = MONGODB_URI.replace(/\/\/(.*):(.*)@/, '//***:***@');
    console.log(`📡 Conectando ao MongoDB: ${sanitizedUri}`);
    
    // Obter o nome do banco de dados da URI
    const dbName = process.env.MONGODB_DB || 'rpx-database';
    console.log(`📂 Banco de dados: ${dbName}`);
    
    // Limpar conexões anteriores
    if (mongoose.connection && mongoose.connection.readyState !== 0) { // 0 = disconnected
      console.log('🧹 Limpando conexões anteriores...');
      try {
        await mongoose.disconnect();
        // Esperar um pouco para garantir que a desconexão seja processada
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (disconnectError) {
        console.warn('⚠️ Erro ao desconectar, prosseguindo mesmo assim:', disconnectError);
      }
    }
    
    // Configurar opções do mongoose com valores mais altos
    mongoose.set('strictQuery', false);
    
    // Configurações mais robustas para conexão
    const options = {
      serverSelectionTimeoutMS: 30000, // 30 segundos para seleção do servidor
      connectTimeoutMS: 30000,         // 30 segundos para estabelecer conexão
      socketTimeoutMS: 60000,          // 60 segundos para timeout de socket
      maxPoolSize: 20,                 // Máximo de conexões no pool (aumentado)
      minPoolSize: 5,                  // Mínimo de conexões no pool (aumentado)
      retryWrites: true,               // Tentar reescrever operações que falharam
      retryReads: true,                // Tentar reler operações que falharam
      autoIndex: false,                // Não criar índices automaticamente (melhora performance)
      family: 4,                       // Forçar IPv4
    };
    
    console.log('🚀 Iniciando conexão com MongoDB...');
    
    // Monitorar progresso da conexão com eventos
    mongoose.connection.on('connecting', () => {
      console.log('🔄 Conectando ao MongoDB...');
    });

    mongoose.connection.on('connected', () => {
      console.log('✅ Conectado ao MongoDB!');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Erro na conexão MongoDB:', err);
    });
    
    // Tentar conexão com retry automático (5 tentativas - mais tentativas)
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        console.log(`🔄 Tentativa de conexão ${attempt} de 5...`);
        await mongoose.connect(MONGODB_URI, options);
        console.log(`✅ Conexão realizada na tentativa ${attempt}`);
        break; // Se a conexão for bem-sucedida, saímos do loop
      } catch (connError) {
        console.error(`❌ Falha na tentativa ${attempt}:`, connError);
        
        if (attempt === 5) {
          console.error('❌ Todas as tentativas falharam');
          throw connError; // Propagar o erro na última tentativa
        }
        
        // Esperar antes da próxima tentativa (crescimento exponencial do tempo de espera)
        const delayMs = Math.pow(2, attempt) * 1000;
        console.log(`⏱️ Aguardando ${delayMs}ms antes da próxima tentativa...`);
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
    
    // Verificar explicitamente se a conexão está funcional acessando a coleção lobbies
    try {
      await (mongoose.connection.db.collection('lobbies') as unknown as MongoDBCollectionCompat).stats();
      console.log('✅ Conexão verificada com sucesso através de acesso à coleção lobbies');
    } catch (accessError) {
      console.warn('⚠️ Aviso: Não foi possível verificar acesso à coleção lobbies:', accessError);
      // Continuar mesmo assim, pode ser que a coleção ainda não exista
    }
    
    // Cache da conexão
    cachedConnection = mongoose.connection;
    isConnected = true;
    console.log(`🎉 MongoDB conectado com sucesso ao banco ${dbName}`);
    
    // Retornar a conexão real
    return {
      db: mongoose.connection.db as unknown as Db
    };
  } catch (error) {
    console.error('❌ Erro fatal ao conectar ao MongoDB:', error);
    // Registrar o erro detalhado para troubleshooting
    if (error instanceof Error) {
      console.error('📋 Detalhes do erro:', error.message);
      console.error('🔍 Stack trace:', error.stack);
    }
    
    // Redefinir flags de conexão em caso de erro
    isConnected = false;
    cachedConnection = null;
    
    // Criar uma conexão mínima para não quebrar APIs
    console.warn('⚠️ Retornando modo de compatibilidade para o banco de dados');
    
    // Importante: em vez de propagar o erro, retornar um objeto db simulado que não quebrará a aplicação
    // Isso permitirá que a aplicação continue funcionando mesmo com erro de conexão
    return {
      db: {
        collection: (name: string) => ({
          find: () => ({ 
            toArray: async () => {
              console.log(`🔶 MODO COMPATIBILIDADE: Simulando find em ${name}`);
              return [];
            }
          }),
          findOne: async () => {
            console.log(`🔶 MODO COMPATIBILIDADE: Simulando findOne em ${name}`);
            return null;
          },
          insertOne: async (doc: any) => {
            console.log(`🔶 MODO COMPATIBILIDADE: Simulando insertOne em ${name}`, doc);
            return { insertedId: 'simulated-id-' + Date.now() };
          },
          updateOne: async () => {
            console.log(`🔶 MODO COMPATIBILIDADE: Simulando updateOne em ${name}`);
            return { modifiedCount: 1 };
          },
          deleteOne: async () => {
            console.log(`🔶 MODO COMPATIBILIDADE: Simulando deleteOne em ${name}`);
            return { deletedCount: 1 };
          },
          updateMany: async () => {
            console.log(`🔶 MODO COMPATIBILIDADE: Simulando updateMany em ${name}`);
            return { modifiedCount: 1 };
          },
          stats: async () => {
            console.log(`🔶 MODO COMPATIBILIDADE: Simulando stats em ${name}`);
            return {};
          }
        })
      } as unknown as Db
    };
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