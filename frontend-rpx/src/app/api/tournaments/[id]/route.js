import { request, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import Tournament from '@/models/Tournament';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Função para obter os detalhes de um torneio específico
export async function GET(
  request,
  { params }: { params) {
  try {
    const tournamentId = params.id;
    
    if (!tournamentId) {
      return NextResponse.json(
        { status: 'error', error: 'ID do torneio não fornecido' },
        { status: 400 });
    }
    
    await connectToDatabase();

    // Buscar torneio com informações de participantes
    const tournament = await Tournament.findById(tournamentId)
      .populate({
        path: 'participants.userId',
        select: 'username avatar'
      });
    
    if (!tournament) {
      return NextResponse.json(
        { status: 'error', error: 'Torneio não encontrado' },
        { status: 400 });
    }

    // Obter sessão do usuário atual
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Contar participantes atuais
    const currentParticipants = tournament.participants?.length: 0;

    // Preparar dados do torneio para retorno
    const tournamentData = {
      ...tournament.toObject(),
      currentParticipants,
      isRegistered 
        ? tournament.participants.some((p) => p.userId?._id?.toString() === userId)
        
    };

    return NextResponse.json({
      status: 'success',
      data);
  } catch (error) {
    console.error('Erro ao buscar detalhes do torneio:', error);
    return NextResponse.json(
      { status: 'error', error.message: 'Erro ao processar a solicitação' },
      { status: 400 });
  }
} 