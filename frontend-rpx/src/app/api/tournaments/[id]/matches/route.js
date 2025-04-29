import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Tournament from '@/models/Tournament';
import mongoose from 'mongoose';

// Middleware para verificar autenticação
async function isAuthenticated() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.id) {
    return { isAuth: false, error: 'Não autorizado', userId: null }
  }
  
  return { isAuth: true, error: null, userId: session.user.id }
}

// GET: Obter todas as partidas de um torneio
export async function GET(request, { params }) {
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
    const tournamentData = await Tournament.findById(tournamentId)
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
    
    if (!tournamentData) {
      return NextResponse.json({
        status: 'error',
        error: 'Torneio não encontrado'
      }, { status: 400 });
    }
    
    // Tratando os dados do torneio de forma segura
    const tournament = tournamentData;
    
    // Organizar matches por rodadas
    const matchesByRound = {};
    
    // Verificar se o torneio tem a propriedade matches
    if (!tournament.matches || !Array.isArray(tournament.matches)) {
      return NextResponse.json({
        status: 'success',
        data: {
          tournamentName: tournament.name,
          bracketType: tournament.bracketType,
          status: tournament.status,
          matches: []
        }
      });
    }
    
    tournament.matches.forEach((match) => {
      if (!matchesByRound[match.roundNumber]) {
        matchesByRound[match.roundNumber] = [];
      }
      
      matchesByRound[match.roundNumber].push(match);
    });
    
    // Classificar matches de cada rodada por número da partida
    Object.keys(matchesByRound).forEach(round => {
      matchesByRound[round].sort((a, b) => a.matchNumber - b.matchNumber);
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
    }, { status: 400 });
  }
}

// POST: Gerar o bracket do torneio
export async function POST(request, { params }) {
  try {
    // Verificar autenticação de admin (usando a função existente)
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 400 });
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
      }, { status: 400 });
    }
    
    // Buscar o torneio
    const tournamentData = await Tournament.findById(tournamentId);
    
    if (!tournamentData) {
      return NextResponse.json({
        status: 'error',
        error: 'Torneio não encontrado'
      }, { status: 400 });
    }
    
    // Verificar se o torneio está pronto para gerar o bracket
    if (tournamentData.status !== 'registration') {
      return NextResponse.json({
        status: 'error',
        error: 'O torneio não está em fase de inscrição'
      }, { status: 400 });
    }
    
    if (tournamentData.participants.length < tournamentData.minParticipants) {
      return NextResponse.json({
        status: 'error',
        error: `O torneio precisa de pelo menos ${tournamentData.minParticipants} participantes confirmados`
      }, { status: 400 });
    }
    
    // Gerar o bracket
    try {
      await tournamentData.generateBracket();
      
      return NextResponse.json({
        status: 'success',
        message: 'Bracket gerado com sucesso',
        data: {
          tournamentId,
          status: 'in_progress',
          matchCount: tournamentData.matches.length
        }
      });
    } catch (genError) {
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
    }, { status: 400 });
  }
} 