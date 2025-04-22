import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

/**
 * Endpoint para criar lobbies aleatórios e colocá-los na fila de matchmaking
 * GET /api/debug/auto-matchmaking?count=5 - Cria 5 lobbies de teste
 */
export async function GET(request: NextRequest) {
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
      const userId = testUsers[i % testUsers.length]._id;
      const lobbyName = `Lobby de Teste ${i+1}`;
      
      // Determinar número máximo de jogadores com base no tipo
      let maxPlayers = 4; // padrão para squad
      if (type === 'solo') maxPlayers = 1;
      if (type === 'duo') maxPlayers = 2;
      
      // Criar lobby
      const lobby = {
        _id: new ObjectId(),
        name: lobbyName,
        owner: userId,
        members: [userId],
        lobbyType: type,
        maxPlayers: maxPlayers,
        status: 'active',
        gameMode: 'casual',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Inserir lobby
      await db.collection('lobbies').insertOne(lobby);
      
      // Adicionar à fila de matchmaking
      const queueItem = {
        userId: userId.toString(),
        lobbyId: lobby._id.toString(),
        teamSize: 1,
        skill: 'any',
        region: 'brasil',
        platformMode: 'all',
        gameplayMode: 'normal',
        type: type,
        processed: false,
        players: [{
          userId: userId.toString(),
          username: `Jogador_Teste_${i+1}`,
          avatar: '/images/avatars/default.png'
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('matchmaking_queue').insertOne(queueItem);
      
      createdLobbies.push({
        lobbyId: lobby._id.toString(),
        name: lobbyName,
        type: type
      });
    }
    
    // Processar matchmaking automaticamente
    const processRequest = new Request(new URL('/api/debug/matchmaking-process', request.url).toString());
    fetch(processRequest)
      .then(async (res) => {
        console.log('Processamento de matchmaking iniciado em background');
      })
      .catch(err => {
        console.error('Erro ao processar matchmaking em background:', err);
      });
    
    return NextResponse.json({
      status: 'success',
      message: `${createdLobbies.length} lobbies de teste criados e adicionados à fila de matchmaking`,
      lobbies: createdLobbies
    });
    
  } catch (error: any) {
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
async function ensureTestUsers(db: any, count: number) {
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