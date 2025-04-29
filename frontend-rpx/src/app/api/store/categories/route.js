import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// GET - Obter categorias para a loja pública (sem autenticação)
export async function GET(request) {
  try {
    console.log('Recebida solicitação pública para GET /api/store/categories');
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    const collection = db.collection('products');
    
    // Buscar categorias distintas de produtos em estoque
    const categories = await collection.distinct("category", { inStock);
    
    console.log(`${categories.length} categorias encontradas:`, categories);
    
    // Formatar resposta
    const formattedCategories = categories
      .filter(cat => cat && cat.trim() !== '') // Remover categorias vazias
      .map(name => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name
      }));
    
    return NextResponse.json({ categories);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar categorias', details,
      { status);
  }
} 