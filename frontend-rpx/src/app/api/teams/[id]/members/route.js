import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';
import { getModels } from '@/lib/mongodb/models';

// POST - Adicionar membro à equipe (convite)
export async function POST(
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
    const { username, role = 'member' } = body;
    
    if (!username) {
      return NextResponse.json(
        { error: 'Nome de usuário é obrigatório' },
        { status: 400 });
    }
    
    // Validar role
    if (role !== 'member' && role !== 'admin') {
      return NextResponse.json(
        { error: 'Função inválida. Funções permitidas: member, admin' },
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
    
    // Verificar se o usuário é dono ou administrador da equipe
    const memberInfo = team.members.find((member) => member.userId === userId);
    
    if (!memberInfo || (memberInfo.role !== 'owner' && memberInfo.role !== 'admin')) {
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
    const targetUser = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 400 });
    }
    
    const targetUserId = targetUser._id ? targetUser._id ? targetUser._id.toString() : "" : "";
    
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
      'members.userId': targetUserId
    });
    
    if (userTeamsCount >= 3) {
      return NextResponse.json(
        { error: 'O usuário já atingiu o limite máximo de equipes (3)' },
        { status: 400 });
    }
    
    // Criar convite de equipe
    const invitation = {
      teamId,
      teamName: team.name,
      teamTag: team.tag,
      invitedById: userId,
      invitedByUsername: memberInfo.username,
      status: 'pending',
      role,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
    };
    
    // Inserir o convite no banco de dados
    await db.collection('teamInvitations').insertOne({
      ...invitation,
      userId: targetUserId
    });
    
    // Criar notificação para o usuário alvo
    await db.collection('notifications').insertOne({
      userId: targetUserId,
      title: 'Convite para equipe',
      message: `Você foi convidado para se juntar à equipe ${team.name} [${team.tag}]`,
      type: 'team_invitation',
      isRead: false,
      relatedId: teamId,
      relatedType: 'team',
      createdAt: new Date()
    });
    
    // Retornar sucesso
    return NextResponse.json({
      message: 'Convite enviado com sucesso',
      invitation: {
        ...invitation,
        targetUser: {
          id: targetUserId,
          username: targetUser.username
        },
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
      { _id: new mongoose.Types.ObjectId(teamId) }
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
        { error: 'Usuário não é membro da equipe' },
        { status: 400 });
    }
    
    // Verificar permissões
    const requestingMember = team.members.find((member) => member.userId === userId);
    
    // Se o usuário que está fazendo a requisição não está na equipe
    if (!requestingMember) {
      return NextResponse.json(
        { error: 'Você não é membro desta equipe' },
        { status: 400 });
    }
    
    // Pegar informações do membro alvo
    const targetMember = team.members[targetMemberIndex];
    
    // Verificar condições:
    // 1. Um membro comum não pode remover ninguém
    // 2. Um admin pode remover apenas membros comuns
    // 3. O dono pode remover qualquer um
    // 4. Um usuário sempre pode sair (remover a si mesmo)
    
    const isSelfRemoval = userId === targetUserId;
    const isOwner = requestingMember.role === 'owner';
    const isAdmin = requestingMember.role === 'admin';
    const isTargetOwner = targetMember.role === 'owner';
    const isTargetAdmin = targetMember.role === 'admin';
    
    if (!isSelfRemoval && !isOwner && (!isAdmin || isTargetAdmin)) {
      return NextResponse.json(
        { error: 'Você não tem permissão para remover este membro' },
        { status: 400 });
    }
    
    // Não permitir que o dono saia se ainda houver outros membros
    if (isSelfRemoval && isOwner && team.members.length > 1) {
      return NextResponse.json(
        { error: 'O dono não pode sair da equipe enquanto houver outros membros' },
        { status: 400 });
    }
    
    // Remover membro da equipe
    const updatedMembers = team.members.filter((member) => member.userId !== targetUserId);
    
    // Atualizar equipe
    await db.collection('teams').updateOne(
      { _id: new mongoose.Types.ObjectId(teamId) },
      { $set: { members: updatedMembers } }
    );
    
    // Se o usuário saiu por conta própria, criar notificação para o dono
    if (isSelfRemoval && !isOwner) {
      const owner = team.members.find((member) => member.role === 'owner');
      
      if (owner) {
        await db.collection('notifications').insertOne({
          userId: owner.userId,
          title: 'Membro saiu da equipe',
          message: `${requestingMember.username} saiu da equipe ${team.name}`,
          type: 'team_update',
          isRead: false,
          relatedId: teamId,
          relatedType: 'team',
          createdAt: new Date()
        });
      }
    } 
    // Se foi removido por alguém, notificar o usuário removido
    else if (!isSelfRemoval) {
      await db.collection('notifications').insertOne({
        userId: targetUserId,
        title: 'Removido da equipe',
        message: `Você foi removido da equipe ${team.name}`,
        type: 'team_update',
        isRead: false,
        relatedId: teamId,
        relatedType: 'team',
        createdAt: new Date()
      });
    }
    
    // Se era o último membro, excluir a equipe
    if (updatedMembers.length === 0) {
      await db.collection('teams').deleteOne({ _id: new mongoose.Types.ObjectId(teamId) });
      return NextResponse.json({
        message: 'Equipe excluída pois não restaram membros',
        deleted: true
      });
    }
    
    return NextResponse.json({
      message: isSelfRemoval ? 'Você saiu da equipe' : 'Membro removido com sucesso',
      removed: targetMember
    });
  } catch (error) {
    console.error('Erro ao remover membro da equipe:', error);
    return NextResponse.json(
      { error: 'Erro ao remover membro da equipe' },
      { status: 400 });
  }
} 