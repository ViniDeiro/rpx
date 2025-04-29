import { request, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

export async function POST(
  request,
  { params }) {
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    if (!isAuth || !userId) {
      return NextResponse.json(
        { status: 'error', error: error || 'Não autorizado' },
        { status: 400 });
    }

    // Obter ID do lobby
    const lobbyId = params.id;
    
    if (!lobbyId) {
      return NextResponse.json(
        { status: 'error', error: 'ID do lobby não fornecido' },
        { status: 400 });
    }

    console.log(`Usuário ${userId} tentando iniciar jogo no lobby ${lobbyId}`);

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Verificar se o ID tem um formato válido para o MongoDB
    let lobbyObjectId;
    try {
      lobbyObjectId = new ObjectId(lobbyId);
    } catch (error) {
      return NextResponse.json(
        { status: 'error', error: 'ID de lobby inválido' },
        { status: 400 });
    }

    // Buscar o lobby
    const lobby = await db.collection('lobbies').findOne({
      _id: lobbyObjectId
    });

    if (!lobby) {
      return NextResponse.json(
        { status: 'error', error: 'Lobby não encontrado' },
        { status: 400 });
    }

    // Verificar se o usuário é o dono do lobby
    const isOwner = lobby.owner ? lobby.owner.toString() === userId.toString() : false;
    
    if (!isOwner) {
      return NextResponse.json(
        { status: 'error', error: 'Apenas o líder do lobby pode iniciar o jogo' },
        { status: 400 });
    }

    // Verificar se todos os jogadores estão prontos
    const membersCount = lobby.members.length;
    const readyMembersCount = lobby.readyMembers?.length || 0;
    
    // Em lobbies solo, o proprietário não precisa marcar "pronto"
    const isSoloLobby = lobby.lobbyType === 'solo' && membersCount === 1;
    
    if (!isSoloLobby && readyMembersCount < membersCount) {
      return NextResponse.json(
        { status: 'error', error: 'Todos os jogadores devem estar prontos para iniciar o jogo' },
        { status: 400 });
    }

    // Criar uma nova partida no banco de dados
    const matchData = {
      lobbyId: lobbyObjectId,
      players: lobby.members.map(memberId => 
        typeof memberId === 'string' ? new ObjectId(memberId) : memberId
      ),
      confirmedPlayers: [], // Inicialmente ninguém confirmou
      gameMode: lobby.gameMode || 'normal',
      createdAt: new Date(),
      startedAt: new Date(),
      finishedAt: null,
      winner: null,
      settings: lobby.settings || {}
    };

    const result = await db.collection('matches').insertOne(matchData);

    if (!result.insertedId) {
      return NextResponse.json(
        { status: 'error', error: 'Erro ao criar a partida' },
        { status: 400 });
    }

    // Atualizar status do lobby para "em jogo"
    await db.collection('lobbies').updateOne(
      { _id: lobbyObjectId },
      { 
        $set: { 
          status: 'in_game',
          matchId: result.insertedId,
          updatedAt: new Date()
        }
      }
    );

    // Notificar todos os membros do lobby
    const memberIds = lobby.members.map(id => typeof id === 'object' ? id.toString() : id);
    
    // Criar notificações para cada membro
    const notifications = memberIds.map(memberId => ({
      userId: memberId,
      type: 'match_start',
      title: 'Partida Iniciada',
      message: `A partida de ${lobby.lobbyType} foi iniciada!`,
      data: {
        matchId: result.insertedId ? result.insertedId.toString() : "",
        lobbyId: lobbyId,
        gameType: lobby.lobbyType
      },
      read: false,
      createdAt: new Date()
    }));

    // Inserir notificações
    if (notifications.length > 0) {
      await db.collection('notifications').insertMany(notifications);
    }

    return NextResponse.json({
      status: 'success',
      message: 'Partida iniciada com sucesso',
      matchId: result.insertedId ? result.insertedId.toString() : ""
    });
    
  } catch (error) {
    console.error('Erro ao iniciar partida:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro interno do servidor' },
      { status: 400 });
  }
} 