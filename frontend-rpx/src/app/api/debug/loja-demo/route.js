import { request, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request) {
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
    const categorias = [
      {
        name: "Colecionáveis",
        description: "Itens raros e únicos para colecionadores",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "Power-ups",
        description: "Melhore seu desempenho no jogo",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "Cosméticos",
        description: "Personalização visual para seu perfil e avatares",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "Assinaturas",
        description: "Assinaturas premium para acessar recursos exclusivos",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "Tickets",
        description: "Entradas para eventos e torneios especiais",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    
    // Inserir categorias
    const categoryResults = await db.collection("categories").insertMany(categorias);
    const categoryIds = Object.values(categoryResults.insertedIds);
    
    // Criar produtos de exemplo
    const produtos = [
      {
        name: "Carta Lendária do Dragão",
        price: 5000,
        description: "Carta colecionável ultra rara com o lendário Dragão de Cristal",
        category: "Colecionáveis",
        imageUrl: "/images/produtos/carta-lendaria.png",
        featured: true,
        available: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "Poção de XP Duplo",
        price: 300,
        description: "Dobra a experiência ganha por 24 horas",
        category: "Power-ups",
        imageUrl: "/images/produtos/pocao-xp.png",
        featured: false,
        available: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "Avatar Premium - Mago Cósmico",
        price: 1500,
        description: "Avatar animado exclusivo com efeitos especiais",
        category: "Cosméticos",
        imageUrl: "/images/produtos/avatar-mago.png",
        featured: true,
        available: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "Tema Gamer RGB",
        price: 800,
        description: "Tema para personalizar seu perfil com LEDs multicores",
        category: "Cosméticos",
        imageUrl: "/images/produtos/tema-rgb.png",
        featured: false,
        available: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "RPX Prime - 1 Mês",
        price: 1000,
        description: "Assinatura mensal com benefícios VIP",
        category: "Assinaturas",
        imageUrl: "/images/produtos/assinatura-prime.png",
        featured: true,
        available: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        name: "Ticket de Entrada - Torneio XTREME",
        price: 2000,
        description: "Entrada para o maior torneio do ano com premiação exclusiva",
        category: "Tickets",
        imageUrl: "/images/produtos/ticket-torneio.png",
        featured: true,
        available: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    
    // Inserir produtos
    const productResults = await db.collection("products").insertMany(produtos);
    
    return NextResponse.json({
      success: true,
      message: "Dados de demonstração criados com sucesso",
      data: {
        categorias,
        produtos,
        ids: Object.values(productResults.insertedIds)
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