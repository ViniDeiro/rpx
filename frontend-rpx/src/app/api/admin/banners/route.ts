import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// GET - Listar todos os banners
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

    // Obter parâmetros de consulta
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');

    // Validar parâmetros
    const skip = (page - 1) * limit;

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Construir query
    const query: any = {};
    if (type) {
      query.type = type;
    }

    // Buscar banners
    const banners = await db.collection('banners')
      .find(query)
      .sort({ position: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Contar total de resultados para paginação
    const total = await db.collection('banners').countDocuments(query);

    return NextResponse.json({
      status: 'success',
      data: banners.map(banner => ({
        ...banner,
        _id: banner._id.toString()
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Erro ao listar banners:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao listar banners: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
}

// POST - Criar um novo banner
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
      title,
      description,
      imageUrl,
      linkUrl,
      type,
      position,
      active,
      startDate,
      endDate
    } = body;

    // Validar dados obrigatórios
    if (!title || !imageUrl || !type) {
      return NextResponse.json(
        { status: 'error', error: 'Dados insuficientes. Título, imagem e tipo são obrigatórios.' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Criar objeto do banner
    const banner = {
      title,
      description: description || '',
      imageUrl,
      linkUrl: linkUrl || '',
      type,
      position: position !== undefined ? parseInt(position) : 0,
      active: active !== undefined ? active : true,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      createdAt: new Date(),
      createdBy: session.user.id || session.user.email,
      updatedAt: new Date(),
      updatedBy: session.user.id || session.user.email
    };

    // Salvar no banco de dados
    const result = await db.collection('banners').insertOne(banner);

    // Registrar log de auditoria
    await db.collection('admin_logs').insertOne({
      adminId: session.user.id || session.user.email,
      adminEmail: session.user.email,
      action: 'create_banner',
      entity: 'banner',
      entityId: result.insertedId.toString(),
      details: {
        bannerTitle: title,
        bannerType: type
      },
      timestamp: new Date()
    });

    return NextResponse.json({
      status: 'success',
      message: 'Banner criado com sucesso',
      bannerId: result.insertedId.toString()
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar banner:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao criar banner: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
}

// DELETE - Remover vários banners (remoção em lote)
export async function DELETE(request: NextRequest) {
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
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { status: 'error', error: 'Lista de IDs não fornecida ou inválida' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Converter IDs para ObjectId
    const objectIds = ids.map(id => new ObjectId(id));

    // Remover banners
    const result = await db.collection('banners').deleteMany({
      _id: { $in: objectIds }
    });

    // Registrar log de auditoria
    await db.collection('admin_logs').insertOne({
      adminId: session.user.id || session.user.email,
      adminEmail: session.user.email,
      action: 'delete_banners',
      entity: 'banner',
      details: {
        count: result.deletedCount,
        bannerIds: ids
      },
      timestamp: new Date()
    });

    return NextResponse.json({
      status: 'success',
      message: `${result.deletedCount} banners removidos com sucesso`
    });
  } catch (error: any) {
    console.error('Erro ao remover banners:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao remover banners: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
} 