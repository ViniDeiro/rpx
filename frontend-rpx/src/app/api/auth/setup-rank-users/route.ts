import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { RankTier } from '@/utils/ranking';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

// Função para gerar um ID aleatório baseado em data
function generateRandomId() {
  return new ObjectId();
}

// Interface para os usuários de rank
interface RankUser {
  _id: ObjectId;
  name: string;
  username: string;
  email: string;
  password: string;
  userNumber: number;
  avatarUrl: string;
  rank: {
    tier: RankTier;
    division: string | null;
    points: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Pontos para cada rank
const rankPoints: Record<RankTier, number> = {
  'unranked': 0,
  'bronze': 150,
  'silver': 350,
  'gold': 750,
  'platinum': 950,
  'diamond': 1350,
  'legend': 1600,
  'challenger': 2100
};

// Lista de usuários de rank para serem criados
const RANK_USERS: RankUser[] = [
  {
    _id: generateRandomId(),
    name: "Luiz",
    username: "luiz",
    email: "luiz@rpx.com",
    password: "senha123",
    userNumber: 1001,
    avatarUrl: "/images/avatar-placeholder.svg",
    rank: {
      tier: "unranked",
      division: null,
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
    userNumber: 1002,
    avatarUrl: "/images/avatar-placeholder.svg",
    rank: {
      tier: "bronze",
      division: "2",
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
    userNumber: 1003,
    avatarUrl: "/images/avatar-placeholder.svg",
    rank: {
      tier: "silver",
      division: "2",
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
    userNumber: 1004,
    avatarUrl: "/images/avatar-placeholder.svg",
    rank: {
      tier: "gold",
      division: "2",
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
    userNumber: 1005,
    avatarUrl: "/images/avatar-placeholder.svg",
    rank: {
      tier: "platinum",
      division: "2",
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
    userNumber: 1006,
    avatarUrl: "/images/avatar-placeholder.svg",
    rank: {
      tier: "diamond",
      division: "2",
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
    userNumber: 1007,
    avatarUrl: "/images/avatar-placeholder.svg",
    rank: {
      tier: "legend",
      division: null,
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
    userNumber: 1008,
    avatarUrl: "/images/avatar-placeholder.svg",
    rank: {
      tier: "challenger",
      division: null,
      points: rankPoints.challenger
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Iniciando setup de usuários com ranks específicos...');
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Resultados da operação
    const results: {
      added: number;
      skipped: number;
      users: Array<{
        name: string;
        username: string;
        rank: string;
        points: number;
      }>;
    } = {
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
              userNumber: user.userNumber,
              name: user.name
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
    
  } catch (error: any) {
    console.error('❌ Erro ao criar usuários com ranks:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar usuários com ranks específicos' },
      { status: 500 }
    );
  }
} 