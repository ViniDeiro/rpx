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

// Verificar se usuário é participante da partida
async function isMatchParticipant(tournament, matchId, userId) {
  const match = tournament.matches.find((m) => m._id ? m._id ? m._id.toString() : "" : "" === matchId);
  
  if (!match) return false;
  
  const isParticipant1 = match.participant1Id && match.participant1Id ? match.participant1Id.toString() : "" === userId;
  const isParticipant2 = match.participant2Id && match.participant2Id ? match.participant2Id.toString() : "" === userId;
  
  return isParticipant1 || isParticipant2;
}

// POST resultado de uma partida específica
export async function POST(
  request, 
  { params }
) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 400 });
    }
    
    const { id: tournamentId, matchId } = params;
    
    if (!tournamentId || !matchId) {
      return NextResponse.json({
        status: 'error',
        error: 'ID do torneio ou da partida não fornecido'
      }, { status: 400 });
    }
    
    // Obter dados da requisição
    const body = await request.json();
    const { score1, score2, winnerId } = body;
    
    // Validar entrada
    if (score1 === undefined || score2 === undefined || !winnerId) {
      return NextResponse.json({
        status: 'error',
        error: 'Dados de resultado incompletos'
      }, { status: 400 });
    }
    
    // Conectar ao banco de dados
    await connectToDatabase();
    
    // Buscar o torneio
    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      return NextResponse.json({
        status: 'error',
        error: 'Torneio não encontrado'
      }, { status: 400 });
    }
    
    // Verificar se o torneio está em andamento
    if (tournament.status !== 'in_progress') {
      return NextResponse.json({
        status: 'error',
        error: 'O torneio não está em andamento'
      }, { status: 400 });
    }
    
    // Verificar se o usuário é um participante da partida ou administrador
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({
      _id: new mongoose.Types.ObjectId(userId)
    });
    
    const isAdmin = user?.role === 'admin' || user?.isAdmin === true;
    const isParticipant = await isMatchParticipant(tournament, matchId, userId);
    
    if (!isAdmin && !isParticipant) {
      return NextResponse.json({
        status: 'error',
        error: 'Você não tem permissão para reportar este resultado'
      }, { status: 400 });
    }
    
    // Localizar a partida no torneio
    const matchIndex = tournament.matches.findIndex((m) => m._id ? m._id ? m._id.toString() : "" : "" === matchId);
    
    if (matchIndex === -1) {
      return NextResponse.json({
        status: 'error',
        error: 'Partida não encontrada neste torneio'
      }, { status: 400 });
    }
    
    const match = tournament.matches[matchIndex];
    
    // Verificar se a partida está em andamento e tem dois participantes
    if (match.status !== 'in_progress' && match.status !== 'scheduled') {
      return NextResponse.json({
        status: 'error',
        error: 'Esta partida já foi finalizada ou cancelada'
      }, { status: 400 });
    }
    
    if (!match.participant1Id || !match.participant2Id) {
      return NextResponse.json({
        status: 'error',
        error: 'Esta partida não tem todos os participantes definidos'
      }, { status: 400 });
    }
    
    // Verificar se o vencedor é um dos participantes
    const isWinnerParticipant = 
      (match.participant1Id && match.participant1Id.toString() === winnerId) || 
      (match.participant2Id && match.participant2Id.toString() === winnerId);
    
    if (!isWinnerParticipant) {
      return NextResponse.json({
        status: 'error',
        error: 'O vencedor reportado não é um participante desta partida'
      }, { status: 400 });
    }
    
    // Determinar o perdedor
    const loserId = match.participant1Id ? match.participant1Id ? match.participant1Id.toString() : "" : "" === winnerId 
      ? match.participant2Id ? match.participant2Id ? match.participant2Id.toString() : "" : ""
      : match.participant1Id ? match.participant1Id.toString() : "";
    
    // Atualizar o resultado da partida
    tournament.matches[matchIndex].score1 = score1;
    tournament.matches[matchIndex].score2 = score2;
    tournament.matches[matchIndex].winnerId = new mongoose.Types.ObjectId(winnerId);
    tournament.matches[matchIndex].loserId = new mongoose.Types.ObjectId(loserId);
    tournament.matches[matchIndex].status = 'completed';
    tournament.matches[matchIndex].endTime = new Date();
    
    // Avançar o vencedor para a próxima partida (se houver)
    if (match.nextMatchId) {
      const nextMatchIndex = tournament.matches.findIndex(
        (m) => m.bracketPosition === match.nextMatchId
      );
      
      if (nextMatchIndex !== -1) {
        const nextMatch = tournament.matches[nextMatchIndex];
        
        // Determinar qual slot do próximo match deve receber o vencedor
        // Isso depende da estrutura do bracket, mas geralmente:
        // - Partidas ímpares enviam o vencedor para o slot 1 do próximo match
        // - Partidas pares enviam o vencedor para o slot 2 do próximo match
        if (match.matchNumber % 2 === 1) {
          tournament.matches[nextMatchIndex].participant1Id = new mongoose.Types.ObjectId(winnerId);
        } else {
          tournament.matches[nextMatchIndex].participant2Id = new mongoose.Types.ObjectId(winnerId);
        }
        
        // Se ambos os participantes já estiverem definidos, atualizar o status da próxima partida
        if (tournament.matches[nextMatchIndex].participant1Id && tournament.matches[nextMatchIndex].participant2Id) { 
          tournament.matches[nextMatchIndex].status = 'scheduled';
        }
      }
    }
    
    // Se houver uma chave de perdedores, avançar o perdedor (para double elimination)
    if (match.nextLoseMatchId) {
      const nextLoseMatchIndex = tournament.matches.findIndex(
        (m) => m.bracketPosition === match.nextLoseMatchId
      );
      
      if (nextLoseMatchIndex !== -1) {
        // Similar à lógica acima, colocar o perdedor no slot apropriado
        if (match.matchNumber % 2 === 1) {
          tournament.matches[nextLoseMatchIndex].participant1Id = new mongoose.Types.ObjectId(loserId);
        } else {
          tournament.matches[nextLoseMatchIndex].participant2Id = new mongoose.Types.ObjectId(loserId);
        }
        
        // Atualizar status se necessário
        if (tournament.matches[nextLoseMatchIndex].participant1Id && tournament.matches[nextLoseMatchIndex].participant2Id) { 
          tournament.matches[nextLoseMatchIndex].status = 'scheduled';
        }
      }
    }
    
    // Verificar se todas as partidas foram concluídas para finalizar o torneio
    const allMatchesCompleted = tournament.matches.every((m) => 
      m.status === 'completed' || m.status === 'cancelled'
    );
    
    if (allMatchesCompleted) { 
      tournament.status = 'completed';
    }
    
    // Salvar as alterações
    await tournament.save();
    
    return NextResponse.json({
      status: 'success',
      message: 'Resultado reportado com sucesso',
      data: {
        status: 'completed',
        tournamentStatus: tournament.status
      }
    });
  } catch (error) {
    console.error('Erro ao reportar resultado de partida:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao processar requisição'
    }, { status: 400 });
  }
} 