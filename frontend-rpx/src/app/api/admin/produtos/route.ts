import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Interface para produto
export interface Product {
  _id?: string | ObjectId;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  inStock: boolean;
  featured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Lista de produtos mockados para desenvolvimento
const mockProducts = [
  {
    _id: new ObjectId(),
    name: 'Insígnia de Ouro RPX',
    description: 'Uma insígnia especial para jogadores premium',
    price: 500,
    category: 'insignia',
    imageUrl: '/images/produtos/insignia-ouro.png',
    inStock: true,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    name: 'Banner Exclusivo Campeão',
    description: 'Um banner exclusivo para campeões de torneios',
    price: 800,
    category: 'banner',
    imageUrl: '/images/produtos/banner-campeao.png',
    inStock: true,
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    name: 'Avatar Personalizado Premium',
    description: 'Avatar personalizado com efeitos especiais',
    price: 300,
    category: 'avatar',
    imageUrl: '/images/produtos/avatar-premium.png',
    inStock: true,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

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

// Função para validar os dados do produto
function validateProduct(product: Partial<Product>): string | null {
  if (!product.name || product.name.trim() === "") {
    return "Nome do produto é obrigatório";
  }

  if (!product.description || product.description.trim() === "") {
    return "Descrição do produto é obrigatória";
  }

  if (product.price === undefined || product.price < 0) {
    return "Preço deve ser um valor positivo";
  }

  if (!product.category || product.category.trim() === "") {
    return "Categoria do produto é obrigatória";
  }

  return null;
}

// GET - Obter produtos (todos ou por ID)
export async function GET(request: NextRequest) {
  // Em ambiente de desenvolvimento, usar dados mock
  if (process.env.NODE_ENV === 'development') {
    console.log('Usando dados mock para produtos');
    
    // Verificar se há um ID na query
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      // Buscar um produto específico
      const product = mockProducts.find(p => p._id.toString() === id);
      
      if (!product) {
        return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
      }
      
      return NextResponse.json(product);
    }
    
    // Retornar todos os produtos
    return NextResponse.json({ products: mockProducts });
  }
  
  try {
    // Verificar autenticação para admin em produção
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { db } = await connectToDatabase();
    const collection = db.collection('products');
    
    // Verificar se há um ID na query
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      // Buscar um produto específico
      const product = await collection.findOne({ _id: new ObjectId(id) });
      
      if (!product) {
        return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
      }
      
      return NextResponse.json(product);
    }
    
    // Buscar todos os produtos
    const products = await collection.find({}).toArray();
    
    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Criar um novo produto
export async function POST(request: NextRequest) {
  try {
    // Em ambiente de desenvolvimento, simular criação
    if (process.env.NODE_ENV === 'development') {
      console.log('Simulando criação de produto em desenvolvimento');
      
      const data = await request.json();
      
      // Criar um novo produto mock
      const newProduct = {
        _id: new ObjectId(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Adicionar ao array de produtos mock (apenas para simulação)
      mockProducts.push(newProduct);
      
      return NextResponse.json(
        { message: 'Produto criado com sucesso', product: newProduct },
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
    if (!data.name || !data.description || !data.price || !data.category) {
      return NextResponse.json(
        { error: 'Dados incompletos. Nome, descrição, preço e categoria são obrigatórios.' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const collection = db.collection('products');
    
    // Criar o produto no banco
    const result = await collection.insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    if (!result.insertedId) {
      return NextResponse.json(
        { error: 'Falha ao criar produto' },
        { status: 500 }
      );
    }
    
    // Buscar o produto recém-criado
    const newProduct = await collection.findOne({ _id: result.insertedId });
    
    return NextResponse.json(
      { message: 'Produto criado com sucesso', product: newProduct },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json(
      { error: 'Erro ao criar produto', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um produto existente
export async function PUT(request: NextRequest) {
  try {
    // Em ambiente de desenvolvimento, simular atualização
    if (process.env.NODE_ENV === 'development') {
      console.log('Simulando atualização de produto em desenvolvimento');
      
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      
      if (!id) {
        return NextResponse.json(
          { error: 'ID do produto não fornecido' },
          { status: 400 }
        );
      }
      
      const data = await request.json();
      
      // Encontrar o produto no array mock
      const index = mockProducts.findIndex(p => p._id.toString() === id);
      
      if (index === -1) {
        return NextResponse.json(
          { error: 'Produto não encontrado' },
          { status: 404 }
        );
      }
      
      // Atualizar o produto mock
      mockProducts[index] = {
        ...mockProducts[index],
        ...data,
        updatedAt: new Date()
      };
      
      return NextResponse.json({
        message: 'Produto atualizado com sucesso',
        product: mockProducts[index]
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
        { error: 'ID do produto não fornecido' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    const { db } = await connectToDatabase();
    const collection = db.collection('products');
    
    // Verificar se o produto existe
    const product = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    // Atualizar o produto
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...data,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Falha ao atualizar produto' },
        { status: 500 }
      );
    }
    
    // Buscar o produto atualizado
    const updatedProduct = await collection.findOne({ _id: new ObjectId(id) });
    
    return NextResponse.json({
      message: 'Produto atualizado com sucesso',
      product: updatedProduct
    });
  } catch (error: any) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar produto', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remover um produto
export async function DELETE(request: NextRequest) {
  try {
    // Em ambiente de desenvolvimento, simular exclusão
    if (process.env.NODE_ENV === 'development') {
      console.log('Simulando exclusão de produto em desenvolvimento');
      
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      
      if (!id) {
        return NextResponse.json(
          { error: 'ID do produto não fornecido' },
          { status: 400 }
        );
      }
      
      // Encontrar o produto no array mock
      const index = mockProducts.findIndex(p => p._id.toString() === id);
      
      if (index === -1) {
        return NextResponse.json(
          { error: 'Produto não encontrado' },
          { status: 404 }
        );
      }
      
      // Remover o produto do array mock
      mockProducts.splice(index, 1);
      
      return NextResponse.json({
        message: 'Produto excluído com sucesso'
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
        { error: 'ID do produto não fornecido' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const collection = db.collection('products');
    
    // Verificar se o produto existe
    const product = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    // Remover o produto
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Falha ao excluir produto' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Produto excluído com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir produto', details: error.message },
      { status: 500 }
    );
  }
} 