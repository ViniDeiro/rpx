import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// Função para gerar um ID aleatório baseado em data
function generateRandomId() {
  return new ObjectId();
}

// Usuários de teste para serem criados
const TEST_USERS = [
  {
    _id: generateRandomId(),
    name: "Administrador Teste",
    email: "admin@exemplo.com",
    username: "admin",
    isAdmin: true,
    createdAt: new Date()
  },
  {
    _id: generateRandomId(),
    name: "Usuário Regular",
    email: "usuario@exemplo.com",
    username: "usuario1",
    isAdmin: false,
    createdAt: new Date()
  },
  {
    _id: generateRandomId(),
    name: "Maria Silva",
    email: "maria@exemplo.com",
    username: "mariasilva",
    isAdmin: false,
    createdAt: new Date(Date.now() - 3600 * 1000 * 24) // 1 dia atrás
  },
  {
    _id: generateRandomId(),
    name: "João Santos",
    email: "joao@exemplo.com",
    username: "joaosantos",
    isAdmin: false,
    createdAt: new Date(Date.now() - 3600 * 1000 * 48) // 2 dias atrás
  },
  {
    _id: generateRandomId(),
    name: "Ana Pereira",
    email: "ana@exemplo.com",
    username: "anapereira",
    isAdmin: false,
    createdAt: new Date(Date.now() - 3600 * 1000 * 72) // 3 dias atrás
  }
];

export async function GET(request: NextRequest) {
  try {
    // Verificar ambiente
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Esta rota só está disponível em ambiente de desenvolvimento' },
        { status: 403 }
      );
    }
    
    console.log('🔧 Iniciando setup de usuários de teste...');
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Verificar usuários existentes
    const existingCount = await db.collection('users').countDocuments();
    console.log(`🔢 Encontrados ${existingCount} usuários existentes no banco`);
    
    // Adicionar usuários de teste
    const results: {
      added: number;
      skipped: number;
      existing: number;
      users: Array<{
        name: string;
        email: string;
        isAdmin: boolean;
      }>;
    } = {
      added: 0,
      skipped: 0,
      existing: existingCount,
      users: []
    };
    
    for (const user of TEST_USERS) {
      // Verificar se já existe um usuário com este email
      const existing = await db.collection('users').findOne({ email: user.email });
      
      if (existing) {
        console.log(`⏭️ Usuário com email ${user.email} já existe, pulando...`);
        results.skipped++;
        continue;
      }
      
      // Inserir o novo usuário
      await db.collection('users').insertOne(user);
      console.log(`✅ Usuário criado: ${user.name} (${user.email})`);
      results.added++;
      results.users.push({
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      });
    }
    
    // Verificar contagem final
    const finalCount = await db.collection('users').countDocuments();
    
    return NextResponse.json({
      success: true,
      message: `${results.added} usuários de teste adicionados. ${results.skipped} ignorados por já existirem.`,
      before: existingCount,
      after: finalCount,
      details: results
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao criar usuários de teste:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar usuários de teste' },
      { status: 500 }
    );
  }
} 