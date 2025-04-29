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
    return { isAuth: false, error: 'Não autorizado', userId: null };
  }
  
  return { isAuth: true, error: null, userId: session.user.id };
}

// POST: Inscrever usuário em um torneio
export async function POST(request, { params }) {
  try {
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
    
    // Validar se o ID é um ObjectID válido
    if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
      return NextResponse.json({
        status: 'error',
        error: 'ID do torneio inválido'
      }, { status: 400 });
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
      }, { status: 404 });
    }
    
    // Verificar se o torneio está aberto para inscrições
    if (tournament.status !== 'registration') {
      return NextResponse.json({
        status: 'error',
        error: 'Este torneio não está aceitando inscrições no momento'
      }, { status: 400 });
    }
    
    // Verificar se o torneio atingiu o limite de participantes
    if (tournament.currentParticipants >= tournament.maxParticipants) {
      return NextResponse.json({
        status: 'error',
        error: 'Torneio com número máximo de participantes atingido'
      }, { status: 400 });
    }
    
    // Verificar se o usuário já está inscrito
    const existingParticipant = tournament.participants.find(p => 
      p.userId.toString() === userId.toString()
    );
    
    if (existingParticipant) {
      return NextResponse.json({
        status: 'error',
        error: 'Você já está inscrito neste torneio'
      }, { status: 400 });
    }
    
    // Adicionar participante
    try {
      await tournament.addParticipant(userId, teamId || null);
      
      return NextResponse.json({
        status: 'success',
        message: 'Inscrição realizada com sucesso',
        data: {
          tournamentId: tournament._id,
          tournamentName: tournament.name,
          registeredAt: new Date(),
          entryFee: tournament.entryFee,
          paymentStatus: tournament.entryFee > 0 ? 'pending' : 'completed'
        }
      });
    } catch (addError) {
      return NextResponse.json({
        status: 'error',
        error: addError.message || 'Erro ao processar inscrição'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro ao inscrever-se no torneio:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao processar inscrição'
    }, { status: 500 });
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
    
    // Buscar o torneio
    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      return NextResponse.json({
        status: 'error',
        error: 'Torneio não encontrado'
      }, { status: 404 });
    }
    
    // Verificar se o torneio já começou
    if (tournament.status === 'in_progress' || tournament.status === 'completed') {
      return NextResponse.json({
        status: 'error',
        error: 'Não é possível cancelar inscrição em torneio já iniciado ou finalizado'
      }, { status: 400 });
    }
    
    // Verificar se o usuário está inscrito
    const participantIndex = tournament.participants.findIndex(p => 
      p.userId.toString() === userId.toString()
    );
    
    if (participantIndex === -1) {
      return NextResponse.json({
        status: 'error',
        error: 'Você não está inscrito neste torneio'
      }, { status: 400 });
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
    }, { status: 500 });
  }
} 