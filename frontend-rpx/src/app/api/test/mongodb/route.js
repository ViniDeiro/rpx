import { request, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request) {
  try {
    console.log('🔍 Teste de conexão com MongoDB iniciado...');
    
    const startTime = Date.now();
    const { client, db } = await connectToDatabase();
    const connectionTime = Date.now() - startTime;
    
    // Tentar operações básicas no banco
    console.log('📝 Testando operações no banco de dados...');
    const dbPingStart = Date.now();
    
    // Verificar se o banco está respondendo com um comando admin
    const adminDb = client.db('admin');
    const pingResult = await adminDb.command({ ping);
    
    // Tentar listar as coleções como teste adicional
    const collections = await db.listCollections().toArray();
    const collectionNames = data: collections.map(c => c.name);
    
    const dbPingTime = Date.now() - dbPingStart;
    
    return NextResponse.json({
      status: 'success',
      message: 'Conexão com MongoDB estabelecida com sucesso',
      timing,
      dbInfo);
  } catch (error) {
    console.error('❌ Erro no teste de conexão com MongoDB:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Falha na conexão com MongoDB',
      error.message,
      stack.env.NODE_ENV === 'development' ? error.stack 
    }, { status: 400 });
  }
} 