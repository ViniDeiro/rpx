import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Verificar se o usuário é admin
async function isAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.isAdmin) {
    return false;
  }
  
  return true;
}

// GET - Listar todas as salas
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
    
    // Obter ID da sala (opcional)
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      // Buscar sala específica
      const sala = await db.collection('gameRooms').findOne({
        _id: new ObjectId(id)
      });
      
      if (!sala) {
        return NextResponse.json(
          { message: 'Sala não encontrada' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(sala);
    }
    
    // Buscar todas as salas (com filtro de salas oficiais)
    const salas = await db.collection('gameRooms')
      .find({ isOfficialRoom: true })
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json(salas);
    
  } catch (error) {
    console.error('Erro ao listar salas:', error);
    
    return NextResponse.json(
      { message: 'Erro ao buscar salas' },
      { status: 500 }
    );
  }
}

// POST - Criar uma nova sala
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
    if (!body.name || !body.roomId || !body.roomPassword) {
      return NextResponse.json(
        { message: 'Dados insuficientes. Nome, ID e senha da sala são obrigatórios.' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se já existe uma sala com o mesmo ID
    const existingSala = await db.collection('gameRooms').findOne({
      roomId: body.roomId
    });
    
    if (existingSala) {
      return NextResponse.json(
        { message: 'Já existe uma sala com este ID.' },
        { status: 400 }
      );
    }
    
    // Criar nova sala
    const novaSala = {
      ...body,
      isOfficialRoom: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('gameRooms').insertOne(novaSala);
    
    return NextResponse.json({
      _id: result.insertedId,
      ...novaSala
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erro ao criar sala:', error);
    
    return NextResponse.json(
      { message: 'Erro ao criar sala' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar uma sala existente
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
        { message: 'ID da sala não fornecido' },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    
    // Validar dados necessários
    if (!body.name || !body.roomId || !body.roomPassword) {
      return NextResponse.json(
        { message: 'Dados insuficientes. Nome, ID e senha da sala são obrigatórios.' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se existe a sala com o ID fornecido
    const existingSala = await db.collection('gameRooms').findOne({
      _id: new ObjectId(id)
    });
    
    if (!existingSala) {
      return NextResponse.json(
        { message: 'Sala não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se já existe outra sala com o mesmo ID de sala, exceto a atual
    if (body.roomId !== existingSala.roomId) {
      const salaComMesmoId = await db.collection('gameRooms').findOne({
        roomId: body.roomId,
        _id: { $ne: new ObjectId(id) }
      });
      
      if (salaComMesmoId) {
        return NextResponse.json(
          { message: 'Já existe outra sala com este ID.' },
          { status: 400 }
        );
      }
    }
    
    // Atualizar sala
    const updateData = {
      ...body,
      updatedAt: new Date()
    };
    
    await db.collection('gameRooms').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    return NextResponse.json({
      _id: id,
      ...updateData
    });
    
  } catch (error) {
    console.error('Erro ao atualizar sala:', error);
    
    return NextResponse.json(
      { message: 'Erro ao atualizar sala' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir uma sala
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
        { message: 'ID da sala não fornecido' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se a sala existe
    const sala = await db.collection('gameRooms').findOne({
      _id: new ObjectId(id)
    });
    
    if (!sala) {
      return NextResponse.json(
        { message: 'Sala não encontrada' },
        { status: 404 }
      );
    }
    
    // Excluir sala
    await db.collection('gameRooms').deleteOne({
      _id: new ObjectId(id)
    });
    
    return NextResponse.json(
      { message: 'Sala excluída com sucesso' }
    );
    
  } catch (error) {
    console.error('Erro ao excluir sala:', error);
    
    return NextResponse.json(
      { message: 'Erro ao excluir sala' },
      { status: 500 }
    );
  }
} 