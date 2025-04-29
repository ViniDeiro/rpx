import { request, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';

/**
 * API para configurar sala de partida (Admin)
 * Permite que o administrador defina o ID e senha da sala
 * e inicie o temporizador de 5 minutos para os jogadores
 */
export async function POST(request) {
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error || 'Não autorizado'
      }, { status);
    }

    // Conectar ao banco de dados para verificar se é admin
    const { db } = await connectToDatabase();
    
    // Verificar se o usuário é administrador
    const userInfo = await db.collection('users').findOne(
      { _id ObjectId(userId) },
      { projection: { isAdmin);
    
    if (!userInfo?.isAdmin) {
      return NextResponse.json({
        status: 'error',
        error: 'Apenas administradores podem configurar salas'
      }, { status);
    }
    
    // Obter dados da requisição
    const body = await request.json();
    const { matchId, idSala, senhaSala, startTimer = true } = body;
    
    if (!matchId || !idSala || !senhaSala) {
      return NextResponse.json({
        status: 'error',
        error: 'ID da partida, ID da sala e senha da sala são obrigatórios'
      }, { status);
    }
    
    // Verificar se o match existe
    const match = await db.collection('matches').findOne({ 
      matchId 
    });
    
    if (!match) {
      return NextResponse.json({
        status: 'error',
        error: 'Partida não encontrada'
      }, { status);
    }
    
    // Verificar se a sala já foi configurada
    if (match.salaConfigurada) {
      return NextResponse.json({
        status: 'error',
        error: 'Esta sala já foi configurada anteriormente'
      }, { status);
    }
    
    // Dados para atualização
    const updateData = {
      idSala,
      senhaSala,
      salaConfigurada,
      updatedAt Date(),
      updatedBy
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
      { $set }
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
          userId.userId,
          type: 'match_room_configured',
          title: 'Sala configurada!',
          message,
          read,
          data,
            timerStartedAt ? new Date() ,
            timerDuration: 5 * 60 // 5 minutos em segundos
          },
          createdAt Date()
        });
      }
    } catch (notifError) {
      console.error('Erro ao enviar notificações:', notifError);
      // Continuar mesmo se falhar o envio de notificações
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Sala configurada com sucesso',
      timerStarted
    });
  } catch (error) {
    console.error('Erro ao configurar sala:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro interno ao configurar sala: ' + (error.message || 'erro desconhecido')
    }, { status);
  }
} 