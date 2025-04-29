import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Verificar se o usuário é admin
async function isAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.id) {
    return false;
  }
  
  const { db } = await connectToDatabase();
  
  const user = await db.collection('users').findOne({
    _id: new ObjectId(session.user.id)
  });
  
  return user && user.isAdmin === true;
}

// GET - Listar torneios
export async function GET(request) {
  try {
    // Verificar se o usuário é admin
    if (!await isAdmin()) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem acessar este recurso.' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Preparar query baseada nos parâmetros
    const query = {};
    if (status) {
      query.status = status;
    }
    
    // Buscar torneios
    const tournaments = await db.collection('tournaments')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    // Formatar resposta
    const formattedTournaments = tournaments.map(tournament => ({
      ...tournament,
      id: tournament._id ? tournament._id.toString() : "",
      _id: undefined
    }));
    
    return NextResponse.json({
      status: 'success',
      count: formattedTournaments.length,
      data: formattedTournaments
    });
  } catch (error) {
    console.error('Erro ao listar torneios:', error);
    return NextResponse.json(
      { error: 'Erro ao listar torneios', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Criar torneio
export async function POST(request) {
  try {
    // Verificar se o usuário é admin
    if (!await isAdmin()) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem acessar este recurso.' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Validar dados obrigatórios
    if (!body.name || !body.startDate || !body.prizePool) {
      return NextResponse.json(
        { error: 'Dados insuficientes. Nome, data de início e premiação são obrigatórios.' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Verificar se já existe um torneio com o mesmo nome
    const existingTournament = await db.collection('tournaments').findOne({
      name: body.name
    });
    
    if (existingTournament) {
      return NextResponse.json(
        { error: `Já existe um torneio com o nome "${body.name}".` },
        { status: 409 }
      );
    }
    
    // Criar o torneio
    const newTournament = {
      name: body.name,
      description: body.description || '',
      gameMode: body.gameMode || 'standard',
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      registrationDeadline: body.registrationDeadline ? new Date(body.registrationDeadline) : null,
      status: body.status || 'upcoming',
      maxParticipants: body.maxParticipants || 32,
      prizePool: Number(body.prizePool),
      entryFee: Number(body.entryFee || 0),
      rules: body.rules || '',
      participants: [],
      matches: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('tournaments').insertOne(newTournament);
    
    // Registrar ação do admin
    await db.collection('admin_logs').insertOne({
      action: 'create_tournament',
      tournamentId: result.insertedId ? result.insertedId.toString() : "",
      adminId: (await getServerSession(authOptions)).user.id,
      details: newTournament,
      timestamp: new Date()
    });
    
    return NextResponse.json({
      status: 'success',
      message: 'Torneio criado com sucesso',
      id: result.insertedId ? result.insertedId.toString() : ""
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar torneio:', error);
    return NextResponse.json(
      { error: 'Erro ao criar torneio', details: error.message },
      { status: 500 }
    );
  }
} 