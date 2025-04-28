import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { RankTier } from '@/utils/ranking';

// Tipo para o usuário demo/simulado
interface DemoUser {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  name: string;
  balance: number;
  createdAt: string;
  rank: {
    tier: RankTier;
    division: '1' | '2' | '3' | null;
    points: number;
  };
}

// Criação de um usuário simulado com rank específico
const createDemoUser = (rankTier: RankTier): DemoUser => {
  const userId = `demo-${rankTier}-${uuidv4().substring(0, 8)}`;
  
  const getRankPoints = (tier: RankTier): number => {
    switch (tier) {
      case 'unranked': return 0;
      case 'bronze': return 150;
      case 'silver': return 350;
      case 'gold': return 750;
      case 'platinum': return 950;
      case 'diamond': return 1350;
      case 'legend': return 1600;
      case 'challenger': return 2100;
      default: return 0;
    }
  };
  
  const getRankDivision = (tier: RankTier): '1' | '2' | '3' | null => {
    if (tier === 'legend' || tier === 'challenger' || tier === 'unranked') {
      return null;
    }
    return '2';
  };
  
  const getUsername = (tier: RankTier): string => {
    const prefixes = {
      unranked: 'Novato',
      bronze: 'Bronze',
      silver: 'Prata',
      gold: 'Ouro',
      platinum: 'Platina',
      diamond: 'Diamante',
      legend: 'Lenda',
      challenger: 'Desafiante'
    };
    
    return `${prefixes[tier]}${Math.floor(Math.random() * 1000)}`;
  };
  
  const getAvatar = (tier: RankTier): string => {
    const avatarIndex = Math.floor(Math.random() * 4);
    const avatarTypes = ['default', 'blue', 'green', 'purple'];
    return `/images/avatars/${avatarTypes[avatarIndex]}.svg`;
  };
  
  const username = getUsername(rankTier);
  const points = getRankPoints(rankTier);
  const division = getRankDivision(rankTier);
  
  return {
    id: userId,
    username,
    email: `${username.toLowerCase()}@exemplo.com`,
    name: username,
    avatarUrl: getAvatar(rankTier),
    balance: 1000 + Math.floor(Math.random() * 9000),
    createdAt: new Date().toISOString(),
    rank: {
      tier: rankTier,
      division,
      points
    }
  };
};

// Endpoint GET para obter um usuário simulado
export async function GET(request: NextRequest) {
  try {
    // Obter o rank a partir dos parâmetros de consulta
    const { searchParams } = new URL(request.url);
    let rankTier = (searchParams.get('rank') || 'unranked') as RankTier;
    
    // Verificar se o rank é válido
    const validRanks: RankTier[] = ['unranked', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend', 'challenger'];
    if (!validRanks.includes(rankTier)) {
      rankTier = 'unranked';
    }
    
    // Criar usuário simulado com o rank especificado
    const demoUser = createDemoUser(rankTier);
    
    // Retornar usuário simulado
    return NextResponse.json({
      user: demoUser,
      token: `demo-token-${uuidv4()}`,
      message: 'Usuário simulado criado com sucesso',
      isDemo: true
    });
  } catch (error) {
    console.error('Erro ao criar usuário simulado:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário simulado' },
      { status: 500 }
    );
  }
} 