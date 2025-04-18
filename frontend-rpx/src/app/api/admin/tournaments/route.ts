import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// Verificar se o usuário é admin
async function isAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.isAdmin) {
    return false;
  }
  
  return true;
}

// GET - Listar todos os torneios
export async function GET(req: NextRequest) {
  try {
    // Verificar se o usuário é admin
    if (!await isAdmin()) {
      return NextResponse.json(
        { message: 'Não autorizado. Acesso apenas para administradores.' },
        { status: 403 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Obter ID do torneio (opcional)
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      // Buscar torneio específico
      const tournament = await db.collection('tournaments').findOne({
        _id: new ObjectId(id)
      });
      
      if (!tournament) {
        return NextResponse.json(
          { message: 'Torneio não encontrado' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        ...tournament,
        id: tournament._id.toString()
      });
    }
    
    // Buscar todos os torneios
    const tournaments = await db.collection('tournaments')
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    
    // Transformar _id em id para compatibilidade com o frontend
    const transformedTournaments = tournaments.map((tournament) => ({
      ...tournament,
      id: tournament._id.toString(),
      _id: undefined
    }));
    
    return NextResponse.json(transformedTournaments);
    
  } catch (error) {
    console.error('Erro ao listar torneios:', error);
    
    return NextResponse.json(
      { message: 'Erro ao buscar torneios' },
      { status: 500 }
    );
  }
}

// POST - Criar um novo torneio
export async function POST(req: NextRequest) {
  try {
    // Verificar se o usuário é admin
    if (!await isAdmin()) {
      return NextResponse.json(
        { message: 'Não autorizado. Acesso apenas para administradores.' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    
    // Validar dados necessários
    if (!body.name || !body.game || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { message: 'Dados insuficientes. Nome, jogo e datas são obrigatórios.' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Criar novo torneio
    const novoTorneio = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentParticipants: 0,
      registrations: [],
      matches: []
    };
    
    const result = await db.collection('tournaments').insertOne(novoTorneio);
    
    if (!result.insertedId) {
      throw new Error('Falha ao inserir torneio');
    }
    
    return NextResponse.json({
      id: result.insertedId.toString(),
      ...novoTorneio
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erro ao criar torneio:', error);
    
    return NextResponse.json(
      { message: 'Erro ao criar torneio' },
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