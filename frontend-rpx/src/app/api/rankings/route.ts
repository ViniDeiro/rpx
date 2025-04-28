import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Interface para entrada de ranking
interface RankingEntry {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  wins: number;
  losses: number;
  winRate: number;
  betCount: number;
  totalWagered: number;
  totalWon: number;
  biggestWin: number;
  rank: number;
}

// Função para gerar nomes aleatórios
const gerarNomeAleatorio = () => {
  const nomes = ['Gabriel', 'Lucas', 'Pedro', 'Rafael', 'Matheus', 'João', 'Bruno', 'Carlos', 'Felipe', 'Victor', 
                 'Diego', 'Daniel', 'Guilherme', 'Rodrigo', 'Gustavo', 'André', 'Thiago', 'Marcelo', 'Ricardo', 'Eduardo'];
  const sobrenomes = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Pereira', 'Ferreira', 'Rodrigues', 'Almeida', 'Gomes',
                     'Ribeiro', 'Martins', 'Rocha', 'Carvalho', 'Fernandes', 'Melo', 'Barbosa', 'Dias', 'Lima', 'Lopes'];
  return `${nomes[Math.floor(Math.random() * nomes.length)]}${sobrenomes[Math.floor(Math.random() * sobrenomes.length)]}`;
};

// Função para gerar avatar aleatório
const gerarAvatarAleatorio = () => {
  const avatarId = Math.floor(Math.random() * 12) + 1;
  return `/images/avatars/avatar${avatarId}.png`;
};

// Função para gerar dados de ranking aleatórios
const gerarRankingSimulado = (quantidade: number, tipo: string): RankingEntry[] => {
  const entries: RankingEntry[] = [];
  
  for (let i = 0; i < quantidade; i++) {
    const wins = Math.floor(Math.random() * 100) + 1;
    const losses = Math.floor(Math.random() * 50) + 1;
    const totalMatches = wins + losses;
    const winRate = Math.round((wins / totalMatches) * 100);
    const betCount = totalMatches * (Math.floor(Math.random() * 5) + 1);
    const totalWagered = betCount * 10;
    const totalWon = totalWagered * (Math.random() * 1.5 + 0.5); // Entre 50% e 200% do valor apostado
    const biggestWin = totalWon * (Math.random() * 0.3 + 0.1); // Entre 10% e 40% do total ganho
    
    // Cálculo de pontuação diferente dependendo do tipo de ranking
    let score = 0;
    if (tipo === 'winrate') {
      score = winRate * (Math.random() * 0.5 + 0.75); // Pontuação baseada no winrate
    } else if (tipo === 'totalWon') {
      score = totalWon / 100; // Pontuação baseada nos ganhos
    } else if (tipo === 'biggestWin') {
      score = biggestWin / 50; // Pontuação baseada na maior vitória
    } else {
      // Pontuação combinada para classificação geral
      score = (winRate * 0.4) + (totalWon / 500) + (betCount / 30);
    }
    
    entries.push({
      id: uuidv4(),
      userId: uuidv4(),
      username: gerarNomeAleatorio(),
      avatar: gerarAvatarAleatorio(),
      score: Math.round(score * 100) / 100,
      wins: wins,
      losses: losses,
      winRate: winRate,
      betCount: betCount,
      totalWagered: Math.round(totalWagered),
      totalWon: Math.round(totalWon),
      biggestWin: Math.round(biggestWin),
      rank: i + 1
    });
  }
  
  // Ordenar com base no tipo de ranking solicitado
  if (tipo === 'winrate') {
    entries.sort((a, b) => b.winRate - a.winRate);
  } else if (tipo === 'totalWon') {
    entries.sort((a, b) => b.totalWon - a.totalWon);
  } else if (tipo === 'biggestWin') {
    entries.sort((a, b) => b.biggestWin - a.biggestWin);
  } else {
    entries.sort((a, b) => b.score - a.score);
  }
  
  // Atualizar ranking após ordenação
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  return entries;
};

// GET - Obter rankings dos jogadores (simulado)
export async function GET(req: NextRequest) {
  try {
    // Obter parâmetros de consulta
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'winrate'; // winrate, totalWon, biggestWin
    const period = url.searchParams.get('period') || 'week'; // all, week, month
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    // Simular um pequeno atraso para parecer mais realista
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Gerar ranking simulado
    const rankingData = gerarRankingSimulado(limit, type);
    
    // Retornar dados simulados
    return NextResponse.json({
      rankings: rankingData,
      type,
      period,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao gerar ranking simulado:', error);
    return NextResponse.json(
      { error: 'Erro ao obter rankings' },
      { status: 500 }
    );
  }
} 