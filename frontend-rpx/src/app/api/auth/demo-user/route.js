import { NextResponse } from 'next/server';

// Criação de um usuário simulado com rank específico
const createDemoUser = (rankTier) => {
  // Definir rank e pontos com base no tier
  let rankName = 'Novato';
  let rankingPoints = 0;
  
  switch (rankTier) {
    case 'bronze':
      rankName = 'Bronze 2';
      rankingPoints = 200;
      break;
    case 'prata':
      rankName = 'Prata 1';
      rankingPoints = 400;
      break;
    case 'ouro':
      rankName = 'Ouro 3';
      rankingPoints = 900;
      break;
    case 'platina':
      rankName = 'Platina 2';
      rankingPoints = 1250;
      break;
    case 'diamante':
      rankName = 'Diamante 1';
      rankingPoints = 2000;
      break;
    case 'mestre':
      rankName = 'Mestre';
      rankingPoints = 4000;
      break;
    default:
      // Manter valores padrão
      break;
  }
  
  // Criar objeto de usuário
  return {
    id: `demo-${rankTier}-${Date.now()}`,
    username: `user_${rankTier}`,
    email: `demo-${rankTier}@example.com`,
    name: `Usuário ${rankName}`,
    currentRank: rankName,
    rankingPoints: rankingPoints,
    balance: 1000,
    isDemo: true
  };
};

// GET: Obter um usuário demo
export async function GET(request) {
  try {
    // Obter o rank solicitado (ou aleatório)
    const { searchParams } = new URL(request.url);
    let rank = searchParams.get('rank') || 'random';
    
    // Se for aleatório, escolher um dos ranks disponíveis
    if (rank === 'random') {
      const ranks = ['novato', 'bronze', 'prata', 'ouro', 'platina', 'diamante', 'mestre'];
      const randomIndex = Math.floor(Math.random() * ranks.length);
      rank = ranks[randomIndex];
    }
    
    // Criar usuário demo com o rank especificado
    const demoUser = createDemoUser(rank);
    
    return NextResponse.json({
      status: 'success',
      user: demoUser
    });
  } catch (error) {
    console.error('Erro ao criar usuário demo:', error);
    return NextResponse.json(
      { status: 'error', error: error.message || 'Erro ao criar usuário demo' },
      { status: 500 }
    );
  }
} 