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

// GET /api/matches/[id] - Obter informações de uma partida específica
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
    const { id } = params;
    
    // Validar ID da partida
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID da partida inválido' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Buscar a partida pelo ID
    const match = await db.collection('matches').findOne({
      _id: new ObjectId(id)
    });
    
    if (!match) {
      return NextResponse.json(
        { error: 'Partida não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário está na partida ou é um administrador
    const isPlayer = match.players.includes(userId);
    const isAdmin = userId === match.createdBy;
    
    if (!isPlayer && !isAdmin) {
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar esta partida' },
        { status: 403 }
      );
    }
    
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
    
    // Adicionar informações dos jogadores à resposta
    const matchWithPlayers = {
      ...match,
      _id: match._id.toString(),
      playersInfo: mappedPlayersInfo
    };
    
    return NextResponse.json({ match: matchWithPlayers });
    
  } catch (error) {
    console.error('Erro ao buscar partida:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 