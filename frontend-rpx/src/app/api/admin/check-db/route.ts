import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Verificando conexão com o banco de dados...');
    
    // Verificar se estamos no ambiente de desenvolvimento
    if (process.env.NODE_ENV !== 'development') {
      console.log('⚠️ Acesso a rota de diagnóstico apenas disponível em ambiente de desenvolvimento');
      return NextResponse.json(
        { error: 'Esta rota só está disponível em ambiente de desenvolvimento' },
        { status: 403 }
      );
    }
    
    // Tentar conectar ao banco de dados
    console.log('🔄 Conectando ao banco de dados...');
    const startTime = Date.now();
    const { db } = await connectToDatabase();
    const connectionTime = Date.now() - startTime;
    console.log(`✅ Conectado ao banco de dados em ${connectionTime}ms`);
    
    // Verificar quantos usuários existem
    console.log('🔍 Contando usuários...');
    const userCount = await db.collection('users').countDocuments();
    console.log(`📊 Encontrados ${userCount} usuários no banco de dados`);
    
    // Listar os primeiros 5 usuários para diagnóstico
    const users = await db.collection('users')
      .find({}, { projection: { _id: 1, email: 1, name: 1, username: 1, isAdmin: 1 } })
      .limit(5)
      .toArray();
    
    // Listar nomes de todas as coleções
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    return NextResponse.json({
      status: 'Conectado',
      connectionTime: `${connectionTime}ms`,
      database: {
        collections: collectionNames,
        userCount,
        sampleUsers: users.map(u => ({
          id: u._id.toString(),
          email: u.email,
          name: u.name || u.username,
          isAdmin: u.isAdmin || false
        }))
      }
    });
  } catch (error: any) {
    console.error('❌ Erro ao verificar banco de dados:', error);
    return NextResponse.json({
      status: 'Erro',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 