import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET - Obter produtos para a loja pública (sem autenticação)
export async function GET(request) {
  try {
    console.log('Recebida solicitação pública para GET /api/store/products');
    
    try {
      // Verificar se há um ID ou categoria na query
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      const category = url.searchParams.get('category');
      const featured = url.searchParams.get('featured');
      
      console.log('Parâmetros:', { id, category, featured });
      
      // Conectar ao banco de dados
      const { db } = await connectToDatabase();
      const collection = db.collection('products');
      
      // Construir a query base
      let query = { inStock: true }; // Por padrão, só mostrar produtos em estoque
      
      // Adicionar filtros
      if (id) {
        try {
          query = { _id: new ObjectId(id) };
        } catch (idError) {
          console.error('ID inválido:', idError);
          return NextResponse.json({ error: 'ID de produto inválido' }, { status: 400 });
        }
      }
      
      if (category) {
        query.category = category;
      }
      
      if (featured === 'true') {
        query.featured = true;
      }
      
      // Se for para um produto específico
      if (id) {
        console.log(`Buscando produto específico com ID: ${id}`);
        const product = await collection.findOne(query);
        
        if (!product) {
          console.log(`Produto com ID ${id} não encontrado`);
          return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
        }
        
        console.log('Produto encontrado com sucesso');
        return NextResponse.json(product);
      }
      
      // Buscar todos os produtos que satisfazem a query
      console.log('Buscando produtos com query:', query);
      const products = await collection.find(query).toArray();
      console.log(`${products.length} produtos encontrados`);
      
      return NextResponse.json({ products });
    } catch (dbError) {
      console.error('Erro no banco de dados:', dbError);
      throw new Error(`Erro no banco de dados: ${dbError.message}`);
    }
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos', details: error.message },
      { status: 400 });
  }
} 