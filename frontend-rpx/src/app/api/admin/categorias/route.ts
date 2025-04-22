import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Interface para categoria
export interface Category {
  _id?: string | ObjectId;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

// Função para validar os dados da categoria
function validateCategory(category: Partial<Category>): string | null {
  if (!category.name || category.name.trim() === "") {
    return "Nome da categoria é obrigatório";
  }

  return null;
}

// Categorias mockadas para desenvolvimento
const mockCategories = [
  {
    _id: 'insignia',
    name: 'Insígnia',
    description: 'Insígnias e medalhas exclusivas',
    order: 1
  },
  {
    _id: 'banner',
    name: 'Banner',
    description: 'Banners personalizados para o perfil',
    order: 2
  },
  {
    _id: 'avatar',
    name: 'Avatar',
    description: 'Avatares personalizados',
    order: 3
  },
  {
    _id: 'outro',
    name: 'Outro',
    description: 'Outros itens',
    order: 4
  }
];

// GET: Listar todas as categorias
export async function GET(request: NextRequest) {
  // Em ambiente de desenvolvimento, usar dados mock
  if (process.env.NODE_ENV === 'development') {
    console.log('Usando dados mock para categorias');
    return NextResponse.json({ categories: mockCategories });
  }
  
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { db } = await connectToDatabase();
    
    // Buscar todas as categorias
    const categories = await db.collection('categories').find({}).sort({ order: 1 }).toArray();
    
    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar categorias', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Criar nova categoria
export async function POST(request: NextRequest) {
  try {
    // Em ambiente de desenvolvimento, simular criação
    if (process.env.NODE_ENV === 'development') {
      console.log('Simulando criação de categoria em desenvolvimento');
      
      const data = await request.json();
      
      // Criar uma nova categoria mock
      const newCategory = {
        _id: Math.random().toString(36).substring(2, 15),
        ...data,
        order: mockCategories.length + 1
      };
      
      // Adicionar ao array de categorias mock
      mockCategories.push(newCategory);
      
      return NextResponse.json(
        { message: 'Categoria criada com sucesso', category: newCategory },
        { status: 201 }
      );
    }
    
    // Verificar autenticação para admin em produção
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Validar dados obrigatórios
    if (!data.name) {
      return NextResponse.json(
        { error: 'Nome da categoria é obrigatório' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const collection = db.collection('categories');
    
    // Obter a próxima ordem disponível
    const maxOrder = await collection.find().sort({ order: -1 }).limit(1).toArray();
    const nextOrder = maxOrder.length > 0 ? maxOrder[0].order + 1 : 1;
    
    // Criar a categoria no banco
    const result = await collection.insertOne({
      ...data,
      order: nextOrder,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    if (!result.insertedId) {
      return NextResponse.json(
        { error: 'Falha ao criar categoria' },
        { status: 500 }
      );
    }
    
    // Buscar a categoria recém-criada
    const newCategory = await collection.findOne({ _id: result.insertedId });
    
    return NextResponse.json(
      { message: 'Categoria criada com sucesso', category: newCategory },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json(
      { error: 'Erro ao criar categoria', details: error.message },
      { status: 500 }
    );
  }
}

// PUT: Atualizar categoria existente
export async function PUT(request: NextRequest) {
  try {
    // Em ambiente de desenvolvimento, simular atualização
    if (process.env.NODE_ENV === 'development') {
      console.log('Simulando atualização de categoria em desenvolvimento');
      
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      
      if (!id) {
        return NextResponse.json(
          { error: 'ID da categoria não fornecido' },
          { status: 400 }
        );
      }
      
      const data = await request.json();
      
      // Encontrar a categoria no array mock
      const index = mockCategories.findIndex(c => c._id === id);
      
      if (index === -1) {
        return NextResponse.json(
          { error: 'Categoria não encontrada' },
          { status: 404 }
        );
      }
      
      // Atualizar a categoria mock
      mockCategories[index] = {
        ...mockCategories[index],
        ...data
      };
      
      return NextResponse.json({
        message: 'Categoria atualizada com sucesso',
        category: mockCategories[index]
      });
    }
    
    // Verificar autenticação para admin em produção
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da categoria não fornecido' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Validar dados obrigatórios
    if (!data.name) {
      return NextResponse.json(
        { error: 'Nome da categoria é obrigatório' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const collection = db.collection('categories');
    
    // Verificar se a categoria existe
    const objectId = new ObjectId(id);
    const category = await collection.findOne({ _id: objectId });
    
    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }
    
    // Atualizar a categoria
    const result = await collection.updateOne(
      { _id: objectId },
      {
        $set: {
          ...data,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Falha ao atualizar categoria' },
        { status: 500 }
      );
    }
    
    // Buscar a categoria atualizada
    const updatedCategory = await collection.findOne({ _id: objectId });
    
    return NextResponse.json({
      message: 'Categoria atualizada com sucesso',
      category: updatedCategory
    });
  } catch (error: any) {
    console.error('Erro ao atualizar categoria:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar categoria', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Remover categoria
export async function DELETE(request: NextRequest) {
  try {
    // Em ambiente de desenvolvimento, simular exclusão
    if (process.env.NODE_ENV === 'development') {
      console.log('Simulando exclusão de categoria em desenvolvimento');
      
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      
      if (!id) {
        return NextResponse.json(
          { error: 'ID da categoria não fornecido' },
          { status: 400 }
        );
      }
      
      // Encontrar a categoria no array mock
      const index = mockCategories.findIndex(c => c._id === id);
      
      if (index === -1) {
        return NextResponse.json(
          { error: 'Categoria não encontrada' },
          { status: 404 }
        );
      }
      
      // Remover a categoria do array mock
      mockCategories.splice(index, 1);
      
      return NextResponse.json({
        message: 'Categoria excluída com sucesso'
      });
    }
    
    // Verificar autenticação para admin em produção
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da categoria não fornecido' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const collection = db.collection('categories');
    
    // Verificar se a categoria existe
    const objectId = new ObjectId(id);
    const category = await collection.findOne({ _id: objectId });
    
    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se há produtos usando esta categoria
    const productsWithCategory = await db.collection('products').countDocuments({
      category: id
    });
    
    if (productsWithCategory > 0) {
      return NextResponse.json(
        { error: 'Esta categoria possui produtos associados e não pode ser excluída' },
        { status: 400 }
      );
    }
    
    // Remover a categoria
    const result = await collection.deleteOne({ _id: objectId });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Falha ao excluir categoria' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Categoria excluída com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao excluir categoria:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir categoria', details: error.message },
      { status: 500 }
    );
  }
} 