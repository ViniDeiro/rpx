import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Verifica se o usuário atual é um administrador
 */
async function isAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.email) {
    return false;
  }
  
  const { db } = await connectToDatabase();
  const usersCollection = db.collection('users');
  
  const user = await usersCollection.findOne({ email: session.user.email });
  
  // Verificar se o usuário tem a propriedade isAdmin
  return user?.isAdmin === true;
}

// GET - Listar salas
export async function GET(request) {
  try {
    // Verificar se o usuário é admin
    if (!await isAdmin()) {
      return NextResponse.json(
        { message: 'Não autorizado. Acesso apenas para administradores.' },
        { status: 403 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    const salas = await db.collection('salas').find({}).toArray();
    
    // Formatar resposta para o front-end
    const salasFormatadas = salas.map(sala => ({
      id: sala._id ? sala._id.toString() : "",
      nome: sala.nome,
      capacidade: sala.capacidade,
      status: sala.status,
      createdAt: sala.createdAt
    }));
    
    return NextResponse.json({
      status: 'success',
      message: 'Salas listadas com sucesso',
      salas: salasFormatadas
    });
  } catch (error) {
    console.error('Erro ao listar salas:', error);
    
    return NextResponse.json(
      { message: 'Erro ao listar salas', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Criar nova sala
export async function POST(request) {
  try {
    // Verificar se o usuário é admin
    if (!await isAdmin()) {
      return NextResponse.json(
        { message: 'Não autorizado. Acesso apenas para administradores.' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Validar dados necessários
    if (!body.nome || !body.capacidade) {
      return NextResponse.json(
        { message: 'Dados insuficientes. Nome e capacidade são obrigatórios.' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se já existe uma sala com o mesmo nome
    const salaExistente = await db.collection('salas').findOne({
      nome: body.nome
    });
    
    if (salaExistente) {
      return NextResponse.json(
        { message: `Já existe uma sala com o nome "${body.nome}".` },
        { status: 409 }
      );
    }
    
    // Criar nova sala
    const novaSala = {
      nome: body.nome,
      capacidade: Number(body.capacidade),
      status: body.status || 'disponivel',
      descricao: body.descricao || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('salas').insertOne(novaSala);
    
    if (!result.insertedId) {
      throw new Error('Falha ao inserir sala');
    }
    
    return NextResponse.json(
      { 
        message: 'Sala criada com sucesso', 
        id: result.insertedId ? result.insertedId.toString() : "",
        sala: { ...novaSala, id: result.insertedId ? result.insertedId.toString() : "" }
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Erro ao criar sala:', error);
    
    return NextResponse.json(
      { message: 'Erro ao criar sala', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remover sala
export async function DELETE(request) {
  try {
    // Verificar se o usuário é admin
    if (!await isAdmin()) {
      return NextResponse.json(
        { message: 'Não autorizado. Acesso apenas para administradores.' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { message: 'ID da sala não fornecido' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se a sala existe
    const sala = await db.collection('salas').findOne({
      _id: new ObjectId(id)
    });
    
    if (!sala) {
      return NextResponse.json(
        { message: 'Sala não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se há partidas vinculadas a esta sala
    const partidasVinculadas = await db.collection('partidas').countDocuments({
      salaId: id
    });
    
    if (partidasVinculadas > 0) {
      return NextResponse.json(
        { message: `Não é possível excluir a sala pois há ${partidasVinculadas} partidas vinculadas a ela.` },
        { status: 400 }
      );
    }
    
    // Remover a sala
    const result = await db.collection('salas').deleteOne({
      _id: new ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: 'Sala não encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: 'Sala removida com sucesso' }
    );
    
  } catch (error) {
    console.error('Erro ao remover sala:', error);
    
    return NextResponse.json(
      { message: 'Erro ao remover sala', error: error.message },
      { status: 500 }
    );
  }
} 