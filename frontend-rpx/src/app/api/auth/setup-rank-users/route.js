import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { RankTier } from '@/utils/ranking';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

// Função para gerar um ID aleatório
function generateRandomId() {
  return new ObjectId();
}

// Pontos para cada rank
const rankPoints = {
  'unranked': 0,
  'bronze': 150,
  'silver': 350,
  'gold': 700,
  'platinum': 1100,
  'diamond': 1600,
  'legend': 1900,
  'challenger': 2100
};

// Lista de usuários de rank para serem criados
const RANK_USERS = [
  {
    _id: generateRandomId(),
    name: "Luiz",
    username: "luiz",
    email: "luiz@rpx.com",
    password: "senha123",
    userNumber: 1,
    avatarUrl: "/images/avatar-placeholder.svg",
    rank: {
      tier: "unranked",
      division: 0,
      points: rankPoints.unranked
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: generateRandomId(),
    name: "João",
    username: "joao",
    email: "joao@rpx.com",
    password: "senha123",
    userNumber: 2,
    avatarUrl: "/images/avatar-placeholder.svg",
    rank: {
      tier: "bronze",
      division: 2,
      points: rankPoints.bronze
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: generateRandomId(),
    name: "Julia",
    username: "julia",
    email: "julia@rpx.com",
    password: "senha123",
    userNumber: 3,
    avatarUrl: "/images/avatar-placeholder.svg",
    rank: {
      tier: "silver",
      division: 2,
      points: rankPoints.silver
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: generateRandomId(),
    name: "Bianca",
    username: "bianca",
    email: "bianca@rpx.com",
    password: "senha123",
    userNumber: 4,
    avatarUrl: "/images/avatar-placeholder.svg",
    rank: {
      tier: "gold",
      division: 2,
      points: rankPoints.gold
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: generateRandomId(),
    name: "Yuri",
    username: "yuri",
    email: "yuri@rpx.com",
    password: "senha123",
    userNumber: 5,
    avatarUrl: "/images/avatar-placeholder.svg",
    rank: {
      tier: "platinum",
      division: 2,
      points: rankPoints.platinum
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: generateRandomId(),
    name: "Dacruz",
    username: "dacruz",
    email: "dacruz@rpx.com",
    password: "senha123",
    userNumber: 6,
    avatarUrl: "/images/avatar-placeholder.svg",
    rank: {
      tier: "diamond",
      division: 2,
      points: rankPoints.diamond
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: generateRandomId(),
    name: "Vini",
    username: "vini",
    email: "vini@rpx.com",
    password: "senha123",
    userNumber: 7,
    avatarUrl: "/images/avatar-placeholder.svg",
    rank: {
      tier: "legend",
      division: 0,
      points: rankPoints.legend
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: generateRandomId(),
    name: "YgorX",
    username: "ygorx",
    email: "ygorx@rpx.com",
    password: "senha123",
    userNumber: 8,
    avatarUrl: "/images/avatar-placeholder.svg",
    rank: {
      tier: "challenger",
      division: 0,
      points: rankPoints.challenger
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export async function GET(request) {
  try {
    console.log('🔧 Iniciando setup de usuários com ranks específicos...');
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Resultados da operação
    const results = {
      added: 0,
      skipped: 0,
      users: []
    };
    
    // Hash padrão para todas as senhas
    const hashedPassword = await bcrypt.hash('senha123', 10);
    
    for (const user of RANK_USERS) {
      // Verificar se já existe um usuário com este username ou email
      const existing = await db.collection('users').findOne({ 
        $or: [
          { email: user.email },
          { username: user.username }
        ]
      });
      
      if (existing) {
        console.log(`⏭️ Usuário ${user.username} (${user.email}) já existe, atualizando...`);
        
        // Atualizar o rank do usuário existente
        await db.collection('users').updateOne(
          { _id: existing._id },
          { 
            $set: {
              rank: user.rank,
              updatedAt: new Date()
            }
          }
        );
        
        results.skipped++;
        results.users.push({
          name: user.name,
          username: user.username,
          rank: user.rank.tier,
          points: user.rank.points
        });
        
        continue;
      }
      
      // Substituir a senha com a versão hasheada
      user.password = hashedPassword;
      
      // Inserir o novo usuário
      await db.collection('users').insertOne(user);
      console.log(`✅ Usuário criado: ${user.name} (${user.username}) - Rank: ${user.rank.tier}`);
      
      results.added++;
      results.users.push({
        name: user.name,
        username: user.username,
        rank: user.rank.tier,
        points: user.rank.points
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `${results.added} usuários criados. ${results.skipped} atualizados.`,
      details: results
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar usuários com ranks:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar usuários com ranks específicos' },
      { status: 500 }
    );
  }
} 