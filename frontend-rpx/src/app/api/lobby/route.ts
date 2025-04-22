import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

// Listar lobbies do usuário
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    if (!isAuth || !userId) {
      return NextResponse.json(
        { status: 'error', error: error || 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter parâmetros da consulta
    const url = new URL(request.url);
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Buscar lobbies do usuário
    const userLobbies = await db.collection('lobbies').find({
      members: new ObjectId(userId)
    }).sort({ createdAt: -1 }).toArray();
    
    // Formatar os lobbies para a resposta
    const formattedLobbies = userLobbies.map(lobby => ({
      ...lobby,
      _id: lobby._id.toString(),
      owner: lobby.owner.toString(),
      members: lobby.members.map((id: ObjectId | string) => id.toString()),
      createdAt: lobby.createdAt instanceof Date ? lobby.createdAt.toISOString() : lobby.createdAt,
      updatedAt: lobby.updatedAt instanceof Date ? lobby.updatedAt.toISOString() : lobby.updatedAt
    }));
    
    return NextResponse.json({
      status: 'success',
      lobbies: formattedLobbies
    });
    
  } catch (error: any) {
    console.error('Erro ao obter lobbies:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Criar um novo lobby
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    if (!isAuth || !userId) {
      return NextResponse.json(
        { status: 'error', error: error || 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Obter dados do corpo da requisição
    const body = await request.json();
    
    // Validar dados mínimos para criar um lobby
    if (!body.lobbyType) {
      return NextResponse.json(
        { status: 'error', error: 'Tipo de lobby não especificado' },
        { status: 400 }
      );
    }
    
    // Determinar número máximo de jogadores com base no tipo
    let maxPlayers = 4; // padrão para squad
    if (body.lobbyType === 'solo') maxPlayers = 1;
    if (body.lobbyType === 'duo') maxPlayers = 2;
    
    // Substituir maxPlayers se fornecido explicitamente
    if (body.maxPlayers && typeof body.maxPlayers === 'number') {
      maxPlayers = body.maxPlayers;
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Criar objeto de lobby
    const userObjectId = new ObjectId(userId);
    const now = new Date();
    
    const lobbyData = {
      name: body.name || `Lobby de ${userId}`,
      owner: userObjectId,
      members: [userObjectId], // Proprietário já é um membro
      lobbyType: body.lobbyType,
      maxPlayers: maxPlayers,
      status: 'active',
      gameMode: body.gameMode || 'casual',
      createdAt: now,
      updatedAt: now,
      readyMembers: [], // Ninguém está pronto no início
      settings: body.settings || {}
    };
    
    // Inserir no banco de dados
    const result = await db.collection('lobbies').insertOne(lobbyData);
    
    if (!result.insertedId) {
      return NextResponse.json(
        { status: 'error', error: 'Erro ao criar lobby' },
        { status: 500 }
      );
    }
    
    // Também adicionar o usuário como membro na coleção lobbymembers
    try {
      const user = await db.collection('users').findOne(
        { _id: userObjectId },
        { projection: { username: 1, avatar: 1, level: 1 } }
      );
      
      if (user) {
        await db.collection('lobbymembers').insertOne({
          lobbyId: result.insertedId.toString(),
          userId: userObjectId,
          username: user.username || 'Usuário',
          avatar: user.avatar || null,
          level: user.level || 1,
          isLeader: true, // Proprietário é o líder
          isReady: false,
          joinedAt: now
        });
      }
    } catch (memberError) {
      console.error('Erro ao adicionar proprietário como membro:', memberError);
      // Continuar mesmo se falhar, pois o lobby já foi criado
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Lobby criado com sucesso',
      lobbyId: result.insertedId.toString()
    });
    
  } catch (error: any) {
    console.error('Erro ao criar lobby:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Criar rota para consertar a filiação ao lobby
export async function PATCH(request: NextRequest) {
  console.log('🔧 Iniciando reparo de filiação ao lobby');
  
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    if (!isAuth || !userId) {
      console.log('❌ Usuário não autenticado:', error);
      return NextResponse.json(
        { status: 'error', error: error || 'Não autorizado' },
        { status: 401 }
      );
    }
    
    console.log('✅ Usuário autenticado:', { userId });
    
    // Obter dados do corpo da requisição
    const body = await request.json();
    const { lobbyId } = body;
    
    if (!lobbyId) {
      console.log('❌ ID do lobby não fornecido');
      return NextResponse.json(
        { status: 'error', error: 'ID do lobby não fornecido' },
        { status: 400 }
      );
    }
    
    console.log(`🔧 Tentando consertar filiação ao lobby: ${lobbyId}`);
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Converter IDs para ObjectId
    const lobbyObjectId = new ObjectId(lobbyId);
    const userObjectId = new ObjectId(userId);
    
    // Verificar se o lobby existe
    const lobby = await db.collection('lobbies').findOne({ _id: lobbyObjectId });
    
    if (!lobby) {
      console.log('⚠️ Lobby não encontrado, tentando criar com base nos membros');
      
      // Verificar se existem membros para este lobby
      const members = await db.collection('lobbymembers').find({ lobbyId }).toArray();
      
      if (members && members.length > 0) {
        console.log(`✅ Encontrados ${members.length} membros para o lobby ${lobbyId}`);
        
        // Criar o lobby com base nos membros encontrados
        const leader = members.find(m => m.isLeader) || members[0];
        
        const newLobby = {
          _id: lobbyObjectId,
          name: `Lobby reconstruído`,
          owner: leader.userId,
          members: members.map(m => m.userId),
          lobbyType: 'reconstructed',
          maxPlayers: 4,
          status: 'active',
          gameMode: 'casual',
          createdAt: new Date(),
          updatedAt: new Date(),
          readyMembers: members.filter(m => m.isReady).map(m => m.userId)
        };
        
        // Inserir o lobby reconstruído
        await db.collection('lobbies').insertOne(newLobby);
        console.log('✅ Lobby reconstruído e inserido no banco de dados');
      } else {
        console.log('❌ Nenhum membro encontrado para este lobby');
        return NextResponse.json(
          { status: 'error', error: 'Lobby não existe e não foi possível reconstruí-lo' },
          { status: 404 }
        );
      }
    }
    
    // Verificar se o usuário já está na lista de membros do lobby
    let isMemberInLobby = false;
    if (lobby && lobby.members) {
      isMemberInLobby = lobby.members.some((memberId: ObjectId | string) => 
        memberId.toString() === userId.toString()
      );
    }
    
    // Verificar se o usuário já está na coleção lobbymembers
    const existingMember = await db.collection('lobbymembers').findOne({
      lobbyId: lobbyId,
      userId: userObjectId
    });
    
    // Se o usuário não estiver em qualquer uma das estruturas, adicioná-lo
    let changes = false;
    
    // 1. Adicionar à lista de membros do lobby se necessário
    if (!isMemberInLobby) {
      console.log('🔧 Adicionando usuário à lista de membros do lobby');
      
      await db.collection('lobbies').updateOne(
        { _id: lobbyObjectId },
        { 
          $addToSet: { members: userObjectId },
          $set: { updatedAt: new Date() }
        },
        { upsert: true }
      );
      
      changes = true;
    }
    
    // 2. Adicionar à coleção lobbymembers se necessário
    if (!existingMember) {
      console.log('🔧 Adicionando usuário à coleção lobbymembers');
      
      // Obter dados do usuário
      const user = await db.collection('users').findOne(
        { _id: userObjectId },
        { projection: { username: 1, avatar: 1, level: 1 } }
      );
      
      // Se o usuário for encontrado, criar entrada na coleção lobbymembers
      if (user) {
        await db.collection('lobbymembers').insertOne({
          lobbyId: lobbyId,
          userId: userObjectId,
          username: user.username || 'Usuário',
          avatar: user.avatar || null,
          level: user.level || 1,
          isLeader: false,
          isReady: false,
          joinedAt: new Date()
        });
        
        changes = true;
      }
    }
    
    console.log('🎉 Verificação de filiação ao lobby concluída');
    
    return NextResponse.json({
      status: 'success',
      message: changes ? 'Filiação ao lobby consertada' : 'Filiação ao lobby já estava correta',
      changesApplied: changes,
      lobbyId: lobbyId
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao consertar filiação ao lobby:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
} 