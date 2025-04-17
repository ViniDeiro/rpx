import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Tournament from '@/models/Tournament';
import mongoose from 'mongoose';

// Middleware para verificar autenticação
async function isAuthenticated() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.id) {
    return { isAuth: false, error: 'Não autorizado', userId: null };
  }
  
  return { isAuth: true, error: null, userId: session.user.id };
}

// GET: Obter todas as partidas de um torneio
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tournamentId = params.id;
    
    if (!tournamentId) {
      return NextResponse.json({
        status: 'error',
        error: 'ID do torneio não fornecido'
      }, { status: 400 });
    }
    
    // Conectar ao banco de dados
    await connectToDatabase();
    
    // Buscar o torneio com populate para participantes e matches
    const tournament = await Tournament.findById(tournamentId)
      .populate([
        {
          path: 'participants.userId',
          select: 'username avatar'
        },
        {
          path: 'matches.participant1Id',
          select: 'username avatar'
        },
        {
          path: 'matches.participant2Id',
          select: 'username avatar'
        }
      ])
      .lean();
    
    if (!tournament) {
      return NextResponse.json({
        status: 'error',
        error: 'Torneio não encontrado'
      }, { status: 404 });
    }
    
    // Organizar matches por rodadas
    const matchesByRound: any = {};
    
    tournament.matches.forEach((match: any) => {
      if (!matchesByRound[match.roundNumber]) {
        matchesByRound[match.roundNumber] = [];
      }
      
      matchesByRound[match.roundNumber].push(match);
    });
    
    // Classificar matches de cada rodada por número da partida
    Object.keys(matchesByRound).forEach(round => {
      matchesByRound[round].sort((a: any, b: any) => a.matchNumber - b.matchNumber);
    });
    
    return NextResponse.json({
      status: 'success',
      data: {
        tournamentName: tournament.name,
        bracketType: tournament.bracketType,
        status: tournament.status,
        matches: matchesByRound
      }
    });
  } catch (error) {
    console.error('Erro ao buscar partidas do torneio:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao buscar partidas'
    }, { status: 500 });
  }
}

// Endpoint para gerar o bracket do torneio
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticação de admin (usando a função existente)
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 401 });
    }
    
    const tournamentId = params.id;
    
    if (!tournamentId) {
      return NextResponse.json({
        status: 'error',
        error: 'ID do torneio não fornecido'
      }, { status: 400 });
    }
    
    // Conectar ao banco de dados
    await connectToDatabase();
    
    // Verificar se o usuário é administrador (lógica simplificada)
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({
      _id: new mongoose.Types.ObjectId(userId)
    });
    
    const isAdmin = user?.role === 'admin' || user?.isAdmin === true;
    
    if (!isAdmin) {
      return NextResponse.json({
        status: 'error',
        error: 'Acesso restrito a administradores'
      }, { status: 403 });
    }
    
    // Buscar o torneio
    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      return NextResponse.json({
        status: 'error',
        error: 'Torneio não encontrado'
      }, { status: 404 });
    }
    
    // Verificar se o torneio está pronto para gerar o bracket
    if (tournament.status !== 'registration') {
      return NextResponse.json({
        status: 'error',
        error: 'O torneio não está em fase de inscrição'
      }, { status: 400 });
    }
    
    if (tournament.participants.length < tournament.minParticipants) {
      return NextResponse.json({
        status: 'error',
        error: `O torneio precisa de pelo menos ${tournament.minParticipants} participantes confirmados`
      }, { status: 400 });
    }
    
    // Gerar o bracket
    try {
      await tournament.generateBracket();
      
      return NextResponse.json({
        status: 'success',
        message: 'Bracket gerado com sucesso',
        data: {
          tournamentId: tournament._id,
          status: 'in_progress',
          matchCount: tournament.matches.length
        }
      });
    } catch (genError: any) {
      return NextResponse.json({
        status: 'error',
        error: genError.message || 'Erro ao gerar bracket'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro ao gerar bracket do torneio:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao processar requisição'
    }, { status: 500 });
  }
} 