import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';

// POST - Entrar em uma partida
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult;
  
  try {
    // Obter ID da partida da URL
    const matchId = params.id;
    
    if (!matchId) {
      return NextResponse.json(
        { error: 'ID da partida não fornecido' },
        { status: 400 }
      );
    }
    
    // Obter ID do usuário da requisição autenticada
    const userId = getUserId(authenticatedReq);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não encontrado na requisição' },
        { status: 400 }
      );
    }
    
    // Obter dados da requisição
    const { teamIndex } = await req.json();
    
    // Conectar ao MongoDB
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      );
    }
    
    // Buscar partida pelo ID
    const match = await db.collection('matches').findOne(
      { _id: new mongoose.Types.ObjectId(matchId) }
    );
    
    if (!match) {
      return NextResponse.json(
        { error: 'Partida não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se a partida está disponível para entrada
    if (match.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Não é possível entrar em uma partida que já começou ou foi encerrada' },
        { status: 400 }
      );
    }
    
    // Verificar se o jogador já está na partida
    const playerExists = match.teams.some((team: any) => 
      team.players.some((player: any) => player.id === userId)
    );
    
    if (playerExists) {
      return NextResponse.json(
        { error: 'Jogador já está nesta partida' },
        { status: 400 }
      );
    }
    
    // Verificar se a partida tem vagas disponíveis
    const totalPlayers = match.teams.reduce((count: number, team: any) => 
      count + team.players.length, 0
    );
    
    if (totalPlayers >= match.totalPlayers) {
      return NextResponse.json(
        { error: 'Partida já está cheia' },
        { status: 400 }
      );
    }
    
    // Obter modelos do MongoDB para acessar o usuário
    const { User } = await (await import('@/lib/mongodb/models')).getModels();
    
    // Verificar se o usuário existe
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário tem saldo suficiente para a taxa de entrada
    if (match.entryFee > 0 && user.wallet && user.wallet.balance < match.entryFee) {
      return NextResponse.json(
        { error: 'Saldo insuficiente para entrar nesta partida' },
        { status: 400 }
      );
    }
    
    // Determinar em qual time colocar o jogador (se não for especificado)
    let targetTeamIndex = teamIndex;
    
    if (targetTeamIndex === undefined) {
      // Encontrar o time com menos jogadores
      let minPlayers = Number.MAX_VALUE;
      
      for (let i = 0; i < match.teams.length; i++) {
        const teamSize = match.teams[i].players.length;
        if (teamSize < minPlayers) {
          minPlayers = teamSize;
          targetTeamIndex = i;
        }
      }
      
      // Se os times estiverem equilibrados, colocar aleatoriamente
      if (match.teams.every((team: any) => team.players.length === minPlayers)) {
        targetTeamIndex = Math.floor(Math.random() * match.teams.length);
      }
    }
    
    // Verificar se o índice do time é válido
    if (targetTeamIndex < 0 || targetTeamIndex >= match.teams.length) {
      return NextResponse.json(
        { error: 'Índice de time inválido' },
        { status: 400 }
      );
    }
    
    // Verificar se o time tem vagas
    const maxPlayersPerTeam = match.totalPlayers / match.teams.length;
    
    if (match.teams[targetTeamIndex].players.length >= maxPlayersPerTeam) {
      return NextResponse.json(
        { error: 'Time selecionado já está cheio' },
        { status: 400 }
      );
    }
    
    // Adicionar jogador ao time
    const playerData = {
      id: userId,
      username: user.username,
      name: user.profile?.name || user.username,
      avatar: user.profile?.avatar || null,
      isCaptain: match.teams[targetTeamIndex].players.length === 0, // Primeiro jogador é o capitão
      isReady: false,
      joinedAt: new Date()
    };
    
    // Atualizar a partida no banco de dados
    await db.collection('matches').updateOne(
      { _id: new mongoose.Types.ObjectId(matchId) },
      { 
        $push: { [`teams.${targetTeamIndex}.players`]: playerData } as any,
        $inc: { playersJoined: 1 },
        $set: { updatedAt: new Date() }
      }
    );
    
    // Processar a taxa de entrada (se houver)
    if (match.entryFee > 0) {
      // Atualizar o saldo do usuário
      await User.findByIdAndUpdate(userId, {
        $inc: { 'wallet.balance': -match.entryFee }
      });
      
      // Registrar a transação
      await db.collection('transactions').insertOne({
        userId,
        amount: -match.entryFee,
        type: 'match_entry',
        status: 'completed',
        description: `Taxa de entrada para partida: ${match.title || matchId}`,
        reference: matchId,
        createdAt: new Date()
      });
    }
    
    // Buscar partida atualizada
    const updatedMatch = await db.collection('matches').findOne(
      { _id: new mongoose.Types.ObjectId(matchId) }
    );
    
    if (!updatedMatch) {
      return NextResponse.json(
        { error: 'Erro ao obter a partida atualizada' },
        { status: 500 }
      );
    }
    
    // Formatar partida para resposta
    const formattedMatch = {
      id: updatedMatch._id.toString(),
      title: updatedMatch.title,
      status: updatedMatch.status,
      teams: updatedMatch.teams,
      playersJoined: updatedMatch.playersJoined,
      totalPlayers: updatedMatch.totalPlayers
    };
    
    // Retornar dados atualizados
    return NextResponse.json({
      message: 'Você entrou na partida com sucesso',
      match: formattedMatch
    });
  } catch (error) {
    console.error('Erro ao entrar na partida:', error);
    return NextResponse.json(
      { error: 'Erro ao entrar na partida' },
      { status: 500 }
    );
  }
} 