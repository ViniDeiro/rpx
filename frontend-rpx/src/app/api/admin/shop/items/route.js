import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET - Listar todos os itens da loja
export async function GET(request) {
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
    const category = searchParams.get('category');
    const featured = searchParams.get('featured') === 'true';
    const available = searchParams.get('available') !== 'false'; // Default true
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Construir query baseada nos parâmetros
    const query = {};
    if (category) query.category = category;
    if (featured) query.featured = true;
    if (available !== undefined) query.available = available;
    
    // Buscar itens
    const items = await db.collection('shop_items')
      .find(query)
      .sort({ featured: -1, category: 1, name: 1 })
      .toArray();
    
    // Formatar resposta
    const formattedItems = items.map(item => ({
      ...item,
      _id: item._id.toString()
    }));
    
    return NextResponse.json({
      status: 'success',
      count: formattedItems.length,
      data: formattedItems
    });
  } catch (error) {
    console.error('Erro ao listar itens da loja:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao listar itens: ' + error.message },
      { status: 500 }
    );
  }
}

// POST - Criar um novo item na loja
export async function POST(request) {
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
    const { name, description, price, category, imageUrl, tags } = body;
    
    // Validar dados obrigatórios
    if (!name || !description || price === undefined || !category || !imageUrl) {
      return NextResponse.json(
        { status: 'error', error: 'Dados insuficientes. Nome, descrição, preço, categoria e imagem são obrigatórios.' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Verificar se já existe um item com o mesmo nome na mesma categoria
    const existingItem = await db.collection('shop_items').findOne({
      name: name,
      category: category
    });
    
    if (existingItem) {
      return NextResponse.json(
        { status: 'error', error: `Já existe um item chamado "${name}" na categoria "${category}".` },
        { status: 409 }
      );
    }
    
    // Criar o item
    const newItem = {
      name: name,
      description: description,
      price: Number(price),
      category: category,
      imageUrl: imageUrl,
      tags: tags || [],
      available: body.available !== false,
      featured: body.featured === true,
      createdAt: new Date(),
      createdBy: session.user.id,
      updatedAt: new Date()
    };
    
    const result = await db.collection('shop_items').insertOne(newItem);
    
    if (!result.insertedId) {
      throw new Error('Falha ao criar item na loja');
    }
    
    // Registrar atividade do admin
    await db.collection('admin_logs').insertOne({
      adminId: session.user.id,
      action: 'create_shop_item',
      itemId: result.insertedId.toString(),
      details: newItem,
      timestamp: new Date()
    });
    
    return NextResponse.json({
      status: 'success',
      message: 'Item criado com sucesso',
      item: {
        _id: result.insertedId.toString(),
        ...newItem
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar item na loja:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao criar item: ' + error.message },
      { status: 500 }
    );
  }
} 