import mongoose from 'mongoose';

// Usando a mesma string de conexão que configuramos anteriormente
const MONGODB_URI = 'mongodb+srv://vinideirolopess:c7MVBr6XpIkQwGaZ@cluster0.vocou4s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

let cachedConnection: typeof mongoose | null = null;

/**
 * Função para conectar ao MongoDB
 */
export async function connectToDatabase() {
  // Se já temos uma conexão, retorná-la
  if (cachedConnection) {
    console.log('Usando conexão MongoDB em cache...');
    return cachedConnection;
  }
  
  // Se não estamos conectados, tentar estabelecer a conexão
  console.log('Conectando ao MongoDB Atlas...');
  
  try {
    mongoose.connection.on('connected', () => {
      console.log('MongoDB Atlas conectado com sucesso');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('Erro de conexão MongoDB Atlas:', err);
    });
    
    const connection = await mongoose.connect(MONGODB_URI);
    console.log('Conexão com MongoDB Atlas estabelecida');
    
    cachedConnection = connection;
    return connection;
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB Atlas:', error);
    throw error;
  }
} 