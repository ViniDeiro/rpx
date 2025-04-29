import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';

// GET - Verificar e mostrar informações do banco de dados
export async function GET(request) {
  try {
    // Esta rota só deve estar disponível em desenvolvimento
    if (process.env.NODE_ENV !== 'development') {
      console.log('⚠️ Acesso a rota de diagnóstico apenas disponível em ambiente de desenvolvimento');
      return NextResponse.json(
        { error: 'Esta rota só está disponível em ambiente de desenvolvimento' },
        { status: 403 }
      );
    }

    // Tentar conectar ao banco de dados
    await connectToDatabase();
    const db = global.mongoConnection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Falha na conexão com o banco de dados' },
        { status: 500 }
      );
    }

    // Obter informações das coleções
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    // Verificar número de usuários
    const userCount = await db.collection('users').countDocuments();
    
    // Obter amostra de usuários
    const sampleUsers = await db.collection('users')
      .find({})
      .limit(5)
      .toArray();

    // Verificar tabelas existentes e seus números
    const stats = {};
    
    for (const colName of collectionNames) {
      stats[colName] = await db.collection(colName).countDocuments();
    }

    // Retornar informações
    return NextResponse.json({
      status: 'success',
      data: {
        connection: 'OK',
        database: {
          collections: collectionNames,
          userCount,
          sampleUsers: sampleUsers.map(u => ({
            id: u._id ? u._id.toString() : "",
            email: u.email,
            name: u.name || u.username,
            created: u.createdAt
          })),
          stats
        }
      }
    });
  } catch (error) {
    console.error('Erro ao verificar banco de dados:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        error: 'Erro ao verificar banco de dados: ' + (error.message || 'Erro desconhecido') 
      },
      { status: 500 }
    );
  }
} 