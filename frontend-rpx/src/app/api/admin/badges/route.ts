import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId, InsertOneResult, UpdateResult } from 'mongodb';

// GET - Listar todas as insígnias e troféus
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
    const type = searchParams.get('type'); // 'badge' ou 'trophy'
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Validar parâmetros
    const skip = (page - 1) * limit;

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Construir query
    const query: any = {};
    
    if (type) {
      query.type = type;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Buscar insígnias e troféus
    const badges = await db.collection('badges')
      .find(query)
      .sort({ category: 1, difficulty: 1, name: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Contar total de resultados para paginação
    const total = await db.collection('badges').countDocuments(query);

    // Obter categorias para filtro
    const categories = await db.collection('badges')
      .distinct('category');

    return NextResponse.json({
      status: 'success',
      data: badges.map(badge => ({
        ...badge,
        _id: badge._id.toString()
      })),
      categories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Erro ao listar insígnias e troféus:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao listar insígnias e troféus: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
}

// POST - Criar ou atualizar uma insígnia/troféu
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
      _id,
      name,
      description,
      imageUrl,
      type, // 'badge' ou 'trophy'
      category,
      difficulty,
      requirements,
      points,
      isSecret
    } = body;

    // Validar dados obrigatórios
    if (!name || !imageUrl || !type || !category) {
      return NextResponse.json(
        { status: 'error', error: 'Dados insuficientes. Nome, imagem, tipo e categoria são obrigatórios.' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Registro de qual tipo de operação foi realizada
    let actionType = '';
    let badgeObjectId: ObjectId | string = new ObjectId(); // Inicializa com um novo ObjectId

    // Atualizar ou criar insígnia
    let result: UpdateResult | InsertOneResult;
    if (_id) {
      // Atualizar insígnia existente
      const objectId = new ObjectId(_id);
      badgeObjectId = objectId;
      
      const badge = {
        name,
        description,
        imageUrl,
        type,
        category,
        difficulty: difficulty || 1,
        requirements: requirements || [],
        points: points || 0,
        isSecret: isSecret || false,
        updatedAt: new Date(),
        updatedBy: session.user.id || session.user.email
      };
      
      result = await db.collection('badges').updateOne(
        { _id: objectId },
        { $set: badge }
      );
      actionType = 'update_badge';
    } else {
      // Criar nova insígnia
      const badge = {
        name,
        description,
        imageUrl,
        type,
        category,
        difficulty: difficulty || 1,
        requirements: requirements || [],
        points: points || 0,
        isSecret: isSecret || false,
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: session.user.id || session.user.email
      };
      
      const insertResult = await db.collection('badges').insertOne(badge);
      result = insertResult;
      badgeObjectId = insertResult.insertedId;
      actionType = 'create_badge';
    }

    // Determinar se a operação foi bem-sucedida e obter o ID correto
    let operationSuccessful = false;
    let badgeId = '';

    if ('insertedId' in result) {
      // Caso de InsertOneResult
      operationSuccessful = !!result.acknowledged;
      badgeId = result.insertedId.toString();
    } else {
      // Caso de UpdateResult
      operationSuccessful = !!result.acknowledged && (result.matchedCount > 0);
      badgeId = _id as string; // Já temos o ID no caso de atualização
    }

    if (!operationSuccessful) {
      return NextResponse.json(
        { status: 'error', error: 'Falha ao salvar a insígnia/troféu no banco de dados' },
        { status: 500 }
      );
    }

    // Registrar log de auditoria
    await db.collection('admin_logs').insertOne({
      adminId: session.user.id || session.user.email,
      adminEmail: session.user.email,
      action: actionType,
      entity: 'badge',
      entityId: badgeId,
      details: {
        badgeName: name,
        badgeType: type
      },
      timestamp: new Date()
    });

    const message = _id 
      ? 'Insígnia/troféu atualizado com sucesso' 
      : 'Insígnia/troféu criado com sucesso';
    
    const statusCode = _id ? 200 : 201;

    return NextResponse.json({
      status: 'success',
      message,
      badgeId: badgeId
    }, { status: statusCode });
  } catch (error: any) {
    console.error('Erro ao salvar insígnia/troféu:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao salvar insígnia/troféu: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
}

// DELETE - Remover uma insígnia/troféu
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
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { status: 'error', error: 'ID da insígnia/troféu não fornecido' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Converter ID para ObjectId
    const badgeId = new ObjectId(id);

    // Verificar se existem usuários com esta insígnia
    const hasUsers = await db.collection('user_badges').findOne({ badgeId: id });
    
    if (hasUsers) {
      return NextResponse.json(
        { status: 'error', error: 'Esta insígnia/troféu está atribuída a usuários e não pode ser removida' },
        { status: 400 }
      );
    }

    // Obter dados da insígnia antes de remover
    const badge = await db.collection('badges').findOne({ _id: badgeId });
    
    if (!badge) {
      return NextResponse.json(
        { status: 'error', error: 'Insígnia/troféu não encontrado' },
        { status: 404 }
      );
    }

    // Remover insígnia
    const result = await db.collection('badges').deleteOne({ _id: badgeId });

    // Registrar log de auditoria
    await db.collection('admin_logs').insertOne({
      adminId: session.user.id || session.user.email,
      adminEmail: session.user.email,
      action: 'delete_badge',
      entity: 'badge',
      entityId: id,
      details: {
        badgeName: badge.name,
        badgeType: badge.type
      },
      timestamp: new Date()
    });

    return NextResponse.json({
      status: 'success',
      message: 'Insígnia/troféu removido com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao remover insígnia/troféu:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao remover insígnia/troféu: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
} 