import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from "mongodb";

// Função para validar os dados da categoria
function validateCategory(category) {
  if (!category.name || category.name.trim() === "") {
    return "Nome da categoria é obrigatório";
  }
  return null;
}

// GET - Listar categorias
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

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Buscar categorias
    const categories = await db.collection('categories')
      .find({})
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({
      status: 'success',
      data: categories.map(category => ({
        ...category,
        id: category._id ? category._id.toString() : ""
      }))
    });
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao listar categorias: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
}

// POST - Criar ou atualizar uma categoria
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
    const { _id, name, description, icon, color } = body;

    const categoryData = {
      name,
      description: description || '',
      icon: icon || '',
      color: color || '#000000'
    };

    // Validar dados
    const validationError = validateCategory(categoryData);
    if (validationError) {
      return NextResponse.json(
        { status: 'error', error: validationError },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    let result;
    let categoryId;

    if (_id) {
      // Atualizar categoria existente
      categoryId = new ObjectId(_id);
      
      const updateData = {
        ...categoryData,
        updatedAt: new Date(),
        updatedBy: session.user.id || session.user.email
      };
      
      result = await db.collection('categories').updateOne(
        { _id: categoryId },
        { $set: updateData }
      );
      
      if (!result.acknowledged || result.matchedCount === 0) {
        return NextResponse.json(
          { status: 'error', error: 'Categoria não encontrada ou falha ao atualizar' },
          { status: 404 }
        );
      }
    } else {
      // Criar nova categoria
      const newCategory = {
        ...categoryData,
        createdAt: new Date(),
        createdBy: session.user.id || session.user.email,
        updatedAt: new Date(),
        updatedBy: session.user.id || session.user.email
      };
      
      result = await db.collection('categories').insertOne(newCategory);
      
      if (!result.acknowledged) {
        return NextResponse.json(
          { status: 'error', error: 'Falha ao criar categoria' },
          { status: 500 }
        );
      }
      
      categoryId = result.insertedId;
    }

    // Registrar log de auditoria
    await db.collection('admin_logs').insertOne({
      adminId: session.user.id || session.user.email,
      adminEmail: session.user.email,
      action: _id ? 'update_category' : 'create_category',
      entity: 'category',
      entityId: _id || categoryId.toString(),
      details: body,
      timestamp: new Date()
    });

    return NextResponse.json({
      status: 'success',
      message: _id ? 'Categoria atualizada com sucesso' : 'Categoria criada com sucesso',
      id: _id || categoryId.toString()
    });
  } catch (error) {
    console.error('Erro ao salvar categoria:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao salvar categoria: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
}

// DELETE - Excluir uma categoria
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

    // Obter ID da categoria da URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { status: 'error', error: 'ID da categoria não fornecido' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Converter ID para ObjectId
    const categoryId = new ObjectId(id);

    // Verificar se existem produtos nesta categoria
    const productsCount = await db.collection('products').countDocuments({ categoryId: id });
    
    if (productsCount > 0) {
      return NextResponse.json(
        { status: 'error', error: 'Esta categoria não pode ser excluída pois está associada a produtos' },
        { status: 400 }
      );
    }

    // Excluir categoria
    const result = await db.collection('categories').deleteOne({ _id: categoryId });

    if (!result.acknowledged || result.deletedCount === 0) {
      return NextResponse.json(
        { status: 'error', error: 'Categoria não encontrada ou falha ao excluir' },
        { status: 404 }
      );
    }

    // Registrar log de auditoria
    await db.collection('admin_logs').insertOne({
      adminId: session.user.id || session.user.email,
      adminEmail: session.user.email,
      action: 'delete_category',
      entity: 'category',
      entityId: id,
      timestamp: new Date()
    });

    return NextResponse.json({
      status: 'success',
      message: 'Categoria excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao excluir categoria: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
} 