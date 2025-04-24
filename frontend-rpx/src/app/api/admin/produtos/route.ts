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

// Função para validar os dados do produto
function validateProduct(product: Partial<Product>): string | null {
  if (!product.name || product.name.trim() === "") {
    return "Nome do produto é obrigatório";
  }

  if (!product.description || product.description.trim() === "") {
    return "Descrição do produto é obrigatória";
  }

  // Verifica se o preço é um número válido
  if (product.price === undefined || isNaN(Number(product.price))) {
    return "Preço deve ser um número válido";
  }
  
  // Verifica se o preço é positivo
  if (Number(product.price) <= 0) {
    return "Preço deve ser um valor positivo";
  }

  if (!product.category || product.category.trim() === "") {
    return "Categoria do produto é obrigatória";
  }

  return null;
}

// GET - Obter produtos (todos ou por ID)
export async function GET(request: NextRequest) {
  try {
    console.log('Recebida solicitação GET para /api/admin/produtos')
    
    // Verificar autenticação para admin (bypassa em ambiente de desenvolvimento)
    if (process.env.NODE_ENV !== 'development') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
    } else {
      console.log('Ambiente de desenvolvimento: bypassing autenticação para GET');
    }
    
    try {
      // Verificar se há um ID na query
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      console.log('Parâmetro ID:', id || 'nenhum');
      
      // Conectar ao banco de dados
      const { db } = await connectToDatabase();
      const collection = db.collection('products');
      
      if (id) {
        // Buscar um produto específico
        console.log(`Buscando produto específico com ID: ${id}`);
        try {
          const product = await collection.findOne({ _id: new ObjectId(id) });
          
          if (!product) {
            console.log(`Produto com ID ${id} não encontrado`);
            return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
          }
          
          console.log('Produto encontrado com sucesso');
          return NextResponse.json(product);
        } catch (idError) {
          console.error('Erro ao buscar produto por ID:', idError);
          return NextResponse.json({ error: 'ID de produto inválido' }, { status: 400 });
        }
      }
      
      // Buscar todos os produtos
      console.log('Buscando todos os produtos');
      const products = await collection.find({}).toArray();
      console.log(`${products.length} produtos encontrados`);
      
      return NextResponse.json({ products });
    } catch (dbError: any) {
      console.error('Erro no banco de dados:', dbError);
      
      // Em desenvolvimento, retornar produtos mockados
      if (process.env.NODE_ENV === 'development') {
        console.log('Usando dados mockados em ambiente de desenvolvimento');
        return NextResponse.json({ 
          products: [] 
        });
      }
      
      throw new Error(`Erro no banco de dados: ${dbError.message}`);
    }
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
    // Verificar autenticação para admin (bypassa em ambiente de desenvolvimento)
    if (process.env.NODE_ENV !== 'development') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
    } else {
      console.log('Ambiente de desenvolvimento: bypassing autenticação');
    }
    
    const data = await request.json();
    console.log('Dados recebidos na API:', data);
    
    // Verificar se a imagem foi enviada
    if (!data.imageUrl) {
      return NextResponse.json(
        { error: 'Imagem do produto é obrigatória' },
        { status: 400 }
      );
    }
    
    // Validar dados obrigatórios
    const validationError = validateProduct(data);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }
    
    // Validar o tamanho da imagem
    if (data.imageUrl && typeof data.imageUrl === 'string') {
      const base64Size = data.imageUrl.length;
      console.log('Tamanho da imagem base64:', Math.round(base64Size / 1024), 'KB');
      
      if (base64Size > 5000000) { // ~5MB em base64
        return NextResponse.json(
          { error: 'A imagem é muito grande. O tamanho máximo é 5MB.' },
          { status: 400 }
        );
      }
    }
    
    try {
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
    } catch (dbError: any) {
      console.error('Erro no banco de dados:', dbError);
      return NextResponse.json(
        { error: `Erro no banco de dados: ${dbError.message}` },
        { status: 500 }
      );
    }
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
    // Verificar autenticação para admin (bypassa em ambiente de desenvolvimento)
    if (process.env.NODE_ENV !== 'development') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
    } else {
      console.log('Ambiente de desenvolvimento: bypassing autenticação para PUT');
    }
    
    // Extrair ID do parâmetro de consulta
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do produto não fornecido' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    console.log('Dados recebidos para atualização:', data);
    
    // Validar dados obrigatórios
    const validationError = validateProduct(data);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }
    
    // Validar o tamanho da imagem se estiver sendo atualizada
    if (data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.startsWith('data:image/')) {
      const base64Size = data.imageUrl.length;
      console.log('Tamanho da imagem base64:', Math.round(base64Size / 1024), 'KB');
      
      if (base64Size > 5000000) { // ~5MB em base64
        return NextResponse.json(
          { error: 'A imagem é muito grande. O tamanho máximo é 5MB.' },
          { status: 400 }
        );
      }
    }
    
    const { db } = await connectToDatabase();
    const collection = db.collection('products');
    
    // Verificar se o produto existe
    const existingProduct = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    // Preparar os dados para atualização
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    // Remover o _id se estiver presente para evitar tentativa de modificação
    if (updateData._id) {
      delete updateData._id;
    }
    
    // Atualizar o produto no banco
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
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

// DELETE - Excluir um produto
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação para admin (bypassa em ambiente de desenvolvimento)
    if (process.env.NODE_ENV !== 'development') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
    } else {
      console.log('Ambiente de desenvolvimento: bypassing autenticação para DELETE');
    }
    
    // Extrair ID do parâmetro de consulta
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    console.log('Solicitação para excluir produto com ID:', id);
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do produto não fornecido' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const collection = db.collection('products');
    
    // Verificar se o produto existe
    const existingProduct = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    // Excluir o produto
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Falha ao excluir produto' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Produto excluído com sucesso',
      id: id
    });
  } catch (error: any) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir produto', details: error.message },
      { status: 500 }
    );
  }
} 