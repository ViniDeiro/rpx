import mongoose from 'mongoose';

// Interface para o cache da conexão
interface MongooseConnection {
  conn: mongoose.Mongoose | null;
  promise: Promise<mongoose.Mongoose> | null;
}

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

// Variável global para manter a conexão entre recarregamentos da API
declare global {
  var mongoose: MongooseConnection | undefined;
}

let cached: MongooseConnection = global.mongoose || { conn: null, promise: null };

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Função para criar um objeto de compatibilidade com MongoDB nativo
function createMongoDBCompat(mongooseInstance: mongoose.Mongoose): MongoDBCompat {
  return {
    collection: (name: string) => {
      // Obter o modelo do mongoose ou criar um novo
      let model: any;
      try {
        model = mongooseInstance.model(name);
      } catch (e) {
        // Se o modelo não existir, criar um dinâmico
        const schema = new mongoose.Schema({}, { strict: false });
        model = mongooseInstance.model(name, schema);
      }

      // Retornar um objeto que emula as operações de Collection do MongoDB
      return {
        find: (query: any) => ({
          toArray: async () => {
            // Evitamos o método .exec() que estava causando erros de tipo
            // e usamos Promise.resolve para garantir que retornamos uma Promise
            const documents = await Promise.resolve(model.find(query).lean());
            return documents || [];
          }
        }),
        findOne: async (query: any) => {
          // Usamos Promise.resolve para garantir que retornamos uma Promise
          return await Promise.resolve(model.findOne(query).lean());
        },
        insertOne: async (doc: any) => {
          // Criamos uma nova instância e salvamos para maior compatibilidade
          const newDoc = new model(doc);
          const saved = await newDoc.save();
          return { insertedId: saved._id, acknowledged: true };
        },
        updateOne: async (filter: any, update: any) => {
          // Usamos Promise.resolve para garantir que retornamos uma Promise
          const result = await Promise.resolve(model.updateOne(filter, update));
          return { 
            matchedCount: result.matchedCount || 0,
            modifiedCount: result.modifiedCount || 0,
            acknowledged: true
          };
        },
        deleteOne: async (filter: any) => {
          // Usamos Promise.resolve para garantir que retornamos uma Promise
          const result = await Promise.resolve(model.deleteOne(filter));
          return { 
            deletedCount: result.deletedCount || 0,
            acknowledged: true
          };
        }
      };
    }
  };
}

export async function connectToDatabase() {
  // Se já temos uma conexão, retorná-la
  if (cached.conn) {
    // Criar e retornar um objeto compatível com MongoDB
    const mongoDBCompat = createMongoDBCompat(cached.conn);
    
    return {
      client: cached.conn,
      db: mongoDBCompat,
      mongoose: cached.conn
    };
  }

  // Se não existe uma promessa de conexão, criar uma
  if (!cached.promise) {
    // String de conexão Atlas fixa - use esta para evitar problemas de carregamento de variáveis de ambiente
    const MONGODB_URI = 'mongodb+srv://vinideirolopess:c7MVBr6XpIkQwGaZ@cluster0.vocou4s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('Tentando conectar ao MongoDB Atlas...');
    
    cached.promise = mongoose.connect(MONGODB_URI)
      .then((mongoose) => {
        console.log('MongoDB Atlas conectado com sucesso');
        return mongoose;
      })
      .catch((error) => {
        console.error('Erro ao conectar ao MongoDB Atlas:', error);
        throw error;
      });
  }

  try {
    // Aguardar a promessa de conexão ser resolvida
    cached.conn = await cached.promise;
    
    // Criar e retornar um objeto compatível com MongoDB
    const mongoDBCompat = createMongoDBCompat(cached.conn);
    
    return {
      client: cached.conn,
      db: mongoDBCompat,
      mongoose: cached.conn
    };
  } catch (e) {
    // Se falhar, limpar a promessa para tentar novamente na próxima chamada
    cached.promise = null;
    throw e;
  }
}

export async function disconnectFromDatabase() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

// Exportar a conexão para uso direto em outros arquivos se necessário
export const db = { connect: connectToDatabase, disconnect: disconnectFromDatabase };

// Função para verificar se estamos usando modo simulado - sempre retorna false
export function isUsingSimulatedMode() {
  return false; // Sempre retorna false, forçando o uso exclusivo do MongoDB
} 