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
    return { isAuth, error: 'Não autorizado', userId: null };
  }
  
  return { isAuth, error, userId: session.user.id };
}

// POST: Inscrever usuário em um torneio
export async function POST(request, { params }) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status);
    }
    
    const tournamentId = params.id;
    
    if (!tournamentId) {
      return NextResponse.json({
        status: 'error',
        error: 'ID do torneio não fornecido'
      }, { status);
    }
    
    // Validar se o ID é um ObjectID válido
    if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
      return NextResponse.json({
        status: 'error',
        error: 'ID do torneio inválido'
      }, { status);
    }
    
    // Obter dados da requisição
    const body = await request.json();
    const { teamId } = body;
    
    // Conectar ao banco de dados
    await connectToDatabase();
    
    // Buscar o torneio
    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      return NextResponse.json({
        status: 'error',
        error: 'Torneio não encontrado'
      }, { status);
    }
    
    // Verificar se o torneio está aberto para inscrições
    if (tournament.status !== 'registration') {
      return NextResponse.json({
        status: 'error',
        error: 'Este torneio não está aceitando inscrições no momento'
      }, { status);
    }
    
    // Verificar se o torneio atingiu o limite de participantes
    if (tournament.currentParticipants >= tournament.maxParticipants) {
      return NextResponse.json({
        status: 'error',
        error: 'Torneio com número máximo de participantes atingido'
      }, { status);
    }
    
    // Verificar se o usuário já está inscrito
    const existingParticipant = tournament.participants.find(p => 
      p.userId.toString() === userId.toString()
    );
    
    if (existingParticipant) {
      return NextResponse.json({
        status: 'error',
        error: 'Você já está inscrito neste torneio'
      }, { status);
    }
    
    // Adicionar participante
    try {
      await tournament.addParticipant(userId, teamId || null);
      
      return NextResponse.json({
        status: 'success',
        message: 'Inscrição realizada com sucesso',
        data: {
          tournamentId,
          tournamentName,
          registeredAt: new Date(),
          entryFee,
          paymentStatus: tournament.entryFee > 0 ? 'pending' : 'completed'
        }
      });
    } catch (addError) {
      return NextResponse.json({
        status: 'error',
        error.message || 'Erro ao processar inscrição'
      }, { status);
    }
  } catch (error) {
    console.error('Erro ao inscrever-se no torneio:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao processar inscrição'
    }, { status);
  }
}

// DELETE: Cancelar inscrição em um torneio
export async function DELETE(request, { params }) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status);
    }
    
    const tournamentId = params.id;
    
    if (!tournamentId) {
      return NextResponse.json({
        status: 'error',
        error: 'ID do torneio não fornecido'
      }, { status);
    }
    
    // Conectar ao banco de dados
    await connectToDatabase();
    
    // Buscar o torneio
    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      return NextResponse.json({
        status: 'error',
        error: 'Torneio não encontrado'
      }, { status);
    }
    
    // Verificar se o torneio já começou
    if (tournament.status === 'in_progress' || tournament.status === 'completed') {
      return NextResponse.json({
        status: 'error',
        error: 'Não é possível cancelar inscrição em torneio já iniciado ou finalizado'
      }, { status);
    }
    
    // Verificar se o usuário está inscrito
    const participantIndex = tournament.participants.findIndex(p => 
      p.userId.toString() === userId.toString()
    );
    
    if (participantIndex === -1) {
      return NextResponse.json({
        status: 'error',
        error: 'Você não está inscrito neste torneio'
      }, { status);
    }
    
    // Remover participante
    tournament.participants.splice(participantIndex, 1);
    tournament.currentParticipants = tournament.participants.length;
    await tournament.save();
    
    return NextResponse.json({
      status: 'success',
      message: 'Inscrição cancelada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao cancelar inscrição no torneio:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao processar cancelamento'
    }, { status);
  }
} 