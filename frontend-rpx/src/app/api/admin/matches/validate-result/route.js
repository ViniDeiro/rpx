import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// Middleware para autenticação
async function isAuthenticated() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.id) {
    return { isAuth: false, error: 'Não autorizado', userId: null };
  }
  
  return { isAuth: true, error: null, userId: session.user.id };
}

// POST resultado da partida
export async function POST(request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error: error
      }, { status: 401 });
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se temos uma conexão válida com o banco
    if (!db) {
      console.error('Validate Result - Erro: conexão com banco de dados falhou');
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 500 });
    }
    
    // Verificar se o usuário é um admin
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId)
    });
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({
        status: 'error',
        error: 'Apenas administradores podem validar resultados'
      }, { status: 403 });
    }
    
    // Obter dados da requisição
    const body = await request.json();
    const { 
      matchId, 
      isValid, 
      validationComment, 
      winnerTeamId,
      distributeRewards 
    } = body;
    
    if (!matchId) {
      return NextResponse.json({
        status: 'error',
        error: 'ID da partida é obrigatório'
      }, { status: 400 });
    }
    
    // Verificar se a partida existe
    const match = await db.collection('matches').findOne({
      _id: new ObjectId(matchId)
    });
    
    if (!match) {
      return NextResponse.json({
        status: 'error',
        error: 'Partida não encontrada'
      }, { status: 404 });
    }
    
    if (match.status !== 'awaiting_validation') {
      return NextResponse.json({
        status: 'error',
        error: 'Esta partida não está aguardando validação'
      }, { status: 400 });
    }
    
    // Se válido e distribuir recompensas está ativado, precisamos de um time vencedor
    if (isValid && distributeRewards && !winnerTeamId) {
      return NextResponse.json({
        status: 'error',
        error: 'ID do time vencedor é obrigatório para distribuir recompensas'
      }, { status: 400 });
    }
    
    // Atualizar status da partida e informações de validação
    const updateData = {
      status: isValid ? 'completed' : 'rejected',
      'resultSubmission.validated': isValid,
      'resultSubmission.validatedBy': new ObjectId(userId),
      'resultSubmission.validatedAt': new Date(),
      'resultSubmission.validationComment': validationComment || null
    };
    
    if (isValid && winnerTeamId) {
      updateData.winnerTeamId = winnerTeamId;
    }
    
    await db.collection('matches').updateOne(
      { _id: new ObjectId(matchId) },
      { $set: updateData }
    );
    
    // Se for válido e distribuir recompensas estiver ativado, calcular e distribuir recompensas
    if (isValid && distributeRewards && winnerTeamId) {
      // Encontrar o time vencedor
      const winnerTeam = match.teams.find((team) => team.lobbyId ? team.lobbyId.toString() : "" === winnerTeamId);
      
      if (winnerTeam && winnerTeam.members) {
        // Distribuir recompensas para cada membro do time vencedor
        // Aqui você implementaria a lógica de negócio para calcular os valores
        // e atualizar o saldo dos usuários
        
        const rewardPerMember = 100; // Valor fictício
        for (const memberId of winnerTeam.members) {
          await db.collection('users').updateOne(
            { _id: new ObjectId(memberId.toString()) },
            { $inc: { balance: rewardPerMember } }
          );
          
          // Registrar a transação
          await db.collection('transactions').insertOne({
            userId: new ObjectId(memberId.toString()),
            type: 'match_reward',
            amount: rewardPerMember,
            matchId: new ObjectId(matchId),
            status: 'completed',
            createdAt: new Date(),
            description: 'Recompensa por vitória em partida'
          });
          
          // Notificar o usuário
          await db.collection('notifications').insertOne({
            userId: new ObjectId(memberId.toString()),
            type: 'system',
            read: false,
            data: {
              message: `Você recebeu ${rewardPerMember} moedas como recompensa pela vitória na partida!`,
              matchId: matchId.toString()
            },
            createdAt: new Date()
          });
        }
      }
    }
    
    // Notificar todos os jogadores sobre o resultado da validação
    const allMembers = [];
    match.teams.forEach((team) => {
      if (team.members && Array.isArray(team.members)) {
        team.members.forEach((memberId) => {
          allMembers.push(memberId.toString());
        });
      }
    });
    
    for (const memberId of allMembers) {
      await db.collection('notifications').insertOne({
        userId: new ObjectId(memberId),
        type: 'match_validated',
        read: false,
        data: {
          message: isValid
            ? 'O resultado da sua partida foi validado! Confira a página da partida para mais detalhes.'
            : 'O resultado da sua partida foi rejeitado. Entre em contato com o suporte para mais informações.',
          matchId: matchId.toString(),
          isValid: isValid
        },
        createdAt: new Date()
      });
    }
    
    return NextResponse.json({
      status: 'success',
      message: isValid ? 'Resultado validado com sucesso' : 'Resultado rejeitado',
      matchId: matchId
    });
    
  } catch (error) {
    console.error('Erro ao validar resultado da partida:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao validar resultado da partida'
    }, { status: 500 });
  }
} 