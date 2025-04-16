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

// GET /api/games/[id] - Obter informações de um jogo específico
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const auth = await authenticateUser(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    
    const { userId } = auth;
    const matchId = params.id;
    
    // Validar ID da partida
    if (!matchId || !ObjectId.isValid(matchId)) {
      return NextResponse.json(
        { error: 'ID da partida inválido' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Buscar a partida pelo ID
    const match = await db.collection('matches').findOne({
      _id: new ObjectId(matchId),
      status: 'started'
    });
    
    if (!match) {
      return NextResponse.json(
        { error: 'Jogo não encontrado ou ainda não iniciado' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário está na partida
    const isPlayer = match.players.includes(userId);
    
    if (!isPlayer) {
      return NextResponse.json(
        { error: 'Você não está participando deste jogo' },
        { status: 403 }
      );
    }
    
    // Buscar o jogo relacionado a esta partida
    let game = await db.collection('games').findOne({
      matchId: matchId
    });
    
    // Se o jogo ainda não existe, criar um novo
    if (!game) {
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
      
      // Criar um objeto com o estado inicial do jogo
      const gameData = {
        matchId: matchId,
        status: 'in_progress',
        players: match.players,
        playersInfo: playersInfo.map((player: any) => ({
          id: player.id || player._id.toString(),
          username: player.username || player.name,
          avatarUrl: player.avatarUrl || null,
          score: 0,
          hand: [],
          actions: []
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
        currentTurn: 0,
        currentRound: 1,
        gameState: {
          // Estado inicial do jogo - a ser implementado
          board: [],
          deck: [],
          discardPile: []
        }
      };
      
      // Inserir o novo jogo no banco de dados
      const result = await db.collection('games').insertOne(gameData);
      
      if (!result.insertedId) {
        return NextResponse.json(
          { error: 'Não foi possível criar o jogo' },
          { status: 500 }
        );
      }
      
      // Buscar o jogo recém-criado
      game = await db.collection('games').findOne({
        _id: result.insertedId
      });
    }
    
    if (!game) {
      return NextResponse.json(
        { error: 'Erro ao inicializar o jogo' },
        { status: 500 }
      );
    }
    
    // Formatar o objeto de resposta
    const gameResponse = {
      ...game,
      _id: game._id.toString()
    };
    
    return NextResponse.json({ game: gameResponse });
    
  } catch (error) {
    console.error('Erro ao buscar dados do jogo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 