import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';

// Interface para entrada de ranking
interface RankingEntry {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  wins: number;
  losses: number;
  winRate: number;
  betCount: number;
  totalWagered: number;
  totalWon: number;
  biggestWin: number;
  rank: number;
}

// GET - Obter rankings dos jogadores
export async function GET(req: NextRequest) {
  try {
    // Obter parâmetros de consulta
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'winrate'; // winrate, totalWon, biggestWin
    const period = url.searchParams.get('period') || 'week'; // all, week, month
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    // Conectar ao MongoDB
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      );
    }
    
    // Preparar filtros baseados no período
    const dateFilter: any = {};
    const now = new Date();
    
    if (period === 'week') {
      // Última semana
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter.createdAt = { $gte: weekAgo };
    } else if (period === 'month') {
      // Último mês
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter.createdAt = { $gte: monthAgo };
    }
    
    // Pipeline de agregação para calcular estatísticas relevantes
    const pipeline = [
      // Filtrar pelo período, se aplicável
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
      
      // Agrupar por usuário
      {
        $group: {
          _id: '$userId',
          betCount: { $sum: 1 },
          wins: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } },
          totalWagered: { $sum: '$amount' },
          totalWon: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, '$potentialWin', 0] } },
          biggestWin: { $max: { $cond: [{ $eq: ['$status', 'won'] }, '$potentialWin', 0] } }
        }
      },
      
      // Calcular campos adicionais
      {
        $project: {
          _id: 0,
          userId: '$_id',
          betCount: 1,
          wins: 1,
          losses: 1,
          totalWagered: 1,
          totalWon: 1,
          biggestWin: 1,
          winRate: {
            $cond: [
              { $eq: [{ $add: ['$wins', '$losses'] }, 0] },
              0,
              { $multiply: [{ $divide: ['$wins', { $add: ['$wins', '$losses'] }] }, 100] }
            ]
          },
          score: {
            $cond: {
              if: { $eq: [{ $add: ['$wins', '$losses'] }, 0] },
              then: 0,
              else: {
                $add: [
                  { $multiply: [{ $divide: ['$wins', { $add: ['$wins', '$losses'] }] }, 50] },
                  { $multiply: [{ $ln: { $add: ['$totalWon', 1] } }, 10] },
                  { $multiply: [{ $ln: { $add: ['$betCount', 1] } }, 5] }
                ]
              }
            }
          }
        }
      },
      
      // Ordenar com base no tipo de ranking solicitado
      {
        $sort: type === 'winrate' 
          ? { winRate: -1, betCount: -1 } 
          : type === 'totalWon' 
            ? { totalWon: -1 } 
            : type === 'biggestWin' 
              ? { biggestWin: -1 }
              : { score: -1 }
      },
      
      // Limitar quantidade de resultados
      { $limit: limit }
    ];
    
    // Executar agregação
    const rankingData = await db.collection('bets').aggregate(pipeline).toArray();
    
    // Obter informações dos usuários para completar o ranking
    const userIds = rankingData.map(entry => entry.userId);
    
    // Buscar detalhes dos usuários pelo ID
    const users = await db.collection('users').find(
      { _id: { $in: userIds.map(id => new mongoose.Types.ObjectId(id)) } },
      { projection: { _id: 1, username: 1, 'profile.name': 1, 'profile.avatar': 1 } }
    ).toArray();
    
    // Mapa para acesso rápido às informações do usuário
    const userMap = users.reduce((map, user) => {
      map[user._id.toString()] = {
        username: user.username,
        name: user.profile?.name || user.username,
        avatar: user.profile?.avatar
      };
      return map;
    }, {} as Record<string, any>);
    
    // Formatar dados do ranking com informações do usuário
    const formattedRanking: RankingEntry[] = rankingData.map((entry, index) => ({
      id: entry.userId,
      userId: entry.userId,
      username: userMap[entry.userId]?.username || 'Usuário Desconhecido',
      avatar: userMap[entry.userId]?.avatar,
      score: Math.round(entry.score * 100) / 100,
      wins: entry.wins,
      losses: entry.losses,
      winRate: Math.round(entry.winRate * 100) / 100,
      betCount: entry.betCount,
      totalWagered: entry.totalWagered,
      totalWon: entry.totalWon,
      biggestWin: entry.biggestWin,
      rank: index + 1
    }));
    
    // Retornar dados formatados
    return NextResponse.json({
      rankings: formattedRanking,
      type,
      period,
      updatedAt: now
    });
  } catch (error) {
    console.error('Erro ao obter rankings:', error);
    return NextResponse.json(
      { error: 'Erro ao obter rankings' },
      { status: 500 }
    );
  }
} 