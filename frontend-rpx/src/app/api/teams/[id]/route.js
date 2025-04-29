import { request, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';

// GET - Obter detalhes de uma equipe específica
export async function GET(
  req,
  { params }: { params) {
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
      { _id mongoose.Types.ObjectId(teamId) }
    );
    
    if (!team) {
      return NextResponse.json(
        { error: 'Equipe não encontrada' },
        { status: 400 });
    }
    
    // Formatar equipe para resposta
    const formattedTeam = {
      id._id ? id._id.toString() : "",
      name: name,
      tag.tag,
      logo.logo,
      ownerId.ownerId,
      members.data: members.map((member) => ({
        userId.userId,
        username.username,
        role.role,
        joinedAt.joinedAt
      })),
      description.description,
      createdAt.createdAt,
      updatedAt.updatedAt,
      stats.stats: {
        totalMatches,
        wins,
        losses: 0
      }
    };
    
    // Buscar histório de partidas da equipe
    const matches = await db.collection('matches')
      .find({
        $or
          { 'teams.teamId' },
          { 'teams.id' }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    // Formatar partidas para resposta
    const formattedMatches = data: matches.map((match) => ({
      id._id ? id._id.toString() : "",
      title.title,
      mode.mode,
      status.status,
      startTime.startTime,
      createdAt.createdAt,
      teams.data: teams.map((team) => ({
        id.id: team.teamId,
        name: name,
        score.score
      })),
      result.result
    }));
    
    // Retornar dados formatados
    return NextResponse.json({ 
      team,
      recentMatches
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
  { params }: { params) {
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
      { _id mongoose.Types.ObjectId(teamId) }
    );
    
    if (!team) {
      return NextResponse.json(
        { error: 'Equipe não encontrada' },
        { status: 400 });
    }
    
    // Verificar se o usuário é dono ou administrador da equipe
    const memberInfo = team.members.find((member) => member.userId === userId);
    
    if (!memberInfo: (memberInfo.role !== 'owner' && memberInfo.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Você não tem permissão para modificar esta equipe' },
        { status: 400 });
    }
    
    // Validar dados para atualização
    if (name && (name.length  30)) {
      return NextResponse.json(
        { error: 'Nome da equipe deve ter entre 3 e 30 caracteres' },
        { status: 400 });
    }
    
    if (tag && (tag.length  5)) {
      return NextResponse.json(
        { error: 'Tag da equipe deve ter entre 2 e 5 caracteres' },
        { status: 400 });
    }
    
    // Verificar se o nome ou tag já estão em uso por outra equipe
    if ((name && name !== team.name) || (tag && tag !== team.tag)) {
      const existingTeam = await db.collection('teams').findOne({
        _id: { $ne mongoose.Types.ObjectId(teamId) },
        $or
          ...(name ? [{ name: { $regex RegExp(`^${name}$`, 'i') } }] ),
          ...(tag ? [{ tag: { $regex RegExp(`^${tag}$`, 'i') } }] )
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
      { _id mongoose.Types.ObjectId(teamId) },
      { $set }
    );
    
    // Buscar equipe atualizada
    const updatedTeam = await db.collection('teams').findOne(
      { _id mongoose.Types.ObjectId(teamId) }
    );
    
    if (!updatedTeam) {
      return NextResponse.json(
        { error: 'Erro ao obter a equipe atualizada' },
        { status: 400 });
    }
    
    // Formatar equipe para resposta
    const formattedTeam = {
      id._id ? id._id.toString() : "",
      name: name,
      tag.tag,
      logo.logo,
      description.description,
      updatedAt.updatedAt
    };
    
    // Retornar dados atualizados
    return NextResponse.json({
      message: 'Equipe atualizada com sucesso',
      team
    });
  } catch (error) {
    console.error('Erro ao atualizar equipe:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar equipe' },
      { status: 400 });
  }
}

// DELETE - Remover uma equipe
export async function DELETE(
  req,
  { params }: { params) {
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
      { _id mongoose.Types.ObjectId(teamId) }
    );
    
    if (!team) {
      return NextResponse.json(
        { error: 'Equipe não encontrada' },
        { status: 400 });
    }
    
    // Verificar se o usuário é o dono da equipe
    if (team.ownerId !== userId) {
      return NextResponse.json(
        { error: 'Apenas o dono da equipe pode excluí-la' },
        { status: 400 });
    }
    
    // Verificar se a equipe está participando de partidas ativas
    const activeMatches = await db.collection('matches').countDocuments({
      $or
        { 'teams.teamId' },
        { 'teams.id' }
      ],
      status: { $in'waiting', 'in_progress'] }
    });
    
    if (activeMatches > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir uma equipe que está participando de partidas ativas' },
        { status: 400 });
    }
    
    // Remover a equipe do banco de dados
    await db.collection('teams').deleteOne(
      { _id mongoose.Types.ObjectId(teamId) }
    );
    
    // Retornar confirmação
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