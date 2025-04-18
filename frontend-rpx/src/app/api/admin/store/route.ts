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

// GET - Listar todos os itens da loja
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
    
    // Obter ID do item (opcional)
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      // Buscar item específico
      const item = await db.collection('store_items').findOne({
        _id: new ObjectId(id)
      });
      
      if (!item) {
        return NextResponse.json(
          { message: 'Item não encontrado' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        ...item,
        id: item._id.toString()
      });
    }
    
    // Buscar todos os itens
    const items = await db.collection('store_items')
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    
    // Transformar _id em id para compatibilidade com o frontend
    const transformedItems = items.map((item: any) => ({
      ...item,
      id: item._id.toString(),
      _id: undefined
    }));
    
    return NextResponse.json(transformedItems);
    
  } catch (error) {
    console.error('Erro ao listar itens da loja:', error);
    
    return NextResponse.json(
      { message: 'Erro ao buscar itens da loja' },
      { status: 500 }
    );
  }
}

// POST - Criar um novo item
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
    if (!body.name || !body.price || !body.category) {
      return NextResponse.json(
        { message: 'Dados insuficientes. Nome, preço e categoria são obrigatórios.' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Criar novo item
    const novoItem = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
      stock: body.stock || 999999, // Estoque ilimitado por padrão
      featured: body.featured || false,
      active: body.active || true
    };
    
    const result = await db.collection('store_items').insertOne(novoItem);
    
    if (!result.insertedId) {
      throw new Error('Falha ao inserir item');
    }
    
    return NextResponse.json({
      id: result.insertedId.toString(),
      ...novoItem
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erro ao criar item:', error);
    
    return NextResponse.json(
      { message: 'Erro ao criar item' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um item existente
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
        { message: 'ID do item não fornecido' },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    
    const { db } = await connectToDatabase();
    
    // Verificar se existe o item com o ID fornecido
    const existingItem = await db.collection('store_items').findOne({
      _id: new ObjectId(id)
    });
    
    if (!existingItem) {
      return NextResponse.json(
        { message: 'Item não encontrado' },
        { status: 404 }
      );
    }
    
    // Atualizar item
    const updateData = {
      ...body,
      updatedAt: new Date()
    };
    
    await db.collection('store_items').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    return NextResponse.json({
      id,
      ...updateData
    });
    
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    
    return NextResponse.json(
      { message: 'Erro ao atualizar item' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir um item
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
        { message: 'ID do item não fornecido' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se o item existe
    const item = await db.collection('store_items').findOne({
      _id: new ObjectId(id)
    });
    
    if (!item) {
      return NextResponse.json(
        { message: 'Item não encontrado' },
        { status: 404 }
      );
    }
    
    // Excluir item
    await db.collection('store_items').deleteOne({
      _id: new ObjectId(id)
    });
    
    return NextResponse.json(
      { message: 'Item excluído com sucesso' }
    );
    
  } catch (error) {
    console.error('Erro ao excluir item:', error);
    
    return NextResponse.json(
      { message: 'Erro ao excluir item' },
      { status: 500 }
    );
  }
} 