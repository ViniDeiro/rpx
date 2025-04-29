import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// GET - Listar todos os banners
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

    // Obter parâmetros de consulta
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Preparar filtro
    const filter = {};
    if (active === 'true') {
      filter.active = true;
    } else if (active === 'false') {
      filter.active = false;
    }

    // Buscar banners
    const banners = await db.collection('banners')
      .find(filter)
      .sort({ order: 1, createdAt: -1 })
      .toArray();

    return NextResponse.json({
      status: 'success',
      data: banners.map(banner => ({
        ...banner,
        id: banner._id.toString()
      }))
    });
  } catch (error) {
    console.error('Erro ao listar banners:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao listar banners: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
}

// POST - Criar ou atualizar um banner
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
    const {
      _id,
      title,
      description,
      imageUrl,
      linkUrl,
      startDate,
      endDate,
      order,
      active
    } = body;

    // Validar dados obrigatórios
    if (!title || !imageUrl) {
      return NextResponse.json(
        { status: 'error', error: 'Título e URL da imagem são obrigatórios' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    let result;
    let bannerId;

    if (_id) {
      // Atualizar banner existente
      const bannerId = new ObjectId(_id);
      
      const updateData = {
        title,
        description,
        imageUrl,
        linkUrl,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        order: order || 0,
        active: active !== undefined ? active : true,
        updatedAt: new Date(),
        updatedBy: session.user.id || session.user.email
      };
      
      result = await db.collection('banners').updateOne(
        { _id: bannerId },
        { $set: updateData }
      );
      
      if (!result.acknowledged || result.matchedCount === 0) {
        return NextResponse.json(
          { status: 'error', error: 'Banner não encontrado ou falha ao atualizar' },
          { status: 404 }
        );
      }
    } else {
      // Criar novo banner
      const newBanner = {
        title,
        description,
        imageUrl,
        linkUrl,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        order: order || 0,
        active: active !== undefined ? active : true,
        createdAt: new Date(),
        createdBy: session.user.id || session.user.email,
        updatedAt: new Date(),
        updatedBy: session.user.id || session.user.email
      };
      
      result = await db.collection('banners').insertOne(newBanner);
      
      if (!result.acknowledged) {
        return NextResponse.json(
          { status: 'error', error: 'Falha ao criar banner' },
          { status: 500 }
        );
      }
      
      bannerId = result.insertedId;
    }

    // Registrar log de auditoria
    await db.collection('admin_logs').insertOne({
      adminId: session.user.id || session.user.email,
      adminEmail: session.user.email,
      action: _id ? 'update_banner' : 'create_banner',
      entity: 'banner',
      entityId: _id || bannerId.toString(),
      details: body,
      timestamp: new Date()
    });

    return NextResponse.json({
      status: 'success',
      message: _id ? 'Banner atualizado com sucesso' : 'Banner criado com sucesso',
      id: _id || bannerId.toString()
    });
  } catch (error) {
    console.error('Erro ao salvar banner:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao salvar banner: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
}

// DELETE - Excluir um banner
export async function DELETE(request) {
  try {
    // Verificar se o usuário é admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { status: 'error', error: 'Apenas administradores podem acessar este recurso' },
        { status: 403 }
      );
    }

    // Obter ID do banner da URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { status: 'error', error: 'ID do banner não fornecido' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Converter ID para ObjectId
    const bannerId = new ObjectId(id);

    // Excluir banner
    const result = await db.collection('banners').deleteOne({ _id: bannerId });

    if (!result.acknowledged || result.deletedCount === 0) {
      return NextResponse.json(
        { status: 'error', error: 'Banner não encontrado ou falha ao excluir' },
        { status: 404 }
      );
    }

    // Registrar log de auditoria
    await db.collection('admin_logs').insertOne({
      adminId: session.user.id || session.user.email,
      adminEmail: session.user.email,
      action: 'delete_banner',
      entity: 'banner',
      entityId: id,
      timestamp: new Date()
    });

    return NextResponse.json({
      status: 'success',
      message: 'Banner excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir banner:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao excluir banner: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
} 