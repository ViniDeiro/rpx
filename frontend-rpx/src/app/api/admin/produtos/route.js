import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Interface para produto
export 

// Função para validar os dados do produto
function validateProduct(product) {
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
    return "Preço deve ser maior que zero";
  }
  
  // Verifica categoria
  if (!product.categoryId) {
    return "Categoria é obrigatória";
  }
  
  return null;
}

// GET - Listar todos os produtos ou um produto específico
export async function GET(request) {
  try {
    // Verificar autenticação para admin (bypassa em ambiente de desenvolvimento)
    if (process.env.NODE_ENV !== 'development') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
      }
    } else {
      console.log('Ambiente de desenvolvimento - bypassing autenticação para GET');
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    const { db } = await connectToDatabase();
    const collection = db.collection('products');
    
    // Se um ID específico for fornecido, buscar apenas esse produto
    if (id) {
      try {
        const product = await collection.findOne({ _id: new ObjectId(id) });
        
        if (!product) {
          return NextResponse.json(
            { error: 'Produto não encontrado' }, 
            { status: 404 }
          );
        }
        
        return NextResponse.json(product);
      } catch (error) {
        return NextResponse.json(
          { error: 'ID de produto inválido' }, 
          { status: 400 }
        );
      }
    }
    
    // Caso contrário, listar todos os produtos
    const products = await collection.find({}).toArray();
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' }, 
      { status: 500 }
    );
  }
}

// POST - Criar um novo produto
export async function POST(request) {
  try {
    // Verificar autenticação para admin (bypassa em ambiente de desenvolvimento)
    if (process.env.NODE_ENV !== 'development') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
      }
    } else {
      console.log('Ambiente de desenvolvimento - bypassing autenticação para POST');
    }
    
    const data = await request.json();
    console.log('Dados recebidos para novo produto:', { ...data, imageUrl: data.imageUrl ? '[IMAGEM]' : undefined });
    
    // Validar dados obrigatórios
    const validationError = validateProduct(data);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }
    
    // Validar o tamanho da imagem
    if (data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.startsWith('data:')) {
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
    } catch (dbError) {
      console.error('Erro no banco de dados:', dbError);
      return NextResponse.json(
        { error: `Erro no banco de dados: ${dbError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json(
      { error: 'Erro ao criar produto', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um produto existente
export async function PUT(request) {
  try {
    // Verificar autenticação para admin (bypassa em ambiente de desenvolvimento)
    if (process.env.NODE_ENV !== 'development') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
      }
    } else {
      console.log('Ambiente de desenvolvimento - bypassing autenticação para PUT');
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
    console.log('Dados recebidos para atualização:', { ...data, imageUrl: data.imageUrl ? '[IMAGEM]' : undefined });
    
    // Validar dados obrigatórios
    const validationError = validateProduct(data);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }
    
    // Validar o tamanho da imagem se estiver sendo atualizada
    if (data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.startsWith('data:')) {
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
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar produto', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Excluir um produto
export async function DELETE(request) {
  try {
    // Verificar autenticação para admin (bypassa em ambiente de desenvolvimento)
    if (process.env.NODE_ENV !== 'development') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
      }
    } else {
      console.log('Ambiente de desenvolvimento - bypassing autenticação para DELETE');
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
      message: 'Produto excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir produto', details: error.message },
      { status: 500 }
    );
  }
} 