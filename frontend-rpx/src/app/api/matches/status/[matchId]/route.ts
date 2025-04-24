import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

/**
 * API para verificar o status de uma partida
 * Retorna informações sobre a sala, ID, senha e tempo restante
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error: error || 'Não autorizado'
      }, { status: 401 });
    }
    
    const matchId = params.matchId;
    
    if (!matchId) {
      return NextResponse.json({
        status: 'error',
        error: 'ID da partida não fornecido'
      }, { status: 400 });
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Buscar a partida
    const match = await db.collection('matches').findOne({ 
      matchId,
      players: { 
        $elemMatch: { 
          userId: userId 
        } 
      }
    });
    
    if (!match) {
      return NextResponse.json({
        status: 'error',
        error: 'Partida não encontrada ou você não é participante'
      }, { status: 404 });
    }
    
    // Verificar se a sala foi configurada
    const isSalaConfigurada = match.salaConfigurada === true;
    
    // Calcular tempo restante se o timer estiver ativo
    let tempoRestante = null;
    
    if (match.timerStarted && match.timerStartedAt) {
      const timerStartedAt = new Date(match.timerStartedAt);
      const agora = new Date();
      const duracaoTimer = match.timerDuration || 5 * 60; // 5 minutos em segundos
      
      // Tempo decorrido em segundos
      const tempoDecorrido = Math.floor((agora.getTime() - timerStartedAt.getTime()) / 1000);
      
      // Tempo restante em segundos (não pode ser negativo)
      tempoRestante = Math.max(0, duracaoTimer - tempoDecorrido);
    }
    
    // Construir a resposta
    const response: any = {
      status: 'success',
      matchId: match.matchId,
      gameType: match.gameType,
      platformMode: match.platformMode,
      gameplayMode: match.gameplayMode,
      currentStatus: match.status,
      salaConfigurada: isSalaConfigurada,
      timerStarted: match.timerStarted || false
    };
    
    // Adicionar informações da sala se estiver configurada
    if (isSalaConfigurada) {
      response.idSala = match.idSala;
      response.senhaSala = match.senhaSala;
    }
    
    // Adicionar tempo restante se o timer estiver ativo
    if (tempoRestante !== null) {
      response.tempoRestante = tempoRestante;
      response.tempoRestanteFormatado = formatarTempoRestante(tempoRestante);
    }
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Erro ao verificar status da partida:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro interno ao verificar status: ' + (error.message || 'erro desconhecido')
    }, { status: 500 });
  }
}

/**
 * Formata o tempo restante em formato legível (mm:ss)
 */
function formatarTempoRestante(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const segundosRestantes = segundos % 60;
  
  return `${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
} 