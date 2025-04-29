import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Cache para partidas (em memória)
const matchCache = {};

// Tempo de expiração do cache (5 segundos)
const CACHE_EXPIRATION = 5000;

export async function GET(
  request,
  { params }) {
  try {
    // Obter o ID da partida dos parâmetros da rota
    const matchId = params.id;
    
    if (!matchId) {
      return NextResponse.json({ error: 'ID da partida não fornecido' }, { status: 400 });
    }
    
    console.log(`API Match partida com ID ${matchId}`);
    
    // Verificar se o cliente está forçando uma busca fresca (ignorar cache)
    const searchParams = request.nextUrl.searchParams;
    const forceFresh = searchParams.get('forceFresh') === 'true';
    
    if (forceFresh) {
      console.log(`API Matchçando busca fresca para ${matchId} (ignorando cache)`);
    }
    
    // Verificar se temos a partida em cache e se é recente
    const now = Date.now();
    const cachedMatch = matchCache[matchId];
    
    if (!forceFresh && cachedMatch && (now - cachedMatch.timestamp < CACHE_EXPIRATION)) {
      console.log(`Retornando match ${matchId} do cache`);
      return NextResponse.json(cachedMatch.data);
    }
    
    // Buscar a partida específica
    const db = await connectToDatabase();
    const query = { _id: new ObjectId(matchId) };
    const match = await db.collection('matches').findOne(query);
    
    console.log(`API Match da busca: ${match ? 'Partida encontrada' : 'Partida não encontrada'}`);
    if (match) {
      console.log(`API Match da partida encontrada:`, JSON.stringify({
        id: match._id ? match._id.toString() : "",
        matchId: match.matchId,
        status: match.status,
        playersCount: match.players?.length || 0,
        teamsCount: match.teams?.length || 0
      }));
    }
    
    if (!match) {
      return NextResponse.json({ error: 'Partida não encontrada' }, { status: 400 });
    }
    
    // Simplificar a resposta para evitar processamento excessivo
    // Converter _id para string para facilitar uso no frontend
    const result = {
      ...match,
      id: match._id ? match._id.toString() : "",
      // Garantir que os objetos de equipe existam para evitar erros no frontend
      teams: match.teams || [
        { id: 'team1', name: 'Time 1', players: [] },
        { id: 'team2', name: 'Time 2', players: [] }
      ]
    };
    
    // Armazenar no cache
    matchCache[matchId] = {
      data: result,
      timestamp: now
    };
    
    console.log(`API Match preparada com sucesso para ${matchId}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`API Match geral na rota: ${error}`);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 400 });
  }
} 