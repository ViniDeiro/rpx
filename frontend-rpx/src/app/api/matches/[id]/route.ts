import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';

// GET - Obter detalhes de uma partida específica
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obter ID da partida da URL
    const matchId = params.id;
    
    if (!matchId) {
      return NextResponse.json(
        { error: 'ID da partida não fornecido' },
        { status: 400 }
      );
    }
    
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
    
    // Formatar dados da partida para resposta
    const formattedMatch = {
      id: match._id.toString(),
      title: match.title || `Partida #${match._id.toString().substring(0, 6)}`,
      mode: match.mode,
      type: match.type,
      status: match.status,
      teamSize: match.teamSize,
      platform: match.platform,
      entryFee: match.entryFee || 0,
      prize: match.prize || 0,
      playersJoined: match.playersJoined || 0,
      totalPlayers: match.totalPlayers || 0,
      startTime: match.startTime,
      createdAt: match.createdAt,
      createdBy: match.createdBy,
      teams: match.teams || [],
      rules: match.rules || {},
      gameDetails: match.gameDetails || {}
    };
    
    // Retornar dados formatados
    return NextResponse.json({ match: formattedMatch });
  } catch (error) {
    console.error('Erro ao obter detalhes da partida:', error);
    return NextResponse.json(
      { error: 'Erro ao obter detalhes da partida' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar status ou detalhes de uma partida (requer autenticação)
export async function PATCH(
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
    const body = await req.json();
    const { status, result, roomDetails } = body;
    
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
    
    // Verificar se o usuário tem permissão para atualizar a partida
    // (deve ser o criador ou ter papel administrativo)
    if (match.createdBy !== userId) {
      // Verificar se o usuário é um administrador ou organizador da partida
      const { User } = await (await import('@/lib/mongodb/models')).getModels();
      const user = await User.findById(userId);
      
      if (!user || user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Permissão negada. Você não tem permissão para modificar esta partida.' },
          { status: 403 }
        );
      }
    }
    
    // Preparar dados para atualização
    const updateData: any = {
      updatedAt: new Date()
    };
    
    // Atualizar status da partida (se fornecido)
    if (status) {
      // Validar status
      const validStatuses = ['waiting', 'in_progress', 'completed', 'canceled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Status inválido. Valores permitidos: waiting, in_progress, completed, canceled' },
          { status: 400 }
        );
      }
      
      updateData.status = status;
      
      // Se a partida estiver começando ou terminando, atualizar timestamps
      if (status === 'in_progress' && match.status !== 'in_progress') {
        updateData.startedAt = new Date();
      } else if (status === 'completed' && match.status !== 'completed') {
        updateData.completedAt = new Date();
      }
    }
    
    // Atualizar resultado da partida (se fornecido)
    if (result) {
      updateData.result = result;
    }
    
    // Atualizar detalhes da sala (se fornecido)
    if (roomDetails) {
      updateData.roomDetails = roomDetails;
    }
    
    // Atualizar partida no banco de dados
    await db.collection('matches').updateOne(
      { _id: new mongoose.Types.ObjectId(matchId) },
      { $set: updateData }
    );
    
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
    
    // Formatar partida atualizada para resposta
    const formattedMatch = {
      id: updatedMatch._id.toString(),
      title: updatedMatch.title,
      status: updatedMatch.status,
      updatedAt: updatedMatch.updatedAt,
      result: updatedMatch.result
    };
    
    // Retornar dados atualizados
    return NextResponse.json({
      message: 'Partida atualizada com sucesso',
      match: formattedMatch
    });
  } catch (error) {
    console.error('Erro ao atualizar partida:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar partida' },
      { status: 500 }
    );
  }
} 