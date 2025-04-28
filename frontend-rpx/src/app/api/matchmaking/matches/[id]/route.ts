import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Cache para partidas (em memória)
const matchCache: Record<string, {
  data: any;
  timestamp: number;
}> = {};

// Tempo de expiração do cache (5 segundos)
const CACHE_EXPIRATION = 5000;

export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    // Obter o ID da partida dos parâmetros da rota
    const matchId = params.id;
    
    if (!matchId) {
      return NextResponse.json({ error: 'ID da partida não fornecido' }, { status: 400 });
    }
    
    console.log(`API Match: Buscando partida com ID ${matchId}`);
    
    // Verificar se o cliente está forçando uma busca fresca (ignorar cache)
    const searchParams = request.nextUrl.searchParams;
    const forceFresh = searchParams.get('forceFresh') === 'true';
    
    if (forceFresh) {
      console.log(`API Match: Forçando busca fresca para ${matchId} (ignorando cache)`);
    }
    
    // Verificar se temos a partida em cache e se é recente
    const now = Date.now();
    const cachedMatch = matchCache[matchId];
    
    if (!forceFresh && cachedMatch && (now - cachedMatch.timestamp < CACHE_EXPIRATION)) {
      console.log(`API Match: Retornando dados do cache para ${matchId}`);
      return NextResponse.json(cachedMatch.data);
    }
    
    // Obter sessão do usuário para autorização - tornando opcional para facilitar debugging
    let userId = 'unknown';
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch (authError) {
      console.warn(`API Match: Erro ao obter sessão, continuando sem autenticação: ${authError}`);
    }
    
    console.log(`API Match: Usuário ${userId} buscando partida ${matchId}`);
    
    // Conectar ao banco de dados
    let db;
    try {
      const dbConnection = await connectToDatabase();
      db = dbConnection.db;
    } catch (dbError) {
      console.error(`API Match: Erro ao conectar ao banco de dados: ${dbError}`);
      return NextResponse.json({ error: 'Erro de conexão com banco de dados' }, { status: 500 });
    }
    
    // Buscar partida do banco de dados
    let match;
    
    try {
      // Usar uma query mais ampla para garantir que a partida seja encontrada
      const query: any = {
        $or: [
          { matchId: matchId },
          { match_id: matchId }
        ]
      };
      
      // Adicionar busca por ObjectId se for válido
      if (ObjectId.isValid(matchId)) {
        query.$or.push({ _id: new ObjectId(matchId) });
      }
      
      console.log(`API Match: Consultando partida com query:`, JSON.stringify(query));
      
      // Buscar todas as partidas do sistema para debug
      const allMatches = await db.collection('matches').find({}).limit(5).toArray();
      console.log(`API Match: Total de partidas no banco: ${allMatches.length}`);
      if (allMatches.length > 0) {
        console.log(`API Match: Amostra de IDs: ${allMatches.map(m => m.matchId || m._id).join(', ')}`);
      }
      
      // Buscar a partida específica
      match = await db.collection('matches').findOne(query);
      
      console.log(`API Match: Resultado da busca: ${match ? 'Partida encontrada' : 'Partida não encontrada'}`);
      if (match) {
        console.log(`API Match: Detalhes da partida encontrada:`, JSON.stringify({
          id: match._id.toString(),
          matchId: match.matchId,
          status: match.status,
          playersCount: match.players?.length || 0,
          teamsCount: match.teams?.length || 0
        }));
      }
    } catch (error) {
      console.error(`API Match: Erro ao buscar partida: ${error}`);
      return NextResponse.json({ error: 'Erro ao buscar partida' }, { status: 500 });
    }
    
    if (!match) {
      return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 });
    }
    
    // Simplificar a resposta para evitar processamento excessivo
    // Converter _id para string para facilitar uso no frontend
    const result = {
      ...match,
      _id: match._id.toString(),
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
    
    console.log(`API Match: Resposta preparada com sucesso para ${matchId}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`API Match: Erro geral na rota: ${error}`);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 