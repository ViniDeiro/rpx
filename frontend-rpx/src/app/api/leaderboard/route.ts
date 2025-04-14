import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import mongoose from 'mongoose';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';

interface UserStats {
  elo: number;
  wins: number;
  losses: number;
  matches: number;
}

interface TeamMember {
  userId: string;
  role: string;
}

interface UserDocument {
  _id: mongoose.Types.ObjectId;
  username: string;
  displayName?: string;
  avatar?: string;
  stats?: UserStats;
  country?: string;
}

interface TeamDocument {
  _id: mongoose.Types.ObjectId;
  members: TeamMember[];
}

// GET para obter o leaderboard global ou específico
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'global';
    const limit = parseInt(searchParams.get('limit') || '100');
    const teamId = searchParams.get('teamId');
    
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      );
    }
    
    let leaderboardQuery: any = {};
    
    if (type === 'team' && teamId) {
      // Verificar se o ID do time é válido
      if (!mongoose.Types.ObjectId.isValid(teamId)) {
        return NextResponse.json(
          { error: 'ID do time inválido' }, 
          { status: 400 }
        );
      }
      
      // Consultar membros do time para ranking específico da equipe
      const team = await db.collection('teams').findOne(
        { _id: new mongoose.Types.ObjectId(teamId) }
      ) as TeamDocument | null;
      
      if (!team) {
        return NextResponse.json(
          { error: 'Time não encontrado' },
          { status: 404 }
        );
      }
      
      // Extrair IDs dos usuários do time
      const teamUserIds = (team.members || []).map((member: TeamMember) => 
        new mongoose.Types.ObjectId(member.userId)
      );
      
      leaderboardQuery = { _id: { $in: teamUserIds } };
    }
    
    // Buscar usuários e ordenar por pontuação
    const users = await db.collection('users')
      .find(leaderboardQuery)
      .project({
        username: 1,
        displayName: 1,
        avatar: 1,
        stats: 1,
        country: 1
      })
      .sort({ 'stats.elo': -1, 'stats.wins': -1 })
      .limit(limit)
      .toArray() as UserDocument[];
    
    // Mapear usuários para o formato de leaderboard
    const leaderboard = users.map((user: UserDocument, index: number) => ({
      rank: index + 1,
      username: user.username,
      displayName: user.displayName || user.username,
      avatar: user.avatar || null,
      country: user.country || null,
      elo: user.stats?.elo || 1000,
      wins: user.stats?.wins || 0,
      losses: user.stats?.losses || 0,
      winRate: user.stats ? 
        (user.stats.matches > 0 ? 
          Math.round((user.stats.wins / user.stats.matches) * 100) : 0) : 0
    }));
    
    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Erro ao obter leaderboard:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação de leaderboard' },
      { status: 500 }
    );
  }
} 