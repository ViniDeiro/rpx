import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId, FindCursor, Document, WithId } from 'mongodb';

interface AdminUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string;
  isAdmin: boolean;
}

// Verificar se o usuário é admin
async function isAdmin() {
  const session = await getServerSession(authOptions);
  
  // Verificação básica de sessão e usuário
  if (!session || !session.user) {
    return false;
  }
  
  try {
    // Conectar ao banco para verificar o status de admin
    const { db } = await connectToDatabase();
    
    // Verificar se temos uma conexão válida
    if (!db) {
      console.error('Admin check - Erro: Conexão com banco de dados falhou');
      return false;
    }
    
    // Verificar no banco se o usuário é admin
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(session.user.id) 
    });
    
    // Verificar se o usuário tem a propriedade isAdmin
    return user?.isAdmin === true;
  } catch (error) {
    console.error('Erro ao verificar permissão de admin:', error);
    return false;
  }
}

// GET - Listar todos os torneios
export async function GET(request: NextRequest) {
  try {
    // Verificar se o usuário é admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { status: 'error', error: 'Apenas administradores podem acessar este recurso' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // upcoming, active, completed, all
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Construir query
    const query: Record<string, any> = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    // Obter total de torneios para paginação
    const total = await db.collection('tournaments').countDocuments(query);

    // Buscar torneios com paginação
    const tournaments = await db.collection('tournaments')
      .find(query)
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      status: 'success',
      data: {
        tournaments: tournaments.map(tournament => ({
          ...tournament,
          _id: tournament._id.toString()
        })),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Erro ao listar torneios:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao listar torneios: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
}

// POST - Criar um novo torneio
export async function POST(request: NextRequest) {
  try {
    // Verificar se o usuário é admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { status: 'error', error: 'Apenas administradores podem acessar este recurso' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      bannerUrl,
      entryFee,
      prizePool,
      maxParticipants,
      startDate,
      endDate,
      rules,
      gameType,
      format,
      status
    } = body;

    // Validar dados obrigatórios
    if (!name || !bannerUrl || entryFee === undefined || prizePool === undefined || !startDate) {
      return NextResponse.json(
        { status: 'error', error: 'Dados insuficientes. Nome, imagem do banner, taxa de inscrição, prêmio e data de início são obrigatórios.' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Criar objeto do torneio
    const tournament = {
      name,
      description: description || '',
      bannerUrl,
      entryFee: parseFloat(entryFee),
      prizePool: parseFloat(prizePool),
      maxParticipants: parseInt(maxParticipants) || 100,
      currentParticipants: 0,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      rules: rules || '',
      gameType: gameType || 'free_fire',
      format: format || 'elimination',
      status: status || 'upcoming', // upcoming, active, completed, canceled
      matches: [],
      participants: [],
      createdBy: session.user.id || session.user.email,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Inserir no banco de dados
    const result = await db.collection('tournaments').insertOne(tournament);

    // Registrar log de auditoria
    await db.collection('admin_logs').insertOne({
      adminId: session.user.id || session.user.email,
      adminEmail: session.user.email,
      action: 'create_tournament',
      entity: 'tournament',
      entityId: result.insertedId.toString(),
      details: {
        tournamentName: name,
        entryFee,
        prizePool,
        startDate
      },
      timestamp: new Date()
    });

    return NextResponse.json({
      status: 'success',
      message: 'Torneio criado com sucesso',
      tournamentId: result.insertedId.toString()
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar torneio:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao criar torneio: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um torneio existente
export async function PUT(req: NextRequest) {
  try {
    // Verificar se o usuário é admin
    if (!await isAdmin()) {
      return NextResponse.json(
        { message: 'Não autorizado. Acesso apenas para administradores.' },
        { status: 403 }
      );
    }
    
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { message: 'ID do torneio não fornecido' },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    
    const { db } = await connectToDatabase();
    
    // Verificar se temos uma conexão válida
    if (!db) {
      return NextResponse.json(
        { message: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      );
    }
    
    // Verificar se existe o torneio com o ID fornecido
    const existingTournament = await db.collection('tournaments').findOne({
      _id: new ObjectId(id)
    });
    
    if (!existingTournament) {
      return NextResponse.json(
        { message: 'Torneio não encontrado' },
        { status: 404 }
      );
    }
    
    // Atualizar torneio
    const updateData = {
      ...body,
      updatedAt: new Date()
    };
    
    await db.collection('tournaments').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    return NextResponse.json({
      id,
      ...updateData
    });
    
  } catch (error) {
    console.error('Erro ao atualizar torneio:', error);
    
    return NextResponse.json(
      { message: 'Erro ao atualizar torneio' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir um torneio
export async function DELETE(req: NextRequest) {
  try {
    // Verificar se o usuário é admin
    if (!await isAdmin()) {
      return NextResponse.json(
        { message: 'Não autorizado. Acesso apenas para administradores.' },
        { status: 403 }
      );
    }
    
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { message: 'ID do torneio não fornecido' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se temos uma conexão válida
    if (!db) {
      return NextResponse.json(
        { message: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      );
    }
    
    // Verificar se o torneio existe
    const tournament = await db.collection('tournaments').findOne({
      _id: new ObjectId(id)
    });
    
    if (!tournament) {
      return NextResponse.json(
        { message: 'Torneio não encontrado' },
        { status: 404 }
      );
    }
    
    // Excluir torneio
    await db.collection('tournaments').deleteOne({
      _id: new ObjectId(id)
    });
    
    return NextResponse.json(
      { message: 'Torneio excluído com sucesso' }
    );
  } catch (error) {
    console.error('Erro ao excluir torneio:', error);
    
    return NextResponse.json(
      { message: 'Erro ao excluir torneio' },
      { status: 500 }
    );
  }
} 