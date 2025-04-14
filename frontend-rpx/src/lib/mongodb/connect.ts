import mongoose from 'mongoose';

// Interface para o cache da conexão
interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Variável global para manter a conexão entre recarregamentos da API
declare global {
  var mongoose: MongooseConnection | undefined;
}

let cached: MongooseConnection = global.mongoose || { conn: null, promise: null };

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  // Se já temos uma conexão, retorná-la
  if (cached.conn) {
    return cached.conn;
  }

  // Se não existe uma promessa de conexão, criar uma
  if (!cached.promise) {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rpx-platform';

    cached.promise = mongoose.connect(MONGODB_URI)
      .then((mongoose) => {
        console.log('MongoDB conectado com sucesso');
        return mongoose;
      })
      .catch((error) => {
        console.error('Erro ao conectar ao MongoDB:', error);
        throw error;
      });
  }

  try {
    // Aguardar a promessa de conexão ser resolvida
    cached.conn = await cached.promise;
    return cached.conn;
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