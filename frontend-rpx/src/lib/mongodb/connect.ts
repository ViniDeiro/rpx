import { MongoClient, Db } from 'mongodb';

// URI de conexão com o MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rpx-platform';
const MONGODB_DB = process.env.MONGODB_DB || 'rpx-platform';

// Interface para o objeto de conexão
interface ConnectionType {
  client: MongoClient | null;
  db: Db | null;
  promise?: Promise<{ client: MongoClient; db: Db }> | null;
}

// Variável global para cache da conexão
declare global {
  // eslint-disable-next-line no-var
  var mongodb: ConnectionType | undefined;
}

let cached = global.mongodb as ConnectionType;

if (!cached) {
  cached = global.mongodb = { client: null, db: null, promise: null };
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached.client && cached.db) {
    return { client: cached.client, db: cached.db };
  }

  if (!cached.promise) {
    const options = {};

    cached.promise = MongoClient.connect(MONGODB_URI, options).then((client) => {
      return {
        client,
        db: client.db(MONGODB_DB),
      };
    });
  }

  try {
    const { client, db } = await cached.promise;
    cached.client = client;
    cached.db = db;
    return { client, db };
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

// Função para verificar se estamos usando modo simulado - sempre retorna false
export function isUsingSimulatedMode() {
  return false; // Sempre retorna false, forçando o uso exclusivo do MongoDB
}

// Para desconectar quando necessário
export async function disconnectFromDatabase() {
  if (cached.client) {
    await cached.client.close();
    cached.client = null;
    cached.db = null;
    cached.promise = null;
    console.log('Desconectado do MongoDB com sucesso!');
  }
} 