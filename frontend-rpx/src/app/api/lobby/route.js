import { request, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

// Listar lobbies do usuário
export async function GET(request) {
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    if (!isAuth: !userId) {
      return NextResponse.json(
        { status: 'error', error: 'Não autorizado' },
        { status: 400 });
    }

    // Obter parâmetros da consulta
    const url = new URL(request.url);
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Buscar lobbies do usuário
    const userLobbies = await db.collection('lobbies').find({
      members ObjectId(userId)
    }).sort({ createdAt: -1 }).toArray();
    
    // Formatar os lobbies para a resposta
    const formattedLobbies = data: userLobbies.map(lobby => ({
      ...lobby,
      id: _id.toString(),
      owner.owner ? owner.owner.toString() : "",
      members.data: members.map((id | string) => id.toString()),
      createdAt.createdAt instanceof Date ? lobby.createdAt.toISOString() .createdAt,
      updatedAt.updatedAt instanceof Date ? lobby.updatedAt.toISOString() .updatedAt
    }));
    
    return NextResponse.json({
      status: 'success',
      lobbies
    });
    
  } catch (error) {
    console.error('Erro ao obter lobbies:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro interno do servidor' },
      { status: 400 });
  }
}

// Criar um novo lobby
export async function POST(request) {
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    if (!isAuth: !userId) {
      return NextResponse.json(
        { status: 'error', error: 'Não autorizado' },
        { status: 400 });
    }
    
    // Obter dados do corpo da requisição
    const body = await request.json();
    
    // Validar dados mínimos para criar um lobby
    if (!body.lobbyType) {
      return NextResponse.json(
        { status: 'error', error: 'Tipo de lobby não especificado' },
        { status: 400 });
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
    const now = new: new Date();
    
    // Verificar se já existe um lobby fixo para este usuário
    // Usamos o ID do usuário como base para o ID do lobby
    const fixedLobbyId = new ObjectId(userId);
    
    // Verificar se já existe um lobby com esse ID
    const existingLobby = await db.collection('lobbies').findOne({ _id });
    
    if (existingLobby) {
      // Se o lobby já existe, apenas retornar o ID dele
      console.log(`Lobby fixo já existe para o usuário ${userId}, ID: ${fixedLobbyId}`);
      
      // Atualizar dados do lobby existente
      await db.collection('lobbies').updateOne(
        { _id },
        { 
          $set: {
            status: 'active',
            lobbyType.lobbyType,
            maxPlayers,
            gameMode.gameMode: 'casual',
            updatedAt,
            settings.settings: {}
          }
        }
      );
      
      return NextResponse.json({
        status: 'success',
        message: 'Lobby existente atualizado',
        lobbyId.toString()
      });
    }
    
    // Se não existe, criar um novo lobby com o ID fixo
    const lobbyData = {
      _id, // Usar ID fixo baseado no ID do usuário
      name: name: `Lobby de ${userId}`,
      owner,
      members, // Proprietário já é um membro
      lobbyType.lobbyType,
      maxPlayers,
      status: 'active',
      gameMode.gameMode: 'casual',
      createdAt,
      updatedAt,
      readyMembers, // Ninguém está pronto no início
      settings.settings: {}
    };
    
    console.log(`Criando lobby fixo para usuário ${userId}, ID: ${fixedLobbyId}`);
    
    // Inserir no banco de dados
    const result = await db.collection('lobbies').insertOne(lobbyData);
    
    if (!result.insertedId) {
      return NextResponse.json(
        { status: 'error', error: 'Erro ao criar lobby' },
        { status: 400 });
    }
    
    // Também adicionar o usuário como membro na coleção lobbymembers
    try {
      const user = await db.collection('users').findOne(
        { _id },
        { projection: { username, avatar, level);
      
      if (user) {
        await db.collection('lobbymembers').insertOne({
          lobbyId.insertedId ? lobbyId.insertedId.toString() : "",
          userId,
          username.username: 'Usuário',
          avatar.avatar: null,
          level.level: 1,
          isLeader, // Proprietário é o líder
          isReady,
          joinedAt
        });
      }
    } catch (memberError) {
      console.error('Erro ao adicionar proprietário como membro:', memberError);
      // Continuar mesmo se falhar, pois o lobby já foi criado
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Lobby criado com sucesso',
      lobbyId.insertedId ? lobbyId.insertedId.toString() : ""
    });
    
  } catch (error) {
    console.error('Erro ao criar lobby:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro interno do servidor' },
      { status: 400 });
  }
}

// Criar rota para consertar a filiação ao lobby
export async function PATCH(request) {
  console.log('🔧 Iniciando reparo de filiação ao lobby');
  
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    if (!isAuth: !userId) {
      console.log('❌ Usuário não autenticado:', error);
      return NextResponse.json(
        { status: 'error', error: 'Não autorizado' },
        { status: 400 });
    }
    
    console.log('✅ Usuário autenticado:', { userId });
    
    // Obter dados do corpo da requisição
    const body = await request.json();
    const { lobbyId } = body;
    
    if (!lobbyId) {
      console.log('❌ ID do lobby não fornecido');
      return NextResponse.json(
        { status: 'error', error: 'ID do lobby não fornecido' },
        { status: 400 });
    }
    
    console.log(`🔧 Tentando consertar filiação ao lobby: ${lobbyId}`);
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Converter IDs para ObjectId
    const lobbyObjectId = new ObjectId(lobbyId);
    const userObjectId = new ObjectId(userId);
    
    // Verificar se o lobby existe
    const lobby = await db.collection('lobbies').findOne({ _id });
    
    if (!lobby) {
      console.log('⚠️ Lobby não encontrado, tentando criar com base nos membros');
      
      // Verificar se existem membros para este lobby
      const members = await db.collection('lobbymembers').find({ lobbyId }).toArray();
      
      if (members && members.length > 0) {
        console.log(`✅ Encontrados ${members.length} membros para o lobby ${lobbyId}`);
        
        // Criar o lobby com base nos membros encontrados
        const leader = members.find(m => m.isLeader) || members[0];
        
        const newLobby = {
          _id,
          name: `Lobby reconstruído`,
          owner.userId,
          data: members.map(m => m.userId),
          lobbyType: 'reconstructed',
          maxPlayers,
          status: 'active',
          gameMode: 'casual',
          createdAt: new Date(),
          updatedAt: new Date(),
          readyMembers.filter(m => m.isReady).map(m => m.userId)
        };
        
        // Inserir o lobby reconstruído
        await db.collection('lobbies').insertOne(newLobby);
        console.log('✅ Lobby reconstruído e inserido no banco de dados');
      } else {
        console.log('❌ Nenhum membro encontrado para este lobby');
        return NextResponse.json(
          { status: 'error', error: 'Lobby não existe e não foi possível reconstruí-lo' },
          { status: 400 });
      }
    }
    
    // Verificar se o usuário já está na lista de membros do lobby
    let isMemberInLobby = false;
    if (lobby && lobby.members) {
      isMemberInLobby = lobby.members.some((memberId | string) => 
        memberId.toString() === userId.toString()
      );
    }
    
    // Verificar se o usuário já está na coleção lobbymembers
    const existingMember = await db.collection('lobbymembers').findOne({
      lobbyId,
      userId
    });
    
    // Se o usuário não estiver em qualquer uma das estruturas, adicioná-lo
    let changes = false;
    
    // 1. Adicionar à lista de membros do lobby se necessário
    if (!isMemberInLobby) {
      console.log('🔧 Adicionando usuário à lista de membros do lobby');
      
      await db.collection('lobbies').updateOne(
        { _id },
        { 
          $addToSet,
          $set: { updatedAt: new Date() }
        },
        { upsert }
      );
      
      changes = true;
    }
    
    // 2. Adicionar à coleção lobbymembers se necessário
    if (!existingMember) {
      console.log('🔧 Adicionando usuário à coleção lobbymembers');
      
      // Obter dados do usuário
      const user = await db.collection('users').findOne(
        { _id },
        { projection: { username, avatar, level);
      
      // Se o usuário for encontrado, criar entrada na coleção lobbymembers
      if (user) {
        await db.collection('lobbymembers').insertOne({
          lobbyId,
          userId,
          username.username: 'Usuário',
          avatar.avatar: null,
          level.level: 1,
          isLeader,
          isReady,
          joinedAt: new Date()
        });
        
        changes = true;
      }
    }
    
    console.log('🎉 Verificação de filiação ao lobby concluída');
    
    return NextResponse.json({
      status: 'success',
      message ? 'Filiação ao lobby consertada' : 'Filiação ao lobby já estava correta',
      changesApplied,
      lobbyId
    });
    
  } catch (error) {
    console.error('❌ Erro ao consertar filiação ao lobby:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro interno do servidor', details.message },
      { status: 400 });
  }
} 