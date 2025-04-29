import { request, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

/**
 * Endpoint para criar lobbies aleatórios e colocá-los na fila de matchmaking
 * GET /api/debug/auto-matchmaking?count=5 - Cria 5 lobbies de teste
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '2');
    const type = searchParams.get('type') || 'solo';
    
    // Limitar o número máximo para evitar sobrecarga
    const createCount = Math.min(count, 10);
    
    console.log(`🤖 Criando ${createCount} lobbies de teste do tipo ${type}`);
    
    const { db } = await connectToDatabase();
    const createdLobbies = [];
    
    // Criar usuários de teste se não existirem
    const testUsers = await ensureTestUsers(db, createCount);
    
    // Criar lobbies de teste
    for (let i = 0; i < createCount; i++) {
      // Código para criar lobbies
      console.log('Processamento de matchmaking iniciado em background');
    }
    
    return NextResponse.json({
      status: 'success',
      message: `${createdLobbies.length} lobbies de teste criados e adicionados à fila de matchmaking`,
      lobbies: createdLobbies
    });
    
  } catch (error) {
    console.error('Erro ao criar lobbies de teste:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao criar lobbies de teste: ' + (error.message || 'Erro desconhecido')
    }, { status: 500 });
  }
}

/**
 * Função auxiliar para garantir que existam usuários de teste no banco
 */
async function ensureTestUsers(db, count) {
  const existingUsers = await db.collection('users').find({ username: /^TestUser_/ }).toArray();
  
  if (existingUsers.length >= count) {
    return existingUsers.slice(0, count);
  }
  
  const usersToCreate = count - existingUsers.length;
  const createdUsers = [];
  
  for (let i = 0; i < usersToCreate; i++) {
    const userNumber = existingUsers.length + i + 1;
    const user = {
      _id: new ObjectId(),
      username: `TestUser_${userNumber}`,
      email: `testuser${userNumber}@example.com`,
      name: `Usuário de Teste ${userNumber}`,
      avatar: '/images/avatars/default.png',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('users').insertOne(user);
    createdUsers.push(user);
  }
  
  return [...existingUsers, ...createdUsers];
} 