import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Middleware de autenticação
async function authenticateUser(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return { error: 'Não autorizado', status: 401 };
  }
  
  return { userId: session.user.id, username: session.user.name };
}

// GET /api/matches - Listar partidas
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateUser(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    
    const { userId } = auth;
    
    // Parâmetros de consulta
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const gameType = searchParams.get('gameType');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');
    
    // Construir filtro
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (gameType) {
      filter.gameType = gameType;
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Contar total de partidas que correspondem ao filtro
    const total = await db.collection('matches').countDocuments(filter);
    
    // Buscar partidas
    const matches = await db.collection('matches')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Formatar resposta
    const formattedMatches = await Promise.all(matches.map(async (match) => {
      // Verificar se o usuário está na partida
      const isPlayerInMatch = match.players.includes(userId);
      
      // Buscar informações dos jogadores
      const playerIds = match.players.map((id: string) => 
        ObjectId.isValid(id) ? new ObjectId(id) : id
      );
      
      const playersInfo = await db.collection('users')
        .find({ 
          $or: [
            { _id: { $in: playerIds } },
            { id: { $in: match.players } }
          ]
        })
        .project({
          _id: 1,
          id: 1,
          username: 1,
          name: 1,
          avatarUrl: 1
        })
        .toArray();
      
      // Mapear informações dos jogadores
      const mappedPlayersInfo = playersInfo.map((player: any) => ({
        _id: player.id || player._id.toString(),
        username: player.username || player.name,
        avatarUrl: player.avatarUrl || null
      }));
      
      return {
        ...match,
        _id: match._id.toString(),
        playersInfo: mappedPlayersInfo,
        isPlayerInMatch
      };
    }));
    
    return NextResponse.json({
      matches: formattedMatches,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total
      }
    });
    
  } catch (error) {
    console.error('Erro ao listar partidas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/matches - Criar nova partida
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateUser(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    
    const { userId } = auth;
    
    // Obter dados da requisição
    const data = await req.json();
    const { title, gameType, maxPlayers, entryFee, players = [] } = data;
    
    // Validar dados obrigatórios
    if (!gameType || !maxPlayers) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Garantir que o criador da partida está incluído nos jogadores
    const uniquePlayers = [...new Set([userId, ...players])];
    
    // Criar nova partida
    const match = {
      title: title || `Partida ${gameType.toUpperCase()}`,
      gameType,
      maxPlayers,
      entryFee: entryFee || 0,
      status: 'waiting',
      players: uniquePlayers,
      confirmedPlayers: [],
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Inserir no banco de dados
    const result = await db.collection('matches').insertOne(match);
    
    if (!result.insertedId) {
      return NextResponse.json(
        { error: 'Erro ao criar partida' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      match: {
        ...match,
        _id: result.insertedId.toString()
      }
    });
    
  } catch (error) {
    console.error('Erro ao criar partida:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 