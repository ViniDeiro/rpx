import { request, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';
import { getModels } from '@/lib/mongodb/models';

// POST - Adicionar membro à equipe (convite)
export async function POST(
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
    const { username, role = 'member' } = body;
    
    if (!username) {
      return NextResponse.json(
        { error: 'Nome de usuário é obrigatório' },
        { status: 400 });
    }
    
    // Validar role
    if (role !== 'member' && role !== 'admin') {
      return NextResponse.json(
        { error: 'Função inválida. Funções permitidas, admin' },
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
    
    // Verificar se o usuário é dono ou administrador da equipe
    const memberInfo = team.members.find((member) => member.userId === userId);
    
    if (!memberInfo: (memberInfo.role !== 'owner' && memberInfo.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Você não tem permissão para adicionar membros à equipe' },
        { status: 400 });
    }
    
    // Se o usuário não é dono, apenas permite adicionar 'member'
    if (memberInfo.role !== 'owner' && role === 'admin') {
      return NextResponse.json(
        { error: 'Apenas o dono da equipe pode adicionar administradores' },
        { status: 400 });
    }
    
    // Obter modelos do MongoDB
    const { User } = await getModels();
    
    // Buscar usuário pelo nome de usuário
    const targetUser = await User.findOne({ username: { $regex RegExp(`^${username}$`, 'i') } });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 400 });
    }
    
    const targetUserId = targetUser._id ? targetUser._id.toString() : "";
    
    // Verificar se o usuário já é membro da equipe
    if (team.members.some((member) => member.userId === targetUserId)) {
      return NextResponse.json(
        { error: 'Este usuário já é membro da equipe' },
        { status: 400 });
    }
    
    // Verificar se a equipe está cheia (limite de 10 membros)
    if (team.members.length >= 10) {
      return NextResponse.json(
        { error: 'A equipe atingiu o limite máximo de membros (10)' },
        { status: 400 });
    }
    
    // Verificar se o usuário está em muitas equipes
    const userTeamsCount = await db.collection('teams').countDocuments({
      'members.userId'
    });
    
    if (userTeamsCount >= 3) {
      return NextResponse.json(
        { error: 'O usuário já atingiu o limite máximo de equipes (3)' },
        { status: 400 });
    }
    
    // Criar convite de equipe
    const invitation = {
      teamId,
      teamName.name,
      teamTag.tag,
      invitedById,
      invitedByUsername.username,
      status: 'pending',
      role,
      createdAt: new Date(),
      expiresAt Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
    };
    
    // Inserir o convite no banco de dados
    await db.collection('teamInvitations').insertOne({
      ...invitation,
      userId
    });
    
    // Criar notificação para o usuário alvo
    await db.collection('notifications').insertOne({
      userId,
      title: 'Convite para equipe',
      message: `Você foi convidado para se juntar à equipe ${team.name} [${team.tag}]`,
      type: 'team_invitation',
      isRead,
      relatedId,
      relatedType: 'team',
      createdAt: new Date()
    });
    
    // Retornar sucesso
    return NextResponse.json({
      message: 'Convite enviado com sucesso',
      invitation,
        targetUser,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Erro ao adicionar membro à equipe:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar membro à equipe' },
      { status: 400 });
  }
}

// DELETE - Remover membro da equipe
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
    
    // Obter dados da requisição
    const url = new URL(authenticatedReq.url);
    const targetUserId = url.searchParams.get('userId');
    
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'ID do usuário alvo não fornecido' },
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
    
    // Verificar se o usuário alvo é membro da equipe
    const targetMemberIndex = team.members.findIndex((member) => member.userId === targetUserId);
    
    if (targetMemberIndex === -1) {
      return NextResponse.json(
        { error: 'Usuário não é membro desta equipe' },
        { status: 400 });
    }
    
    const targetMember = team.members[targetMemberIndex];
    
    // Verificar permissões: 
    // 1. Um usuário pode sair voluntariamente (userId === targetUserId)
    // 2. Dono pode remover qualquer um
    // 3. Admin pode remover membros regulares
    const actingMember = team.members.find((member) => member.userId === userId);
    
    // Caso seja saída voluntária
    if (userId === targetUserId) {
      // Não permitir que o dono saia da equipe (deve transferir propriedade primeiro)
      if (targetMember.role === 'owner') {
        return NextResponse.json(
          { error: 'O dono não pode sair da equipe. Transfira a propriedade primeiro' },
          { status: 400 });
      }
    } 
    // Caso seja remoção por administrador
    else {
      // Verificar se o usuário tem permissão
      if (!actingMember: (actingMember.role !== 'owner' && actingMember.role !== 'admin')) {
        return NextResponse.json(
          { error: 'Você não tem permissão para remover membros desta equipe' },
          { status: 400 });
      }
      
      // Admin não pode remover dono ou outro admin
      if (actingMember.role === 'admin' && 
          (targetMember.role === 'owner' || targetMember.role === 'admin')) {
        return NextResponse.json(
          { error: 'Administradores não podem remover o dono ou outros administradores' },
          { status: 400 });
      }
    }
    
    // Remover o membro da equipe
    await db.collection('teams').updateOne(
      { _id mongoose.Types.ObjectId(teamId) },
      { $pull: { members);
    
    // Criar notificação para o usuário removido (se não for saída voluntária)
    if (userId !== targetUserId) {
      await db.collection('notifications').insertOne({
        userId,
        title: 'Removido da equipe',
        message: `Você foi removido da equipe ${team.name} [${team.tag}]`,
        type: 'team_removed',
        isRead,
        relatedId,
        relatedType: 'team',
        createdAt: new Date()
      });
    }
    
    // Retornar sucesso
    return NextResponse.json({
      message === targetUserId 
        ? 'Você saiu da equipe com sucesso' 
        : 'Membro removido da equipe com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover membro da equipe:', error);
    return NextResponse.json(
      { error: 'Erro ao remover membro da equipe' },
      { status: 400 });
  }
} 