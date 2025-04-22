import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// GET - Listar todos os produtos da loja
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
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Construir query
    const query: Record<string, any> = {};
    if (category) {
      query.category = category;
    }

    // Obter total de produtos para paginação
    const total = await db.collection('shop_items').countDocuments(query);

    // Buscar produtos com paginação
    const items = await db.collection('shop_items')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      status: 'success',
      data: {
        items: items.map(item => ({
          ...item,
          _id: item._id.toString()
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
    console.error('Erro ao listar produtos da loja:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao listar produtos: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
}

// POST - Adicionar novo produto à loja
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
      price,
      category,
      imageUrl,
      available,
      featured,
      attributes
    } = body;

    // Validar dados obrigatórios
    if (!name || !price || !category || !imageUrl) {
      return NextResponse.json(
        { status: 'error', error: 'Dados insuficientes. Nome, preço, categoria e imagem são obrigatórios.' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Criar objeto do produto
    const shopItem = {
      name,
      description: description || '',
      price: parseFloat(price),
      category,
      imageUrl,
      available: available !== false, // true por padrão
      featured: featured === true,    // false por padrão
      attributes: attributes || {},
      sales: 0,
      createdBy: session.user.id || session.user.email,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Inserir no banco de dados
    const result = await db.collection('shop_items').insertOne(shopItem);

    // Registrar log de auditoria
    await db.collection('admin_logs').insertOne({
      adminId: session.user.id || session.user.email,
      adminEmail: session.user.email,
      action: 'create_shop_item',
      entity: 'shop_item',
      entityId: result.insertedId.toString(),
      details: {
        itemName: name,
        price,
        category
      },
      timestamp: new Date()
    });

    return NextResponse.json({
      status: 'success',
      message: 'Produto adicionado com sucesso',
      itemId: result.insertedId.toString()
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao adicionar produto à loja:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao adicionar produto: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
} 