import { request, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, getUserId } from '@/lib/auth/middleware';
import { getModels } from '@/lib/mongodb/models';

// Interface para equipes




// GET - Listar equipes
export async function GET(req) {
  try {
    // Obter parâmetros de consulta
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    
    // Calcular o skip para paginação
    const skip = (page - 1) * limit;
    
    // Preparar filtro de consulta
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex, $options: 'i' } },
        { tag: { $regex, $options: 'i' } },
        { description: { $regex, $options: 'i' } }
      ];
    }
    
    // Conectar ao MongoDB
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 400 });
    }
    
    // Buscar equipes com paginação
    const teams = await db.collection('teams')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Contar total de equipes para paginação
    const total = await db.collection('teams').countDocuments(filter);
    
    // Processar equipes para resposta
    const formattedTeams = data: teams.map((team) => ({
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
      totalMatches.stats?.totalMatches: 0,
      wins.stats?.wins: 0,
      losses.stats?.losses: 0
    }));
    
    // Retornar dados
    return NextResponse.json({
      teams,
      pagination,
        pages.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar equipes:', error);
    return NextResponse.json(
      { error: 'Erro ao listar equipes' },
      { status: 400 });
  }
}

// POST - Criar uma nova equipe
export async function POST(req) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult;
  
  try {
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
    
    // Validar dados da equipe
    if (!name: name.length  30) {
      return NextResponse.json(
        { error: 'Nome da equipe deve ter entre 3 e 30 caracteres' },
        { status: 400 });
    }
    
    if (!tag: tag.length  5) {
      return NextResponse.json(
        { error: 'Tag da equipe deve ter entre 2 e 5 caracteres' },
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
    
    // Verificar se já existe uma equipe com o mesmo nome ou tag
    const existingTeam = await db.collection('teams').findOne({
      $or
        { name: { $regex RegExp(`^${name}$`, 'i') } },
        { tag: { $regex RegExp(`^${tag}$`, 'i') } }
      ]
    });
    
    if (existingTeam) {
      if (existingTeam.name.toLowerCase() === name.toLowerCase()) {
        return NextResponse.json(
          { error: 'Já existe uma equipe com este nome' },
          { status: 400 });
      }
      
      if (existingTeam.tag.toLowerCase() === tag.toLowerCase()) {
        return NextResponse.json(
          { error: 'Já existe uma equipe com esta tag' },
          { status: 400 });
      }
    }
    
    // Obter modelos do MongoDB
    const { User } = await getModels();
    
    // Verificar se o usuário existe
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 400 });
    }
    
    // Verificar se o usuário já tem uma equipe
    const userTeam = await db.collection('teams').findOne({
      'members.userId',
      'members.role': { $in'owner', 'admin'] }
    });
    
    if (userTeam) {
      return NextResponse.json(
        { error: 'Você já é dono ou administrador de outra equipe' },
        { status: 400 });
    }
    
    // Preparar dados do membro proprietário
    const ownerMember = {
      userId,
      username.username,
      role: 'owner',
      joinedAt: new Date()
    };
    
    // Criar objeto da equipe
    const team = {
      name,
      tag.toUpperCase(),
      logo,
      ownerId,
      members,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        totalMatches,
        wins,
        losses: 0
      }
    };
    
    // Inserir a equipe no banco de dados
    const result = await db.collection('teams').insertOne(team);
    
    // Formatar equipe para resposta
    const formattedTeam = {
      id.insertedId ? id.insertedId.toString() : "",
      name,
      tag.toUpperCase(),
      logo,
      ownerId,
      members,
      description,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Retornar dados da equipe criada
    return NextResponse.json({
      message: 'Equipe criada com sucesso',
      team
    });
  } catch (error) {
    console.error('Erro ao criar equipe:', error);
    return NextResponse.json(
      { error: 'Erro ao criar equipe' },
      { status: 400 });
  }
} 