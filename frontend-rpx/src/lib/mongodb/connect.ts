import mongoose from 'mongoose';

// Interface para simular uma Collection do MongoDB
interface MongoDBCollectionCompat {
  find: (query: any) => { toArray: () => Promise<any[]> };
  findOne: (query: any) => Promise<any>;
  insertOne: (doc: any) => Promise<any>;
  updateOne: (filter: any, update: any) => Promise<any>;
  deleteOne: (filter: any) => Promise<any>;
}

// Interface para simular o cliente MongoDB tradicional
interface MongoDBCompat {
  collection: (name: string) => MongoDBCollectionCompat;
}

// Cache da conexão
let isConnected = false;

export async function connectToDatabase() {
  try {
    // Se já estamos conectados, retornar a conexão existente
    if (isConnected && mongoose.connection && mongoose.connection.db) {
      console.log('Usando conexão MongoDB existente');
      return { 
        db: {
          collection: (name: string) => mongoose.connection.db!.collection(name)
        }
      };
    }

    console.log('Estabelecendo nova conexão com MongoDB');
    
    // String de conexão Atlas fixa
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vinideirolopess:c7MVBr6XpIkQwGaZ@cluster0.vocou4s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI não definida');
    }
    
    // Configurar opções do mongoose
    mongoose.set('strictQuery', false);
    
    // Conectar ao MongoDB
    await mongoose.connect(MONGODB_URI);
    
    // Verificar se a conexão foi estabelecida corretamente
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('Falha ao conectar ao MongoDB: connection.db não disponível');
    }
    
    isConnected = true;
    console.log('MongoDB conectado com sucesso');
    
    // Retornar objeto com método collection
    return {
      db: {
        collection: (name: string) => mongoose.connection.db!.collection(name)
      }
    };
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    // Em caso de erro, retornar um objeto simulado que não causa erros
    // mas vai falhar silenciosamente nas operações
    return {
      db: {
        collection: (name: string) => ({
          find: () => ({ 
            toArray: async () => [] 
          }),
          findOne: async () => null,
          insertOne: async () => ({ insertedId: null, acknowledged: false }),
          updateOne: async () => ({ matchedCount: 0, modifiedCount: 0, acknowledged: false }),
          deleteOne: async () => ({ deletedCount: 0, acknowledged: false })
        })
      }
    };
  }
}

export async function disconnectFromDatabase() {
  if (mongoose.connection) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('Desconectado do MongoDB');
  }
}

// Exportar funções para uso direto
export const db = { 
  connect: connectToDatabase, 
  disconnect: disconnectFromDatabase 
}; 