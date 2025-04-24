import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

/**
 * API para configurar sala de partida (Admin)
 * Permite que o administrador defina o ID e senha da sala
 * e inicie o temporizador de 5 minutos para os jogadores
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error: error || 'Não autorizado'
      }, { status: 401 });
    }

    // Conectar ao banco de dados para verificar se é admin
    const { db } = await connectToDatabase();
    
    // Verificar se o usuário é administrador
    const userInfo = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { isAdmin: 1 } }
    );
    
    if (!userInfo?.isAdmin) {
      return NextResponse.json({
        status: 'error',
        error: 'Apenas administradores podem configurar salas'
      }, { status: 403 });
    }
    
    // Obter dados da requisição
    const body = await request.json();
    const { matchId, idSala, senhaSala, startTimer = true } = body;
    
    if (!matchId || !idSala || !senhaSala) {
      return NextResponse.json({
        status: 'error',
        error: 'ID da partida, ID da sala e senha da sala são obrigatórios'
      }, { status: 400 });
    }
    
    // Verificar se o match existe
    const match = await db.collection('matches').findOne({ 
      matchId 
    });
    
    if (!match) {
      return NextResponse.json({
        status: 'error',
        error: 'Partida não encontrada'
      }, { status: 404 });
    }
    
    // Verificar se a sala já foi configurada
    if (match.salaConfigurada) {
      return NextResponse.json({
        status: 'error',
        error: 'Esta sala já foi configurada anteriormente'
      }, { status: 400 });
    }
    
    // Dados para atualização
    const updateData: any = {
      idSala,
      senhaSala,
      salaConfigurada: true,
      updatedAt: new Date(),
      updatedBy: userId
    };
    
    // Se deve iniciar o temporizador
    if (startTimer) {
      updateData.timerStarted = true;
      updateData.timerStartedAt = new Date();
      updateData.status = 'in_progress';
    }
    
    // Atualizar o match com as informações da sala
    await db.collection('matches').updateOne(
      { matchId },
      { $set: updateData }
    );
    
    // Enviar notificações para os jogadores
    try {
      const notificationMessage = startTimer 
        ? 'A sala foi configurada! Você tem 5 minutos para entrar no jogo.' 
        : 'A sala foi configurada! Verifique os detalhes da partida.';
      
      // Buscar todos os jogadores da partida
      const players = match.players || [];
      
      // Enviar notificação para cada jogador
      for (const player of players) {
        await db.collection('notifications').insertOne({
          userId: player.userId,
          type: 'match_room_configured',
          title: 'Sala configurada!',
          message: notificationMessage,
          read: false,
          data: {
            matchId,
            idSala,
            senhaSala,
            timerStarted: startTimer,
            timerStartedAt: startTimer ? new Date() : null,
            timerDuration: 5 * 60 // 5 minutos em segundos
          },
          createdAt: new Date()
        });
      }
    } catch (notifError) {
      console.error('Erro ao enviar notificações:', notifError);
      // Continuar mesmo se falhar o envio de notificações
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Sala configurada com sucesso',
      timerStarted: startTimer
    });
  } catch (error: any) {
    console.error('Erro ao configurar sala:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro interno ao configurar sala: ' + (error.message || 'erro desconhecido')
    }, { status: 500 });
  }
} 