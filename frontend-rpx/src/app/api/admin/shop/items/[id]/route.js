import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET - Obter detalhes de um item específico da loja
export async function GET(request, { params }) {
  try {
    // Verificar se o usuário é admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { status: 'error', error: 'Apenas administradores podem acessar este recurso' },
        { status: 403 }
      );
    }

    const itemId = params.id;
    if (!itemId) {
      return NextResponse.json(
        { status: 'error', error: 'ID do item não fornecido' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Buscar o item
    let item;
    try {
      item = await db.collection('shop_items').findOne({
        _id: new ObjectId(itemId)
      });
    } catch (e) {
      return NextResponse.json(
        { status: 'error', error: 'ID de item inválido' },
        { status: 400 }
      );
    }

    if (!item) {
      return NextResponse.json(
        { status: 'error', error: 'Item não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: item
    });
  } catch (error) {
    console.error('Erro ao buscar item da loja:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao buscar item: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um item da loja
export async function PUT(request, { params }) {
  try {
    // Verificar se o usuário é admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { status: 'error', error: 'Apenas administradores podem acessar este recurso' },
        { status: 403 }
      );
    }

    const itemId = params.id;
    if (!itemId) {
      return NextResponse.json(
        { status: 'error', error: 'ID do item não fornecido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validar dados obrigatórios
    if (!body.name || !body.description || body.price === undefined) {
      return NextResponse.json(
        { status: 'error', error: 'Dados insuficientes. Nome, descrição e preço são obrigatórios.' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Verificar se o item existe
    let item;
    try {
      item = await db.collection('shop_items').findOne({
        _id: new ObjectId(itemId)
      });
    } catch (e) {
      return NextResponse.json(
        { status: 'error', error: 'ID de item inválido' },
        { status: 400 }
      );
    }

    if (!item) {
      return NextResponse.json(
        { status: 'error', error: 'Item não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar o item
    const updateData = {
      name: body.name,
      description: body.description,
      price: Number(body.price),
      imageUrl: body.imageUrl || item.imageUrl,
      category: body.category || item.category,
      tags: body.tags || item.tags,
      isAvailable: body.isAvailable !== undefined ? body.isAvailable : item.isAvailable,
      updatedAt: new Date(),
      updatedBy: session.user.id
    };

    await db.collection('shop_items').updateOne(
      { _id: new ObjectId(itemId) },
      { $set: updateData }
    );

    // Registrar atividade do admin
    await db.collection('admin_logs').insertOne({
      adminId: session.user.id,
      action: 'update_shop_item',
      itemId: itemId,
      details: updateData,
      timestamp: new Date()
    });

    return NextResponse.json({
      status: 'success',
      message: 'Item atualizado com sucesso',
      data: {
        _id: itemId,
        ...updateData
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar item da loja:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao atualizar item: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remover um item da loja
export async function DELETE(request, { params }) {
  try {
    // Verificar se o usuário é admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { status: 'error', error: 'Apenas administradores podem acessar este recurso' },
        { status: 403 }
      );
    }

    const itemId = params.id;
    if (!itemId) {
      return NextResponse.json(
        { status: 'error', error: 'ID do item não fornecido' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Verificar se o item existe
    let item;
    try {
      item = await db.collection('shop_items').findOne({
        _id: new ObjectId(itemId)
      });
    } catch (e) {
      return NextResponse.json(
        { status: 'error', error: 'ID de item inválido' },
        { status: 400 }
      );
    }

    if (!item) {
      return NextResponse.json(
        { status: 'error', error: 'Item não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o item foi comprado por algum usuário
    const purchaseCount = await db.collection('user_purchases').countDocuments({
      itemId: itemId
    });

    if (purchaseCount > 0) {
      return NextResponse.json(
        { 
          status: 'error', 
          error: `Este item não pode ser excluído pois já foi comprado por ${purchaseCount} usuários.` 
        },
        { status: 400 }
      );
    }

    // Excluir o item
    await db.collection('shop_items').deleteOne({
      _id: new ObjectId(itemId)
    });

    // Registrar atividade do admin
    await db.collection('admin_logs').insertOne({
      adminId: session.user.id,
      action: 'delete_shop_item',
      itemId: itemId,
      details: { item },
      timestamp: new Date()
    });

    return NextResponse.json({
      status: 'success',
      message: 'Item excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir item da loja:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao excluir item: ' + error.message },
      { status: 500 }
    );
  }
} 