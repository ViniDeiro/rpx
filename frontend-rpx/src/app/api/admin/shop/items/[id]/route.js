import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// GET - Obter detalhes de um produto
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
        { status: 'error', error: 'ID do produto não fornecido' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Buscar o produto
    const item = await db.collection('shop_items').findOne({
      _id: new ObjectId(itemId)
    });

    if (!item) {
      return NextResponse.json(
        { status: 'error', error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: {
        ...item,
        _id: item._id.toString()
      }
    });
  } catch (error) {
    console.error('Erro ao obter detalhes do produto:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao obter detalhes do produto: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um produto
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
        { status: 'error', error: 'ID do produto não fornecido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      category,
      imageUrl,
      available,
      featured,
      attributes
    } = body;

    // Validar dados obrigatórios
    if (!name || price === undefined || !category || !imageUrl) {
      return NextResponse.json(
        { status: 'error', error: 'Dados insuficientes. Nome, preço, categoria e imagem são obrigatórios.' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Verificar se o produto existe
    const existingItem = await db.collection('shop_items').findOne({
      _id: new ObjectId(itemId)
    });

    if (!existingItem) {
      return NextResponse.json(
        { status: 'error', error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Criar objeto de atualização
    const updateData = {
      name,
      description: description || '',
      price: parseFloat(price),
      category,
      imageUrl,
      available: available !== false,
      featured: featured === true,
      attributes: attributes || {},
      updatedAt: new Date(),
      updatedBy: session.user.id || session.user.email
    };

    // Atualizar no banco de dados
    await db.collection('shop_items').updateOne(
      { _id: new ObjectId(itemId) },
      { $set: updateData }
    );

    // Registrar log de auditoria
    await db.collection('admin_logs').insertOne({
      adminId: session.user.id || session.user.email,
      adminEmail: session.user.email,
      action: 'update_shop_item',
      entity: 'shop_item',
      entityId: itemId,
      details: {
        itemName: name,
        price,
        category
      },
      timestamp: new Date()
    });

    return NextResponse.json({
      status: 'success',
      message: 'Produto atualizado com sucesso',
      itemId: itemId
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao atualizar produto: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
}

// DELETE - Remover um produto
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
        { status: 'error', error: 'ID do produto não fornecido' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Verificar se o produto existe
    const existingItem = await db.collection('shop_items').findOne({
      _id: new ObjectId(itemId)
    });

    if (!existingItem) {
      return NextResponse.json(
        { status: 'error', error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o produto foi vendido ou está em uso
    const sales = existingItem.sales || 0;
    if (sales > 0) {
      // Em vez de excluir, marcar como indisponível
      await db.collection('shop_items').updateOne(
        { _id: new ObjectId(itemId) },
        { 
          $set: { 
            available: false,
            updatedAt: new Date(),
            updatedBy: session.user.id || session.user.email
          }
        }
      );

      return NextResponse.json({
        status: 'success',
        message: 'Produto marcado como indisponível pois já possui vendas',
        itemId: itemId
      });
    }

    // Remover o produto
    await db.collection('shop_items').deleteOne({
      _id: new ObjectId(itemId)
    });

    // Registrar log de auditoria
    await db.collection('admin_logs').insertOne({
      adminId: session.user.id || session.user.email,
      adminEmail: session.user.email,
      action: 'delete_shop_item',
      entity: 'shop_item',
      entityId: itemId,
      details: {
        itemName: existingItem.name,
        price: existingItem.price,
        category: existingItem.category
      },
      timestamp: new Date()
    });

    return NextResponse.json({
      status: 'success',
      message: 'Produto removido com sucesso',
      itemId: itemId
    });
  } catch (error) {
    console.error('Erro ao remover produto:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao remover produto: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
} 