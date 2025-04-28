import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

/**
 * API para depuração de partidas
 * Este endpoint permite verificar se uma partida existe e exibir seus detalhes
 * Apenas para uso interno/desenvolvimento.
 */
export async function GET(request: NextRequest) {
  try {
    // Obter o ID da partida da query string
    const searchParams = request.nextUrl.searchParams;
    const matchId = searchParams.get('matchId');

    // Verificar se o ID da partida foi fornecido
    if (!matchId) {
      return NextResponse.json({ 
        error: 'ID da partida não fornecido', 
        usage: 'Adicione ?matchId=ID_DA_PARTIDA à URL' 
      }, { status: 400 });
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Verificar se temos uma conexão válida com o banco
    if (!db) {
      return NextResponse.json({ error: 'Erro de conexão com o banco de dados' }, { status: 500 });
    }

    console.log(`Debug Match - Verificando partida: ${matchId}`);

    // Buscar a partida
    let match;
    try {
      // Tentar buscar por diferentes campos possíveis de ID
      const query: any = {
        $or: [
          { matchId: matchId },
          { match_id: matchId }
        ]
      };
      
      // Adicionar busca por ObjectId somente se for válido
      if (ObjectId.isValid(matchId)) {
        query.$or.push({ _id: new ObjectId(matchId) });
      }
      
      console.log(`Debug Match: Consultando com query: ${JSON.stringify(query)}`);
      
      // Verificar o estado da conexão com o banco
      const connectionStatus: {
        connected: boolean,
        collections: string[]
      } = {
        connected: true,
        collections: []
      };
      
      try {
        // Listar todas as coleções disponíveis
        const collections = await db.listCollections().toArray();
        connectionStatus.collections = collections.map(c => c.name);
      } catch (collErr) {
        console.error("Erro ao listar coleções:", collErr);
        connectionStatus.connected = false;
      }
      
      console.log(`Debug Match: Status da conexão: ${JSON.stringify(connectionStatus)}`);
      
      // Buscar amostra de partidas para verificar estrutura
      const sampleMatches = await db.collection('matches').find({}).limit(1).toArray();
      console.log(`Debug Match: Amostra de partidas (${sampleMatches.length}):`);
      if (sampleMatches.length > 0) {
        const sampleMatch = sampleMatches[0];
        console.log(`- ID: ${sampleMatch._id}`);
        console.log(`- matchId: ${sampleMatch.matchId || 'não definido'}`);
        console.log(`- Status: ${sampleMatch.status || 'não definido'}`);
        console.log(`- Players: ${sampleMatch.players?.length || 0}`);
        console.log(`- Teams: ${sampleMatch.teams?.length || 0}`);
      }
      
      // Buscar a partida específica
      match = await db.collection('matches').findOne(query);
    } catch (error) {
      console.error('Erro ao buscar partida:', error);
      return NextResponse.json({ 
        error: 'Erro ao buscar partida', 
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        debug: {
          query: {
            matchId: matchId,
            isValidObjectId: ObjectId.isValid(matchId),
            mongooseState: mongoose?.connection?.readyState
          }
        }
      }, { status: 500 });
    }

    // Verificar se a partida foi encontrada
    if (!match) {
      // Verificar se existem outras partidas com dados semelhantes
      const possibleMatches = await db.collection('matches').find({
        $or: [
          { 'players.userId': matchId },
          { 'teams.players.id': matchId },
          { 'teams.players.userId': matchId }
        ]
      }).limit(5).toArray();
      
      console.log(`DEBUG: Não encontrou partida direta, mas encontrou ${possibleMatches.length} possíveis partidas relacionadas`);
      
      // Buscar todas as partidas recentes para ajudar a depurar
      const recentMatches = await db.collection('matches')
        .find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();
      
      return NextResponse.json({ 
        error: 'Partida não encontrada',
        searched: matchId,
        possibleMatches: possibleMatches.map(m => ({
          _id: m._id.toString(),
          matchId: m.matchId,
          createdAt: m.createdAt,
          players: m.players?.length || 0,
          teams: m.teams?.length || 0
        })),
        recentMatches: recentMatches.map(m => ({
          _id: m._id.toString(),
          matchId: m.matchId,
          createdAt: m.createdAt,
          status: m.status
        }))
      }, { status: 404 });
    }

    // Buscar também as notificações relacionadas
    let notifications: any[] = [];
    try {
      notifications = await db.collection('notifications').find({
        'data.matchId': matchId
      }).toArray();
    } catch (notifError) {
      console.warn('Erro ao buscar notificações:', notifError);
      // Continuar mesmo com erro nas notificações
    }

    // Verificar também na fila de matchmaking
    let queueItems: any[] = [];
    try {
      queueItems = await db.collection('matchmaking_queue').find({
        $or: [
          { matchId: matchId },
          { lobbyId: { $in: match.lobbies || [] } }
        ]
      }).toArray();
    } catch (queueError) {
      console.warn('Erro ao buscar itens da fila:', queueError);
      // Continuar mesmo com erro na fila
    }

    // Preparar estrutura de times se estiver faltando
    if (!match.teams || !Array.isArray(match.teams) || match.teams.length === 0) {
      console.log('DEBUG: Partida não tem times, criando a partir dos jogadores');
      
      // Criar times a partir dos jogadores
      if (match.players && Array.isArray(match.players)) {
        match.teams = [
          {
            id: 'team1',
            name: 'Time 1',
            players: match.players
              .filter((p: any) => !p.team || p.team === 'team1')
              .map((p: any) => ({
                id: p.userId || p.id,
                userId: p.userId || p.id,
                name: p.username || p.name || 'Jogador',
                username: p.username || p.name || 'Jogador',
                avatar: p.avatar || p.avatarUrl || '/images/avatars/default.png',
                isReady: true,
                isCaptain: true,
                rank: p.rank || 'Iniciante'
              }))
          },
          {
            id: 'team2',
            name: 'Time 2',
            players: match.players
              .filter((p: any) => p.team === 'team2')
              .map((p: any) => ({
                id: p.userId || p.id,
                userId: p.userId || p.id,
                name: p.username || p.name || 'Jogador',
                username: p.username || p.name || 'Jogador',
                avatar: p.avatar || p.avatarUrl || '/images/avatars/default.png',
                isReady: true,
                isCaptain: true,
                rank: p.rank || 'Iniciante'
              }))
          }
        ];
      } else {
        match.teams = [
          { id: 'team1', name: 'Time 1', players: [] },
          { id: 'team2', name: 'Time 2', players: [] }
        ];
      }
    }

    // Retornar as informações para depuração
    return NextResponse.json({
      match: {
        ...match,
        _id: match._id.toString(), // Converter ObjectId para string
      },
      notifications: notifications.map(n => ({
        ...n,
        _id: n._id.toString(),
        userId: n.userId,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt,
      })),
      queueItems: queueItems.map(q => ({
        ...q,
        _id: q._id.toString(),
      })),
      message: 'Partida encontrada com sucesso',
      debug: {
        timestamp: new Date(),
        matchIdFormat: typeof matchId === 'string' ? 'string' : 'unknown',
        matchIdLength: typeof matchId === 'string' ? matchId.length : 0,
        hasTeams: !!match.teams && Array.isArray(match.teams),
        teamsCount: match.teams?.length || 0,
        hasPlayers: !!match.players && Array.isArray(match.players),
        playersCount: match.players?.length || 0
      }
    });
  } catch (error) {
    console.error('Erro geral no endpoint de debug:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 