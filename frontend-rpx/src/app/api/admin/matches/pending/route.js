import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

// Antes das funções, adicionar interface para o tipo de jogador


/**
 * API para obter partidas pendentes de configuração pelo admin
 * Lista todas as partidas com status 'waiting_admin'
 */
export async function GET(request) {
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error: error || 'Não autorizado'
      }, { status: 401 });
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Verificar se o usuário é administrador
    const userInfo = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { isAdmin: 1 } }
    );
    
    if (!userInfo?.isAdmin) {
      return NextResponse.json({
        status: 'error',
        error: 'Apenas administradores podem acessar partidas pendentes'
      }, { status: 403 });
    }
    
    // Buscar partidas pendentes (status waiting_admin)
    const pendingMatches = await db.collection('matches')
      .find({ 
        status: 'waiting_admin',
        salaConfigurada: { $ne: true }
      })
      .sort({ createdAt: -1 }) // Mais recentes primeiro
      .limit(50) // Limitar número de resultados
      .toArray();
    
    // Contar o total de partidas pendentes
    const totalPending = await db.collection('matches').countDocuments({
      status: 'waiting_admin',
      salaConfigurada: { $ne: true }
    });
    
    // Formatar a resposta para exibição na interface do admin
    const formattedMatches = pendingMatches.map(match => ({
      matchId: match.matchId,
      gameType: match.gameType,
      platformMode: match.platformMode || 'cualquier',
      gameplayMode: match.gameplayMode || 'normal',
      createdAt: match.createdAt,
      playersCount: match.players?.length || 0,
      lobbies: match.lobbies || [],
      // Preparar resumo dos jogadores para mostrar na interface
      playersSummary: (match.players || []).map((p) => ({
        userId: p.userId,
        username: p.username,
        avatar: p.avatar
      }))
    }));
    
    return NextResponse.json({
      status: 'success',
      matches: formattedMatches,
      total: totalPending,
      count: formattedMatches.length
    });
  } catch (error) {
    console.error('Erro ao listar partidas pendentes:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro interno ao listar partidas: ' + (error.message || 'erro desconhecido')
    }, { status: 500 });
  }
} 