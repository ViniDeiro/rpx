import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';

// GET - Obter detalhes de uma equipe específica
export async function GET(
  req,
  { params }) {
  try {
    // Obter ID da equipe da URL
    const teamId = params.id;
    
    if (!teamId) {
      return NextResponse.json(
        { error: 'ID da equipe não fornecido' },
        { status: 400 });
    }
    
    // Conectar ao MongoDB
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 400 });
    }
    
    // Buscar equipe pelo ID
    const team = await db.collection('teams').findOne(
      { _id: new mongoose.Types.ObjectId(teamId) }
    );
    
    if (!team) {
      return NextResponse.json(
        { error: 'Equipe não encontrada' },
        { status: 400 });
    }
    
    // Formatar equipe para resposta
    const formattedTeam = {
      id: team._id ? team._id ? team._id.toString() : "" : "",
      name: team.name,
      tag: team.tag,
      logo: team.logo,
      ownerId: team.ownerId,
      members: team.members.map((member) => ({
        userId: member.userId,
        username: member.username,
        role: member.role,
        joinedAt: member.joinedAt
      })),
      description: team.description,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      stats: team.stats || {
        totalMatches: 0,
        wins: 0,
        losses: 0
      }
    };
    
    // Buscar histórico de partidas da equipe
    const matches = await db.collection('matches')
      .find({
        $or: [
          { 'teams.teamId': teamId },
          { 'teams.id': teamId }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    // Formatar partidas para resposta
    const formattedMatches = matches.map((match) => ({
      id: match._id ? match._id ? match._id.toString() : "" : "",
      title: match.title,
      mode: match.mode,
      status: match.status,
      startTime: match.startTime,
      createdAt: match.createdAt,
      teams: match.teams.map((team) => ({
        id: team.id || team.teamId,
        name: team.name,
        score: team.score
      })),
      result: match.result
    }));
    
    // Retornar dados formatados
    return NextResponse.json({ 
      team: formattedTeam,
      recentMatches: formattedMatches
    });
  } catch (error) {
    console.error('Erro ao obter detalhes da equipe:', error);
    return NextResponse.json(
      { error: 'Erro ao obter detalhes da equipe' },
      { status: 400 });
  }
}

// PATCH - Atualizar detalhes de uma equipe
export async function PATCH(
  req,
  { params }) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult;
  
  try {
    // Obter ID da equipe da URL
    const teamId = params.id;
    
    if (!teamId) {
      return NextResponse.json(
        { error: 'ID da equipe não fornecido' },
        { status: 400 });
    }
    
    // Obter ID do usuário da requisição autenticada
    const userId = getUserId(authenticatedReq);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não encontrado na requisição' },
        { status: 400 });
    }
    
    // Obter dados da requisição
    const body = await req.json();
    const { name, tag, logo, description } = body;
    
    // Conectar ao MongoDB
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 400 });
    }
    
    // Buscar equipe pelo ID
    const team = await db.collection('teams').findOne(
      { _id: new mongoose.Types.ObjectId(teamId) }
    );
    
    if (!team) {
      return NextResponse.json(
        { error: 'Equipe não encontrada' },
        { status: 400 });
    }
    
    // Verificar se o usuário é dono ou administrador da equipe
    const memberInfo = team.members.find((member) => member.userId === userId);
    
    if (!memberInfo || (memberInfo.role !== 'owner' && memberInfo.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Você não tem permissão para modificar esta equipe' },
        { status: 400 });
    }
    
    // Validar dados para atualização
    if (name && (name.length < 3 || name.length > 30)) {
      return NextResponse.json(
        { error: 'Nome da equipe deve ter entre 3 e 30 caracteres' },
        { status: 400 });
    }
    
    if (tag && (tag.length < 2 || tag.length > 5)) {
      return NextResponse.json(
        { error: 'Tag da equipe deve ter entre 2 e 5 caracteres' },
        { status: 400 });
    }
    
    // Verificar se o nome ou tag já estão em uso por outra equipe
    if ((name && name !== team.name) || (tag && tag !== team.tag)) {
      const existingTeam = await db.collection('teams').findOne({
        _id: { $ne: new mongoose.Types.ObjectId(teamId) },
        $or: [
          ...(name ? [{ name: { $regex: new RegExp(`^${name}$`, 'i') } }] : []),
          ...(tag ? [{ tag: { $regex: new RegExp(`^${tag}$`, 'i') } }] : [])
        ]
      });
      
      if (existingTeam) {
        if (name && existingTeam.name.toLowerCase() === name.toLowerCase()) {
          return NextResponse.json(
            { error: 'Já existe uma equipe com este nome' },
            { status: 400 });
        }
        
        if (tag && existingTeam.tag.toLowerCase() === tag.toLowerCase()) {
          return NextResponse.json(
            { error: 'Já existe uma equipe com esta tag' },
            { status: 400 });
        }
      }
    }
    
    // Preparar dados para atualização
    const updateData = {
      updatedAt: new Date()
    };
    
    if (name) updateData.name = name;
    if (tag) updateData.tag = tag.toUpperCase();
    if (logo !== undefined) updateData.logo = logo;
    if (description !== undefined) updateData.description = description;
    
    // Atualizar a equipe no banco de dados
    await db.collection('teams').updateOne(
      { _id: new mongoose.Types.ObjectId(teamId) },
      { $set: updateData }
    );
    
    // Buscar equipe atualizada
    const updatedTeam = await db.collection('teams').findOne(
      { _id: new mongoose.Types.ObjectId(teamId) }
    );
    
    if (!updatedTeam) {
      return NextResponse.json(
        { error: 'Erro ao obter a equipe atualizada' },
        { status: 400 });
    }
    
    // Formatar equipe para resposta
    const formattedTeam = {
      id: updatedTeam._id ? updatedTeam._id.toString() : "",
      name: updatedTeam.name,
      tag: updatedTeam.tag,
      logo: updatedTeam.logo,
      description: updatedTeam.description,
      updatedAt: updatedTeam.updatedAt
    };
    
    // Retornar dados atualizados
    return NextResponse.json({
      message: 'Equipe atualizada com sucesso',
      team: formattedTeam
    });
  } catch (error) {
    console.error('Erro ao atualizar equipe:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar equipe' },
      { status: 400 });
  }
}

// DELETE - Excluir uma equipe
export async function DELETE(
  req,
  { params }) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult;
  
  try {
    // Obter ID da equipe da URL
    const teamId = params.id;
    
    if (!teamId) {
      return NextResponse.json(
        { error: 'ID da equipe não fornecido' },
        { status: 400 });
    }
    
    // Obter ID do usuário da requisição autenticada
    const userId = getUserId(authenticatedReq);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não encontrado na requisição' },
        { status: 400 });
    }
    
    // Conectar ao MongoDB
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 400 });
    }
    
    // Buscar equipe pelo ID
    const team = await db.collection('teams').findOne(
      { _id: new mongoose.Types.ObjectId(teamId) }
    );
    
    if (!team) {
      return NextResponse.json(
        { error: 'Equipe não encontrada' },
        { status: 400 });
    }
    
    // Verificar se o usuário é o dono da equipe
    const memberInfo = team.members.find((member) => member.userId === userId);
    
    if (!memberInfo || memberInfo.role !== 'owner') {
      return NextResponse.json(
        { error: 'Apenas o dono pode excluir a equipe' },
        { status: 400 });
    }
    
    // Excluir convites pendentes
    await db.collection('teamInvitations').deleteMany({
      teamId
    });
    
    // Excluir a equipe
    await db.collection('teams').deleteOne({
      _id: new mongoose.Types.ObjectId(teamId)
    });
    
    // Retornar sucesso
    return NextResponse.json({
      message: 'Equipe excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir equipe:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir equipe' },
      { status: 400 });
  }
} 