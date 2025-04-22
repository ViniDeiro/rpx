import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Limpar coleções existentes (opcional)
    const shouldClear = request.nextUrl.searchParams.get("clear") === "true";
    if (shouldClear) {
      await db.collection("categories").deleteMany({});
      await db.collection("products").deleteMany({});
    }
    
    // Criar categorias de exemplo
    const categories = [
      {
        name: "Assinaturas",
        description: "Assinaturas premium para acessar recursos exclusivos",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "Moedas",
        description: "Pacotes de moedas para usar na plataforma",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "Skins",
        description: "Itens cosméticos para personalizar seu perfil",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "Bônus",
        description: "Itens e pacotes especiais com desconto",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
    
    // Inserir categorias
    const categoryResults = await db.collection("categories").insertMany(categories);
    const categoryIds = Object.values(categoryResults.insertedIds);
    
    // Criar produtos de exemplo
    const products = [
      {
        name: "RPX Premium - 1 Mês",
        description: "Assinatura premium por 1 mês. Acesso a todos os recursos exclusivos.",
        price: 29.90,
        category: categoryIds[0].toString(),
        imageUrl: "https://via.placeholder.com/300?text=RPX+Premium",
        inStock: true,
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "Pacote de 1000 Moedas",
        description: "Pacote com 1000 moedas para usar em apostas e itens especiais.",
        price: 49.90,
        category: categoryIds[1].toString(),
        imageUrl: "https://via.placeholder.com/300?text=1000+Moedas",
        inStock: true,
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "Skin Épica - Dragão Dourado",
        description: "Skin exclusiva para personalizar seu perfil na plataforma.",
        price: 79.90,
        category: categoryIds[2].toString(),
        imageUrl: "https://via.placeholder.com/300?text=Skin+Épica",
        inStock: true,
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "Bundle Iniciante",
        description: "Pacote para novos jogadores com diversos itens e benefícios.",
        price: 39.90,
        category: categoryIds[3].toString(),
        imageUrl: "https://via.placeholder.com/300?text=Bundle+Iniciante",
        inStock: true,
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    // Inserir produtos
    const productResults = await db.collection("products").insertMany(products);
    
    return NextResponse.json({
      success: true,
      message: "Dados de demonstração criados com sucesso",
      data: {
        categories: {
          count: categories.length,
          ids: categoryIds
        },
        products: {
          count: products.length,
          ids: Object.values(productResults.insertedIds)
        }
      }
    });
  } catch (error) {
    console.error("Erro ao criar dados de demonstração da loja:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao criar dados de demonstração" },
      { status: 500 }
    );
  }
} 