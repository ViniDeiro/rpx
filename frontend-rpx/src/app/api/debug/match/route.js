import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

/**
 * GET /api/debug/match?matchId=12345
 * 
 * Endpoint para ver detalhes de uma partida, incluindo apostas e usuários
 */
export async function GET(request) {
  try {
    // Verificar se estamos em ambiente de desenvolvimento
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Esta rota só está disponível em ambiente de desenvolvimento' }, 
        { status: 403 }
      );
    }
    
    // Obter ID da partida da URL
    const url = new URL(request.url);
    const matchId = url.searchParams.get('matchId');
    
    if (!matchId) {
      return NextResponse.json({
        error: 'ID da partida não fornecido',
        usage: 'Adicione ?matchId=ID_DA_PARTIDA à URL'
      }, { status: 400 });
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    let match;
    try {
      match = await db.collection('matches').findOne({
        _id: new ObjectId(matchId)
      });
    } catch (e) {
      return NextResponse.json(
        { error: 'ID da partida inválido' }, 
        { status: 400 }
      );
    }
    
    if (!match) {
      return NextResponse.json(
        { error: 'Partida não encontrada' }, 
        { status: 404 }
      );
    }
    
    // Buscar apostas relacionadas a esta partida
    const bets = await db.collection('bets')
      .find({ matchId: matchId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    
    // Obter IDs de usuários envolvidos (apostadores)
    const userIds = [...new Set(bets.map(bet => bet.userId))];
    
    // Buscar detalhes desses usuários
    const users = userIds.length > 0 
      ? await db.collection('users')
          .find({ _id: { $in: userIds.map(id => new ObjectId(id)) } })
          .project({ _id: 1, username: 1, email: 1 })
          .toArray()
      : [];
    
    // Formatar os dados para a resposta
    const formattedMatch = {
      id: match._id ? match._id.toString() : "",
      title: match.title,
      status: match.status,
      startTime: match.startTime,
      endTime: match.endTime,
      teams: match.teams,
      result: match.result,
      totalBets: bets.length,
      bettingTotalAmount: bets.reduce((acc, bet) => acc + (bet.amount || 0), 0),
      createdAt: match.createdAt,
      updatedAt: match.updatedAt
    };
    
    const formattedBets = bets.map(bet => ({
      id: bet._id ? bet._id.toString() : "",
      userId: bet.userId,
      userInfo: users.find(u => u._id ? u._id.toString() : "" === bet.userId) || null,
      amount: bet.amount,
      odd: bet.odd,
      potentialWin: bet.potentialWin,
      type: bet.type,
      selection: bet.selection,
      status: bet.status,
      createdAt: bet.createdAt
    }));
    
    return NextResponse.json({
      match: formattedMatch,
      bets: formattedBets,
      userCount: users.length
    });
    
  } catch (error) {
    console.error('Erro ao obter detalhes da partida:', error);
    return NextResponse.json(
      { error: 'Erro ao obter detalhes da partida', details: error.message }, 
      { status: 500 }
    );
  }
} 